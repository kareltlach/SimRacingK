// ─────────────────────────────────────────────────────────────────────────────
// UnifiedTelemetrySchema.ts – Canonical telemetry schema & validation
// ─────────────────────────────────────────────────────────────────────────────

// ── Tire compound positions ──────────────────────────────────────────────────
export interface TireData {
  fl: number;
  fr: number;
  rl: number;
  rr: number;
}

export interface TireTempZones {
  inner: TireData;
  mid: TireData;
  outer: TireData;
}

// ── Per-wheel suspension data ────────────────────────────────────────────────
export interface SuspensionData {
  fl: number;
  fr: number;
  rl: number;
  rr: number;
}

// ── Lap / sector timing ─────────────────────────────────────────────────────
export interface LapTiming {
  currentLapTime: number;      // seconds
  lastLapTime: number;
  bestLapTime: number;
  sectorIndex: number;         // 0-based
  sectorTimes: number[];       // seconds per sector for current lap
  bestSectorTimes: number[];   // best sector times across session
  lapNumber: number;
  totalLaps: number;           // 0 = unlimited
}

// ── Session metadata ────────────────────────────────────────────────────────
export type SessionType = 'practice' | 'qualifying' | 'race' | 'hotlap' | 'replay' | 'unknown';
export type GameId =
  | 'assetto_corsa'
  | 'assetto_corsa_competizione'
  | 'assetto_corsa_evo'
  | 'le_mans_ultimate'
  | 'forza_motorsport'
  | 'forza_horizon'
  | 'ea_wrc'
  | 'mock'
  | 'lan_relay'
  | 'unknown';

export interface SessionInfo {
  gameId: GameId;
  sessionType: SessionType;
  trackName: string;
  carName: string;
  driverName: string;
  sessionTimeRemaining: number;  // seconds, -1 = unlimited
}

// ── Weather / track conditions ──────────────────────────────────────────────
export interface TrackCondition {
  airTemp: number;             // °C
  trackTemp: number;           // °C
  windSpeed: number;           // m/s
  windDirection: number;       // degrees 0-360
  rainIntensity: number;       // 0-1
  trackGrip: number;           // 0-1 (1 = full grip)
}

// ── Car damage ──────────────────────────────────────────────────────────────
export interface CarDamage {
  front: number;               // 0-1
  rear: number;
  left: number;
  right: number;
  engine: number;              // 0-1 (0 = no damage)
}

// ── Electronics / assists ───────────────────────────────────────────────────
export interface Electronics {
  abs: number;                 // 0-1 activation
  tc: number;                  // 0-1 activation
  absLevel: number;            // setting level
  tcLevel: number;
  engineMap: number;
  brakeBias: number;           // 0-1 (0 = full front)
}

// ── Full unified telemetry frame ────────────────────────────────────────────
export interface UnifiedTelemetryData {
  timestamp: number;           // ms since session start (high-res)

  // ── Motion / position ──
  speed: number;               // km/h
  worldPosX: number;           // metres
  worldPosY: number;           // metres (height)
  worldPosZ: number;           // metres
  yaw: number;                 // radians
  pitch: number;               // radians
  roll: number;                // radians
  gForceX: number;             // lateral g
  gForceY: number;             // vertical g
  gForceZ: number;             // longitudinal g

  // ── Engine / drivetrain ──
  rpm: number;
  maxRpm: number;
  gear: number;                // -1 = reverse, 0 = neutral, 1+ = forward
  throttle: number;            // 0-1
  brake: number;               // 0-1
  clutch: number;              // 0-1
  steeringAngle: number;       // -1 to 1 (left to right)
  fuelLevel: number;           // litres
  fuelConsumptionPerLap: number; // litres

  // ── Tyres ──
  tyrePressure: TireData;      // kPa
  tyreTemp: TireTempZones;     // °C
  tyreWear: TireData;          // 0-1 (1 = new)
  wheelSlip: TireData;         // ratio

  // ── Suspension ──
  suspensionTravel: SuspensionData;  // mm
  rideHeight: SuspensionData;        // mm

  // ── Brakes ──
  brakeTemp: TireData;         // °C

  // ── Force feedback ──
  ffbSignal: number;           // -1 to 1
  ffbClipping: boolean;        // true when signal clips

  // ── Track position ──
  trackProgress: number;       // 0-1 normalised position on track
  distanceTraveled: number;    // metres total

  // ── Timing ──
  lapTiming: LapTiming;

  // ── Session ──
  sessionInfo: SessionInfo;

  // ── Track conditions ──
  trackCondition: TrackCondition;

  // ── Damage ──
  carDamage: CarDamage;

  // ── Electronics ──
  electronics: Electronics;
}

// ── Default values ──────────────────────────────────────────────────────────

function defaultTireData(v = 0): TireData {
  return { fl: v, fr: v, rl: v, rr: v };
}

function defaultTireTempZones(v = 25): TireTempZones {
  return {
    inner: defaultTireData(v),
    mid: defaultTireData(v),
    outer: defaultTireData(v),
  };
}

function defaultLapTiming(): LapTiming {
  return {
    currentLapTime: 0,
    lastLapTime: 0,
    bestLapTime: 0,
    sectorIndex: 0,
    sectorTimes: [],
    bestSectorTimes: [],
    lapNumber: 0,
    totalLaps: 0,
  };
}

function defaultSessionInfo(): SessionInfo {
  return {
    gameId: 'unknown',
    sessionType: 'unknown',
    trackName: '',
    carName: '',
    driverName: '',
    sessionTimeRemaining: -1,
  };
}

function defaultTrackCondition(): TrackCondition {
  return {
    airTemp: 25,
    trackTemp: 30,
    windSpeed: 0,
    windDirection: 0,
    rainIntensity: 0,
    trackGrip: 1,
  };
}

function defaultCarDamage(): CarDamage {
  return { front: 0, rear: 0, left: 0, right: 0, engine: 0 };
}

function defaultElectronics(): Electronics {
  return { abs: 0, tc: 0, absLevel: 1, tcLevel: 1, engineMap: 1, brakeBias: 0.57 };
}

export function createDefaultTelemetryData(): UnifiedTelemetryData {
  return {
    timestamp: 0,
    speed: 0,
    worldPosX: 0,
    worldPosY: 0,
    worldPosZ: 0,
    yaw: 0,
    pitch: 0,
    roll: 0,
    gForceX: 0,
    gForceY: 0,
    gForceZ: 0,
    rpm: 0,
    maxRpm: 8000,
    gear: 0,
    throttle: 0,
    brake: 0,
    clutch: 0,
    steeringAngle: 0,
    fuelLevel: 50,
    fuelConsumptionPerLap: 2.5,
    tyrePressure: defaultTireData(200),
    tyreTemp: defaultTireTempZones(25),
    tyreWear: defaultTireData(1),
    wheelSlip: defaultTireData(0),
    suspensionTravel: defaultTireData(0),
    rideHeight: defaultTireData(50),
    brakeTemp: defaultTireData(200),
    ffbSignal: 0,
    ffbClipping: false,
    trackProgress: 0,
    distanceTraveled: 0,
    lapTiming: defaultLapTiming(),
    sessionInfo: defaultSessionInfo(),
    trackCondition: defaultTrackCondition(),
    carDamage: defaultCarDamage(),
    electronics: defaultElectronics(),
  };
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function mergeTireData(target: TireData, source: Partial<TireData> | undefined): TireData {
  if (!source) return target;
  return {
    fl: source.fl ?? target.fl,
    fr: source.fr ?? target.fr,
    rl: source.rl ?? target.rl,
    rr: source.rr ?? target.rr,
  };
}

function mergeTireTempZones(target: TireTempZones, source: Partial<TireTempZones> | undefined): TireTempZones {
  if (!source) return target;
  return {
    inner: mergeTireData(target.inner, source.inner),
    mid: mergeTireData(target.mid, source.mid),
    outer: mergeTireData(target.outer, source.outer),
  };
}

function clampTireData(td: TireData, min: number, max: number): TireData {
  return {
    fl: clamp(td.fl, min, max),
    fr: clamp(td.fr, min, max),
    rl: clamp(td.rl, min, max),
    rr: clamp(td.rr, min, max),
  };
}

function clampTireTempZones(tz: TireTempZones, min: number, max: number): TireTempZones {
  return {
    inner: clampTireData(tz.inner, min, max),
    mid: clampTireData(tz.mid, min, max),
    outer: clampTireData(tz.outer, min, max),
  };
}

// ── Validation ──────────────────────────────────────────────────────────────

export function validateTelemetryData(data: Partial<UnifiedTelemetryData>): UnifiedTelemetryData {
  const defaults = createDefaultTelemetryData();

  const result: UnifiedTelemetryData = {
    // Timing
    timestamp: data.timestamp ?? defaults.timestamp,

    // Motion – positions are unclamped, angles wrap
    speed: clamp(data.speed ?? defaults.speed, 0, 500),
    worldPosX: data.worldPosX ?? defaults.worldPosX,
    worldPosY: data.worldPosY ?? defaults.worldPosY,
    worldPosZ: data.worldPosZ ?? defaults.worldPosZ,
    yaw: data.yaw ?? defaults.yaw,
    pitch: data.pitch ?? defaults.pitch,
    roll: data.roll ?? defaults.roll,
    gForceX: clamp(data.gForceX ?? defaults.gForceX, -10, 10),
    gForceY: clamp(data.gForceY ?? defaults.gForceY, -10, 10),
    gForceZ: clamp(data.gForceZ ?? defaults.gForceZ, -10, 10),

    // Engine / drivetrain
    rpm: clamp(data.rpm ?? defaults.rpm, 0, 20000),
    maxRpm: clamp(data.maxRpm ?? defaults.maxRpm, 1000, 20000),
    gear: clamp(data.gear ?? defaults.gear, -1, 10),
    throttle: clamp(data.throttle ?? defaults.throttle, 0, 1),
    brake: clamp(data.brake ?? defaults.brake, 0, 1),
    clutch: clamp(data.clutch ?? defaults.clutch, 0, 1),
    steeringAngle: clamp(data.steeringAngle ?? defaults.steeringAngle, -1, 1),
    fuelLevel: clamp(data.fuelLevel ?? defaults.fuelLevel, 0, 200),
    fuelConsumptionPerLap: clamp(data.fuelConsumptionPerLap ?? defaults.fuelConsumptionPerLap, 0, 50),

    // Tyres
    tyrePressure: clampTireData(mergeTireData(defaults.tyrePressure, data.tyrePressure), 100, 400),
    tyreTemp: clampTireTempZones(mergeTireTempZones(defaults.tyreTemp, data.tyreTemp), -20, 300),
    tyreWear: clampTireData(mergeTireData(defaults.tyreWear, data.tyreWear), 0, 1),
    wheelSlip: clampTireData(mergeTireData(defaults.wheelSlip, data.wheelSlip), -5, 5),

    // Suspension
    suspensionTravel: mergeTireData(defaults.suspensionTravel, data.suspensionTravel as Partial<TireData> | undefined),
    rideHeight: mergeTireData(defaults.rideHeight, data.rideHeight as Partial<TireData> | undefined),

    // Brakes
    brakeTemp: clampTireData(mergeTireData(defaults.brakeTemp, data.brakeTemp), 0, 1500),

    // FFB
    ffbSignal: clamp(data.ffbSignal ?? defaults.ffbSignal, -1, 1),
    ffbClipping: data.ffbClipping ?? defaults.ffbClipping,

    // Track
    trackProgress: clamp(data.trackProgress ?? defaults.trackProgress, 0, 1),
    distanceTraveled: Math.max(data.distanceTraveled ?? defaults.distanceTraveled, 0),

    // Timing
    lapTiming: {
      currentLapTime: data.lapTiming?.currentLapTime ?? defaults.lapTiming.currentLapTime,
      lastLapTime: data.lapTiming?.lastLapTime ?? defaults.lapTiming.lastLapTime,
      bestLapTime: data.lapTiming?.bestLapTime ?? defaults.lapTiming.bestLapTime,
      sectorIndex: data.lapTiming?.sectorIndex ?? defaults.lapTiming.sectorIndex,
      sectorTimes: data.lapTiming?.sectorTimes ?? [...defaults.lapTiming.sectorTimes],
      bestSectorTimes: data.lapTiming?.bestSectorTimes ?? [...defaults.lapTiming.bestSectorTimes],
      lapNumber: data.lapTiming?.lapNumber ?? defaults.lapTiming.lapNumber,
      totalLaps: data.lapTiming?.totalLaps ?? defaults.lapTiming.totalLaps,
    },

    // Session
    sessionInfo: {
      gameId: data.sessionInfo?.gameId ?? defaults.sessionInfo.gameId,
      sessionType: data.sessionInfo?.sessionType ?? defaults.sessionInfo.sessionType,
      trackName: data.sessionInfo?.trackName ?? defaults.sessionInfo.trackName,
      carName: data.sessionInfo?.carName ?? defaults.sessionInfo.carName,
      driverName: data.sessionInfo?.driverName ?? defaults.sessionInfo.driverName,
      sessionTimeRemaining: data.sessionInfo?.sessionTimeRemaining ?? defaults.sessionInfo.sessionTimeRemaining,
    },

    // Track conditions
    trackCondition: {
      airTemp: clamp(data.trackCondition?.airTemp ?? defaults.trackCondition.airTemp, -40, 60),
      trackTemp: clamp(data.trackCondition?.trackTemp ?? defaults.trackCondition.trackTemp, -40, 80),
      windSpeed: clamp(data.trackCondition?.windSpeed ?? defaults.trackCondition.windSpeed, 0, 100),
      windDirection: clamp(data.trackCondition?.windDirection ?? defaults.trackCondition.windDirection, 0, 360),
      rainIntensity: clamp(data.trackCondition?.rainIntensity ?? defaults.trackCondition.rainIntensity, 0, 1),
      trackGrip: clamp(data.trackCondition?.trackGrip ?? defaults.trackCondition.trackGrip, 0, 1),
    },

    // Damage
    carDamage: {
      front: clamp(data.carDamage?.front ?? defaults.carDamage.front, 0, 1),
      rear: clamp(data.carDamage?.rear ?? defaults.carDamage.rear, 0, 1),
      left: clamp(data.carDamage?.left ?? defaults.carDamage.left, 0, 1),
      right: clamp(data.carDamage?.right ?? defaults.carDamage.right, 0, 1),
      engine: clamp(data.carDamage?.engine ?? defaults.carDamage.engine, 0, 1),
    },

    // Electronics
    electronics: {
      abs: clamp(data.electronics?.abs ?? defaults.electronics.abs, 0, 1),
      tc: clamp(data.electronics?.tc ?? defaults.electronics.tc, 0, 1),
      absLevel: clamp(data.electronics?.absLevel ?? defaults.electronics.absLevel, 0, 12),
      tcLevel: clamp(data.electronics?.tcLevel ?? defaults.electronics.tcLevel, 0, 12),
      engineMap: clamp(data.electronics?.engineMap ?? defaults.electronics.engineMap, 0, 10),
      brakeBias: clamp(data.electronics?.brakeBias ?? defaults.electronics.brakeBias, 0, 1),
    },
  };

  // Ensure maxRpm >= rpm
  if (result.rpm > result.maxRpm) {
    result.rpm = result.maxRpm;
  }

  return result;
}
