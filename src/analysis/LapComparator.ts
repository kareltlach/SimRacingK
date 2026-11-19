// ─── LapComparator ───────────────────────────────────────────────────────────
// Compares two laps (reference vs. target) by interpolating both onto a
// common set of trackProgress points (every 0.1 %) and computing the
// cumulative time delta at each point.

import type { TelemetrySample, LapComparison } from '../shared/types';
import { detectBrakeZones } from './BrakeZoneDetector';
import { analyzeAllCorners } from './CornerAnalyzer';

/** Number of evenly-spaced comparison points (0.1 % spacing → 1001 points) */
const NUM_POINTS = 1001;

// ─── Interpolation helpers ───────────────────────────────────────────────────

/**
 * Build a monotonically-advancing array of (trackProgress, cumulativeTime)
 * from raw samples.  Samples are sorted by trackProgress; ties are resolved
 * by timestamp.  `cumulativeTime` is the elapsed time since the first sample.
 */
interface ProgressTime {
  progress: number;
  time: number;
}

function buildProgressTimeSeries(samples: TelemetrySample[]): ProgressTime[] {
  const sorted = [...samples].sort((a, b) => {
    const dp = a.trackProgress - b.trackProgress;
    return dp !== 0 ? dp : a.timestamp - b.timestamp;
  });

  if (sorted.length === 0) return [];

  const t0 = sorted[0].timestamp;
  const series: ProgressTime[] = [];

  // Keep only the first occurrence when progress goes backward (noise)
  let lastProgress = -1;
  for (const s of sorted) {
    if (s.trackProgress > lastProgress) {
      series.push({ progress: s.trackProgress, time: s.timestamp - t0 });
      lastProgress = s.trackProgress;
    }
  }

  return series;
}

/**
 * Linearly interpolate cumulative time for a given `progress` within a
 * sorted ProgressTime series.  Clamps to boundary values when outside range.
 */
function interpolateTime(series: ProgressTime[], progress: number): number {
  if (series.length === 0) return 0;
  if (progress <= series[0].progress) return series[0].time;
  if (progress >= series[series.length - 1].progress)
    return series[series.length - 1].time;

  // Binary search for the bracket [lo, hi] where
  // series[lo].progress ≤ progress < series[hi].progress
  let lo = 0;
  let hi = series.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >>> 1;
    if (series[mid].progress <= progress) lo = mid;
    else hi = mid;
  }

  const pLo = series[lo].progress;
  const pHi = series[hi].progress;
  const tLo = series[lo].time;
  const tHi = series[hi].time;

  if (pHi === pLo) return tLo; // avoid division by zero
  const t = (progress - pLo) / (pHi - pLo);
  return tLo + t * (tHi - tLo);
}

// ─── Main ────────────────────────────────────────────────────────────────────

/**
 * Compare a target lap against a reference lap.
 *
 * @param refSamples    - Telemetry samples for the reference (faster / ideal) lap.
 * @param targetSamples - Telemetry samples for the lap being analysed.
 * @returns A LapComparison with per-point deltas, total delta, corner metrics
 *          and detected zones.
 */
export function compareLaps(
  refSamples: TelemetrySample[],
  targetSamples: TelemetrySample[],
): LapComparison {
  // 1. Build progress → cumulative-time series for both laps
  const refSeries = buildProgressTimeSeries(refSamples);
  const tgtSeries = buildProgressTimeSeries(targetSamples);

  // 2. Create the common progress grid (0.000, 0.001, 0.002, … , 1.000)
  const deltaByProgress: Array<{ progress: number; timeDelta: number }> = [];

  for (let i = 0; i < NUM_POINTS; i++) {
    const progress = i / (NUM_POINTS - 1); // 0 → 1
    const refTime = interpolateTime(refSeries, progress);
    const tgtTime = interpolateTime(tgtSeries, progress);
    // Positive delta = target is slower (losing time)
    deltaByProgress.push({ progress, timeDelta: tgtTime - refTime });
  }

  // 3. Total delta = final cumulative difference
  const totalDelta =
    deltaByProgress.length > 0
      ? deltaByProgress[deltaByProgress.length - 1].timeDelta
      : 0;

  // 4. Detect brake zones from the reference lap
  const zones = detectBrakeZones(refSamples);

  // 5. Per-corner metrics for both laps
  const refMetrics = analyzeAllCorners(refSamples, zones);
  const targetMetrics = analyzeAllCorners(targetSamples, zones);

  return {
    deltaByProgress,
    totalDelta,
    refMetrics,
    targetMetrics,
    zones,
  };
}
