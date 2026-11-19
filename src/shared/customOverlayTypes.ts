export type CustomElementType =
  | 'text'
  | 'rectangle'
  | 'circle'
  | 'gauge-linear'
  | 'led-bar'
  | 'divider'

export interface CustomElementBinding {
  propertyKey: string // e.g. "speed", "rpm", "gear", "tireTemps.fl[0]", "fuelLevel"
  prefix?: string     // e.g. "KM/H: "
  suffix?: string     // e.g. " L"
  multiplier?: number // e.g. 1
  decimals?: number   // e.g. 1 or 0
  fallback?: string   // e.g. "--"
}

export interface CustomOverlayElement {
  id: string
  name: string
  type: CustomElementType
  x: number
  y: number
  width: number
  height: number
  zIndex: number
  
  // Style properties
  backgroundColor?: string
  borderColor?: string
  borderWidth?: number
  borderRadius?: number
  opacity?: number

  // Text specific
  text?: string
  fontSize?: number
  fontWeight?: 'normal' | 'bold' | '900'
  fontFamily?: 'sans' | 'mono' | 'serif'
  textColor?: string
  textAlign?: 'left' | 'center' | 'right'

  // Gauge / LED specific
  minVal?: number
  maxVal?: number
  fillColor?: string
  inactiveColor?: string

  // Dynamic Telemetry Binding
  binding?: CustomElementBinding
}

export interface CustomOverlayData {
  canvasWidth: number
  canvasHeight: number
  backgroundColor: string
  elements: CustomOverlayElement[]
}

export interface TelemetryFieldOption {
  key: string
  label: string
  category: 'Velocidade & Motor' | 'Pedais & Direção' | 'Pneus & Freios' | 'Tempos & Pista' | 'Combustível & Estratégia' | 'Eletrônica'
  unit?: string
  example?: string
}

export const AVAILABLE_TELEMETRY_FIELDS: TelemetryFieldOption[] = [
  // Velocidade & Motor
  { key: 'speedKmh', label: 'Velocidade (KM/H)', category: 'Velocidade & Motor', unit: 'km/h', example: '245' },
  { key: 'rpm', label: 'RPM Atual', category: 'Velocidade & Motor', unit: 'RPM', example: '6850' },
  { key: 'maxRpm', label: 'RPM Máximo', category: 'Velocidade & Motor', unit: 'RPM', example: '8500' },
  { key: 'gear', label: 'Marcha Atual (1-6, N, R)', category: 'Velocidade & Motor', example: '4' },

  // Pedais & Direção
  { key: 'throttle', label: 'Acelerador (0-100%)', category: 'Pedais & Direção', unit: '%', example: '100' },
  { key: 'brake', label: 'Freio (0-100%)', category: 'Pedais & Direção', unit: '%', example: '45' },
  { key: 'clutch', label: 'Embreagem (0-100%)', category: 'Pedais & Direção', unit: '%', example: '0' },
  { key: 'steeringAngle', label: 'Ângulo do Volante', category: 'Pedais & Direção', unit: '°', example: '-12.5' },

  // Tempos & Pista
  { key: 'trackName', label: 'Nome da Pista Atual', category: 'Tempos & Pista', example: 'Barcelona-Catalunya' },
  { key: 'carName', label: 'Nome do Carro / Modelo', category: 'Tempos & Pista', example: 'McLaren 720S GT3 Evo' },
  { key: 'trackProgress', label: 'Progresso da Volta (0-100%)', category: 'Tempos & Pista', unit: '%', example: '64' },
  { key: 'delta', label: 'Delta de Tempo da Volta', category: 'Tempos & Pista', unit: 's', example: '-0.35' },
  { key: 'currentLapTime', label: 'Tempo da Volta Atual', category: 'Tempos & Pista', example: '1:44.520' },
  { key: 'bestLapTime', label: 'Melhor Tempo da Sessão', category: 'Tempos & Pista', example: '1:43.110' },
  { key: 'lastLapTime', label: 'Tempo da Última Volta', category: 'Tempos & Pista', example: '1:44.200' },

  // Combustível & Estratégia
  { key: 'fuelRemaining', label: 'Combustível Restante', category: 'Combustível & Estratégia', unit: 'L', example: '45.2' },
  { key: 'fuelPerLap', label: 'Consumo por Volta', category: 'Combustível & Estratégia', unit: 'L/V', example: '3.15' },
  { key: 'estimatedLapsRemaining', label: 'Voltas Restantes Estimadas', category: 'Combustível & Estratégia', unit: 'v', example: '14.3' },

  // Pneus & Freios
  { key: 'tirePressures.fl', label: 'Pressão Pneu Diant. Esq. (FL)', category: 'Pneus & Freios', unit: 'PSI', example: '26.8' },
  { key: 'tirePressures.fr', label: 'Pressão Pneu Diant. Dir. (FR)', category: 'Pneus & Freios', unit: 'PSI', example: '26.9' },
  { key: 'tirePressures.rl', label: 'Pressão Pneu Tras. Esq. (RL)', category: 'Pneus & Freios', unit: 'PSI', example: '27.1' },
  { key: 'tirePressures.rr', label: 'Pressão Pneu Tras. Dir. (RR)', category: 'Pneus & Freios', unit: 'PSI', example: '27.2' },
  { key: 'brakeTemps.fl', label: 'Temp. Freio Diant. Esq. (FL)', category: 'Pneus & Freios', unit: '°C', example: '480' },
  { key: 'brakeTemps.fr', label: 'Temp. Freio Diant. Dir. (FR)', category: 'Pneus & Freios', unit: '°C', example: '485' },
  { key: 'brakeTemps.rl', label: 'Temp. Freio Tras. Esq. (RL)', category: 'Pneus & Freios', unit: '°C', example: '390' },
  { key: 'brakeTemps.rr', label: 'Temp. Freio Tras. Dir. (RR)', category: 'Pneus & Freios', unit: '°C', example: '395' },

  // Eletrônica
  { key: 'absActive', label: 'ABS Ativo (True/False)', category: 'Eletrônica', example: 'ATIVO' },
  { key: 'tcActive', label: 'TC Ativo (True/False)', category: 'Eletrônica', example: 'ATIVO' },
  { key: 'pitLimiter', label: 'Limitador de Pit Lane', category: 'Eletrônica', example: 'PIT' },
]

/**
 * Resolve um valor do objeto de telemetria usando notação de caminho ponto (ex: 'tirePressures.fl')
 * e suporte a chaves canônicas universais para compatibilidade total entre todos os jogos
 * (Assetto Corsa, ACC, AC EVO, Le Mans Ultimate, Forza Motorsport / Horizon, EA Sports WRC / Rally, etc.)
 */
export function resolveTelemetryValue(telemetry: any, key?: string): any {
  if (!telemetry || !key) return undefined

  // Mapeamentos de compatibilidade e aliases universais entre sim games
  const ALIAS_MAP: Record<string, string[]> = {
    speedKmh: ['speedKmh', 'speed', 'speed_kmh', 'kph'],
    rpm: ['rpm', 'engineRpm'],
    maxRpm: ['maxRpm', 'max_rpm', 'rpmMax'],
    gear: ['gear', 'currentGear'],
    throttle: ['throttle', 'gas', 'throttlePct'],
    brake: ['brake', 'brakePct'],
    clutch: ['clutch', 'clutchPct'],
    steeringAngle: ['steeringAngle', 'steer', 'steering'],
    fuelRemaining: ['fuelRemaining', 'fuelLevel', 'fuel', 'fuel_litres'],
    fuelPerLap: ['fuelPerLap', 'fuelConsumptionPerLap', 'fuel_per_lap'],
    trackProgress: ['trackProgress', 'progress', 'normalizedSplinePosition', 'lapDistancePct'],
    delta: ['delta', 'lapDelta', 'deltaLapTime'],
    currentLapTime: ['currentLapTime', 'lapTiming.currentLapTime', 'currentLapTimeMs'],
    lastLapTime: ['lastLapTime', 'lapTiming.lastLapTime', 'lastLapTimeMs'],
    bestLapTime: ['bestLapTime', 'lapTiming.bestLapTime', 'bestLapTimeMs'],
    trackName: ['trackName', 'sessionInfo.trackName', 'track'],
    carName: ['carName', 'sessionInfo.carName', 'car', 'carModel'],
    absActive: ['absActive', 'electronics.abs', 'abs'],
    tcActive: ['tcActive', 'electronics.tc', 'tc'],
    pitLimiter: ['pitLimiterActive', 'pitLimiter'],
  }

  const lookupKeys = ALIAS_MAP[key] || [key]

  for (const candidate of lookupKeys) {
    try {
      const parts = candidate.split('.')
      let curr = telemetry
      let found = true
      for (const part of parts) {
        if (curr === null || curr === undefined) {
          found = false
          break
        }
        curr = curr[part]
      }
      if (found && curr !== undefined && curr !== null) {
        // Normalização de booleanos numéricos (ex: ABS ou TC vindos como 0 ou 1)
        if (key === 'absActive' || key === 'tcActive' || key === 'pitLimiter') {
          return Boolean(curr)
        }
        // Formatação inteligente de tempos de volta se for número em segundos ou ms
        if ((key.includes('LapTime')) && typeof curr === 'number' && curr > 0) {
          const totalSecs = curr > 1000 ? curr / 1000 : curr
          const mins = Math.floor(totalSecs / 60)
          const secs = (totalSecs % 60).toFixed(3).padStart(6, '0')
          return `${mins}:${secs}`
        }
        return curr
      }
    } catch {
      // continua tentando o próximo alias
    }
  }

  return undefined
}
