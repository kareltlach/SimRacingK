import React, { useRef, useEffect, useCallback, useState } from 'react'

interface Props {
  throttle: number
  brake: number
  clutch: number
  steeringAngle: number  // -1 to 1
  width: number
  height: number
  transparent?: boolean
}

const HISTORY_SECONDS = 5
const HISTORY_FPS = 30
const HISTORY_LEN = HISTORY_SECONDS * HISTORY_FPS

export const InputGraphWidget: React.FC<Props> = ({
  throttle, brake, clutch, steeringAngle, width, height, transparent = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const historyRef = useRef<{ t: number[]; b: number[]; c: number[] }>({
    t: [], b: [], c: [],
  })
  const frameRef = useRef(0)
  const lastPushRef = useRef(0)

  // Push history at HISTORY_FPS rate
  useEffect(() => {
    const now = Date.now()
    if (now - lastPushRef.current < 1000 / HISTORY_FPS) return
    lastPushRef.current = now
    const h = historyRef.current
    h.t.push(throttle); h.b.push(brake); h.c.push(clutch)
    if (h.t.length > HISTORY_LEN) { h.t.shift(); h.b.shift(); h.c.shift() }
  })

  const chartH = Math.floor(height * 0.38)
  const barAreaH = height - chartH - 54 // 54px for steering

  const drawChart = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const cw = width - 24
    const ch = chartH
    canvas.width = cw * dpr
    canvas.height = ch * dpr
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, cw, ch)

    const h = historyRef.current
    const len = h.t.length
    if (len < 2) { frameRef.current = requestAnimationFrame(drawChart); return }

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'
    ctx.lineWidth = 1
    for (let p = 0; p <= 100; p += 25) {
      const y = ch - (p / 100) * ch
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(cw, y); ctx.stroke()
    }

    const drawTrace = (data: number[], color: string) => {
      ctx.beginPath()
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.lineJoin = 'round'
      for (let i = 0; i < len; i++) {
        const x = (i / (HISTORY_LEN - 1)) * cw
        const y = ch - (data[i] / 100) * ch
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()

      // Faint fill
      ctx.lineTo((len - 1) / (HISTORY_LEN - 1) * cw, ch)
      ctx.lineTo(0, ch)
      ctx.closePath()
      ctx.fillStyle = color.replace(')', ',0.08)').replace('rgb', 'rgba')
      ctx.fill()
    }

    drawTrace(h.t, 'rgb(34,197,94)')
    drawTrace(h.b, 'rgb(239,68,68)')
    drawTrace(h.c, 'rgb(59,130,246)')

    frameRef.current = requestAnimationFrame(drawChart)
  }, [width, chartH])

  useEffect(() => {
    frameRef.current = requestAnimationFrame(drawChart)
    return () => cancelAnimationFrame(frameRef.current)
  }, [drawChart])

  const barW = Math.min(36, (width - 80) / 3)

  return (
    <div
      className="flex flex-col rounded-xl overflow-hidden"
      style={{
        width, height,
        background: transparent ? 'transparent' : 'linear-gradient(180deg, rgba(15,23,42,0.92) 0%, rgba(15,23,42,0.80) 100%)',
        border: transparent ? 'none' : '1px solid rgba(255,255,255,0.08)',
        backdropFilter: transparent ? 'none' : 'blur(8px)',
        padding: 12,
      }}
    >
      {/* Label */}
      <div className="text-[10px] font-semibold tracking-widest uppercase mb-2" style={{ color: '#64748b' }}>
        Inputs
      </div>

      {/* Bars */}
      <div className="flex items-end justify-center gap-4" style={{ height: barAreaH }}>
        {[
          { value: throttle, color: '#22c55e', label: 'THR' },
          { value: brake,    color: '#ef4444', label: 'BRK' },
          { value: clutch,   color: '#3b82f6', label: 'CLT' },
        ].map(({ value, color, label }) => (
          <div key={label} className="flex flex-col items-center gap-1">
            {/* Percentage */}
            <span className="font-mono text-[10px] tabular-nums" style={{ color }}>
              {Math.round(value)}%
            </span>
            {/* Bar track */}
            <div
              className="relative rounded-md overflow-hidden"
              style={{ width: barW, height: barAreaH - 32, background: 'rgba(255,255,255,0.06)' }}
            >
              <div
                className="absolute bottom-0 left-0 w-full rounded-md"
                style={{
                  height: `${value}%`,
                  background: `linear-gradient(0deg, ${color}, ${color}cc)`,
                  boxShadow: `0 0 10px ${color}44`,
                  transition: 'height 0.08s ease-out',
                }}
              />
            </div>
            {/* Label */}
            <span className="text-[9px] font-bold tracking-wider" style={{ color: '#94a3b8' }}>
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Steering wheel indicator */}
      <div className="flex items-center justify-center mt-2 mb-1">
        <svg
          width="36" height="36" viewBox="0 0 36 36"
          style={{
            transform: `rotate(${steeringAngle * 180}deg)`,
            transition: 'transform 0.06s ease-out',
          }}
        >
          <circle cx="18" cy="18" r="16" fill="none" stroke="#64748b" strokeWidth="3" />
          <circle cx="18" cy="18" r="10" fill="none" stroke="#64748b" strokeWidth="1.5" />
          {/* Spokes */}
          <line x1="2" y1="18" x2="8" y2="18" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="28" y1="18" x2="34" y2="18" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="18" y1="28" x2="18" y2="34" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
          {/* Top marker */}
          <circle cx="18" cy="2" r="2.5" fill="#eab308" />
        </svg>
      </div>

      {/* Sliding line chart */}
      <canvas
        ref={canvasRef}
        style={{ width: width - 24, height: chartH, borderRadius: 6 }}
      />
    </div>
  )
}
