// ─────────────────────────────────────────────────────────────────────────────
// TrackGenerator.ts – Synthetic circuit path (Monza-inspired)
// ─────────────────────────────────────────────────────────────────────────────

export type CornerType = 'straight' | 'light' | 'medium' | 'heavy' | 'chicane' | 'hairpin';

export interface TrackPoint {
  x: number;             // world X (metres)
  z: number;             // world Z (metres)
  targetSpeed: number;   // km/h target speed at this point
  brakeZone: boolean;    // true if approaching heavy braking
  cornerType: CornerType;
  heading: number;       // radians
  curvature: number;     // 1/radius – 0 = straight
  sector: number;        // 0, 1, 2
  cumulativeDistance: number; // metres from start
}

export interface TrackInfo {
  name: string;
  points: TrackPoint[];
  totalLength: number;   // metres
  sectorDistances: [number, number, number]; // cumulative sector end distances
}

// ── Segment definition (before tessellation) ────────────────────────────────

interface TrackSegment {
  type: CornerType;
  deltaAngle: number;   // radians – positive = left turn
  length: number;       // metres
  targetSpeed: number;  // km/h
  brakeZone: boolean;
  sector: number;
}

// ── Monza-like layout ───────────────────────────────────────────────────────
// Autodromo Nazionale Monza: ~5.793 km
//   S1: Start/finish straight → T1 Variante del Rettifilo (chicane) → Curva Grande → Variante della Roggia
//   S2: Lesmo 1 → Lesmo 2 → Short straight → Variante Ascari
//   S3: Long back straight → Parabolica → start/finish

function monzaSegments(): TrackSegment[] {
  return [
    // ── Sector 1 ─────────────────────────────────────────
    // Start / finish straight
    { type: 'straight', deltaAngle: 0,         length: 650,  targetSpeed: 340, brakeZone: false, sector: 0 },
    // Braking zone into T1
    { type: 'straight', deltaAngle: 0,         length: 120,  targetSpeed: 280, brakeZone: true,  sector: 0 },
    // T1-T2 Variante del Rettifilo chicane (right-left)
    { type: 'chicane',  deltaAngle: -0.65,     length: 90,   targetSpeed: 80,  brakeZone: false, sector: 0 },
    { type: 'chicane',  deltaAngle: 0.70,      length: 80,   targetSpeed: 85,  brakeZone: false, sector: 0 },
    // Short accel to Curva Grande
    { type: 'straight', deltaAngle: 0,         length: 300,  targetSpeed: 300, brakeZone: false, sector: 0 },
    // Curva Grande (long sweeping right)
    { type: 'medium',   deltaAngle: -0.95,     length: 400,  targetSpeed: 240, brakeZone: false, sector: 0 },
    // Braking into Variante della Roggia
    { type: 'straight', deltaAngle: 0,         length: 100,  targetSpeed: 260, brakeZone: true,  sector: 0 },
    // Variante della Roggia chicane (left-right)
    { type: 'chicane',  deltaAngle: 0.55,      length: 70,   targetSpeed: 75,  brakeZone: false, sector: 0 },
    { type: 'chicane',  deltaAngle: -0.60,     length: 70,   targetSpeed: 80,  brakeZone: false, sector: 0 },

    // ── Sector 2 ─────────────────────────────────────────
    // Run to Lesmo 1
    { type: 'straight', deltaAngle: 0,         length: 160,  targetSpeed: 280, brakeZone: true,  sector: 1 },
    // Lesmo 1 (right)
    { type: 'medium',   deltaAngle: -0.50,     length: 150,  targetSpeed: 180, brakeZone: false, sector: 1 },
    // Run to Lesmo 2
    { type: 'straight', deltaAngle: 0,         length: 140,  targetSpeed: 260, brakeZone: true,  sector: 1 },
    // Lesmo 2 (right)
    { type: 'medium',   deltaAngle: -0.55,     length: 160,  targetSpeed: 170, brakeZone: false, sector: 1 },
    // Short straight
    { type: 'straight', deltaAngle: 0,         length: 350,  targetSpeed: 310, brakeZone: false, sector: 1 },
    // Braking into Ascari
    { type: 'straight', deltaAngle: 0,         length: 100,  targetSpeed: 260, brakeZone: true,  sector: 1 },
    // Variante Ascari (left-right-left)
    { type: 'chicane',  deltaAngle: 0.45,      length: 80,   targetSpeed: 150, brakeZone: false, sector: 1 },
    { type: 'chicane',  deltaAngle: -0.50,     length: 70,   targetSpeed: 155, brakeZone: false, sector: 1 },
    { type: 'chicane',  deltaAngle: 0.35,      length: 70,   targetSpeed: 160, brakeZone: false, sector: 1 },

    // ── Sector 3 ─────────────────────────────────────────
    // Long back straight (rettilineo tribune)
    { type: 'straight', deltaAngle: 0,         length: 820,  targetSpeed: 340, brakeZone: false, sector: 2 },
    // Braking into Parabolica
    { type: 'straight', deltaAngle: 0,         length: 160,  targetSpeed: 280, brakeZone: true,  sector: 2 },
    // Parabolica (long right-hander)
    { type: 'heavy',    deltaAngle: -1.35,     length: 380,  targetSpeed: 140, brakeZone: false, sector: 2 },
    // Exit / acceleration onto main straight
    { type: 'straight', deltaAngle: 0,         length: 280,  targetSpeed: 310, brakeZone: false, sector: 2 },
  ];
}

// ── Tessellate segments into evenly spaced TrackPoints ──────────────────────

function tessellate(segments: TrackSegment[], resolution: number = 2): TrackInfo {
  const points: TrackPoint[] = [];
  let x = 0;
  let z = 0;
  let heading = 0; // radians – 0 = +X direction
  let cumulativeDistance = 0;

  for (const seg of segments) {
    const steps = Math.max(1, Math.round(seg.length / resolution));
    const stepLen = seg.length / steps;
    const dAngle = seg.deltaAngle / steps;
    const curvature = seg.length > 0 ? Math.abs(seg.deltaAngle) / seg.length : 0;

    for (let i = 0; i < steps; i++) {
      heading += dAngle;
      x += Math.cos(heading) * stepLen;
      z += Math.sin(heading) * stepLen;
      cumulativeDistance += stepLen;

      points.push({
        x,
        z,
        targetSpeed: seg.targetSpeed,
        brakeZone: seg.brakeZone,
        cornerType: seg.type,
        heading,
        curvature,
        sector: seg.sector,
        cumulativeDistance,
      });
    }
  }

  const totalLength = cumulativeDistance;

  // Calculate sector boundary cumulative distances
  let s1End = 0;
  let s2End = 0;
  for (const p of points) {
    if (p.sector === 0) s1End = p.cumulativeDistance;
    if (p.sector <= 1) s2End = p.cumulativeDistance;
  }

  return {
    name: 'Monza (Synthetic)',
    points,
    totalLength,
    sectorDistances: [s1End, s2End, totalLength],
  };
}

// ── Public API ──────────────────────────────────────────────────────────────

let cachedTrack: TrackInfo | null = null;

export function getTrack(): TrackInfo {
  if (!cachedTrack) {
    cachedTrack = tessellate(monzaSegments());
  }
  return cachedTrack;
}

/**
 * Returns interpolated position, heading and curvature at a normalised
 * trackProgress value (0-1).
 */
export function getPointAtProgress(progress: number): TrackPoint {
  const track = getTrack();
  const p = ((progress % 1) + 1) % 1; // normalise to [0,1)
  const targetDist = p * track.totalLength;
  const pts = track.points;

  // Binary search for the nearest point
  let lo = 0;
  let hi = pts.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (pts[mid].cumulativeDistance < targetDist) lo = mid + 1;
    else hi = mid;
  }

  // Interpolate between lo-1 and lo
  if (lo === 0) return { ...pts[0], cumulativeDistance: targetDist };

  const a = pts[lo - 1];
  const b = pts[lo];
  const segLen = b.cumulativeDistance - a.cumulativeDistance;
  const t = segLen > 0 ? (targetDist - a.cumulativeDistance) / segLen : 0;

  return {
    x: a.x + (b.x - a.x) * t,
    z: a.z + (b.z - a.z) * t,
    targetSpeed: a.targetSpeed + (b.targetSpeed - a.targetSpeed) * t,
    brakeZone: b.brakeZone,
    cornerType: b.cornerType,
    heading: a.heading + (b.heading - a.heading) * t,
    curvature: a.curvature + (b.curvature - a.curvature) * t,
    sector: b.sector,
    cumulativeDistance: targetDist,
  };
}

/**
 * Get the sector index (0, 1, 2) for a given track progress.
 */
export function getSectorAtProgress(progress: number): number {
  const track = getTrack();
  const dist = ((progress % 1 + 1) % 1) * track.totalLength;
  if (dist <= track.sectorDistances[0]) return 0;
  if (dist <= track.sectorDistances[1]) return 1;
  return 2;
}
