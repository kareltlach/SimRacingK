// ─── CornerAnalyzer ──────────────────────────────────────────────────────────
// Extracts per-corner driving metrics from telemetry samples within a
// given BrakeZone.

import type { TelemetrySample, BrakeZone, CornerMetrics } from '../shared/types';

/** Brake threshold that marks "braking has started" */
const BRAKE_THRESHOLD = 0.10;
/** Throttle threshold that marks "full throttle application" */
const THROTTLE_THRESHOLD = 0.80;

/**
 * Extract the slice of samples whose trackProgress falls within
 * [zone.startProgress, zone.endProgress], sorted by trackProgress.
 */
function extractZoneSamples(
  samples: TelemetrySample[],
  zone: BrakeZone,
): TelemetrySample[] {
  return samples
    .filter(
      (s) => s.trackProgress >= zone.startProgress && s.trackProgress <= zone.endProgress,
    )
    .sort((a, b) => a.trackProgress - b.trackProgress);
}

/**
 * Analyse a single corner (brake zone) and return quantitative metrics.
 *
 * @param samples - Full lap telemetry samples (any order).
 * @param zone    - The brake zone to analyse.
 * @returns CornerMetrics for the zone.
 */
export function analyzeCorner(
  samples: TelemetrySample[],
  zone: BrakeZone,
): CornerMetrics {
  const zoneSamples = extractZoneSamples(samples, zone);

  if (zoneSamples.length === 0) {
    // Edge-case: no samples inside the zone — return zeroed metrics.
    return {
      brakePoint: zone.startProgress,
      brakeForce: 0,
      apexSpeed: 0,
      throttlePoint: zone.endProgress,
      maxSteeringAngle: 0,
      minSpeed: 0,
      exitSpeed: 0,
      timeInZone: 0,
    };
  }

  // ── brakePoint: trackProgress of first sample where brake > BRAKE_THRESHOLD
  let brakePoint = zone.startProgress;
  for (const s of zoneSamples) {
    if (s.brake > BRAKE_THRESHOLD) {
      brakePoint = s.trackProgress;
      break;
    }
  }

  // ── brakeForce: maximum brake value in zone
  let brakeForce = 0;
  for (const s of zoneSamples) {
    if (s.brake > brakeForce) brakeForce = s.brake;
  }

  // ── minSpeed & apexSpeed (same thing — minimum speedKmh in zone)
  let minSpeed = Infinity;
  let apexIdx = 0;
  for (let i = 0; i < zoneSamples.length; i++) {
    if (zoneSamples[i].speedKmh < minSpeed) {
      minSpeed = zoneSamples[i].speedKmh;
      apexIdx = i;
    }
  }
  const apexSpeed = minSpeed === Infinity ? 0 : minSpeed;
  if (minSpeed === Infinity) minSpeed = 0;

  // ── throttlePoint: trackProgress of first sample with throttle > THROTTLE_THRESHOLD
  //    *after* the apex (i.e. from apexIdx onward)
  let throttlePoint = zone.endProgress; // default: end of zone
  for (let i = apexIdx; i < zoneSamples.length; i++) {
    if (zoneSamples[i].throttle > THROTTLE_THRESHOLD) {
      throttlePoint = zoneSamples[i].trackProgress;
      break;
    }
  }

  // ── maxSteeringAngle: maximum |steeringAngle| in zone
  let maxSteeringAngle = 0;
  for (const s of zoneSamples) {
    const absAngle = Math.abs(s.steeringAngle);
    if (absAngle > maxSteeringAngle) maxSteeringAngle = absAngle;
  }

  // ── exitSpeed: speedKmh of the last sample in the zone
  const exitSpeed = zoneSamples[zoneSamples.length - 1].speedKmh;

  // ── timeInZone: difference between first and last timestamp in the zone
  const timeInZone =
    zoneSamples[zoneSamples.length - 1].timestamp - zoneSamples[0].timestamp;

  return {
    brakePoint,
    brakeForce,
    apexSpeed,
    throttlePoint,
    maxSteeringAngle,
    minSpeed,
    exitSpeed,
    timeInZone,
  };
}

/**
 * Convenience: analyse every zone in an array and return an array of metrics
 * in the same order.
 */
export function analyzeAllCorners(
  samples: TelemetrySample[],
  zones: BrakeZone[],
): CornerMetrics[] {
  return zones.map((zone) => analyzeCorner(samples, zone));
}
