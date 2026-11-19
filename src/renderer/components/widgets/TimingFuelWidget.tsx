import React, { useState, useEffect } from 'react'

interface Props {
  currentLapTime: number
  bestLapTime: number
  lastLapTime: number
  delta: number           // seconds, negative = faster
  fuelRemaining: number   // liters
  fuelPerLap: number
  estimatedLapsRemaining: number
  width: number
  height: number
  transparent?: boolean
}

function formatTime(seconds: number): string {
  if (seconds <= 0 || !isFinite(seconds)) return '--:--.---'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toFixed(3).padStart(6, '0')}`
}

export const TimingFuelWidget: React.FC<Props> = ({
  currentLapTime, bestLapTime, lastLapTime, delta,
  fuelRemaining, fuelPerLap, estimatedLapsRemaining,
  width, height, transparent = false,
}) => {
  // Blink state for low-fuel warning
  const [blink, setBlink] = useState(false)
  const lowFuel = estimatedLapsRemaining < 3

  useEffect(() => {
    if (!lowFuel) return
    const id = setInterval(() => setBlink(b => !b), 500)
    return () => clearInterval(id)
  }, [lowFuel])

  const deltaAbs = Math.abs(delta)
  const deltaSign = delta < 0 ? '-' : '+'
  const deltaColor = delta < 0 ? '#22c55e' : delta > 0 ? '#ef4444' : '#e2e8f0'
  // Delta bar: max ±2s
  const barMax = 2
  const barPct = Math.min(deltaAbs / barMax, 1) * 50 // 50% of bar width

  return (
    <div
      className="flex flex-col rounded-xl overflow-hidden"
      style={{
        width, height,
        background: transparent ? 'transparent' : 'linear-gradient(180deg, rgba(15,23,42,0.92) 0%, rgba(15,23,42,0.80) 100%)',
        border: transparent ? 'none' : '1px solid rgba(255,255,255,0.08)',
        backdropFilter: transparent ? 'none' : 'blur(8px)',
        padding: 14,
      }}
    >
      {/* Label */}
      <div className="text-[10px] font-semibold tracking-widest uppercase mb-2" style={{ color: '#64748b' }}>
        Timing
      </div>

      {/* Current lap */}
      <div className="font-mono font-bold tabular-nums" style={{ fontSize: 28, lineHeight: 1, color: '#fff' }}>
        {formatTime(currentLapTime)}
      </div>

      {/* Best / Last */}
      <div className="flex gap-4 mt-2">
        <div className="flex flex-col">
          <span className="text-[9px] uppercase tracking-wider" style={{ color: '#475569' }}>Best</span>
          <span className="font-mono text-sm tabular-nums" style={{ color: '#22c55e' }}>
            {formatTime(bestLapTime)}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] uppercase tracking-wider" style={{ color: '#475569' }}>Last</span>
          <span className="font-mono text-sm tabular-nums" style={{ color: '#cbd5e1' }}>
            {formatTime(lastLapTime)}
          </span>
        </div>
      </div>

      {/* Delta bar */}
      <div className="mt-3 flex flex-col items-center gap-1">
        <span className="font-mono font-bold text-sm tabular-nums" style={{ color: deltaColor }}>
          {deltaSign}{deltaAbs.toFixed(3)}s
        </span>
        <div className="relative w-full h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          {/* Center line */}
          <div className="absolute left-1/2 top-0 w-px h-full" style={{ background: 'rgba(255,255,255,0.2)' }} />
          {/* Bar */}
          <div
            className="absolute top-0 h-full rounded-full"
            style={{
              width: `${barPct}%`,
              ...(delta < 0
                ? { right: '50%', background: 'linear-gradient(270deg, #22c55e, #22c55e88)' }
                : { left: '50%', background: 'linear-gradient(90deg, #ef4444, #ef444488)' }),
              boxShadow: `0 0 10px ${deltaColor}44`,
              transition: 'width 0.1s ease-out',
            }}
          />
        </div>
      </div>

      {/* Separator */}
      <div className="w-full h-px my-3" style={{ background: 'rgba(255,255,255,0.08)' }} />

      {/* Fuel section */}
      <div className="text-[10px] font-semibold tracking-widest uppercase mb-1" style={{ color: '#64748b' }}>
        Fuel
      </div>
      <div className="flex gap-4">
        <div className="flex flex-col">
          <span className="text-[9px] uppercase tracking-wider" style={{ color: '#475569' }}>Remaining</span>
          <span
            className="font-mono text-sm font-bold tabular-nums"
            style={{
              color: lowFuel ? (blink ? '#ef4444' : '#991b1b') : '#e2e8f0',
              transition: 'color 0.2s',
            }}
          >
            {fuelRemaining.toFixed(1)}L
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] uppercase tracking-wider" style={{ color: '#475569' }}>Per Lap</span>
          <span className="font-mono text-sm tabular-nums" style={{ color: '#cbd5e1' }}>
            {fuelPerLap.toFixed(2)}L
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] uppercase tracking-wider" style={{ color: '#475569' }}>Est. Laps</span>
          <span
            className="font-mono text-sm font-bold tabular-nums"
            style={{
              color: lowFuel ? (blink ? '#ef4444' : '#991b1b') : '#22c55e',
              transition: 'color 0.2s',
            }}
          >
            {estimatedLapsRemaining.toFixed(1)}
          </span>
        </div>
      </div>

      {/* Low-fuel warning */}
      {lowFuel && (
        <div
          className="mt-2 px-2 py-1 rounded text-[10px] font-bold tracking-wider text-center"
          style={{
            background: blink ? 'rgba(239,68,68,0.3)' : 'rgba(239,68,68,0.1)',
            color: '#ef4444',
            border: '1px solid rgba(239,68,68,0.4)',
            transition: 'background 0.3s',
          }}
        >
          ⚠ LOW FUEL WARNING
        </div>
      )}
    </div>
  )
}
