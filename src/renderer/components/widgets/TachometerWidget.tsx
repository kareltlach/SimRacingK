import React, { useRef, useEffect, useCallback } from 'react'

interface Props {
  rpm: number
  maxRpm: number
  gear: number
  speedKmh: number
  absActive: boolean
  tcActive: boolean
  pitLimiter: boolean
  flags: string
  width: number
  height: number
  transparent?: boolean
}

const LED_COUNT = 40
const LED_GAP = 3
const LED_RADIUS = 3

function ledColor(i: number, total: number, ratio: number): string | null {
  const ledRatio = i / total
  if (ledRatio > ratio) return null // off

  if (ledRatio < 0.60) return '#22c55e'       // green
  if (ledRatio < 0.80) return '#eab308'       // yellow
  if (ledRatio < 0.95) return '#ef4444'       // red
  return '#ef4444'                             // top red (will flash)
}

function flagColor(flag: string): string {
  switch (flag) {
    case 'yellow': return '#eab308'
    case 'red':    return '#ef4444'
    case 'blue':   return '#3b82f6'
    case 'white':  return '#e2e8f0'
    case 'green':  return '#22c55e'
    case 'checkered': return '#a855f7'
    default:       return '#475569'
  }
}

export const TachometerWidget: React.FC<Props> = ({
  rpm, maxRpm, gear, speedKmh, absActive, tcActive, pitLimiter, flags, width, height, transparent = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef(0)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = 48 * dpr
    ctx.scale(dpr, dpr)

    ctx.clearRect(0, 0, width, 48)

    const ratio = Math.min(rpm / maxRpm, 1)
    const isRevLimiter = ratio >= 0.95
    const flash = isRevLimiter && Math.sin(Date.now() / 60) > 0

    const ledW = (width - LED_GAP * (LED_COUNT + 1)) / LED_COUNT

    for (let i = 0; i < LED_COUNT; i++) {
      const x = LED_GAP + i * (ledW + LED_GAP)
      const color = ledColor(i, LED_COUNT, ratio)

      if (color) {
        // Glow for rev-limiter region
        if (i / LED_COUNT >= 0.95 && flash) {
          ctx.shadowColor = '#ef4444'
          ctx.shadowBlur = 18
        } else {
          ctx.shadowColor = color
          ctx.shadowBlur = 6
        }
        ctx.fillStyle = color
      } else {
        ctx.shadowBlur = 0
        ctx.fillStyle = 'rgba(255,255,255,0.06)'
      }

      // Rounded rect
      const rh = 28
      const ry = 10
      ctx.beginPath()
      ctx.roundRect(x, ry, ledW, rh, LED_RADIUS)
      ctx.fill()
    }

    // Rev-limiter full glow flash
    if (isRevLimiter && flash) {
      ctx.shadowBlur = 0
      ctx.fillStyle = 'rgba(239,68,68,0.15)'
      ctx.fillRect(0, 0, width, 48)
    }

    ctx.shadowBlur = 0
    frameRef.current = requestAnimationFrame(draw)
  }, [rpm, maxRpm, width])

  useEffect(() => {
    frameRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frameRef.current)
  }, [draw])

  const gearDisplay = gear === 0 ? 'N' : gear === -1 ? 'R' : String(gear)

  return (
    <div
      className="relative flex flex-col items-center rounded-xl overflow-hidden"
      style={{
        width, height,
        background: transparent ? 'transparent' : 'linear-gradient(180deg, rgba(15,23,42,0.92) 0%, rgba(15,23,42,0.80) 100%)',
        border: transparent ? 'none' : '1px solid rgba(255,255,255,0.08)',
        backdropFilter: transparent ? 'none' : 'blur(8px)',
      }}
    >
      {/* LED bar canvas */}
      <canvas
        ref={canvasRef}
        style={{ width, height: 48, marginTop: 4 }}
      />

      {/* Gear + Speed cluster */}
      <div className="flex items-center justify-center gap-6 flex-1 -mt-1">
        <span
          className="font-black tabular-nums tracking-tight select-none"
          style={{
            fontSize: 64,
            lineHeight: 1,
            color: '#fff',
            textShadow: '0 0 24px rgba(255,255,255,0.3)',
          }}
        >
          {gearDisplay}
        </span>

        <div className="flex flex-col items-end">
          <span
            className="font-mono font-bold tabular-nums"
            style={{ fontSize: 36, lineHeight: 1, color: '#e2e8f0' }}
          >
            {Math.round(speedKmh)}
          </span>
          <span className="text-xs font-medium" style={{ color: '#94a3b8' }}>
            KM/H
          </span>
        </div>
      </div>

      {/* RPM number */}
      <div className="absolute top-[52px] right-4 font-mono text-xs tabular-nums" style={{ color: '#64748b' }}>
        {Math.round(rpm)} RPM
      </div>

      {/* Status lights row */}
      <div className="flex items-center gap-3 pb-3">
        {/* ABS */}
        <div
          className={`px-2.5 py-1 rounded text-[10px] font-black tracking-widest uppercase transition-all duration-75 select-none ${
            absActive
              ? 'bg-amber-400 text-black shadow-[0_0_18px_rgba(251,191,36,0.9)] scale-110 animate-pulse border border-amber-300'
              : 'bg-[#181a24] text-gray-600 border border-gray-800/60'
          }`}
        >
          ABS
        </div>
        {/* TC */}
        <div
          className={`px-2.5 py-1 rounded text-[10px] font-black tracking-widest uppercase transition-all duration-75 select-none ${
            tcActive
              ? 'bg-orange-500 text-black shadow-[0_0_18px_rgba(249,115,22,0.9)] scale-110 animate-pulse border border-orange-300'
              : 'bg-[#181a24] text-gray-600 border border-gray-800/60'
          }`}
        >
          TC
        </div>
        {/* PIT */}
        <div
          className={`px-2.5 py-1 rounded text-[10px] font-black tracking-widest uppercase transition-all duration-75 select-none ${
            pitLimiter
              ? 'bg-blue-500 text-white shadow-[0_0_18px_rgba(59,130,246,0.9)] scale-110 animate-pulse border border-blue-300'
              : 'bg-[#181a24] text-gray-600 border border-gray-800/60'
          }`}
        >
          PIT
        </div>
        {/* Flag */}
        <div
          className="w-6 h-4 rounded-sm transition-all duration-150 border border-gray-800/50"
          style={{
            background: flagColor(flags),
            boxShadow: flags ? `0 0 12px ${flagColor(flags)}` : 'none',
          }}
        />
      </div>
    </div>
  )
}
