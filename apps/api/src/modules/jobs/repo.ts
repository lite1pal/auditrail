import type { JobName, JobPayload, JobStatus } from "@auditrail/domain/jobs";

export interface JobOutboxRecord {
  id: string;
  name: JobName;
  payload: JobPayload;
  status: JobStatus;
  availableAt: string;
  attemptCount: number;
  maxAttempts: number;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
  processedAt?: string;
}

export interface EnqueueJobInput {
  name: JobName;
  payload: JobPayload;
  availableAt?: string;
  maxAttempts?: number;
}

export interface ClaimNextJobOptions {
  name?: JobName;
  now?: string;
}

export interface MarkJobCompletedInput {
  id: string;
  processedAt?: string;
}

export interface MarkJobFailedInput {
  id: string;
  error: string;
  failedAt?: string;
  retryAt?: string;
}

export interface ListPendingJobsOptions {
  name?: JobName;
  limit?: number;
}

export interface CountPendingJobsOptions {
  name?: JobName;
}

export interface JobOutboxRepo {
  enqueue(input: EnqueueJobInput): Promise<JobOutboxRecord>;
  claimNext(options?: ClaimNextJobOptions): Promise<JobOutboxRecord | undefined>;
  markCompleted(
    input: MarkJobCompletedInput
  ): Promise<JobOutboxRecord | undefined>;
  markFailed(input: MarkJobFailedInput): Promise<JobOutboxRecord | undefined>;
  listPending(options?: ListPendingJobsOptions): Promise<JobOutboxRecord[]>;
  countPending(options?: CountPendingJobsOptions): Promise<number>;
}
