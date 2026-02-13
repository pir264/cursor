import React from 'react';
import { PipelineRun } from '../Types/PipelineTypes';
import { StageIndicator } from './StageIndicator';
import './PipelineRow.scss';

interface PipelineRowProps {
  pipelineRun: PipelineRun;
  onRowClick?: (run: PipelineRun) => void;
}

/**
 * Component representing a single pipeline run row with stage information
 */
export const PipelineRow: React.FC<PipelineRowProps> = ({ pipelineRun, onRowClick }) => {
  const getOverallStatusClass = (): string => {
    if (pipelineRun.state === 'inProgress') {
      return 'in-progress';
    }
    
    if (pipelineRun.state === 'completed') {
      switch (pipelineRun.result) {
        case 'succeeded':
        case 'succeededWithIssues':
          return 'succeeded';
        case 'failed':
          return 'failed';
        case 'canceled':
          return 'cancelled';
        case 'partiallySucceeded':
          return 'partial';
        default:
          return 'unknown';
      }
    }

    return 'not-started';
  };

  const getOverallStatusIcon = (): string => {
    const statusClass = getOverallStatusClass();
    switch (statusClass) {
      case 'succeeded':
        return '✓';
      case 'failed':
        return '✗';
      case 'partial':
        return '⚠';
      case 'in-progress':
        return '⟳';
      case 'cancelled':
        return '⊘';
      default:
        return '○';
    }
  };

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const failedStage = pipelineRun.stages?.find(s => s.result === 'failed');
  const hasStages = pipelineRun.stages && pipelineRun.stages.length > 0;

  return (
    <div 
      className={`pipeline-row ${getOverallStatusClass()} ${onRowClick ? 'clickable' : ''}`}
      onClick={() => onRowClick && onRowClick(pipelineRun)}
    >
      <div className="pipeline-row-main">
        <div className="pipeline-status">
          <span className="status-icon">{getOverallStatusIcon()}</span>
        </div>
        
        <div className="pipeline-info">
          <div className="pipeline-name">
            {pipelineRun.pipeline?.name || pipelineRun.name}
          </div>
          <div className="pipeline-meta">
            <span className="run-id">Run #{pipelineRun.id}</span>
            {pipelineRun.finishedDate && (
              <span className="run-date">{formatDate(pipelineRun.finishedDate)}</span>
            )}
            {!pipelineRun.finishedDate && pipelineRun.createdDate && (
              <span className="run-date">Started {formatDate(pipelineRun.createdDate)}</span>
            )}
          </div>
        </div>

        <div className="pipeline-stages">
          {hasStages ? (
            <div className="stages-container">
              {pipelineRun.stages!.map((stage, index) => (
                <StageIndicator 
                  key={stage.id || index} 
                  stage={stage} 
                  compact={true}
                  showName={true}
                />
              ))}
            </div>
          ) : (
            <div className="no-stages">No stage information available</div>
          )}
        </div>
      </div>

      {failedStage && (
        <div className="pipeline-failed-stage">
          <span className="failed-label">Failed at:</span>
          <StageIndicator stage={failedStage} showName={true} compact={false} />
        </div>
      )}
    </div>
  );
};
