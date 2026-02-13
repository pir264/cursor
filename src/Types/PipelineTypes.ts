/**
 * Stage execution status
 */
export enum StageStatus {
  Succeeded = 'succeeded',
  Failed = 'failed',
  InProgress = 'inProgress',
  NotStarted = 'notStarted',
  Skipped = 'skipped',
  Cancelled = 'cancelled'
}

/**
 * Pipeline run result
 */
export enum PipelineResult {
  Succeeded = 'succeeded',
  Failed = 'failed',
  Canceled = 'canceled',
  PartiallySucceeded = 'partiallySucceeded',
  SucceededWithIssues = 'succeededWithIssues'
}

/**
 * Stage record from Timeline API
 */
export interface StageRecord {
  id: string;
  name: string;
  type: string;
  state?: 'completed' | 'inProgress' | 'pending';
  result?: 'succeeded' | 'failed' | 'canceled' | 'skipped';
  startTime?: Date;
  finishTime?: Date;
  order?: number;
  parentId?: string;
  errorCount?: number;
  warningCount?: number;
}

/**
 * Timeline response from Azure DevOps API
 */
export interface TimelineResponse {
  records: StageRecord[];
  lastChangedBy?: string;
  lastChangedOn?: Date;
  id?: string;
  changeId?: number;
  url?: string;
}

/**
 * Pipeline run information
 */
export interface PipelineRun {
  id: number;
  name: string;
  state: 'inProgress' | 'completed' | 'canceling' | 'canceled';
  result?: PipelineResult;
  createdDate: Date;
  finishedDate?: Date;
  url: string;
  _links?: {
    web?: {
      href: string;
    };
  };
  pipeline?: {
    id: number;
    name: string;
    folder?: string;
    revision?: number;
  };
  stages?: StageRecord[];
}

/**
 * Pipeline definition
 */
export interface Pipeline {
  id: number;
  name: string;
  folder?: string;
  revision?: number;
  url?: string;
}

/**
 * Project context
 */
export interface ProjectContext {
  id: string;
  name: string;
}

/**
 * Organization context
 */
export interface OrganizationContext {
  name: string;
}
