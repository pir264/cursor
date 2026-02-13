import React, { useEffect, useState } from 'react';
import * as SDK from 'azure-devops-extension-sdk';
import { PipelineService } from '../Services/PipelineService';
import { PipelineList } from '../Components/PipelineList';
import { PipelineRun, Pipeline } from '../Types/PipelineTypes';
import './PipelineStagesHub.scss';

/**
 * Main hub component for displaying pipeline stages
 */
export const PipelineStagesHub: React.FC = () => {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [pipelineRuns, setPipelineRuns] = useState<Map<number, PipelineRun[]>>(new Map());
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [service, setService] = useState<PipelineService | null>(null);

  useEffect(() => {
    initializeExtension();
  }, []);

  useEffect(() => {
    if (service) {
      loadPipelineData();
    }
  }, [service]);

  const initializeExtension = async () => {
    try {
      // Initialize the SDK
      await SDK.init();
      
      // Notify that the extension is ready
      SDK.notifyLoadSucceeded();

      // Create the pipeline service
      const pipelineService = new PipelineService();
      setService(pipelineService);
    } catch (error) {
      console.error('Failed to initialize extension:', error);
      setError('Failed to initialize extension. Please refresh the page.');
      SDK.notifyLoadFailed(error as Error);
    }
  };

  const loadPipelineData = async () => {
    if (!service) return;

    setLoading(true);
    setError(undefined);

    try {
      // Get all pipelines
      const allPipelines = await service.getPipelines();
      setPipelines(allPipelines);

      // Load runs for each pipeline (limit to first 10 pipelines to avoid too many API calls)
      const pipelinesToLoad = allPipelines.slice(0, 10);
      const runsMap = new Map<number, PipelineRun[]>();

      // Load runs in parallel for better performance
      const runsPromises = pipelinesToLoad.map(async (pipeline) => {
        try {
          const runs = await service.getAllPipelineRunsWithStages(pipeline.id, 20);
          runsMap.set(pipeline.id, runs);
        } catch (err) {
          console.error(`Error loading runs for pipeline ${pipeline.id}:`, err);
          // Continue with other pipelines even if one fails
          runsMap.set(pipeline.id, []);
        }
      });

      await Promise.all(runsPromises);
      setPipelineRuns(runsMap);
    } catch (err) {
      console.error('Error loading pipeline data:', err);
      setError('Failed to load pipeline data. Please try refreshing the page.');
    } finally {
      setLoading(false);
    }
  };

  const handlePipelineRunClick = (run: PipelineRun) => {
    // Open the pipeline run in Azure DevOps
    if (run.url) {
      window.open(run.url, '_blank');
    } else if (run._links?.web?.href) {
      window.open(run._links.web.href, '_blank');
    }
  };

  return (
    <div className="pipeline-stages-hub">
      <div className="hub-header">
        <h1>Pipeline Stages</h1>
        <p className="hub-description">
          View detailed stage information for your YAML pipelines. See which stages succeeded and identify where failures occurred.
        </p>
      </div>

      <div className="hub-content">
        <PipelineList
          pipelines={pipelines}
          pipelineRuns={pipelineRuns}
          loading={loading}
          error={error}
          onPipelineRunClick={handlePipelineRunClick}
        />
      </div>
    </div>
  );
};

// Export default for webpack
export default PipelineStagesHub;
