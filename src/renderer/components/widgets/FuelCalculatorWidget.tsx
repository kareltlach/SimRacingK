import React from 'react'

interface Props {
  fuelRemaining?: number
  fuelPerLap?: number
  estimatedLapsRemaining?: number
  width: number
  height: number
  transparent?: boolean
}

export const FuelCalculatorWidget: React.FC<Props> = ({
  fuelRemaining = 0,
  fuelPerLap = 0,
  estimatedLapsRemaining = 0,
  width,
  height,
  transparent = false,
}) => {
  const hasData = fuelRemaining > 0 || fuelPerLap > 0
  const lapsLeft = fuelPerLap > 0 ? fuelRemaining / fuelPerLap : estimatedLapsRemaining
  const refuelNeeded = fuelPerLap > 0 ? Math.max(0, fuelPerLap * 5 - fuelRemaining) : 0

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
      <div className="flex items-center justify-between pb-1 mb-1 border-b border-gray-800 text-[10px] text-gray-400 font-bold uppercase">
        <span>FUEL &amp; PIT STRATEGY</span>
        <span className={`font-bold ${hasData ? 'text-amber-400' : 'text-gray-600'}`}>
          {hasData ? 'LIVE' : 'AGUARDANDO...'}
        </span>
      </div>

      {!hasData ? (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <div className="text-center space-y-1">
            <div className="w-5 h-5 mx-auto border-2 border-amber-500/40 border-t-amber-400 rounded-full animate-spin" />
            <div className="text-[10px] text-amber-400/70 font-bold">AGUARDANDO DADOS DO JOGO...</div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 grid grid-cols-3 gap-2 items-center text-center">
            <div className="bg-black/30 p-2 rounded border border-gray-800">
              <div className="text-[10px] text-gray-400 uppercase">TANQUE</div>
              <div className="text-xl font-black text-white">{fuelRemaining.toFixed(1)} <span className="text-[10px] text-gray-500 font-sans">L</span></div>
            </div>

            <div className="bg-black/30 p-2 rounded border border-gray-800">
              <div className="text-[10px] text-gray-400 uppercase">CONSUMO</div>
              <div className="text-xl font-black text-amber-400">{fuelPerLap.toFixed(2)} <span className="text-[10px] text-gray-500 font-sans">L/V</span></div>
            </div>

            <div className="bg-black/30 p-2 rounded border border-gray-800">
              <div className="text-[10px] text-gray-400 uppercase">VOLTAS REST.</div>
              <div className="text-xl font-black text-emerald-400">{lapsLeft.toFixed(1)}</div>
            </div>
          </div>

          <div className="flex justify-between items-center text-[10px] text-gray-400 pt-1 border-t border-gray-800">
            <span>REABAST.: <strong className="text-white">+{refuelNeeded.toFixed(1)} L</strong></span>
            <span>MARGEM: <strong className={lapsLeft > 2 ? 'text-emerald-400' : 'text-rose-400'}>{lapsLeft > 0 ? `${Math.max(0, lapsLeft - Math.floor(lapsLeft)).toFixed(1)} VOLTAS` : '---'}</strong></span>
          </div>
        </>
      )}
    </div>
  )
}
