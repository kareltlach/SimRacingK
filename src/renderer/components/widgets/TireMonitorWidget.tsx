import React from 'react'

interface Props {
  tireTemps: {
    fl: [number, number, number] | number
    fr: [number, number, number] | number
    rl: [number, number, number] | number
    rr: [number, number, number] | number
  }
  tirePressures: { fl: number; fr: number; rl: number; rr: number }
  brakeTemps: { fl: number; fr: number; rl: number; rr: number }
  width: number
  height: number
  transparent?: boolean
}

function tempColor(t: number): string {
  if (t < 70)  return '#2563eb' // cold blue
  if (t < 75)  return '#06b6d4' // cyan
  if (t < 95)  return '#22c55e' // optimal green
  if (t < 105) return '#eab308' // warm yellow
  return '#ef4444'               // hot red
}

function brakeColor(t: number): string {
  if (t < 100) return '#3b82f6' // cold ambient ~28°C
  if (t < 350) return '#22c55e' // warm green
  if (t < 650) return '#eab308' // optimal brake yellow
  return '#ef4444'               // glowing red
}

const TireBlock: React.FC<{
  temps: [number, number, number] | any
  pressure: number
  brakeTemp: number
  position: 'fl' | 'fr' | 'rl' | 'rr'
}> = ({ temps, pressure = 25.5, brakeTemp = 28, position }) => {
  const isRight = position === 'fr' || position === 'rr'
  
  // Normalize temps to always be a safe 3-number tuple [inner, mid, outer]
  const safeTemps: [number, number, number] = Array.isArray(temps)
    ? [Number(temps[0]) || 70, Number(temps[1]) || 70, Number(temps[2]) || 70]
    : typeof temps === 'number'
    ? [temps, temps, temps]
    : typeof temps === 'object' && temps !== null
    ? [Number(temps.inner) || 70, Number(temps.mid) || 70, Number(temps.outer) || 70]
    : [70, 70, 70]

  // zones: Inner, Mid, Outer — left-to-right depends on side
  const zones = isRight ? [safeTemps[2], safeTemps[1], safeTemps[0]] : safeTemps

  return (
    <div className="flex flex-col items-center gap-1 select-none">
      {/* Tire rectangle with 3 zones */}
      <div className="flex rounded-sm overflow-hidden" style={{ width: 54, height: 26, gap: 1 }}>
        {zones.map((t, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              background: tempColor(t),
              boxShadow: `inset 0 0 4px rgba(0,0,0,0.4)`,
              transition: 'all 0.2s ease-in-out',
            }}
          >
            <span className="flex items-center justify-center h-full text-[9px] font-bold text-white drop-shadow-sm font-mono">
              {Math.round(t)}
            </span>
          </div>
        ))}
      </div>

      {/* Brake disc indicator with dynamic glow */}
      <div className="flex items-center space-x-1 mt-0.5">
        <div
          className="rounded-full flex-shrink-0"
          style={{
            width: 12, height: 12,
            background: brakeColor(brakeTemp),
            boxShadow: `0 0 10px ${brakeColor(brakeTemp)}88`,
            transition: 'all 0.2s',
          }}
        />
        <span className="text-[9px] font-mono text-gray-400 font-bold">
          {Math.round(brakeTemp)}°
        </span>
      </div>

      {/* Real-time Pressure */}
      <div className="flex flex-col items-center -mt-0.5">
        <span className="font-mono text-xs font-black tabular-nums text-white">
          {(pressure || 0).toFixed(1)}
        </span>
        <span className="text-[8px] uppercase tracking-wider font-bold text-cyan-400">
          PSI
        </span>
      </div>
    </div>
  )
}

export const TireMonitorWidget: React.FC<Props> = ({
  tireTemps, tirePressures, brakeTemps, width, height, transparent = false,
}) => {
  const safeTemps = tireTemps || { fl: [70, 70, 70], fr: [70, 70, 70], rl: [70, 70, 70], rr: [70, 70, 70] }
  const safePressures = tirePressures || { fl: 25.5, fr: 25.5, rl: 26.0, rr: 26.0 }
  const safeBrakes = brakeTemps || { fl: 27, fr: 27, rl: 28, rr: 28 }

  return (
    <div
      className="flex flex-col items-center justify-between rounded-xl overflow-hidden"
      style={{
        width, height,
        background: transparent ? 'transparent' : 'linear-gradient(180deg, rgba(15,23,42,0.92) 0%, rgba(15,23,42,0.80) 100%)',
        border: transparent ? 'none' : '1px solid rgba(255,255,255,0.08)',
        backdropFilter: transparent ? 'none' : 'blur(8px)',
        padding: 12,
      }}
    >
      {/* Label */}
      <div className="flex items-center justify-between w-full text-[10px] font-bold tracking-widest uppercase mb-1 border-b border-gray-800 pb-1" style={{ color: '#94a3b8' }}>
        <span>TIRES &amp; BRAKES</span>
        <span className="text-emerald-400 font-mono text-[9px]">REALTIME 60HZ</span>
      </div>

      {/* Grid: 3 columns  —  tire | car silhouette | tire */}
      <div
        className="grid gap-3 items-center justify-items-center w-full my-auto"
        style={{ gridTemplateColumns: 'auto 1fr auto', gridTemplateRows: 'auto auto' }}
      >
        {/* Front-left */}
        <TireBlock temps={safeTemps.fl} pressure={safePressures.fl} brakeTemp={safeBrakes.fl} position="fl" />

        {/* Car body top half */}
        <div
          className="rounded-t-[30px] rounded-b-md flex items-center justify-center"
          style={{
            width: 44, height: 65,
            background: 'linear-gradient(180deg, rgba(56,189,248,0.2) 0%, rgba(30,41,59,0.5) 100%)',
            border: '1.5px solid rgba(56,189,248,0.3)',
            gridRow: '1 / 2',
          }}
        >
          <span className="text-[8px] font-mono font-bold text-sky-400 uppercase">FRONT</span>
        </div>

        {/* Front-right */}
        <TireBlock temps={safeTemps.fr} pressure={safePressures.fr} brakeTemp={safeBrakes.fr} position="fr" />

        {/* Rear-left */}
        <TireBlock temps={safeTemps.rl} pressure={safePressures.rl} brakeTemp={safeBrakes.rl} position="rl" />

        {/* Car body bottom half */}
        <div
          className="rounded-b-[24px] rounded-t-md flex items-center justify-center"
          style={{
            width: 44, height: 55,
            background: 'linear-gradient(180deg, rgba(30,41,59,0.5) 0%, rgba(56,189,248,0.15) 100%)',
            border: '1.5px solid rgba(56,189,248,0.3)',
            borderTop: 'none',
            gridRow: '2 / 3',
          }}
        >
          <span className="text-[8px] font-mono font-bold text-gray-500 uppercase">REAR</span>
        </div>

        {/* Rear-right */}
        <TireBlock temps={safeTemps.rr} pressure={safePressures.rr} brakeTemp={safeBrakes.rr} position="rr" />
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 mt-2 flex-wrap justify-center border-t border-gray-800/60 pt-1.5 w-full">
        {[
          { label: '<70°', color: '#2563eb' },
          { label: '70-75°', color: '#06b6d4' },
          { label: '75-95°', color: '#22c55e' },
          { label: '95-105°', color: '#eab308' },
          { label: '>105°', color: '#ef4444' },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ background: color }} />
            <span className="text-[8px] font-mono text-gray-400">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
export default TireMonitorWidget
