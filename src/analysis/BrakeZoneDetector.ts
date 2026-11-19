// ─── BrakeZoneDetector ───────────────────────────────────────────────────────
// Detects brake zones (corners) from a single lap's telemetry samples.
// Algorithm:
//   1. Sort samples by trackProgress.
//   2. Walk forward — a brake zone starts when brake > 0.10 for ≥3
//      consecutive samples.
//   3. The zone ends when brake drops below 0.05.
//   4. Apex = point of minimum speed within the zone.
//   5. Classify by minimum speed: <60 → hairpin, <120 → medium,
//      <180 → fast, else → chicane.
//   6. Merge zones whose starts are closer than 2 % trackProgress.

import type { TelemetrySample, BrakeZone } from '../shared/types';

/** Minimum brake value to consider braking active */
const BRAKE_ON_THRESHOLD = 0.10;
/** Brake value below which a zone is considered finished */
const BRAKE_OFF_THRESHOLD = 0.05;
/** How many consecutive above-threshold samples are required to open a zone */
const MIN_CONSECUTIVE = 3;
/** Zones whose startProgress are closer than this are merged */
const MERGE_GAP = 0.02;

/** Speed thresholds (km/h) for corner classification */
const HAIRPIN_MAX = 60;
const MEDIUM_MAX = 120;
const FAST_MAX = 180;

// ─── Helpers ─────────────────────────────────────────────────────────────────

interface RawZone {
  startIdx: number;
  endIdx: number;
}

function classifyCorner(minSpeed: number): BrakeZone['cornerType'] {
  if (minSpeed < HAIRPIN_MAX) return 'hairpin';
  if (minSpeed < MEDIUM_MAX) return 'medium';
  if (minSpeed < FAST_MAX) return 'fast';
  return 'chicane';
}

/**
 * Find the index of the sample with the minimum speedKmh between [lo, hi]
 * (inclusive) within an already-sorted array.
 */
function findApexIndex(sorted: TelemetrySample[], lo: number, hi: number): number {
  let minIdx = lo;
  let minSpeed = sorted[lo].speedKmh;
  for (let i = lo + 1; i <= hi; i++) {
    if (sorted[i].speedKmh < minSpeed) {
      minSpeed = sorted[i].speedKmh;
      minIdx = i;
    }
  }
  return minIdx;
}

// ─── Main ────────────────────────────────────────────────────────────────────

/**
 * Detect brake zones (corners) from a lap's telemetry samples.
 *
 * @param samples - Unsorted array of TelemetrySample for one lap.
 * @returns Array of BrakeZone sorted by startProgress.
 */
export function detectBrakeZones(samples: TelemetrySample[]): BrakeZone[] {
  if (samples.length < MIN_CONSECUTIVE) return [];

  // 1. Sort by trackProgress (non-destructive)
  const sorted = [...samples].sort((a, b) => a.trackProgress - b.trackProgress);

  // 2–3. Walk and collect raw zones
  const rawZones: RawZone[] = [];
  let consecutiveCount = 0;
  let zoneStartIdx = -1;
  let inZone = false;

  for (let i = 0; i < sorted.length; i++) {
    const braking = sorted[i].brake > BRAKE_ON_THRESHOLD;

    if (!inZone) {
      if (braking) {
        consecutiveCount++;
        if (consecutiveCount === 1) {
          zoneStartIdx = i;
        }
        if (consecutiveCount >= MIN_CONSECUTIVE) {
          inZone = true;
        }
      } else {
        consecutiveCount = 0;
        zoneStartIdx = -1;
      }
    } else {
      // Already inside a zone — look for end
      if (sorted[i].brake < BRAKE_OFF_THRESHOLD) {
        // Zone ends at the previous sample (last above-threshold) or current
        rawZones.push({ startIdx: zoneStartIdx, endIdx: i });
        inZone = false;
        consecutiveCount = 0;
        zoneStartIdx = -1;
      }
    }
  }

  // If the lap ends while still in a zone, close it
  if (inZone && zoneStartIdx >= 0) {
    rawZones.push({ startIdx: zoneStartIdx, endIdx: sorted.length - 1 });
  }

  if (rawZones.length === 0) return [];

  // 6. Merge zones whose startProgress are closer than MERGE_GAP
  const merged: RawZone[] = [rawZones[0]];
  for (let i = 1; i < rawZones.length; i++) {
    const prev = merged[merged.length - 1];
    const curr = rawZones[i];
    const gap = sorted[curr.startIdx].trackProgress - sorted[prev.endIdx].trackProgress;
    if (gap < MERGE_GAP) {
      // Merge: extend previous zone to encompass current
      prev.endIdx = curr.endIdx;
    } else {
      merged.push(curr);
    }
  }

  // 4–5. Build BrakeZone objects
  const zones: BrakeZone[] = merged.map((rz, idx) => {
    const apexIdx = findApexIndex(sorted, rz.startIdx, rz.endIdx);
    const minSpeed = sorted[apexIdx].speedKmh;

    return {
      index: idx + 1,
      startProgress: sorted[rz.startIdx].trackProgress,
      endProgress: sorted[rz.endIdx].trackProgress,
      apexProgress: sorted[apexIdx].trackProgress,
      cornerType: classifyCorner(minSpeed),
    };
  });

  return zones;
}
