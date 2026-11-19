import React from 'react'

interface Props {
  stageProgress: number   // 0-100
  stageTime: number       // seconds
  splitDelta: number      // seconds, negative = faster
  gForceX: number         // lateral G
  gForceY: number         // longitudinal G
  handbrakeActive: boolean
  width: number
  height: number
  transparent?: boolean
}

function formatStageTime(seconds: number): string {
  if (seconds <= 0 || !isFinite(seconds)) return '--:--.--'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toFixed(2).padStart(5, '0')}`
}

const G_MAX = 3 // max G displayed

export const RallyWidget: React.FC<Props> = ({
  stageProgress, stageTime, splitDelta, gForceX, gForceY, handbrakeActive, width, height, transparent = false,
}) => {
  const splitColor = splitDelta < 0 ? '#22c55e' : splitDelta > 0 ? '#ef4444' : '#e2e8f0'
  const splitSign = splitDelta < 0 ? '-' : '+'

  // G-meter positioning (normalized to -1..1)
  const gxNorm = Math.max(-1, Math.min(1, gForceX / G_MAX))
  const gyNorm = Math.max(-1, Math.min(1, gForceY / G_MAX))
  const gMeterSize = Math.min(width * 0.4, height * 0.38)
  const gDotX = (gMeterSize / 2) + gxNorm * (gMeterSize / 2 - 6)
  const gDotY = (gMeterSize / 2) - gyNorm * (gMeterSize / 2 - 6)

  return (
    <div
      className="flex flex-col rounded-xl overflow-hidden"
      style={{
        width, height,
        background: transparent ? 'transparent' : 'linear-gradient(180deg, rgba(15,23,42,0.92) 0%, rgba(15,23,42,0.75) 100%)',
        border: transparent ? 'none' : '1px solid rgba(255,255,255,0.08)',
        backdropFilter: transparent ? 'none' : 'blur(8px)',
        padding: 14,
      }}
    >
      {/* Label */}
      <div className="text-[10px] font-semibold tracking-widest uppercase mb-2" style={{ color: '#64748b' }}>
        Rally Stage
      </div>

      {/* Stage progress bar */}
      <div className="w-full h-3 rounded-full overflow-hidden mb-2" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.min(100, Math.max(0, stageProgress))}%`,
            background: 'linear-gradient(90deg, #3b82f6, #a855f7)',
            boxShadow: '0 0 10px rgba(59,130,246,0.3)',
            transition: 'width 0.15s ease-out',
          }}
        />
      </div>
      <div className="flex justify-between text-[9px] font-mono tabular-nums mb-1" style={{ color: '#94a3b8' }}>
        <span>{stageProgress.toFixed(1)}%</span>
        <span>Stage</span>
      </div>

      {/* Stage time */}
      <div className="font-mono font-bold tabular-nums" style={{ fontSize: 22, lineHeight: 1, color: '#fff' }}>
        {formatStageTime(stageTime)}
      </div>

      {/* Split delta */}
      <div className="font-mono font-bold text-sm tabular-nums mt-1" style={{ color: splitColor }}>
        {splitSign}{Math.abs(splitDelta).toFixed(2)}s
      </div>

      {/* G-force meter + handbrake row */}
      <div className="flex items-center gap-3 mt-3 flex-1">
        {/* G-meter */}
        <div className="relative" style={{ width: gMeterSize, height: gMeterSize }}>
          <svg width={gMeterSize} height={gMeterSize} viewBox={`0 0 ${gMeterSize} ${gMeterSize}`}>
            {/* Background circle */}
            <circle
              cx={gMeterSize / 2} cy={gMeterSize / 2} r={gMeterSize / 2 - 2}
              fill="rgba(255,255,255,0.03)" stroke="rgba(148,163,184,0.15)" strokeWidth="1"
            />
            {/* Inner rings */}
            <circle
              cx={gMeterSize / 2} cy={gMeterSize / 2} r={(gMeterSize / 2 - 2) * 0.66}
              fill="none" stroke="rgba(148,163,184,0.08)" strokeWidth="0.5"
            />
            <circle
              cx={gMeterSize / 2} cy={gMeterSize / 2} r={(gMeterSize / 2 - 2) * 0.33}
              fill="none" stroke="rgba(148,163,184,0.08)" strokeWidth="0.5"
            />
            {/* Cross-hair */}
            <line
              x1={gMeterSize / 2} y1={2} x2={gMeterSize / 2} y2={gMeterSize - 2}
              stroke="rgba(148,163,184,0.08)" strokeWidth="0.5"
            />
            <line
              x1={2} y1={gMeterSize / 2} x2={gMeterSize - 2} y2={gMeterSize / 2}
              stroke="rgba(148,163,184,0.08)" strokeWidth="0.5"
            />
            {/* G-force dot */}
            <circle
              cx={gDotX} cy={gDotY} r={5}
              fill="#ef4444"
              style={{ filter: 'drop-shadow(0 0 6px rgba(239,68,68,0.6))' }}
            >
              <animate attributeName="r" values="4;6;4" dur="1.2s" repeatCount="indefinite" />
            </circle>
          </svg>
          {/* G labels */}
          <span className="absolute top-0 left-1/2 -translate-x-1/2 text-[7px] font-mono" style={{ color: '#475569' }}>
            {G_MAX}G
          </span>
        </div>

        {/* Handbrake indicator */}
        <div className="flex flex-col items-center gap-1">
          <div
            className="rounded-lg flex items-center justify-center"
            style={{
              width: 44, height: 44,
              background: handbrakeActive
                ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                : 'rgba(255,255,255,0.05)',
              boxShadow: handbrakeActive ? '0 0 20px rgba(239,68,68,0.5)' : 'none',
              border: `1.5px solid ${handbrakeActive ? '#ef4444' : 'rgba(255,255,255,0.08)'}`,
              transition: 'all 0.15s',
            }}
          >
            <span
              className="font-black text-sm"
              style={{ color: handbrakeActive ? '#fff' : '#475569' }}
            >
              HB
            </span>
          </div>
          <span className="text-[8px] uppercase tracking-wider" style={{ color: '#475569' }}>
            Handbrake
          </span>
        </div>
      </div>
    </div>
  )
}
