import { agentLogger } from '../utils/logger.js';

/**
 * Calibration bucket for tracking prediction accuracy
 */
export interface CalibrationBucket {
  bucketId: string;
  minProbability: number;
  maxProbability: number;
  predictions: number;
  outcomes: number; // Number of times the event occurred
  accuracy: number | null; // outcomes / predictions
}

/**
 * Prediction record for tracking
 */
export interface PredictionRecord {
  forecastId: string;
  gameId: string;
  predictedProbability: number;
  bucket: string;
  timestamp: Date;
  outcome: boolean | null; // null = pending, true = occurred, false = did not occur
}

/**
 * Calibration anchor for synthesis agent
 */
export interface CalibrationAnchor {
  probabilityBucket: string;
  historicalAccuracy: number | null;
  sampleSize: number;
  message: string;
}

/**
 * In-memory Calibration Service
 * Tracks prediction accuracy by probability bucket for calibration feedback
 */
class CalibrationService {
  private buckets: Map<string, CalibrationBucket> = new Map();
  private predictions: Map<string, PredictionRecord> = new Map();

  constructor() {
    this.initializeBuckets();
  }

  /**
   * Initialize 10% probability buckets
   */
  private initializeBuckets(): void {
    const bucketRanges = [
      { id: '0-10%', min: 0, max: 0.1 },
      { id: '10-20%', min: 0.1, max: 0.2 },
      { id: '20-30%', min: 0.2, max: 0.3 },
      { id: '30-40%', min: 0.3, max: 0.4 },
      { id: '40-50%', min: 0.4, max: 0.5 },
      { id: '50-60%', min: 0.5, max: 0.6 },
      { id: '60-70%', min: 0.6, max: 0.7 },
      { id: '70-80%', min: 0.7, max: 0.8 },
      { id: '80-90%', min: 0.8, max: 0.9 },
      { id: '90-100%', min: 0.9, max: 1.0 },
    ];

    for (const range of bucketRanges) {
      this.buckets.set(range.id, {
        bucketId: range.id,
        minProbability: range.min,
        maxProbability: range.max,
        predictions: 0,
        outcomes: 0,
        accuracy: null,
      });
    }
  }

  /**
   * Get bucket ID for a probability
   */
  private getBucketId(probability: number): string {
    if (probability < 0.1) return '0-10%';
    if (probability < 0.2) return '10-20%';
    if (probability < 0.3) return '20-30%';
    if (probability < 0.4) return '30-40%';
    if (probability < 0.5) return '40-50%';
    if (probability < 0.6) return '50-60%';
    if (probability < 0.7) return '60-70%';
    if (probability < 0.8) return '70-80%';
    if (probability < 0.9) return '80-90%';
    return '90-100%';
  }

  /**
   * Record a new prediction
   */
  recordPrediction(forecastId: string, gameId: string, probability: number): void {
    const bucketId = this.getBucketId(probability);

    const record: PredictionRecord = {
      forecastId,
      gameId,
      predictedProbability: probability,
      bucket: bucketId,
      timestamp: new Date(),
      outcome: null,
    };

    this.predictions.set(forecastId, record);

    agentLogger.info(
      { forecastId, gameId, probability, bucket: bucketId },
      'Prediction recorded for calibration'
    );
  }

  /**
   * Record the outcome of a prediction
   */
  recordOutcome(forecastId: string, occurred: boolean): void {
    const record = this.predictions.get(forecastId);

    if (!record) {
      agentLogger.warn({ forecastId }, 'No prediction found for outcome');
      return;
    }

    if (record.outcome !== null) {
      agentLogger.warn({ forecastId }, 'Outcome already recorded');
      return;
    }

    record.outcome = occurred;

    // Update bucket statistics
    const bucket = this.buckets.get(record.bucket);
    if (bucket) {
      bucket.predictions++;
      if (occurred) {
        bucket.outcomes++;
      }
      bucket.accuracy = bucket.predictions > 0
        ? bucket.outcomes / bucket.predictions
        : null;
    }

    agentLogger.info(
      {
        forecastId,
        occurred,
        bucket: record.bucket,
        bucketAccuracy: bucket?.accuracy,
        bucketSampleSize: bucket?.predictions,
      },
      'Outcome recorded for calibration'
    );
  }

  /**
   * Get calibration data for a specific bucket
   */
  getCalibrationForBucket(bucketId: string): CalibrationBucket | undefined {
    return this.buckets.get(bucketId);
  }

  /**
   * Get calibration anchor for synthesis agent
   * Returns historical accuracy information for the probability bucket
   */
  getCalibrationAnchor(probability: number): CalibrationAnchor {
    const bucketId = this.getBucketId(probability);
    const bucket = this.buckets.get(bucketId);

    if (!bucket || bucket.predictions < 5) {
      return {
        probabilityBucket: bucketId,
        historicalAccuracy: null,
        sampleSize: bucket?.predictions || 0,
        message: `Insufficient data for ${bucketId} bucket (${bucket?.predictions || 0} predictions). No calibration adjustment recommended.`,
      };
    }

    const expectedMidpoint = (bucket.minProbability + bucket.maxProbability) / 2;
    const calibrationDiff = bucket.accuracy !== null
      ? bucket.accuracy - expectedMidpoint
      : 0;

    let message: string;
    if (Math.abs(calibrationDiff) < 0.05) {
      message = `When predicting ${bucketId}, historical accuracy is ${(bucket.accuracy! * 100).toFixed(0)}% (n=${bucket.predictions}). Well calibrated.`;
    } else if (calibrationDiff > 0) {
      message = `When predicting ${bucketId}, events occurred ${(bucket.accuracy! * 100).toFixed(0)}% of the time (n=${bucket.predictions}). You may be slightly underconfident.`;
    } else {
      message = `When predicting ${bucketId}, events occurred ${(bucket.accuracy! * 100).toFixed(0)}% of the time (n=${bucket.predictions}). You may be slightly overconfident.`;
    }

    return {
      probabilityBucket: bucketId,
      historicalAccuracy: bucket.accuracy,
      sampleSize: bucket.predictions,
      message,
    };
  }

  /**
   * Get all calibration buckets for reporting
   */
  getAllBuckets(): CalibrationBucket[] {
    return Array.from(this.buckets.values());
  }

  /**
   * Get overall calibration metrics
   */
  getCalibrationMetrics(): {
    totalPredictions: number;
    resolvedPredictions: number;
    pendingPredictions: number;
    brierScore: number | null;
    calibrationError: number | null;
  } {
    let totalPredictions = 0;
    let resolvedPredictions = 0;
    let brierSum = 0;
    let calibrationErrorSum = 0;
    let bucketsWithData = 0;

    for (const record of this.predictions.values()) {
      totalPredictions++;
      if (record.outcome !== null) {
        resolvedPredictions++;
        // Brier score component: (forecast - outcome)^2
        const outcomeValue = record.outcome ? 1 : 0;
        brierSum += Math.pow(record.predictedProbability - outcomeValue, 2);
      }
    }

    // Calculate calibration error across buckets
    for (const bucket of this.buckets.values()) {
      if (bucket.predictions >= 5 && bucket.accuracy !== null) {
        const expectedMidpoint = (bucket.minProbability + bucket.maxProbability) / 2;
        calibrationErrorSum += Math.abs(bucket.accuracy - expectedMidpoint);
        bucketsWithData++;
      }
    }

    return {
      totalPredictions,
      resolvedPredictions,
      pendingPredictions: totalPredictions - resolvedPredictions,
      brierScore: resolvedPredictions > 0 ? brierSum / resolvedPredictions : null,
      calibrationError: bucketsWithData > 0 ? calibrationErrorSum / bucketsWithData : null,
    };
  }

  /**
   * Get prediction by forecast ID
   */
  getPrediction(forecastId: string): PredictionRecord | undefined {
    return this.predictions.get(forecastId);
  }

  /**
   * Get all pending predictions (for outcome recording)
   */
  getPendingPredictions(): PredictionRecord[] {
    return Array.from(this.predictions.values())
      .filter(p => p.outcome === null);
  }

  /**
   * Reset all calibration data (for testing)
   */
  reset(): void {
    this.predictions.clear();
    this.initializeBuckets();
    agentLogger.info('Calibration service reset');
  }
}

// Singleton instance
export const calibrationService = new CalibrationService();
