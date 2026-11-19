import React, { useMemo } from 'react'

interface NearCar {
  x: number  // lateral offset in meters (positive = right)
  y: number  // longitudinal offset in meters (positive = ahead)
  id: number
}

interface Props {
  nearCars: NearCar[]
  width: number
  height: number
  transparent?: boolean
}

const RADAR_RANGE = 20 // meters visible in each direction

function proximityColor(dist: number): string {
  if (dist < 2)  return '#ef4444' // red
  if (dist < 5)  return '#eab308' // yellow
  return '#94a3b8'                 // grey
}

export const RadarWidget: React.FC<Props> = ({ nearCars, width, height, transparent = false }) => {
  const size = Math.min(width, height)
  const cx = size / 2
  const cy = size / 2
  const scale = (size / 2 - 16) / RADAR_RANGE

  // Filter cars within/outside range
  const { visible, arrows } = useMemo(() => {
    const vis: (NearCar & { sx: number; sy: number; dist: number })[] = []
    const arr: { angle: number; color: string }[] = []

    nearCars.forEach(car => {
      const dist = Math.sqrt(car.x ** 2 + car.y ** 2)
      const sx = cx + car.x * scale
      const sy = cy - car.y * scale // y-up → screen y-down

      if (Math.abs(car.x) <= RADAR_RANGE && Math.abs(car.y) <= RADAR_RANGE) {
        vis.push({ ...car, sx, sy, dist })
      } else {
        const angle = Math.atan2(-car.y, car.x) // screen coords
        arr.push({ angle, color: proximityColor(dist) })
      }
    })

    return { visible: vis, arrows: arr }
  }, [nearCars, cx, cy, scale])

  return (
    <div
      className="relative flex items-center justify-center rounded-xl overflow-hidden"
      style={{
        width, height,
        background: transparent ? 'transparent' : 'linear-gradient(180deg, rgba(15,23,42,0.92) 0%, rgba(15,23,42,0.80) 100%)',
        border: transparent ? 'none' : '1px solid rgba(255,255,255,0.08)',
        backdropFilter: transparent ? 'none' : 'blur(8px)',
      }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Radar circles */}
        {[0.25, 0.5, 0.75, 1].map(r => (
          <circle
            key={r}
            cx={cx} cy={cy}
            r={(size / 2 - 16) * r}
            fill="none" stroke="rgba(148,163,184,0.1)" strokeWidth="1"
          />
        ))}

        {/* Cross-hair lines */}
        <line x1={cx} y1={8} x2={cx} y2={size - 8} stroke="rgba(148,163,184,0.08)" strokeWidth="1" />
        <line x1={8} y1={cy} x2={size - 8} y2={cy} stroke="rgba(148,163,184,0.08)" strokeWidth="1" />

        {/* Semi-transparent radar background */}
        <circle cx={cx} cy={cy} r={size / 2 - 16} fill="rgba(59,130,246,0.03)" />

        {/* Player car (center) */}
        <rect
          x={cx - 6} y={cy - 12}
          width={12} height={24}
          rx={3}
          fill="rgba(255,255,255,0.9)"
          stroke="rgba(255,255,255,0.3)" strokeWidth="1"
        />

        {/* Nearby cars */}
        {visible.map(car => {
          const color = proximityColor(car.dist)
          const isVeryClose = car.dist < 2
          return (
            <g key={car.id}>
              {/* Pulsing ring for very close cars */}
              {isVeryClose && (
                <circle
                  cx={car.sx} cy={car.sy} r={12}
                  fill="none" stroke={color}
                  strokeWidth="1.5" opacity="0.5"
                >
                  <animate attributeName="r" values="8;16;8" dur="0.8s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.6;0.1;0.6" dur="0.8s" repeatCount="indefinite" />
                </circle>
              )}
              {/* Car dot */}
              <rect
                x={car.sx - 4} y={car.sy - 7}
                width={8} height={14}
                rx={2}
                fill={color}
                stroke="rgba(0,0,0,0.3)" strokeWidth="0.5"
              >
                {isVeryClose && (
                  <animate attributeName="opacity" values="1;0.4;1" dur="0.4s" repeatCount="indefinite" />
                )}
              </rect>
            </g>
          )
        })}

        {/* Directional arrows for out-of-range cars */}
        {arrows.map((a, i) => {
          const edgeR = size / 2 - 12
          const ax = cx + Math.cos(a.angle) * edgeR
          const ay = cy + Math.sin(a.angle) * edgeR
          const deg = (a.angle * 180) / Math.PI + 90
          return (
            <g key={`arrow-${i}`} transform={`translate(${ax},${ay}) rotate(${deg})`}>
              <polygon points="0,-6 4,4 -4,4" fill={a.color} opacity="0.7" />
            </g>
          )
        })}

        {/* Range label */}
        <text x={cx + 4} y={16} fill="#475569" fontSize="8" fontFamily="monospace">
          {RADAR_RANGE}m
        </text>
      </svg>

      {/* Title */}
      <div
        className="absolute top-2 left-3 text-[10px] font-semibold tracking-widest uppercase"
        style={{ color: '#64748b' }}
      >
        Radar
      </div>
    </div>
  )
}
