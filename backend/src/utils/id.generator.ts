import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return uuidv4();
}

/**
 * Generate a forecast ID with prefix
 */
export function generateForecastId(): string {
  return `fc-${uuidv4().slice(0, 8)}`;
}

/**
 * Generate a task ID with prefix
 */
export function generateTaskId(): string {
  return `task-${uuidv4().slice(0, 8)}`;
}
