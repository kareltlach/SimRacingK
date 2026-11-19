// ─── TelemetryAnalyzerEngine ─────────────────────────────────────────────────
// Main orchestrator that ties together all analysis sub-modules to produce
// a complete coaching analysis of a target lap vs. a reference lap.

import type {
  TelemetrySample,
  BrakeZone,
  RaceInsight,
} from '../shared/types';

import { detectBrakeZones } from './BrakeZoneDetector';
import { compareLaps } from './LapComparator';
import { generateInsights } from './InsightGenerator';

// ─── Result type ─────────────────────────────────────────────────────────────

/**
 * Complete result returned by the TelemetryAnalyzerEngine.
 */
export interface AnalysisResult {
  /** Top coaching insights sorted by impact (biggest time-loss first) */
  insights: RaceInsight[];
  /**
   * Cumulative time-delta curve sampled at every 0.1 % of track progress.
   * Positive values mean the target lap is slower than the reference.
   */
  deltaByProgress: Array<{ progress: number; delta: number }>;
  /** Detected brake zones (corners) from the reference lap */
  zones: BrakeZone[];
}

// ─── Engine ──────────────────────────────────────────────────────────────────

/**
 * Analyse a target lap against a reference lap and produce coaching insights.
 *
 * Usage:
 * ```ts
 * const result = analyzeLaps(refSamples, targetSamples);
 * console.log(result.insights);     // top 3 coaching tips
 * console.log(result.zones);        // detected corners
 * console.log(result.deltaByProgress); // plot-ready delta curve
 * ```
 *
 * @param refSamples    - Telemetry for the reference (ideal / fastest) lap.
 * @param targetSamples - Telemetry for the lap under review.
 * @returns An {@link AnalysisResult} with insights, delta curve, and zones.
 */
export function analyzeLaps(
  refSamples: TelemetrySample[],
  targetSamples: TelemetrySample[],
): AnalysisResult {
  // 1. Detect brake zones from the reference lap (the "truth")
  const zones = detectBrakeZones(refSamples);

  // 2. Full lap comparison (deltas + per-corner metrics for both laps)
  const comparison = compareLaps(refSamples, targetSamples);

  // 3. Generate natural-language coaching insights
  const insights = generateInsights(comparison);

  // 4. Map deltaByProgress to the simpler { progress, delta } shape
  const deltaByProgress = comparison.deltaByProgress.map((d) => ({
    progress: d.progress,
    delta: d.timeDelta,
  }));

  return { insights, deltaByProgress, zones };
}

// ─── Re-exports for convenience ──────────────────────────────────────────────

export { detectBrakeZones } from './BrakeZoneDetector';
export { analyzeCorner, analyzeAllCorners } from './CornerAnalyzer';
export { compareLaps } from './LapComparator';
export { generateInsights } from './InsightGenerator';
