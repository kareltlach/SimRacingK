import { create } from 'zustand'

export interface TelemetryFrame {
  speed: number
  speedKmh: number
  rpm: number
  maxRpm: number
  gear: number
  throttle: number
  brake: number
  clutch: number
  steeringAngle: number
  steer: number
  fuelLevel: number
  fuelRemaining: number
  fuelPerLap: number
  trackProgress: number
  tireTemps: {
    fl: [number, number, number] | number
    fr: [number, number, number] | number
    rl: [number, number, number] | number
    rr: [number, number, number] | number
  }
  tirePressures: { fl: number; fr: number; rl: number; rr: number }
  brakeTemps: { fl: number; fr: number; rl: number; rr: number }
  absActive: boolean
  tcActive: boolean
  pitLimiterActive: boolean
  delta: number
  timestamp: number
  gameId?: string
  carName?: string
  trackName?: string
  competitors?: any[]
  nearCars?: any[]
  worldX?: number
  worldZ?: number
}

interface TelemetryState {
  currentData: TelemetryFrame | null
  isConnected: boolean
  activeGame: string | null
  activeCar: string
  activeTrack: string
  telemetryRate: number
  inputHistory: TelemetryFrame[]

  setTelemetryData: (data: any) => void
  setConnection: (connected: boolean, game?: string | null) => void
  reset: () => void
}

const MAX_HISTORY = 300 // 5 seconds at 60fps

export const useTelemetryStore = create<TelemetryState>((set, get) => ({
  currentData: null,
  isConnected: false,
  activeGame: 'acc',
  activeCar: 'Assetto Corsa Competizione',
  activeTrack: 'Monza',
  telemetryRate: 60,
  inputHistory: [],

  setTelemetryData: (raw: any) => {
    if (!raw) return

    const state = get()

    const speed = Math.round(raw.speed !== undefined ? raw.speed : (raw.speedKmh || 0))
    const rpm = Math.round(raw.rpm || 0)
    const maxRpm = Math.round(raw.maxRpm || 8500)
    const gear = raw.gear !== undefined ? raw.gear : 0
    const throttle = raw.throttle !== undefined ? raw.throttle : (raw.gas !== undefined ? raw.gas : 0)
    const brake = raw.brake !== undefined ? raw.brake : 0
    const clutch = raw.clutch !== undefined ? raw.clutch : 0
    const steer = raw.steeringAngle !== undefined ? raw.steeringAngle : (raw.steer || 0)

    // 3-zone tire temperatures: Inner, Mid, Outer
    const zones = raw.tireZones || raw.tireTemps || raw.temps
    const tFL: [number, number, number] = Array.isArray(zones?.fl)
      ? zones.fl
      : typeof zones?.fl === 'number'
      ? [zones.fl, zones.fl, zones.fl]
      : Array.isArray(raw.temps) && raw.temps.length >= 4
      ? [raw.temps[0], raw.temps[0], raw.temps[0]]
      : [70, 70, 70]

    const tFR: [number, number, number] = Array.isArray(zones?.fr)
      ? zones.fr
      : typeof zones?.fr === 'number'
      ? [zones.fr, zones.fr, zones.fr]
      : Array.isArray(raw.temps) && raw.temps.length >= 4
      ? [raw.temps[1], raw.temps[1], raw.temps[1]]
      : [70, 70, 70]

    const tRL: [number, number, number] = Array.isArray(zones?.rl)
      ? zones.rl
      : typeof zones?.rl === 'number'
      ? [zones.rl, zones.rl, zones.rl]
      : Array.isArray(raw.temps) && raw.temps.length >= 4
      ? [raw.temps[2], raw.temps[2], raw.temps[2]]
      : [70, 70, 70]

    const tRR: [number, number, number] = Array.isArray(zones?.rr)
      ? zones.rr
      : typeof zones?.rr === 'number'
      ? [zones.rr, zones.rr, zones.rr]
      : Array.isArray(raw.temps) && raw.temps.length >= 4
      ? [raw.temps[3], raw.temps[3], raw.temps[3]]
      : [70, 70, 70]

    // Tire Pressures in PSI
    const pFL = raw.tirePressures?.fl || raw.tyrePressure?.fl || raw.pressures?.[0] || 25.5
    const pFR = raw.tirePressures?.fr || raw.tyrePressure?.fr || raw.pressures?.[1] || 25.5
    const pRL = raw.tirePressures?.rl || raw.tyrePressure?.rl || raw.pressures?.[2] || 26.0
    const pRR = raw.tirePressures?.rr || raw.tyrePressure?.rr || raw.pressures?.[3] || 26.0

    // Brake Temps in °C
    const bFL = raw.brakeTemps?.fl || raw.brakeTemp?.fl || raw.brakes?.[0] || 27
    const bFR = raw.brakeTemps?.fr || raw.brakeTemp?.fr || raw.brakes?.[1] || 27
    const bRL = raw.brakeTemps?.rl || raw.brakeTemp?.rl || raw.brakes?.[2] || 28
    const bRR = raw.brakeTemps?.rr || raw.brakeTemp?.rr || raw.brakes?.[3] || 28

    const rawTrack = raw.sessionInfo?.trackName || raw.trackName || raw.track || ''
    const rawCar = raw.sessionInfo?.carName || raw.carName || raw.car || ''
    const fuelVal = Math.round((raw.fuelLevel !== undefined ? raw.fuelLevel : (raw.fuel || 62.0)) * 10) / 10

    const frame: TelemetryFrame = {
      speed,
      speedKmh: speed,
      rpm,
      maxRpm,
      gear,
      throttle,
      brake,
      clutch,
      steeringAngle: steer,
      steer,
      fuelLevel: fuelVal,
      fuelRemaining: fuelVal,
      fuelPerLap: raw.fuelPerLap || 2.9,
      trackProgress: raw.trackProgress !== undefined ? raw.trackProgress : (raw.progress || 0),
      tireTemps: { fl: tFL, fr: tFR, rl: tRL, rr: tRR },
      tirePressures: { fl: pFL, fr: pFR, rl: pRL, rr: pRR },
      brakeTemps: { fl: bFL, fr: bFR, rl: bRL, rr: bRR },
      absActive: !!raw.electronics?.abs || !!raw.abs,
      tcActive: !!raw.electronics?.tc || !!raw.tc,
      pitLimiterActive: !!raw.pitLimiter,
      delta: raw.delta || 0,
      timestamp: raw.timestamp || Date.now(),
      trackName: rawTrack,
      carName: rawCar,
      competitors: raw.competitors || (raw as any).competitors || [],
      nearCars: raw.nearCars || (raw as any).nearCars || (raw as any).carsNearby || [],
      worldX: raw.worldX || 0,
      worldZ: raw.worldZ || 0,
    }

    const history = [...state.inputHistory, frame]
    if (history.length > MAX_HISTORY) {
      history.splice(0, history.length - MAX_HISTORY)
    }

    set({
      currentData: frame,
      isConnected: true,
      inputHistory: history,
      activeGame: raw.sessionInfo?.gameId || raw.gameId || state.activeGame,
      activeCar: rawCar || state.activeCar,
      activeTrack: rawTrack || state.activeTrack,
      telemetryRate: 60
    })
  },

  setConnection: (connected, game = null) =>
    set({ isConnected: connected, activeGame: game || 'acc' }),

  reset: () =>
    set({
      currentData: null,
      isConnected: false,
      telemetryRate: 0,
      inputHistory: [],
    }),
}))
