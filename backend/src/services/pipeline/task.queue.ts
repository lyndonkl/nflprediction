import { memoryStore } from '../storage/memory.store.js';
import { buildPipelineConfig } from '../../config/presets.config.js';
import { createForecastContext } from '../../types/pipeline.types.js';
import type { PipelineTask, TaskState, AgentPreset, ForecastingStage } from '../../types/pipeline.types.js';
import { pipelineLogger } from '../../utils/logger.js';
import { generateTaskId, generateForecastId } from '../../utils/id.generator.js';
import { EventEmitter } from 'events';

export interface QueuedTask {
  task: PipelineTask;
  priority: number;
  addedAt: Date;
}

/**
 * Task Queue - manages pipeline task execution queue
 */
class TaskQueue extends EventEmitter {
  private queue: QueuedTask[] = [];

  /**
   * Add a task to the queue
   */
  enqueue(task: PipelineTask, priority: number = 0): void {
    // Store task in memory
    memoryStore.setTask(task);

    // Add to queue
    const queued: QueuedTask = {
      task,
      priority,
      addedAt: new Date(),
    };

    // Insert by priority (higher priority first)
    const insertIndex = this.queue.findIndex((q) => q.priority < priority);
    if (insertIndex === -1) {
      this.queue.push(queued);
    } else {
      this.queue.splice(insertIndex, 0, queued);
    }

    pipelineLogger.debug(
      { taskId: task.id, forecastId: task.forecastId, queueLength: this.queue.length },
      'Task enqueued'
    );

    this.emit('taskAdded', task);
  }

  /**
   * Get next task from queue
   */
  dequeue(): PipelineTask | undefined {
    const queued = this.queue.shift();
    return queued?.task;
  }

  /**
   * Peek at next task without removing
   */
  peek(): PipelineTask | undefined {
    return this.queue[0]?.task;
  }

  /**
   * Get queue length
   */
  get length(): number {
    return this.queue.length;
  }

  /**
   * Check if queue is empty
   */
  get isEmpty(): boolean {
    return this.queue.length === 0;
  }

  /**
   * Update task state
   */
  updateTaskState(taskId: string, state: TaskState, error?: string): PipelineTask | undefined {
    const task = memoryStore.getTask(taskId);
    if (!task) return undefined;

    task.state = state;
    task.updatedAt = new Date();

    if (error) {
      task.error = error;
    }

    if (state === 'completed' || state === 'failed') {
      task.completedAt = new Date();
    }

    memoryStore.setTask(task);

    // Emit appropriate event
    if (state === 'working') {
      this.emit('taskStarted', task);
    } else if (state === 'completed') {
      this.emit('taskCompleted', task);
    } else if (state === 'failed') {
      this.emit('taskFailed', task, error || 'Unknown error');
    }

    return task;
  }

  /**
   * Update task current stage
   */
  updateCurrentStage(taskId: string, stage: ForecastingStage | null): PipelineTask | undefined {
    const task = memoryStore.getTask(taskId);
    if (!task) return undefined;

    task.currentStage = stage;
    task.updatedAt = new Date();

    memoryStore.setTask(task);
    return task;
  }

  /**
   * Get task by ID
   */
  getTask(taskId: string): PipelineTask | undefined {
    return memoryStore.getTask(taskId);
  }

  /**
   * Get task by forecast ID
   */
  getTaskByForecastId(forecastId: string): PipelineTask | undefined {
    const tasks = memoryStore.getAllTasks();
    return tasks.find((t) => t.forecastId === forecastId);
  }

  /**
   * Cancel a task
   */
  cancel(taskId: string): boolean {
    // Remove from queue if present
    const queueIndex = this.queue.findIndex((q) => q.task.id === taskId);
    if (queueIndex !== -1) {
      this.queue.splice(queueIndex, 1);
    }

    // Update state
    const task = this.updateTaskState(taskId, 'cancelled');
    if (task) {
      pipelineLogger.info({ taskId }, 'Task cancelled');
      return true;
    }

    return false;
  }

  /**
   * Get all queued tasks
   */
  getQueued(): PipelineTask[] {
    return this.queue.map((q) => q.task);
  }

  /**
   * Get all active tasks (working state)
   */
  getActive(): PipelineTask[] {
    return memoryStore.getAllTasks().filter((t) => t.state === 'working');
  }

  /**
   * Clear the queue
   */
  clear(): void {
    this.queue = [];
    pipelineLogger.info('Task queue cleared');
  }

  /**
   * Create a new pipeline task
   */
  createTask(
    gameId: string,
    homeTeam: string,
    awayTeam: string,
    gameTime: Date,
    preset: AgentPreset = 'balanced'
  ): PipelineTask {
    const forecastId = generateForecastId();
    const config = buildPipelineConfig(preset);
    const context = createForecastContext(forecastId, gameId, homeTeam, awayTeam, gameTime);

    const task: PipelineTask = {
      id: generateTaskId(),
      forecastId,
      gameId,
      state: 'submitted',
      currentStage: null,
      preset,
      config,
      context,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    memoryStore.setTask(task);
    memoryStore.setContext(context);

    return task;
  }

  /**
   * Get queue statistics
   */
  stats(): {
    queueLength: number;
    activeCount: number;
    oldestWaitMs: number | null;
  } {
    const oldest = this.queue[this.queue.length - 1];
    return {
      queueLength: this.queue.length,
      activeCount: this.getActive().length,
      oldestWaitMs: oldest ? Date.now() - oldest.addedAt.getTime() : null,
    };
  }
}

// Singleton instance
export const taskQueue = new TaskQueue();
