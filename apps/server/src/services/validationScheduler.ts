import type { Database } from '@vtt/database';
import { modules } from '@vtt/database';
import { eq, and, or, lt, isNull } from 'drizzle-orm';
import { moduleValidatorService } from './moduleValidator.js';

/**
 * Validation Scheduler Service
 *
 * Manages background validation jobs for modules.
 * Handles batch validation, progress tracking, and scheduled revalidation.
 *
 * @see docs/architecture/EAV_MODULE_SCHEMA.md
 */

/**
 * Validation job status
 */
export enum ValidationJobStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

/**
 * Validation job
 */
export interface ValidationJob {
  id: string;
  moduleId: string;
  status: ValidationJobStatus;
  progress: number; // 0-100
  startedAt: Date | null;
  completedAt: Date | null;
  error: string | null;
  totalEntities: number;
  processedEntities: number;
}

/**
 * Validation scheduler configuration
 */
export interface SchedulerConfig {
  /**
   * Maximum concurrent validation jobs
   */
  maxConcurrentJobs: number;

  /**
   * Batch size for entity processing
   */
  batchSize: number;

  /**
   * Delay between batches (ms)
   */
  batchDelay: number;

  /**
   * Auto-revalidate modules older than this (hours)
   */
  autoRevalidateAfterHours: number;

  /**
   * Enable automatic revalidation
   */
  enableAutoRevalidation: boolean;
}

/**
 * Default scheduler configuration
 */
const DEFAULT_CONFIG: SchedulerConfig = {
  maxConcurrentJobs: 3,
  batchSize: 50,
  batchDelay: 100,
  autoRevalidateAfterHours: 24,
  enableAutoRevalidation: true,
};

export class ValidationScheduler {
  private db: Database;
  private config: SchedulerConfig;
  private jobs: Map<string, ValidationJob>;
  private activeJobs: Set<string>;
  private intervalId: NodeJS.Timeout | null = null;

  constructor(db: Database, config: Partial<SchedulerConfig> = {}) {
    this.db = db;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.jobs = new Map();
    this.activeJobs = new Set();
  }

  /**
   * Start the scheduler
   */
  start(): void {
    if (this.intervalId) {
      console.warn('[ValidationScheduler] Scheduler already running');
      return;
    }

    console.log('[ValidationScheduler] Starting scheduler');

    // Run validation check every 5 minutes
    this.intervalId = setInterval(() => {
      this.checkAndScheduleValidations();
    }, 5 * 60 * 1000);

    // Run initial check
    this.checkAndScheduleValidations();
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    if (!this.intervalId) {
      return;
    }

    console.log('[ValidationScheduler] Stopping scheduler');
    clearInterval(this.intervalId);
    this.intervalId = null;
  }

  /**
   * Schedule validation for a module
   */
  async scheduleValidation(moduleId: string, priority: boolean = false): Promise<string> {
    try {
      // Check if already scheduled
      const existingJob = Array.from(this.jobs.values()).find(
        (job) => job.moduleId === moduleId && job.status !== ValidationJobStatus.COMPLETED && job.status !== ValidationJobStatus.FAILED
      );

      if (existingJob) {
        console.log(`[ValidationScheduler] Module ${moduleId} already scheduled`);
        return existingJob.id;
      }

      // Create new job
      const job: ValidationJob = {
        id: crypto.randomUUID(),
        moduleId,
        status: ValidationJobStatus.PENDING,
        progress: 0,
        startedAt: null,
        completedAt: null,
        error: null,
        totalEntities: 0,
        processedEntities: 0,
      };

      this.jobs.set(job.id, job);

      console.log(`[ValidationScheduler] Scheduled validation job ${job.id} for module ${moduleId}`);

      // If priority or not at capacity, start immediately
      if (priority || this.activeJobs.size < this.config.maxConcurrentJobs) {
        this.executeJob(job.id);
      }

      return job.id;
    } catch (error) {
      console.error(`[ValidationScheduler] Error scheduling validation for ${moduleId}:`, error);
      throw error;
    }
  }

  /**
   * Cancel a validation job
   */
  cancelValidation(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job) {
      return false;
    }

    if (job.status === ValidationJobStatus.IN_PROGRESS) {
      job.status = ValidationJobStatus.CANCELLED;
      this.activeJobs.delete(jobId);
      console.log(`[ValidationScheduler] Cancelled job ${jobId}`);
      return true;
    }

    if (job.status === ValidationJobStatus.PENDING) {
      job.status = ValidationJobStatus.CANCELLED;
      console.log(`[ValidationScheduler] Cancelled pending job ${jobId}`);
      return true;
    }

    return false;
  }

  /**
   * Get job status
   */
  getJobStatus(jobId: string): ValidationJob | null {
    return this.jobs.get(jobId) || null;
  }

  /**
   * Get all jobs for a module
   */
  getModuleJobs(moduleId: string): ValidationJob[] {
    return Array.from(this.jobs.values()).filter((job) => job.moduleId === moduleId);
  }

  /**
   * Get all active jobs
   */
  getActiveJobs(): ValidationJob[] {
    return Array.from(this.jobs.values()).filter(
      (job) => job.status === ValidationJobStatus.IN_PROGRESS
    );
  }

  /**
   * Clear completed jobs older than 1 hour
   */
  cleanupJobs(): void {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    for (const [jobId, job] of this.jobs.entries()) {
      if (
        (job.status === ValidationJobStatus.COMPLETED || job.status === ValidationJobStatus.FAILED) &&
        job.completedAt &&
        job.completedAt < oneHourAgo
      ) {
        this.jobs.delete(jobId);
      }
    }
  }

  /**
   * Batch validate multiple modules
   */
  async batchValidate(moduleIds: string[]): Promise<string[]> {
    const jobIds: string[] = [];

    for (const moduleId of moduleIds) {
      try {
        const jobId = await this.scheduleValidation(moduleId, false);
        jobIds.push(jobId);
      } catch (error) {
        console.error(`[ValidationScheduler] Error scheduling validation for ${moduleId}:`, error);
      }
    }

    return jobIds;
  }

  /**
   * Validate all modules that need revalidation
   */
  async validateStaleModules(): Promise<string[]> {
    if (!this.config.enableAutoRevalidation) {
      return [];
    }

    try {
      const cutoffDate = new Date(
        Date.now() - this.config.autoRevalidateAfterHours * 60 * 60 * 1000
      );

      // Find modules that need revalidation
      const staleModules = await this.db
        .select({ id: modules.id })
        .from(modules)
        .where(
          and(
            eq(modules.isActive, true),
            or(
              lt(modules.validatedAt, cutoffDate),
              isNull(modules.validatedAt),
              eq(modules.validationStatus, 'pending')
            )
          )
        );

      console.log(`[ValidationScheduler] Found ${staleModules.length} modules needing revalidation`);

      return this.batchValidate(staleModules.map((m) => m.id));
    } catch (error) {
      console.error('[ValidationScheduler] Error finding stale modules:', error);
      return [];
    }
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  /**
   * Check for modules needing validation and schedule them
   */
  private async checkAndScheduleValidations(): Promise<void> {
    try {
      // Clean up old jobs
      this.cleanupJobs();

      // Start pending jobs if capacity available
      this.startPendingJobs();

      // Check for stale modules
      await this.validateStaleModules();
    } catch (error) {
      console.error('[ValidationScheduler] Error in validation check:', error);
    }
  }

  /**
   * Start pending jobs up to capacity
   */
  private startPendingJobs(): void {
    if (this.activeJobs.size >= this.config.maxConcurrentJobs) {
      return;
    }

    const pendingJobs = Array.from(this.jobs.values())
      .filter((job) => job.status === ValidationJobStatus.PENDING)
      .slice(0, this.config.maxConcurrentJobs - this.activeJobs.size);

    for (const job of pendingJobs) {
      this.executeJob(job.id);
    }
  }

  /**
   * Execute a validation job
   */
  private async executeJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) {
      return;
    }

    // Check if job was cancelled
    if (job.status === ValidationJobStatus.CANCELLED) {
      return;
    }

    // Mark as in progress
    job.status = ValidationJobStatus.IN_PROGRESS;
    job.startedAt = new Date();
    this.activeJobs.add(jobId);

    console.log(`[ValidationScheduler] Starting job ${jobId} for module ${job.moduleId}`);

    try {
      // Get module entity count for progress tracking
      const [module] = await this.db
        .select()
        .from(modules)
        .where(eq(modules.id, job.moduleId))
        .limit(1);

      if (!module) {
        throw new Error(`Module ${job.moduleId} not found`);
      }

      // Run validation with progress tracking
      const result = await moduleValidatorService.revalidateModuleFromDb(
        this.db,
        job.moduleId
      );

      // Update job with results
      job.status = ValidationJobStatus.COMPLETED;
      job.completedAt = new Date();
      job.progress = 100;
      job.totalEntities = result.entityCount || 0;
      job.processedEntities = result.entityCount || 0;

      console.log(
        `[ValidationScheduler] Completed job ${jobId}: ${result.errors.length} errors, ${result.warnings.length} warnings`
      );
    } catch (error) {
      console.error(`[ValidationScheduler] Job ${jobId} failed:`, error);

      job.status = ValidationJobStatus.FAILED;
      job.completedAt = new Date();
      job.error = error instanceof Error ? error.message : String(error);
    } finally {
      this.activeJobs.delete(jobId);

      // Start next pending job if available
      this.startPendingJobs();
    }
  }
}

/**
 * Create and export scheduler instance
 * Note: Database must be provided when initializing the scheduler
 */
let schedulerInstance: ValidationScheduler | null = null;

export function initializeScheduler(db: Database, config?: Partial<SchedulerConfig>): ValidationScheduler {
  if (schedulerInstance) {
    console.warn('[ValidationScheduler] Scheduler already initialized');
    return schedulerInstance;
  }

  schedulerInstance = new ValidationScheduler(db, config);
  return schedulerInstance;
}

export function getScheduler(): ValidationScheduler {
  if (!schedulerInstance) {
    throw new Error('ValidationScheduler not initialized. Call initializeScheduler() first.');
  }
  return schedulerInstance;
}

export function shutdownScheduler(): void {
  if (schedulerInstance) {
    schedulerInstance.stop();
    schedulerInstance = null;
  }
}
