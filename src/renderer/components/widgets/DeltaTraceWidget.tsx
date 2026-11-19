import React from 'react'

interface Props {
  currentLapTime?: number
  bestLapTime?: number
  delta?: number
  speedKmh?: number
  gear?: number
  rpm?: number
  width: number
  height: number
  transparent?: boolean
  trackName?: string
  s1Time?: string
  s2Time?: string
  s3Time?: string
  optTime?: string
  isActive?: boolean
}

export const DeltaTraceWidget: React.FC<Props> = ({
  delta = 0,
  speedKmh = 0,
  gear = 0,
  rpm = 0,
  width,
  height,
  transparent = false,
  trackName = '',
  s1Time = '--.---',
  s2Time = '--.---',
  s3Time = '--.---',
  optTime = '--:--.---',
  isActive = true,
}) => {
  // If widget is not active, display cleanly zeroed data
  const displayGear = !isActive ? 'N' : (gear === 0 ? 'N' : gear === -1 ? 'R' : gear)
  const displaySpeed = !isActive ? 0 : Math.round(speedKmh)
  const displayRpm = !isActive ? 0 : Math.round(rpm)
  const displayDelta = !isActive ? 0 : delta

  return (
    <div
      className="flex flex-col rounded-xl overflow-hidden text-xs font-mono select-none"
      style={{
        width,
        height,
        background: transparent ? 'transparent' : 'linear-gradient(180deg, rgba(15,23,42,0.92) 0%, rgba(15,23,42,0.85) 100%)',
        border: transparent ? 'none' : '1px solid rgba(255,255,255,0.08)',
        backdropFilter: transparent ? 'none' : 'blur(8px)',
        padding: 10,
      }}
    >
      {/* Top status bar */}
      <div className="flex items-center justify-between pb-1 border-b border-gray-800 text-[10px]">
        <div className="flex items-center space-x-2">
          <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-gray-600'}`}></span>
          <span className="text-white font-bold">{(trackName || 'AGUARDANDO...').toUpperCase()} • {isActive ? 'LIVE REALTIME' : 'STANDBY'}</span>
        </div>
        <div className={`font-bold ${displayDelta < 0 ? 'text-emerald-400' : displayDelta > 0 ? 'text-rose-400' : 'text-gray-400'}`}>
          DELTA: {displayDelta === 0 ? '0.00s' : displayDelta < 0 ? `${displayDelta.toFixed(2)}s (FASTER)` : `+${displayDelta.toFixed(2)}s`}
        </div>
      </div>

      {/* Main body */}
      <div className="flex-1 flex items-center justify-between py-1">
        {/* Gear + Speed */}
        <div className="flex items-baseline space-x-3">
          <div className="text-4xl font-black text-amber-400 font-mono">
            {displayGear}
          </div>
          <div>
            <div className="text-xl font-bold text-white font-mono">
              {displaySpeed} <span className="text-xs text-gray-500 font-sans">KM/H</span>
            </div>
            <div className="text-[10px] text-gray-400 font-mono">
              {displayRpm} RPM
            </div>
          </div>
        </div>

        {/* Delta Graphic Trace */}
        <div className="flex-1 px-4 flex flex-col justify-center">
          <div className="h-6 w-full bg-black/40 rounded border border-gray-800 relative overflow-hidden flex items-center">
            {/* Center zero line */}
            <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-gray-500 z-10"></div>
            {/* Delta bar */}
            {isActive && displayDelta !== 0 && (
              <div
                className={`h-full shadow-lg transition-all duration-100 ${displayDelta < 0 ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-rose-500 shadow-rose-500/50'}`}
                style={{
                  width: `${Math.min(50, Math.abs(displayDelta) * 25)}%`,
                  marginLeft: displayDelta < 0 ? `${50 - Math.min(50, Math.abs(displayDelta) * 25)}%` : '50%',
                }}
              ></div>
            )}
          </div>
          <div className="flex justify-between text-[9px] text-gray-500 mt-1">
            <span>-2.0s</span>
            <span>0.0s</span>
            <span>+2.0s</span>
          </div>
        </div>

        {/* Sectors */}
        <div className="flex flex-col space-y-1">
          <div className="flex items-center space-x-1">
            <span className="px-2 py-0.5 bg-purple-950/80 text-purple-300 rounded text-[9px] border border-purple-800 font-bold">S1: {s1Time}</span>
            <span className="px-2 py-0.5 bg-emerald-950/80 text-emerald-300 rounded text-[9px] border border-emerald-800 font-bold">S2: {s2Time}</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="px-2 py-0.5 bg-black/40 text-gray-400 rounded text-[9px] border border-gray-800">S3: {s3Time}</span>
            <span className="px-2 py-0.5 bg-emerald-900/60 text-emerald-200 rounded text-[9px] font-bold">OPT: {optTime}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
