import React from 'react'
import { useTelemetryStore } from '../../store/telemetryStore'

export const ConnectionStatus: React.FC = () => {
  const isConnected = useTelemetryStore((s) => s.isConnected)
  const activeGame = useTelemetryStore((s) => s.activeGame)
  const activeCar = useTelemetryStore((s) => s.activeCar)
  const activeTrack = useTelemetryStore((s) => s.activeTrack)
  const telemetryRate = useTelemetryStore((s) => s.telemetryRate)
  const currentData = useTelemetryStore((s) => s.currentData)

  const handleStartSim = () => {
    if (window.api?.telemetry?.start) {
      window.api.telemetry.start('mock')
    }
  }

  const handleStopSim = () => {
    if (window.api?.telemetry?.stop) {
      window.api.telemetry.stop()
    }
  }

  return (
    <div className="bg-[#11111c] border border-[#1e1e32] rounded-xl p-5 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-white flex items-center space-x-2">
          <span>📡</span>
          <span>Status do Simulador</span>
        </h2>
        <div className="flex items-center space-x-2">
          <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50 animate-pulse' : 'bg-red-500'}`}></span>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-gray-300">
            {isConnected ? `CONECTADO (${telemetryRate || 60}Hz)` : 'AGUARDANDO SIMULADOR'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-[#0b0b13] p-3 rounded-lg border border-[#1a1a2b]">
          <div className="text-[11px] font-mono text-gray-500 uppercase">Simulador Ativo</div>
          <div className="text-sm font-bold text-red-400 mt-1">{activeGame ? activeGame.toUpperCase() : 'Mock Circuit Engine'}</div>
        </div>
        <div className="bg-[#0b0b13] p-3 rounded-lg border border-[#1a1a2b]">
          <div className="text-[11px] font-mono text-gray-500 uppercase">Carro</div>
          <div className="text-sm font-bold text-gray-200 mt-1">{activeCar || 'Ferrari 488 GT3'}</div>
        </div>
        <div className="bg-[#0b0b13] p-3 rounded-lg border border-[#1a1a2b]">
          <div className="text-[11px] font-mono text-gray-500 uppercase">Pista</div>
          <div className="text-sm font-bold text-gray-200 mt-1">{activeTrack || 'Autodromo Nazionale Monza'}</div>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <button
          onClick={handleStartSim}
          className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-lg text-xs font-bold shadow-md shadow-red-950/50 transition-all flex items-center space-x-2 cursor-pointer"
        >
          <span>▶️</span>
          <span>Iniciar Teste Sintético (Mock 60Hz)</span>
        </button>
        <button
          onClick={handleStopSim}
          className="px-4 py-2 bg-[#1c1c2e] hover:bg-[#25253e] text-gray-300 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer"
        >
          <span>⏹️</span>
          <span>Parar Telemetria</span>
        </button>
        {currentData && (
          <div className="text-xs font-mono text-gray-400 ml-auto">
            Speed: <span className="text-white font-bold">{Math.round(currentData.speedKmh || (currentData as any).speed || 0)} km/h</span> | RPM: <span className="text-amber-400 font-bold">{Math.round(currentData.rpm || 0)}</span>
          </div>
        )}
      </div>
    </div>
  )
}
export default ConnectionStatus
