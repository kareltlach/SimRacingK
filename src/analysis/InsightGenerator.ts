// ─── InsightGenerator ────────────────────────────────────────────────────────
// Produces natural-language coaching insights by comparing per-corner metrics
// between a reference lap and a target lap.  Insights are scored by estimated
// time lost and sorted so the biggest opportunities come first.

import type { LapComparison, RaceInsight, CornerMetrics, BrakeZone } from '../shared/types';

// ─── Thresholds ──────────────────────────────────────────────────────────────

/** Minimum absolute difference in brakePoint (normalised 0–1) to flag */
const BRAKE_POINT_THRESHOLD = 0.005; // 0.5 % of track
/** Minimum absolute apex-speed difference (km/h) to flag */
const APEX_SPEED_THRESHOLD = 3;
/** Minimum absolute difference in throttlePoint (normalised 0–1) to flag */
const THROTTLE_POINT_THRESHOLD = 0.005;
/** Minimum relative steering-angle increase (fraction) to flag */
const STEERING_RELATIVE_THRESHOLD = 0.15; // 15 %

/** How many top insights to return */
const TOP_N = 3;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Estimate the time lost (positive) or gained (negative) in a specific zone
 * from the deltaByProgress curve, computed as:
 *
 *   timeLost = Δ(zoneEnd) − Δ(zoneStart)
 *
 * where Δ(p) is the cumulative time delta at progress p.
 */
function timeLostInZone(
  deltaByProgress: Array<{ progress: number; timeDelta: number }>,
  zone: BrakeZone,
): number {
  // Find nearest delta entries for zone boundaries via binary search
  const deltaAtProgress = (p: number): number => {
    if (deltaByProgress.length === 0) return 0;
    let lo = 0;
    let hi = deltaByProgress.length - 1;

    // Clamp
    if (p <= deltaByProgress[0].progress) return deltaByProgress[0].timeDelta;
    if (p >= deltaByProgress[hi].progress) return deltaByProgress[hi].timeDelta;

    while (hi - lo > 1) {
      const mid = (lo + hi) >>> 1;
      if (deltaByProgress[mid].progress <= p) lo = mid;
      else hi = mid;
    }

    // Linear interpolation between lo and hi
    const pLo = deltaByProgress[lo].progress;
    const pHi = deltaByProgress[hi].progress;
    const dLo = deltaByProgress[lo].timeDelta;
    const dHi = deltaByProgress[hi].timeDelta;

    if (pHi === pLo) return dLo;
    const t = (p - pLo) / (pHi - pLo);
    return dLo + t * (dHi - dLo);
  };

  return deltaAtProgress(zone.endProgress) - deltaAtProgress(zone.startProgress);
}

/**
 * Convert a normalised trackProgress difference to an approximate distance
 * in metres, assuming a nominal 4 500 m track length.  Used only for
 * human-readable descriptions.
 */
function progressToMetres(dp: number, trackLengthM = 4500): number {
  return Math.abs(dp) * trackLengthM;
}

/** Round to one decimal place */
function r1(n: number): number {
  return Math.round(n * 10) / 10;
}

// ─── Insight builders ────────────────────────────────────────────────────────

function buildBrakingInsight(
  zone: BrakeZone,
  ref: CornerMetrics,
  tgt: CornerMetrics,
  timeLost: number,
): RaceInsight | null {
  const diff = tgt.brakePoint - ref.brakePoint;
  if (Math.abs(diff) < BRAKE_POINT_THRESHOLD) return null;

  const metres = r1(progressToMetres(diff));
  const earlyLate = diff < 0 ? { en: 'early', pt: 'cedo' } : { en: 'late', pt: 'tarde' };

  return {
    cornerIndex: zone.index,
    trackProgressStart: zone.startProgress,
    trackProgressEnd: zone.endProgress,
    timeLost,
    description: `Braking ${metres} m too ${earlyLate.en} at Turn ${zone.index}`,
    descriptionPtBr: `Frenagem ${metres} m ${earlyLate.pt} demais na Curva ${zone.index}`,
    category: 'braking',
  };
}

function buildApexSpeedInsight(
  zone: BrakeZone,
  ref: CornerMetrics,
  tgt: CornerMetrics,
  timeLost: number,
): RaceInsight | null {
  const diff = tgt.apexSpeed - ref.apexSpeed;
  if (Math.abs(diff) < APEX_SPEED_THRESHOLD) return null;

  const kmh = r1(Math.abs(diff));
  const lowerHigher = diff < 0
    ? { en: 'lower', pt: 'menor' }
    : { en: 'higher', pt: 'maior' };

  return {
    cornerIndex: zone.index,
    trackProgressStart: zone.startProgress,
    trackProgressEnd: zone.endProgress,
    timeLost,
    description: `Apex speed ${kmh} km/h ${lowerHigher.en} at Turn ${zone.index}`,
    descriptionPtBr: `Velocidade no ápice ${kmh} km/h ${lowerHigher.pt} na Curva ${zone.index}`,
    category: 'apex-speed',
  };
}

function buildThrottleInsight(
  zone: BrakeZone,
  ref: CornerMetrics,
  tgt: CornerMetrics,
  timeLost: number,
): RaceInsight | null {
  const diff = tgt.throttlePoint - ref.throttlePoint;
  if (Math.abs(diff) < THROTTLE_POINT_THRESHOLD) return null;

  const metres = r1(progressToMetres(diff));
  // Positive diff means target applies throttle later (further along the track)
  if (diff <= 0) return null; // earlier throttle is usually fine / positive

  return {
    cornerIndex: zone.index,
    trackProgressStart: zone.startProgress,
    trackProgressEnd: zone.endProgress,
    timeLost,
    description: `Throttle application ${metres} m later at Turn ${zone.index}`,
    descriptionPtBr: `Aceleração aplicada ${metres} m mais tarde na Curva ${zone.index}`,
    category: 'throttle',
  };
}

function buildSteeringInsight(
  zone: BrakeZone,
  ref: CornerMetrics,
  tgt: CornerMetrics,
  timeLost: number,
): RaceInsight | null {
  if (ref.maxSteeringAngle === 0) return null; // avoid division by zero

  const relativeIncrease =
    (tgt.maxSteeringAngle - ref.maxSteeringAngle) / ref.maxSteeringAngle;

  if (relativeIncrease < STEERING_RELATIVE_THRESHOLD) return null;

  const pct = r1(relativeIncrease * 100);

  return {
    cornerIndex: zone.index,
    trackProgressStart: zone.startProgress,
    trackProgressEnd: zone.endProgress,
    timeLost,
    description: `Excessive steering input (+${pct} %) at Turn ${zone.index} — possible understeer`,
    descriptionPtBr: `Esterço excessivo (+${pct} %) na Curva ${zone.index} — possível subesterço`,
    category: 'steering',
  };
}

// ─── Main ────────────────────────────────────────────────────────────────────

/**
 * Generate natural-language coaching insights from a LapComparison.
 *
 * Returns the top {@link TOP_N} insights sorted by absolute time lost
 * (biggest opportunities first).
 *
 * @param comparison - The result of {@link compareLaps}.
 */
export function generateInsights(comparison: LapComparison): RaceInsight[] {
  const { deltaByProgress, refMetrics, targetMetrics, zones } = comparison;

  const allInsights: RaceInsight[] = [];

  for (let i = 0; i < zones.length; i++) {
    const zone = zones[i];
    const ref = refMetrics[i];
    const tgt = targetMetrics[i];

    if (!ref || !tgt) continue;

    const tl = timeLostInZone(deltaByProgress, zone);

    const builders = [
      buildBrakingInsight,
      buildApexSpeedInsight,
      buildThrottleInsight,
      buildSteeringInsight,
    ];

    for (const build of builders) {
      const insight = build(zone, ref, tgt, tl);
      if (insight) allInsights.push(insight);
    }
  }

  // Sort by absolute time lost descending (biggest opportunity first)
  allInsights.sort((a, b) => Math.abs(b.timeLost) - Math.abs(a.timeLost));

  return allInsights.slice(0, TOP_N);
}
