import * as SDK from 'azure-devops-extension-sdk';
import { getClient } from 'azure-devops-extension-api/Common/Client';
import { BuildRestClient } from 'azure-devops-extension-api/Build/BuildClient';
import { PipelinesRestClient } from 'azure-devops-extension-api/Pipelines/PipelinesClient';
import * as Build from 'azure-devops-extension-api/Build/Build';
import * as Pipelines from 'azure-devops-extension-api/Pipelines/Pipelines';
import { PipelineRun, StageRecord, Pipeline } from '../Types/PipelineTypes';

/**
 * Service for interacting with Azure DevOps Pipeline APIs
 */
export class PipelineService {
  private buildClient: BuildRestClient;
  private pipelineClient: PipelinesRestClient;
  private organizationUrl: string;
  private projectId: string;

  constructor() {
    const webContext = SDK.getWebContext();
    
    // Get organization URL from context
    this.organizationUrl = (webContext as any).host?.uri || '';
    this.projectId = webContext.project.id;
    
    // Initialize REST API clients (SDK handles authentication automatically)
    this.buildClient = getClient(BuildRestClient);
    this.pipelineClient = getClient(PipelinesRestClient);
  }

  /**
   * Get all pipelines for the current project
   */
  async getPipelines(): Promise<Pipeline[]> {
    try {
      const pipelines = await this.pipelineClient.listPipelines(this.projectId);
      return pipelines.map((p: Pipelines.Pipeline) => ({
        id: p.id!,
        name: p.name || 'Unnamed Pipeline',
        folder: p.folder,
        revision: p.revision,
        url: p._links?.web?.href
      }));
    } catch (error) {
      console.error('Error fetching pipelines:', error);
      throw error;
    }
  }

  /**
   * Get pipeline runs for a specific pipeline
   */
  async getPipelineRuns(pipelineId: number, top: number = 50): Promise<PipelineRun[]> {
    try {
      const runs = await this.pipelineClient.listRuns(this.projectId, pipelineId);
      
      // Limit to top N runs
      const limitedRuns = runs.slice(0, top);
      
      return limitedRuns.map((run: Pipelines.Run) => {
        // Map RunState enum to string
        let state: 'inProgress' | 'completed' | 'canceling' | 'canceled' = 'completed';
        const runState = run.state as any;
        if (runState === Pipelines.RunState.InProgress || runState === 1) {
          state = 'inProgress';
        } else if (runState === Pipelines.RunState.Completed || runState === 2) {
          state = 'completed';
        } else if (runState === Pipelines.RunState.Canceling || runState === 4) {
          state = 'canceling';
        } else if (runState === 8) { // Canceled state value
          state = 'canceled';
        }

        return {
          id: run.id!,
          name: run.name || `Run ${run.id}`,
          state,
          result: run.result as any,
          createdDate: run.createdDate || new Date(),
          finishedDate: run.finishedDate,
          url: run._links?.web?.href || '',
          _links: run._links,
          pipeline: {
            id: pipelineId,
            name: run.pipeline?.name || '',
            folder: run.pipeline?.folder,
            revision: run.pipeline?.revision
          }
        };
      });
    } catch (error) {
      console.error('Error fetching pipeline runs:', error);
      throw error;
    }
  }

  /**
   * Get stages for a specific pipeline run using Timeline API
   */
  async getPipelineRunStages(runId: number, buildId?: number): Promise<StageRecord[]> {
    // If no buildId provided, try to find it
    if (!buildId) {
      buildId = await this.findBuildIdFromRun(runId);
      if (!buildId) {
        return [];
      }
    }

    try {
      // Use the Build Timeline API to get stage information
      const timeline = await this.buildClient.getBuildTimeline(this.projectId, buildId);
      
      if (!timeline || !timeline.records) {
        return [];
      }

      // Filter for stage records (type === "Stage")
      const stageRecords = timeline.records
        .filter((record: Build.TimelineRecord) => record.type === 'Stage')
        .map((record: Build.TimelineRecord) => ({
          id: record.id || '',
          name: record.name || 'Unknown Stage',
          type: record.type || '',
          state: this.mapTimelineState(record.state),
          result: this.mapTimelineResult(record.result),
          startTime: record.startTime ? new Date(record.startTime) : undefined,
          finishTime: record.finishTime ? new Date(record.finishTime) : undefined,
          order: record.order,
          parentId: record.parentId,
          errorCount: record.errorCount,
          warningCount: record.warningCount
        }))
        .sort((a, b) => (a.order || 0) - (b.order || 0));

      return stageRecords;
    } catch (error) {
      console.error(`Error fetching stages for run ${runId}:`, error);
      // Return empty array if timeline is not available (e.g., run is still queued)
      return [];
    }
  }

  /**
   * Map TimelineRecordState to our StageRecord state
   */
  private mapTimelineState(state?: Build.TimelineRecordState): 'completed' | 'inProgress' | 'pending' | undefined {
    if (!state) return undefined;
    
    // Use string comparison to avoid enum type issues
    const stateStr = String(state);
    if (stateStr.includes('Completed') || state === Build.TimelineRecordState.Completed) {
      return 'completed';
    } else if (stateStr.includes('InProgress') || state === Build.TimelineRecordState.InProgress) {
      return 'inProgress';
    } else if (stateStr.includes('Pending') || state === Build.TimelineRecordState.Pending) {
      return 'pending';
    }
    return undefined;
  }

  /**
   * Map TaskResult to our StageRecord result
   */
  private mapTimelineResult(result?: Build.TaskResult): 'succeeded' | 'failed' | 'canceled' | 'skipped' | undefined {
    if (!result) return undefined;
    
    // Use numeric comparison to avoid enum type issues
    const resultValue = result as any;
    if (resultValue === Build.TaskResult.Succeeded || resultValue === 0) {
      return 'succeeded';
    } else if (resultValue === Build.TaskResult.Failed || resultValue === 1) {
      return 'failed';
    } else if (resultValue === Build.TaskResult.Canceled || resultValue === 2) {
      return 'canceled';
    } else if (resultValue === Build.TaskResult.Skipped || resultValue === 3) {
      return 'skipped';
    }
    return undefined;
  }

  /**
   * Get all pipeline runs with their stage information
   */
  async getAllPipelineRunsWithStages(pipelineId: number, top: number = 50): Promise<PipelineRun[]> {
    try {
      const runs = await this.getPipelineRuns(pipelineId, top);
      
      // Fetch stages for each run in parallel
      const runsWithStages = await Promise.all(
        runs.map(async (run) => {
          // For YAML pipelines, try to find the corresponding build
          // First try using run ID as build ID (sometimes they match)
          let stages: StageRecord[] = [];
          
          try {
            // Try run ID as build ID first (common for YAML pipelines)
            stages = await this.getPipelineRunStages(run.id, run.id);
            
            // If that didn't work, try to find the build ID
            if (stages.length === 0) {
              const buildId = await this.findBuildIdForRun(run.id, pipelineId);
              if (buildId) {
                stages = await this.getPipelineRunStages(run.id, buildId);
              }
            }
          } catch (err) {
            console.warn(`Could not fetch stages for run ${run.id}:`, err);
          }

          return {
            ...run,
            stages
          };
        })
      );

      return runsWithStages;
    } catch (error) {
      console.error('Error fetching pipeline runs with stages:', error);
      throw error;
    }
  }

  /**
   * Find build ID from pipeline run ID
   * For YAML pipelines, we search builds by definition ID and try to match by run number or timing
   */
  private async findBuildIdFromRun(runId: number): Promise<number | undefined> {
    try {
      // Try using runId as buildId directly (common for YAML pipelines)
      try {
        await this.buildClient.getBuildTimeline(this.projectId, runId);
        return runId;
      } catch {
        // If that fails, continue to search
      }

      // Search recent builds
      const builds = await this.buildClient.getBuilds(
        this.projectId,
        undefined, // definitions
        undefined, // queues
        undefined, // buildNumber
        undefined, // minTime
        undefined, // maxTime
        undefined, // requestedFor
        undefined, // reasonFilter
        undefined, // statusFilter
        undefined, // resultFilter
        undefined, // tagFilters
        undefined, // properties
        100, // top
        undefined, // continuationToken
        undefined, // maxBuildsPerDefinition
        undefined, // deletedFilter
        undefined, // queryOrder
        undefined, // branchName
        [runId], // buildIds - try using runId
        undefined, // repositoryId
        undefined  // repositoryType
      );

      if (builds && builds.length > 0 && builds[0].id) {
        return builds[0].id;
      }

      return undefined;
    } catch (error) {
      console.warn('Could not find build ID from run:', error);
      return undefined;
    }
  }

  /**
   * Find build ID for a pipeline run by searching builds with matching definition
   */
  private async findBuildIdForRun(runId: number, pipelineId: number): Promise<number | undefined> {
    try {
      // Search builds by definition ID (pipeline ID)
      const builds = await this.buildClient.getBuilds(
        this.projectId,
        [pipelineId], // definitions - use pipeline ID
        undefined, // queues
        undefined, // buildNumber
        undefined, // minTime
        undefined, // maxTime
        undefined, // requestedFor
        undefined, // reasonFilter
        undefined, // statusFilter
        undefined, // resultFilter
        undefined, // tagFilters
        undefined, // properties
        50, // top - get recent builds
        undefined, // continuationToken
        undefined, // maxBuildsPerDefinition
        undefined, // deletedFilter
        undefined, // queryOrder
        undefined, // branchName
        undefined, // buildIds
        undefined, // repositoryId
        undefined  // repositoryType
      );

      // Try to match by ID first (sometimes run ID = build ID)
      const exactMatch = builds.find(b => b.id === runId);
      if (exactMatch && exactMatch.id) {
        return exactMatch.id;
      }

      // If no exact match, return the most recent build for this definition
      // This is approximate but better than nothing
      if (builds.length > 0 && builds[0].id) {
        return builds[0].id;
      }

      return undefined;
    } catch (error) {
      console.warn('Could not find build ID for run:', error);
      return undefined;
    }
  }
}
