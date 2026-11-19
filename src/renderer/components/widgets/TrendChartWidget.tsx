import React from 'react'

interface Props {
  width: number
  height: number
  transparent?: boolean
}

export const TrendChartWidget: React.FC<Props> = ({ width, height, transparent = false }) => {
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
      <div className="flex items-center justify-between pb-1.5 mb-1 border-b border-gray-800 text-[10px] text-gray-400 font-bold uppercase">
        <div className="flex items-center space-x-2">
          <span>POSITION & LAPTIME TREND</span>
          <span className="text-amber-400 font-bold">— VER (P1)</span>
          <span className="text-blue-400 font-bold">— YOU (P12)</span>
        </div>
        <span className="text-gray-500">LAPS 1-15</span>
      </div>

      <div className="flex-1 relative flex items-center justify-center p-2">
        <svg viewBox="0 0 420 180" className="w-full h-full">
          {/* Horizontal grid lines */}
          <line x1="30" y1="20" x2="410" y2="20" stroke="rgba(255,255,255,0.05)" />
          <line x1="30" y1="60" x2="410" y2="60" stroke="rgba(255,255,255,0.05)" />
          <line x1="30" y1="100" x2="410" y2="100" stroke="rgba(255,255,255,0.05)" />
          <line x1="30" y1="140" x2="410" y2="140" stroke="rgba(255,255,255,0.05)" />

          {/* Y Axis labels */}
          <text x="5" y="24" fill="#64748b" fontSize="9">P1</text>
          <text x="5" y="64" fill="#64748b" fontSize="9">P5</text>
          <text x="5" y="104" fill="#64748b" fontSize="9">P10</text>
          <text x="5" y="144" fill="#64748b" fontSize="9">P15</text>

          {/* Leader Trend Line (P1 - Yellow) */}
          <polyline
            fill="none"
            stroke="#fbbf24"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points="40,25 70,22 100,24 130,21 160,20 190,20 220,20 250,22 280,21 310,20 340,21 370,20 400,20"
          />

          {/* Player Trend Line (Blue, climbing from P18 to P12) */}
          <polyline
            fill="none"
            stroke="#38bdf8"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points="40,150 70,145 100,135 130,128 160,120 190,118 220,115 250,112 280,110 310,108 340,105 370,104 400,102"
          />

          {/* Current position marker */}
          <circle cx="400" cy="102" r="5" fill="#38bdf8" stroke="#fff" strokeWidth="2" />
          <text x="350" y="94" fill="#38bdf8" fontSize="10" fontWeight="bold">P12 (+6)</text>
        </svg>
      </div>

      <div className="flex justify-between items-center text-[9px] text-gray-500 pt-1 border-t border-gray-800">
        <span>RACE PACE: 1:48.241</span>
        <span>CONSISTENCY: 97.8%</span>
      </div>
    </div>
  )
}
