import React, { useRef, useEffect, useCallback, useState } from 'react'

interface Props {
  ffbSignal: number  // 0-100
  width: number
  height: number
  transparent?: boolean
}

const CLIP_THRESHOLD = 90   // above this = clipping
const HISTORY_WINDOW = 60   // seconds for clip% calculation
const SAMPLE_HZ = 20        // samples per second for clip tracking

export const FFBClipWidget: React.FC<Props> = ({ ffbSignal, width, height, transparent = false }) => {
  const [peakHold, setPeakHold] = useState(0)
  const [clipPct, setClipPct] = useState(0)
  const historyRef = useRef<number[]>([])
  const peakDecayRef = useRef(0)
  const lastSampleRef = useRef(0)

  // Track peak & clipping %
  useEffect(() => {
    const now = Date.now()

    // Peak hold with slow decay
    if (ffbSignal > peakDecayRef.current) {
      peakDecayRef.current = ffbSignal
    } else {
      peakDecayRef.current = Math.max(0, peakDecayRef.current - 0.15)
    }
    setPeakHold(peakDecayRef.current)

    // Sample at SAMPLE_HZ
    if (now - lastSampleRef.current < 1000 / SAMPLE_HZ) return
    lastSampleRef.current = now

    const h = historyRef.current
    h.push(ffbSignal)
    const maxSamples = HISTORY_WINDOW * SAMPLE_HZ
    if (h.length > maxSamples) h.splice(0, h.length - maxSamples)

    const clipping = h.filter(v => v >= CLIP_THRESHOLD).length
    setClipPct((clipping / h.length) * 100)
  })

  // Suggested gain reduction
  const suggestedGain = clipPct > 5
    ? Math.round(100 - (clipPct - 5) * 1.5)
    : 100

  const signal = Math.min(100, Math.max(0, ffbSignal))
  const isClipping = signal >= CLIP_THRESHOLD

  // Meter color gradient stops
  const meterH = height - 120

  // Color for the fill
  const fillColor = signal < 70
    ? '#22c55e'
    : signal < 90
      ? '#eab308'
      : '#ef4444'

  return (
    <div
      className="flex flex-col items-center rounded-xl overflow-hidden"
      style={{
        width, height,
        background: transparent ? 'transparent' : 'linear-gradient(180deg, rgba(15,23,42,0.92) 0%, rgba(15,23,42,0.80) 100%)',
        border: transparent ? 'none' : '1px solid rgba(255,255,255,0.08)',
        backdropFilter: transparent ? 'none' : 'blur(8px)',
        padding: 10,
      }}
    >
      {/* Label */}
      <div className="text-[9px] font-semibold tracking-widest uppercase mb-2" style={{ color: '#64748b' }}>
        FFB
      </div>

      {/* Vertical meter */}
      <div className="relative flex-1 w-full flex justify-center" style={{ minHeight: meterH }}>
        {/* Track */}
        <div
          className="relative rounded-lg overflow-hidden"
          style={{ width: 32, height: meterH, background: 'rgba(255,255,255,0.06)' }}
        >
          {/* Zone backgrounds */}
          <div className="absolute bottom-0 left-0 w-full" style={{ height: '70%', background: 'rgba(34,197,94,0.06)' }} />
          <div className="absolute w-full" style={{ bottom: '70%', height: '20%', background: 'rgba(234,179,8,0.06)' }} />
          <div className="absolute w-full" style={{ bottom: '90%', height: '10%', background: 'rgba(239,68,68,0.06)' }} />

          {/* Clip zone marker line */}
          <div
            className="absolute left-0 w-full"
            style={{ bottom: `${CLIP_THRESHOLD}%`, height: 1, background: 'rgba(239,68,68,0.5)' }}
          />

          {/* Fill */}
          <div
            className="absolute bottom-0 left-0 w-full rounded-b-lg"
            style={{
              height: `${signal}%`,
              background: `linear-gradient(0deg, ${fillColor}cc, ${fillColor})`,
              boxShadow: isClipping
                ? `0 0 20px ${fillColor}88, inset 0 0 10px ${fillColor}44`
                : `0 0 8px ${fillColor}44`,
              transition: 'height 0.05s ease-out',
            }}
          />

          {/* Peak hold line */}
          <div
            className="absolute left-0 w-full"
            style={{
              bottom: `${peakHold}%`,
              height: 2,
              background: '#fff',
              boxShadow: '0 0 6px rgba(255,255,255,0.4)',
              opacity: 0.8,
              transition: 'bottom 0.1s ease-out',
            }}
          />

          {/* Clipping glow overlay */}
          {isClipping && (
            <div
              className="absolute inset-0 rounded-lg"
              style={{
                background: 'rgba(239,68,68,0.15)',
                animation: 'pulse 0.3s ease-in-out infinite alternate',
              }}
            />
          )}
        </div>

        {/* Scale labels */}
        <div className="absolute right-0 top-0 h-full flex flex-col justify-between py-0.5" style={{ width: 20 }}>
          {[100, 75, 50, 25, 0].map(v => (
            <span key={v} className="text-[7px] font-mono tabular-nums text-right" style={{ color: '#475569' }}>
              {v}
            </span>
          ))}
        </div>
      </div>

      {/* Signal value */}
      <div className="font-mono font-bold text-sm tabular-nums mt-2" style={{ color: fillColor }}>
        {Math.round(signal)}%
      </div>

      {/* Clip percentage */}
      <div className="flex flex-col items-center mt-1 gap-0.5">
        <span className="text-[8px] uppercase tracking-wider" style={{ color: '#475569' }}>Clip</span>
        <span
          className="font-mono text-xs font-bold tabular-nums"
          style={{ color: clipPct > 5 ? '#ef4444' : '#94a3b8' }}
        >
          {clipPct.toFixed(1)}%
        </span>
      </div>

      {/* Suggested gain */}
      <div
        className="mt-1 px-1.5 py-0.5 rounded text-[7px] font-bold tracking-wider text-center leading-tight"
        style={{
          background: suggestedGain < 100 ? 'rgba(234,179,8,0.15)' : 'rgba(34,197,94,0.1)',
          color: suggestedGain < 100 ? '#eab308' : '#22c55e',
          border: `1px solid ${suggestedGain < 100 ? 'rgba(234,179,8,0.2)' : 'rgba(34,197,94,0.15)'}`,
        }}
      >
        Gain: {suggestedGain}%
      </div>

      {/* Inline pulse animation */}
      <style>{`
        @keyframes pulse {
          from { opacity: 0.1; }
          to   { opacity: 0.3; }
        }
      `}</style>
    </div>
  )
}
