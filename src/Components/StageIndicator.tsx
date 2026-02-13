import React from 'react';
import { StageRecord, StageStatus } from '../Types/PipelineTypes';
import './StageIndicator.scss';

interface StageIndicatorProps {
  stage: StageRecord;
  showName?: boolean;
  compact?: boolean;
}

/**
 * Visual indicator component for pipeline stage status
 */
export const StageIndicator: React.FC<StageIndicatorProps> = ({ 
  stage, 
  showName = true,
  compact = false 
}) => {
  const getStatusClass = (): string => {
    if (!stage.state && !stage.result) {
      return 'not-started';
    }

    if (stage.state === 'inProgress') {
      return 'in-progress';
    }

    if (stage.state === 'completed') {
      switch (stage.result) {
        case 'succeeded':
          return 'succeeded';
        case 'failed':
          return 'failed';
        case 'canceled':
          return 'cancelled';
        case 'skipped':
          return 'skipped';
        default:
          return 'unknown';
      }
    }

    return 'not-started';
  };

  const getStatusIcon = (): string => {
    const statusClass = getStatusClass();
    switch (statusClass) {
      case 'succeeded':
        return '✓';
      case 'failed':
        return '✗';
      case 'in-progress':
        return '⟳';
      case 'cancelled':
        return '⊘';
      case 'skipped':
        return '⊘';
      default:
        return '○';
    }
  };

  const getDuration = (): string => {
    if (stage.startTime && stage.finishTime) {
      const duration = stage.finishTime.getTime() - stage.startTime.getTime();
      const minutes = Math.floor(duration / 60000);
      const seconds = Math.floor((duration % 60000) / 1000);
      return `${minutes}m ${seconds}s`;
    }
    return '';
  };

  const statusClass = getStatusClass();
  const duration = getDuration();

  return (
    <div className={`stage-indicator ${statusClass} ${compact ? 'compact' : ''}`} title={getTooltipText()}>
      <span className="stage-icon">{getStatusIcon()}</span>
      {showName && <span className="stage-name">{stage.name}</span>}
      {!compact && duration && <span className="stage-duration">{duration}</span>}
    </div>
  );

  function getTooltipText(): string {
    const parts = [stage.name];
    
    if (stage.state === 'completed' && stage.result) {
      parts.push(`Status: ${stage.result}`);
    } else if (stage.state === 'inProgress') {
      parts.push('Status: In Progress');
    } else {
      parts.push('Status: Not Started');
    }

    if (duration) {
      parts.push(`Duration: ${duration}`);
    }

    if (stage.startTime) {
      parts.push(`Started: ${stage.startTime.toLocaleString()}`);
    }

    if (stage.errorCount && stage.errorCount > 0) {
      parts.push(`Errors: ${stage.errorCount}`);
    }

    if (stage.warningCount && stage.warningCount > 0) {
      parts.push(`Warnings: ${stage.warningCount}`);
    }

    return parts.join('\n');
  }
};
