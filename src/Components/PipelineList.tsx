import React, { useState } from 'react';
import { PipelineRun, Pipeline } from '../Types/PipelineTypes';
import { PipelineRow } from './PipelineRow';
import './PipelineList.scss';

interface PipelineListProps {
  pipelines: Pipeline[];
  pipelineRuns: Map<number, PipelineRun[]>;
  loading?: boolean;
  error?: string;
  onPipelineRunClick?: (run: PipelineRun) => void;
}

/**
 * Component displaying a list of pipelines with their runs and stage information
 */
export const PipelineList: React.FC<PipelineListProps> = ({
  pipelines,
  pipelineRuns,
  loading,
  error,
  onPipelineRunClick
}) => {
  const [expandedPipelines, setExpandedPipelines] = useState<Set<number>>(new Set());

  const togglePipeline = (pipelineId: number) => {
    const newExpanded = new Set(expandedPipelines);
    if (newExpanded.has(pipelineId)) {
      newExpanded.delete(pipelineId);
    } else {
      newExpanded.add(pipelineId);
    }
    setExpandedPipelines(newExpanded);
  };

  if (loading) {
    return (
      <div className="pipeline-list-loading">
        <div className="loading-spinner"></div>
        <p>Loading pipeline information...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pipeline-list-error">
        <div className="error-icon">⚠</div>
        <p>{error}</p>
      </div>
    );
  }

  if (pipelines.length === 0) {
    return (
      <div className="pipeline-list-empty">
        <p>No pipelines found in this project.</p>
      </div>
    );
  }

  return (
    <div className="pipeline-list">
      {pipelines.map((pipeline) => {
        const runs = pipelineRuns.get(pipeline.id) || [];
        const isExpanded = expandedPipelines.has(pipeline.id);
        const hasRuns = runs.length > 0;

        return (
          <div key={pipeline.id} className="pipeline-group">
            <div 
              className={`pipeline-header ${isExpanded ? 'expanded' : ''}`}
              onClick={() => togglePipeline(pipeline.id)}
            >
              <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
              <span className="pipeline-group-name">{pipeline.name}</span>
              <span className="pipeline-run-count">
                {hasRuns ? `${runs.length} run${runs.length !== 1 ? 's' : ''}` : 'No runs'}
              </span>
            </div>

            {isExpanded && (
              <div className="pipeline-runs">
                {hasRuns ? (
                  runs.map((run) => (
                    <PipelineRow
                      key={run.id}
                      pipelineRun={run}
                      onRowClick={onPipelineRunClick}
                    />
                  ))
                ) : (
                  <div className="no-runs">No runs found for this pipeline.</div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
