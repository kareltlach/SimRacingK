// ─────────────────────────────────────────────────────────────────────────────
// MockTelemetryEngine.ts – Complete realistic telemetry simulation
// ─────────────────────────────────────────────────────────────────────────────

import {
  UnifiedTelemetryData,
  TireData,
  TireTempZones,
  LapTiming,
  createDefaultTelemetryData,
  validateTelemetryData,
} from '../UnifiedTelemetrySchema';
import { getTrack, getPointAtProgress, getSectorAtProgress, TrackInfo } from './TrackGenerator';

// ── Car physics constants ───────────────────────────────────────────────────

interface GearSpec {
  ratio: number;
  maxSpeedKmh: number;
}

const CAR_CONFIG = {
  name: 'Ferrari 488 GT3',
  idleRpm: 1050,
  maxRpm: 7800,
  redlineRpm: 7500,
  finalDrive: 3.23,
  wheelCircumference: 2.05, // metres
  mass: 1285,               // kg
  maxBrakeDecel: 42,        // m/s² (GT3 car under heavy braking)
  maxLateralG: 2.8,
  dragCoeff: 0.33,
  fuelTankCapacity: 110,    // litres
  fuelPerLap: 2.8,          // litres (Monza)
  gears: [
    { ratio: 3.08, maxSpeedKmh: 92 },
    { ratio: 2.19, maxSpeedKmh: 128 },
    { ratio: 1.63, maxSpeedKmh: 172 },
    { ratio: 1.29, maxSpeedKmh: 219 },
    { ratio: 1.03, maxSpeedKmh: 269 },
    { ratio: 0.84, maxSpeedKmh: 340 },
  ] as GearSpec[],
};

// ── Tire temperature model ──────────────────────────────────────────────────

interface TireThermalState {
  innerTemp: number;
  midTemp: number;
  outerTemp: number;
  coreTemp: number;
}

function initTireThermal(ambientTemp: number): TireThermalState {
  return {
    innerTemp: ambientTemp + 5,
    midTemp: ambientTemp + 3,
    outerTemp: ambientTemp + 2,
    coreTemp: ambientTemp,
  };
}

// ── Engine ───────────────────────────────────────────────────────────────────

function computeGear(speedKmh: number): number {
  if (speedKmh < 5) return 1;
  for (let g = CAR_CONFIG.gears.length - 1; g >= 0; g--) {
    // Upshift around 95% of gear max speed; downshift at ~60%
    if (speedKmh <= CAR_CONFIG.gears[g].maxSpeedKmh * 0.95) {
      // But don't be in too high a gear at low speeds
      if (g > 0 && speedKmh < CAR_CONFIG.gears[g - 1].maxSpeedKmh * 0.55) continue;
      return g + 1;
    }
  }
  return CAR_CONFIG.gears.length;
}

function computeRpm(speedKmh: number, gear: number): number {
  if (gear < 1 || gear > CAR_CONFIG.gears.length) return CAR_CONFIG.idleRpm;
  const g = CAR_CONFIG.gears[gear - 1];
  const speedMs = speedKmh / 3.6;
  const wheelRps = speedMs / CAR_CONFIG.wheelCircumference;
  const rpm = wheelRps * 60 * g.ratio * CAR_CONFIG.finalDrive;
  return Math.max(CAR_CONFIG.idleRpm, Math.min(CAR_CONFIG.maxRpm, rpm));
}

// ── Main engine class ───────────────────────────────────────────────────────

export class MockTelemetryEngine {
  private track: TrackInfo;
  private tickCount: number = 0;
  private sessionStartMs: number;

  // ── Simulation state ──
  private progress: number = 0;      // 0-1 track position
  private speedKmh: number = 0;
  private distanceTraveled: number = 0;
  private fuelLevel: number;
  private lapNumber: number = 0;
  private lapStartTime: number = 0;   // ms
  private sectorStartTime: number = 0;
  private currentSector: number = 0;
  private sectorTimesThisLap: number[] = [];
  private lastLapTime: number = 0;
  private bestLapTime: number = 0;
  private bestSectorTimes: number[] = [0, 0, 0];

  // ── Tire state (per wheel) ──
  private tires: { fl: TireThermalState; fr: TireThermalState; rl: TireThermalState; rr: TireThermalState };
  private tirePressures: TireData = { fl: 196, fr: 197, rl: 193, rr: 194 };
  private tyreWear: TireData = { fl: 1, fr: 1, rl: 1, rr: 1 };
  private brakeTemps: TireData = { fl: 300, fr: 300, rl: 280, rr: 280 };

  // ── Smoothing accumulators ──
  private smoothThrottle: number = 0;
  private smoothBrake: number = 0;
  private smoothSteering: number = 0;
  private prevSpeed: number = 0;
  private lateralG: number = 0;
  private longiG: number = 0;

  // ── Lap completion callback ──
  public onLapComplete?: (lapInfo: { lapNumber: number; lapTime: number; sectorTimes: number[] }) => void;

  constructor() {
    this.track = getTrack();
    this.sessionStartMs = Date.now();
    this.fuelLevel = CAR_CONFIG.fuelTankCapacity;

    const ambientTemp = 25;
    this.tires = {
      fl: initTireThermal(ambientTemp),
      fr: initTireThermal(ambientTemp),
      rl: initTireThermal(ambientTemp),
      rr: initTireThermal(ambientTemp),
    };
  }

  // ── Tick (call at 60 Hz) ──────────────────────────────────────────────────

  tick(): UnifiedTelemetryData {
    const dt = 1 / 60; // seconds per frame
    this.tickCount++;
    const elapsedMs = this.tickCount * (1000 / 60);

    // Get the target point on the track
    const trackPt = getPointAtProgress(this.progress);
    const targetSpeed = trackPt.targetSpeed;

    // ── Speed simulation with realistic ramp ──
    this.updateSpeed(targetSpeed, trackPt.brakeZone, trackPt.curvature, dt);

    // ── Advance position ──
    const speedMs = this.speedKmh / 3.6;
    const distanceDelta = speedMs * dt;
    this.distanceTraveled += distanceDelta;
    const prevProgress = this.progress;
    this.progress = (this.distanceTraveled % this.track.totalLength) / this.track.totalLength;

    // ── Sector and lap transitions ──
    const newSector = getSectorAtProgress(this.progress);
    this.handleSectorAndLapTransitions(prevProgress, elapsedMs, newSector);

    // ── Compute derived values ──
    const gear = computeGear(this.speedKmh);
    const rpm = computeRpm(this.speedKmh, gear);

    // ── Tire model update ──
    this.updateTires(dt, trackPt.curvature);

    // ── Brake temperature model ──
    this.updateBrakeTemps(dt);

    // ── Fuel consumption ──
    this.fuelLevel -= (CAR_CONFIG.fuelPerLap / this.track.totalLength) * distanceDelta;
    if (this.fuelLevel < 0) this.fuelLevel = 0;

    // ── G-forces ──
    const accelMs2 = (this.speedKmh - this.prevSpeed) / 3.6 / dt;
    this.longiG = this.lerp(this.longiG, accelMs2 / 9.81, 0.3);
    this.lateralG = this.lerp(
      this.lateralG,
      trackPt.curvature * speedMs * speedMs / 9.81,
      0.3
    );
    // Add direction sign based on heading change
    const lateralSign = trackPt.curvature > 0 ? Math.sign(getPointAtProgress(this.progress + 0.001).heading - trackPt.heading) : 0;
    this.prevSpeed = this.speedKmh;

    // ── Steering ──
    const targetSteering = Math.max(-1, Math.min(1, trackPt.curvature * speedMs * 0.015 * lateralSign));
    this.smoothSteering = this.lerp(this.smoothSteering, targetSteering, 0.15);

    // ── FFB ──
    const ffbBase = trackPt.curvature * speedMs * 0.08;
    const ffbNoise = (Math.sin(elapsedMs * 0.047) * 0.03) + (Math.sin(elapsedMs * 0.013) * 0.02);
    let ffbSignal = Math.max(-1, Math.min(1, ffbBase + ffbNoise));
    // Kerb rumble in chicanes
    if (trackPt.cornerType === 'chicane') {
      ffbSignal += Math.sin(elapsedMs * 0.5) * 0.15;
    }
    ffbSignal = Math.max(-1, Math.min(1, ffbSignal));
    const ffbClipping = Math.abs(ffbSignal) > 0.95;

    // ── ABS / TC simulation ──
    let absActivation = 0;
    let tcActivation = 0;
    if (this.smoothBrake > 0.85 && this.speedKmh > 40) {
      absActivation = 0.3 + Math.random() * 0.5;
    }
    if (this.smoothThrottle > 0.9 && this.speedKmh < 100 && gear <= 3) {
      tcActivation = 0.2 + Math.random() * 0.4;
    }

    // ── Wheel slip ──
    const slipBase = this.smoothBrake > 0.7 ? 0.02 + this.smoothBrake * 0.08 : this.smoothThrottle > 0.8 && gear <= 3 ? 0.01 + this.smoothThrottle * 0.05 : 0;
    const wheelSlip: TireData = {
      fl: slipBase * (1 + Math.random() * 0.3),
      fr: slipBase * (1 + Math.random() * 0.3),
      rl: slipBase * 1.3 * (1 + Math.random() * 0.3),
      rr: slipBase * 1.3 * (1 + Math.random() * 0.3),
    };

    // ── Updated world position ──
    const worldPt = getPointAtProgress(this.progress);

    // ── Build frame ──
    const data: Partial<UnifiedTelemetryData> = {
      timestamp: elapsedMs,

      speed: this.speedKmh,
      worldPosX: worldPt.x,
      worldPosY: 0, // flat track approximation
      worldPosZ: worldPt.z,
      yaw: worldPt.heading,
      pitch: 0,
      roll: this.lateralG * 0.015, // slight roll under lateral load
      gForceX: this.lateralG * lateralSign,
      gForceY: 1, // 1g standing
      gForceZ: this.longiG,

      rpm,
      maxRpm: CAR_CONFIG.maxRpm,
      gear,
      throttle: this.smoothThrottle,
      brake: this.smoothBrake,
      clutch: 0,
      steeringAngle: this.smoothSteering,
      fuelLevel: this.fuelLevel,
      fuelConsumptionPerLap: CAR_CONFIG.fuelPerLap,

      tyrePressure: { ...this.tirePressures },
      tyreTemp: this.buildTireTempZones(),
      tyreWear: { ...this.tyreWear },
      wheelSlip,

      suspensionTravel: {
        fl: 15 + this.longiG * 3 - this.lateralG * 2,
        fr: 15 + this.longiG * 3 + this.lateralG * 2,
        rl: 15 - this.longiG * 2 - this.lateralG * 1.5,
        rr: 15 - this.longiG * 2 + this.lateralG * 1.5,
      },
      rideHeight: {
        fl: 50 - this.longiG * 2 + this.lateralG * 1,
        fr: 50 - this.longiG * 2 - this.lateralG * 1,
        rl: 55 + this.longiG * 1.5 + this.lateralG * 0.8,
        rr: 55 + this.longiG * 1.5 - this.lateralG * 0.8,
      },

      brakeTemp: { ...this.brakeTemps },
      ffbSignal,
      ffbClipping,
      trackProgress: this.progress,
      distanceTraveled: this.distanceTraveled,

      lapTiming: this.buildLapTiming(elapsedMs),

      sessionInfo: {
        gameId: 'mock',
        sessionType: 'practice',
        trackName: this.track.name,
        carName: CAR_CONFIG.name,
        driverName: 'ApexTelemetry Tester',
        sessionTimeRemaining: -1,
      },

      trackCondition: {
        airTemp: 25 + Math.sin(elapsedMs * 0.00001) * 0.3,
        trackTemp: 32 + Math.sin(elapsedMs * 0.000008) * 0.5,
        windSpeed: 2.5 + Math.sin(elapsedMs * 0.000015) * 0.5,
        windDirection: 170 + Math.sin(elapsedMs * 0.000005) * 10,
        rainIntensity: 0,
        trackGrip: 0.98,
      },

      carDamage: { front: 0, rear: 0, left: 0, right: 0, engine: 0 },

      electronics: {
        abs: absActivation,
        tc: tcActivation,
        absLevel: 3,
        tcLevel: 4,
        engineMap: 1,
        brakeBias: 0.57,
      },
    };

    return validateTelemetryData(data);
  }

  // ── Internal helpers ──────────────────────────────────────────────────────

  private updateSpeed(targetSpeed: number, brakeZone: boolean, curvature: number, dt: number): void {
    // Cornering speed reduction based on curvature
    let effectiveTarget = targetSpeed;
    if (curvature > 0.001) {
      const maxCorneringSpeed = Math.sqrt(CAR_CONFIG.maxLateralG * 9.81 / curvature) * 3.6;
      effectiveTarget = Math.min(effectiveTarget, maxCorneringSpeed);
    }

    const speedDiff = effectiveTarget - this.speedKmh;
    let rawThrottle = 0;
    let rawBrake = 0;

    if (brakeZone || speedDiff < -20) {
      // Heavy braking
      const brakingIntensity = Math.min(1, Math.abs(speedDiff) / 120);
      rawBrake = 0.5 + brakingIntensity * 0.5;
      rawThrottle = 0;
      const decel = CAR_CONFIG.maxBrakeDecel * rawBrake * dt;
      this.speedKmh = Math.max(effectiveTarget * 0.9, this.speedKmh - decel * 3.6);
    } else if (speedDiff < 0) {
      // Slight lift / trail braking
      rawThrottle = Math.max(0, 0.3 + speedDiff / 50);
      rawBrake = Math.max(0, -speedDiff / 60);
      this.speedKmh += speedDiff * 0.08;
    } else {
      // Accelerating
      rawThrottle = Math.min(1, 0.5 + speedDiff / 80);
      rawBrake = 0;
      // Power curve: more acceleration at lower speeds
      const powerFactor = 1 - (this.speedKmh / 360);
      const accel = rawThrottle * powerFactor * 25 * dt;
      this.speedKmh = Math.min(effectiveTarget, this.speedKmh + accel * 3.6);
    }

    // Smooth inputs
    this.smoothThrottle = this.lerp(this.smoothThrottle, rawThrottle, 0.12);
    this.smoothBrake = this.lerp(this.smoothBrake, rawBrake, 0.15);
    this.speedKmh = Math.max(0, this.speedKmh);
  }

  private handleSectorAndLapTransitions(prevProgress: number, elapsedMs: number, newSector: number): void {
    // Sector transition
    if (newSector !== this.currentSector) {
      const sectorTime = (elapsedMs - this.sectorStartTime) / 1000;
      this.sectorTimesThisLap.push(sectorTime);

      // Track best sector times
      if (this.bestSectorTimes[this.currentSector] === 0 || sectorTime < this.bestSectorTimes[this.currentSector]) {
        this.bestSectorTimes[this.currentSector] = sectorTime;
      }

      this.currentSector = newSector;
      this.sectorStartTime = elapsedMs;
    }

    // Lap completion detection: progress wraps around (high to low)
    if (prevProgress > 0.95 && this.progress < 0.05) {
      // Complete the last sector
      const finalSectorTime = (elapsedMs - this.sectorStartTime) / 1000;
      this.sectorTimesThisLap.push(finalSectorTime);
      if (this.bestSectorTimes[this.currentSector] === 0 || finalSectorTime < this.bestSectorTimes[this.currentSector]) {
        this.bestSectorTimes[this.currentSector] = finalSectorTime;
      }

      const lapTime = (elapsedMs - this.lapStartTime) / 1000;

      if (this.lapNumber > 0) {
        // Don't count the out-lap
        this.lastLapTime = lapTime;
        if (this.bestLapTime === 0 || lapTime < this.bestLapTime) {
          this.bestLapTime = lapTime;
        }

        // Callback
        if (this.onLapComplete) {
          this.onLapComplete({
            lapNumber: this.lapNumber,
            lapTime,
            sectorTimes: [...this.sectorTimesThisLap],
          });
        }
      }

      this.lapNumber++;
      this.lapStartTime = elapsedMs;
      this.sectorStartTime = elapsedMs;
      this.currentSector = 0;
      this.sectorTimesThisLap = [];
    }
  }

  private updateTires(dt: number, curvature: number): void {
    const speedMs = this.speedKmh / 3.6;
    const loadFactor = 0.5 + speedMs * 0.004; // Higher speed = more heat

    // Tyre heating from friction
    const frictionHeat = (Math.abs(curvature) * speedMs * speedMs * 0.02 + this.smoothBrake * 8 + this.smoothThrottle * 2) * dt;

    // Ambient cooling
    const ambientTemp = 25;
    const coolingRate = 0.015 * dt * (1 + speedMs * 0.005); // more cooling at speed from airflow

    // Optimal tyre temp for GT3 ~85-105°C
    const positions: Array<'fl' | 'fr' | 'rl' | 'rr'> = ['fl', 'fr', 'rl', 'rr'];

    for (const pos of positions) {
      const tire = this.tires[pos];
      const isFront = pos === 'fl' || pos === 'fr';
      const isLeft = pos === 'fl' || pos === 'rl';

      // Front tires heat more from braking, rear from throttle
      const brakeHeatFactor = isFront ? 1.4 : 0.8;
      const throttleHeatFactor = isFront ? 0.6 : 1.3;

      // Lateral load distribution (outside tire heats more)
      const lateralFactor = curvature > 0 ?
        (isLeft ? 1.2 : 0.9) :
        (curvature < 0 ? (isLeft ? 0.9 : 1.2) : 1.0);

      const totalHeat = frictionHeat * loadFactor * lateralFactor *
        (brakeHeatFactor * this.smoothBrake + throttleHeatFactor * this.smoothThrottle + 0.3);

      // Inner heats fastest (more load), outer slowest
      tire.innerTemp += totalHeat * 1.15 - (tire.innerTemp - ambientTemp) * coolingRate;
      tire.midTemp += totalHeat * 1.0 - (tire.midTemp - ambientTemp) * coolingRate;
      tire.outerTemp += totalHeat * 0.85 - (tire.outerTemp - ambientTemp) * coolingRate;

      // Core temperature slowly averages
      tire.coreTemp += (((tire.innerTemp + tire.midTemp + tire.outerTemp) / 3) - tire.coreTemp) * 0.005 * dt;

      // Clamp
      tire.innerTemp = Math.max(ambientTemp, Math.min(150, tire.innerTemp));
      tire.midTemp = Math.max(ambientTemp, Math.min(145, tire.midTemp));
      tire.outerTemp = Math.max(ambientTemp, Math.min(140, tire.outerTemp));

      // Pressure increases with temperature (approx 0.1 kPa per °C)
      const basePressure = isFront ? 196 : 193;
      this.tirePressures[pos] = basePressure + (tire.coreTemp - ambientTemp) * 0.1;

      // Wear (very slow)
      this.tyreWear[pos] = Math.max(0, this.tyreWear[pos] - frictionHeat * 0.00001 * loadFactor);
    }
  }

  private updateBrakeTemps(dt: number): void {
    const positions: Array<'fl' | 'fr' | 'rl' | 'rr'> = ['fl', 'fr', 'rl', 'rr'];
    const speedMs = this.speedKmh / 3.6;

    for (const pos of positions) {
      const isFront = pos === 'fl' || pos === 'fr';
      const brakeBias = isFront ? 0.6 : 0.4;

      // Heating from braking
      const brakeHeat = this.smoothBrake * speedMs * brakeBias * 2.0 * dt;
      // Cooling from airflow
      const cooling = (this.brakeTemps[pos] - 25) * 0.008 * dt * (1 + speedMs * 0.003);

      this.brakeTemps[pos] += brakeHeat - cooling;
      this.brakeTemps[pos] = Math.max(80, Math.min(1200, this.brakeTemps[pos]));
    }
  }

  private buildTireTempZones(): TireTempZones {
    return {
      inner: {
        fl: this.tires.fl.innerTemp,
        fr: this.tires.fr.innerTemp,
        rl: this.tires.rl.innerTemp,
        rr: this.tires.rr.innerTemp,
      },
      mid: {
        fl: this.tires.fl.midTemp,
        fr: this.tires.fr.midTemp,
        rl: this.tires.rl.midTemp,
        rr: this.tires.rr.midTemp,
      },
      outer: {
        fl: this.tires.fl.outerTemp,
        fr: this.tires.fr.outerTemp,
        rl: this.tires.rl.outerTemp,
        rr: this.tires.rr.outerTemp,
      },
    };
  }

  private buildLapTiming(elapsedMs: number): LapTiming {
    return {
      currentLapTime: (elapsedMs - this.lapStartTime) / 1000,
      lastLapTime: this.lastLapTime,
      bestLapTime: this.bestLapTime,
      sectorIndex: this.currentSector,
      sectorTimes: [...this.sectorTimesThisLap],
      bestSectorTimes: [...this.bestSectorTimes],
      lapNumber: this.lapNumber,
      totalLaps: 0,
    };
  }

  private lerp(current: number, target: number, factor: number): number {
    return current + (target - current) * factor;
  }
}
