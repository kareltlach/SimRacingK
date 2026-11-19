import React, { useRef, useEffect, useState } from 'react'

interface Props {
  width: number
  height: number
  transparent?: boolean
  circuitName?: string
  trackLength?: string
  svgPath?: string
  sector1Path?: string
  sector2Path?: string
  isActive?: boolean
  trackProgress?: number
  worldX?: number
  worldZ?: number
}

export const TrackMapGPSWidget: React.FC<Props> = ({
  width,
  height,
  transparent = false,
  circuitName = '',
  trackLength = '--- KM',
  svgPath,
  sector1Path,
  sector2Path,
  isActive = true,
  trackProgress = 0,
  worldX = 0,
  worldZ = 0,
}) => {
  const pathRef = useRef<SVGPathElement | null>(null)
  const gpsPathRef = useRef<Array<{ x: number; z: number }>>([])
  const lastTrackRef = useRef<string>('')
  const boundsRef = useRef<{ minX: number; maxX: number; minZ: number; maxZ: number }>({ minX: 0, maxX: 1, minZ: 0, maxZ: 1 })

  const [gpsSvgPoints, setGpsSvgPoints] = useState<string>('')
  const [playerPos, setPlayerPos] = useState<{ x: number; y: number }>({ x: 200, y: 140 })
  const [gpsActive, setGpsActive] = useState(false)
  const [gpsPointCount, setGpsPointCount] = useState(0)
  const [fallbackPlayerCoord, setFallbackPlayerCoord] = useState<{ x: number; y: number }>({ x: 50, y: 180 })

  const displayName = circuitName || 'AGUARDANDO...'
  const hasGpsData = worldX !== 0 || worldZ !== 0

  // Detect track change — clear GPS path
  useEffect(() => {
    if (circuitName && circuitName !== lastTrackRef.current) {
      lastTrackRef.current = circuitName
      gpsPathRef.current = []
      boundsRef.current = { minX: 0, maxX: 1, minZ: 0, maxZ: 1 }
      setGpsSvgPoints('')
      setGpsPointCount(0)
    }
  }, [circuitName])

  // Accumulate GPS points from real world coordinates
  useEffect(() => {
    if (!hasGpsData) {
      setGpsActive(false)
      return
    }

    setGpsActive(true)
    const path = gpsPathRef.current

    // Only add point if distance from last > 2 meters
    if (path.length > 0) {
      const last = path[path.length - 1]
      const dist = Math.sqrt((worldX - last.x) ** 2 + (worldZ - last.z) ** 2)
      if (dist < 2) return
    }

    path.push({ x: worldX, z: worldZ })

    // Update bounding box
    const bounds = boundsRef.current
    if (path.length === 1) {
      bounds.minX = worldX - 50
      bounds.maxX = worldX + 50
      bounds.minZ = worldZ - 50
      bounds.maxZ = worldZ + 50
    } else {
      bounds.minX = Math.min(bounds.minX, worldX)
      bounds.maxX = Math.max(bounds.maxX, worldX)
      bounds.minZ = Math.min(bounds.minZ, worldZ)
      bounds.maxZ = Math.max(bounds.maxZ, worldZ)
    }

    // Normalize to SVG viewBox 400x280 with padding
    const rangeX = Math.max(1, bounds.maxX - bounds.minX)
    const rangeZ = Math.max(1, bounds.maxZ - bounds.minZ)
    const padding = 20

    const normalize = (x: number, z: number) => ({
      svgX: ((x - bounds.minX) / rangeX) * (400 - 2 * padding) + padding,
      svgY: ((z - bounds.minZ) / rangeZ) * (240 - 2 * padding) + padding,
    })

    // Build polyline points string (every 3rd point for performance)
    const step = path.length > 500 ? 3 : path.length > 200 ? 2 : 1
    let points = ''
    for (let i = 0; i < path.length; i += step) {
      const { svgX, svgY } = normalize(path[i].x, path[i].z)
      points += `${svgX.toFixed(1)},${svgY.toFixed(1)} `
    }
    // Always include last point
    const lastPt = path[path.length - 1]
    const { svgX: lastSX, svgY: lastSY } = normalize(lastPt.x, lastPt.z)
    points += `${lastSX.toFixed(1)},${lastSY.toFixed(1)}`

    setGpsSvgPoints(points)
    setPlayerPos({ x: lastSX, y: lastSY })
    setGpsPointCount(path.length)
  }, [worldX, worldZ, hasGpsData])

  // Fallback: use SVG path + trackProgress when no GPS data
  useEffect(() => {
    if (hasGpsData) return
    if (!pathRef.current) return
    try {
      const totalLength = pathRef.current.getTotalLength()
      if (totalLength > 0) {
        const p = Math.max(0, Math.min(1, trackProgress))
        const distance = p * totalLength
        const pt = pathRef.current.getPointAtLength(distance)
        setFallbackPlayerCoord({ x: pt.x, y: pt.y })
      }
    } catch {}
  }, [trackProgress, svgPath, hasGpsData])

  const statusText = gpsActive
    ? (gpsPointCount > 200 ? 'MAPA GPS ATIVO' : 'GPS COLETANDO...')
    : (isActive ? 'GPS REALTIME' : 'STANDBY')

  const statusColor = gpsActive ? 'bg-emerald-400' : (isActive ? 'bg-amber-400' : 'bg-gray-500')

  return (
    <div
      className="flex flex-col rounded-xl overflow-hidden text-xs font-mono select-none"
      style={{
        width,
        height,
        background: transparent ? 'transparent' : 'linear-gradient(180deg, rgba(15,23,42,0.92) 0%, rgba(15,23,42,0.85) 100%)',
        border: transparent ? 'none' : '1px solid rgba(255,255,255,0.08)',
        backdropFilter: transparent ? 'none' : 'blur(8px)',
        padding: 8,
      }}
    >
      <div className="flex items-center justify-between pb-1 mb-1 border-b border-gray-800 text-[10px] text-gray-400 font-bold uppercase">
        <span className="truncate max-w-[200px] text-gray-200">{displayName}</span>
        <span className={`font-bold ${gpsActive ? 'text-emerald-400' : isActive ? 'text-amber-400' : 'text-gray-500'}`}>{trackLength}</span>
      </div>

      <div className="flex-1 relative flex items-center justify-center">
        <svg viewBox="0 0 400 280" className="w-full h-full p-2">
          {/* GPS-based track (priority if available) */}
          {gpsActive && gpsSvgPoints ? (
            <>
              {/* Rendered GPS track outline */}
              <polyline
                points={gpsSvgPoints}
                fill="none"
                stroke="rgba(255,255,255,0.25)"
                strokeWidth="8"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {/* Colored progress overlay — first half of points */}
              {gpsPointCount > 10 && (
                <polyline
                  points={gpsSvgPoints.split(' ').slice(0, Math.ceil(gpsPointCount * trackProgress / (gpsPointCount > 500 ? 3 : gpsPointCount > 200 ? 2 : 1))).join(' ')}
                  fill="none"
                  stroke="#e11d48"
                  strokeWidth="6"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              )}

              {/* Player car GPS position */}
              <g transform={`translate(${playerPos.x}, ${playerPos.y})`}>
                <circle cx="0" cy="0" r="10" fill="none" stroke="#fbbf24" strokeWidth="2" opacity="0.6" className="animate-ping" />
                <circle cx="0" cy="0" r="6" fill="#fbbf24" stroke="#ffffff" strokeWidth="2" />
                <rect x="8" y="-12" width="58" height="15" rx="3" fill="rgba(0,0,0,0.75)" stroke="#fbbf24" strokeWidth="1" />
                <text x="11" y="-2" fill="#fbbf24" fontSize="9" fontWeight="bold" fontFamily="monospace">
                  VOCÊ ({Math.round(trackProgress * 100)}%)
                </text>
              </g>
            </>
          ) : svgPath ? (
            <>
              {/* Fallback: static SVG path */}
              <path
                ref={pathRef}
                d={svgPath}
                fill="none"
                stroke={isActive ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.06)'}
                strokeWidth="8"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {isActive && sector1Path && (
                <path d={sector1Path} fill="none" stroke="#e11d48" strokeWidth="6" strokeLinecap="round" />
              )}
              {isActive && sector2Path && (
                <path d={sector2Path} fill="none" stroke="#3b82f6" strokeWidth="6" strokeLinecap="round" />
              )}
              {isActive && (
                <g transform={`translate(${fallbackPlayerCoord.x}, ${fallbackPlayerCoord.y})`}>
                  <circle cx="0" cy="0" r="10" fill="none" stroke="#fbbf24" strokeWidth="2" opacity="0.6" className="animate-ping" />
                  <circle cx="0" cy="0" r="6" fill="#fbbf24" stroke="#ffffff" strokeWidth="2" />
                  <rect x="8" y="-12" width="58" height="15" rx="3" fill="rgba(0,0,0,0.75)" stroke="#fbbf24" strokeWidth="1" />
                  <text x="11" y="-2" fill="#fbbf24" fontSize="9" fontWeight="bold" fontFamily="monospace">
                    VOCÊ ({Math.round(trackProgress * 100)}%)
                  </text>
                </g>
              )}
            </>
          ) : (
            /* No data at all */
            <text x="200" y="140" textAnchor="middle" fill="#fbbf24" fontSize="12" fontWeight="bold" fontFamily="monospace" opacity="0.7">
              ● AGUARDANDO GPS...
            </text>
          )}
        </svg>

        {/* GPS Status Tag */}
        <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/70 border border-gray-800 rounded text-[9px] text-gray-300 font-mono flex items-center space-x-1">
          <span className={`w-1.5 h-1.5 rounded-full ${statusColor} ${gpsActive ? 'animate-pulse' : ''}`} />
          <span>{statusText}</span>
        </div>
      </div>
    </div>
  )
}
export default TrackMapGPSWidget
