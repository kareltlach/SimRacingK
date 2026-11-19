import React from 'react'

interface CompetitorEntry {
  carIndex: number
  driverName: string
  carModel: string
  raceNumber: number
  position: number
  cupPosition: number
  splinePosition: number
  laps: number
  bestLapMs: number
  lastLapMs: number
  delta: number
  location: string
  classColor: string
  isPlayer: boolean
}

interface Props {
  width: number
  height: number
  transparent?: boolean
  trackName?: string
  competitors?: CompetitorEntry[]
}

export const RelativesStandingsWidget: React.FC<Props> = ({
  width,
  height,
  transparent = false,
  trackName = '',
  competitors = [],
}) => {
  const displayTrack = trackName ? trackName.toUpperCase() : 'AGUARDANDO...'
  const hasData = competitors.length > 0

  // Find player to show nearby relatives (5 above, 5 below)
  const playerIdx = competitors.findIndex(c => c.isPlayer)
  let visibleDrivers = competitors

  if (competitors.length > 12 && playerIdx >= 0) {
    const start = Math.max(0, playerIdx - 5)
    const end = Math.min(competitors.length, playerIdx + 6)
    visibleDrivers = competitors.slice(start, end)
  }

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
      <div className="flex items-center justify-between pb-1.5 mb-1 border-b border-gray-800 text-[10px] text-gray-400 font-bold uppercase">
        <span>RELATIVES ({displayTrack})</span>
        <span className="text-emerald-400 font-bold">
          {hasData ? `${competitors.length} CARS` : '---'}
        </span>
      </div>

      <div className="flex-1 flex flex-col justify-start space-y-1 overflow-y-auto">
        {!hasData ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 space-y-2 py-4">
            <div className="w-6 h-6 border-2 border-amber-500/40 border-t-amber-400 rounded-full animate-spin" />
            <span className="text-[11px] font-bold text-amber-400/70">AGUARDANDO DADOS DO JOGO...</span>
            <span className="text-[9px] text-gray-600">Conectando à sessão ativa via Broadcasting UDP</span>
          </div>
        ) : (
          visibleDrivers.map((d) => (
            <div
              key={d.carIndex}
              className={`flex items-center justify-between px-2 py-1 rounded transition-all ${
                d.isPlayer
                  ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 shadow-sm'
                  : 'bg-black/30 text-gray-200'
              }`}
            >
              <div className="flex items-center space-x-2 truncate">
                <span className="w-5 text-center font-bold text-gray-400">{d.position}</span>
                <span className="w-1.5 h-3 rounded-full" style={{ backgroundColor: d.classColor }} />
                <span className="truncate max-w-[130px] font-sans font-medium">
                  {d.isPlayer ? `${d.driverName} (YOU)` : d.driverName}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <span className="px-1.5 py-0.2 rounded bg-black/50 text-[9px] text-gray-400 border border-gray-800 truncate max-w-[70px]" title={d.carModel}>
                  #{d.raceNumber}
                </span>
                {d.location === 'PIT' || d.location === 'PITLANE' ? (
                  <span className="px-1.5 py-0.2 rounded bg-amber-950 text-amber-400 font-bold text-[9px] border border-amber-800">
                    PIT
                  </span>
                ) : (
                  <span
                    className={`tabular-nums font-bold text-[11px] ${
                      d.delta < 0 ? 'text-rose-400' : d.delta > 0 ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {d.isPlayer ? 'INT' : (d.delta > 0 ? `+${d.delta.toFixed(1)}` : `${d.delta.toFixed(1)}`)}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
