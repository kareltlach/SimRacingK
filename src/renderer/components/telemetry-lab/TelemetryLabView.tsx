import React, { useState } from 'react'

export const TelemetryLabView: React.FC = () => {
  const [refLap, setRefLap] = useState('Volta 3 (1:47.320 - Melhor Volta)')
  const [compLap, setCompLap] = useState('Volta 2 (1:48.450)')

  return (
    <div className="p-7 space-y-6 max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between border-b border-[#1b1b2d] pb-5">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Telemetry Lab (Análise Estilo MoTeC)</h1>
          <p className="text-xs text-gray-400 mt-1">Laboratório profissional de análise de dados, mapa 2D interativo, comparação de voltas e AI Race Coach.</p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-[#11111c] px-3 py-1.5 rounded-lg border border-[#1e1e32]">
            <span className="text-xs font-mono text-blue-400 font-bold">REF:</span>
            <select value={refLap} onChange={(e) => setRefLap(e.target.value)} className="bg-transparent text-xs text-gray-200 font-semibold focus:outline-none">
              <option>Volta 3 (1:47.320 - Melhor Volta)</option>
              <option>Volta 1 (1:49.110)</option>
            </select>
          </div>
          <div className="flex items-center space-x-2 bg-[#11111c] px-3 py-1.5 rounded-lg border border-[#1e1e32]">
            <span className="text-xs font-mono text-red-400 font-bold">COMP:</span>
            <select value={compLap} onChange={(e) => setCompLap(e.target.value)} className="bg-transparent text-xs text-gray-200 font-semibold focus:outline-none">
              <option>Volta 2 (1:48.450)</option>
              <option>Ghost Telemetry Importado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Charts & Track Map */}
      <div className="grid grid-cols-3 gap-6">
        {/* Track Map 2D */}
        <div className="bg-[#11111c] border border-[#1e1e32] rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Mapa 2D da Pista (X, Z)</h2>
            <span className="text-[10px] font-mono text-gray-500">MONZA GP</span>
          </div>

          <div className="h-64 bg-[#0a0a10] border border-[#1a1a2b] rounded-lg relative flex items-center justify-center p-4">
            <svg viewBox="0 0 200 120" className="w-full h-full stroke-red-500 fill-none stroke-2">
              <path d="M 20 60 L 70 20 L 140 20 L 180 50 L 160 100 L 110 100 L 90 80 L 50 80 Z" className="stroke-gray-700 stroke-[3]" />
              <path d="M 20 60 L 70 20 L 140 20 L 180 50 L 160 100 L 110 100 L 90 80 L 50 80 Z" className="stroke-gradient stroke-[2] stroke-dasharray-[6]" />
              <circle cx="70" cy="20" r="4" className="fill-red-500 stroke-white stroke-1" />
            </svg>
            <div className="absolute top-2 left-2 text-[10px] font-mono text-gray-400">Curva 1 (Prima Variante)</div>
          </div>

          <div className="text-[11px] text-gray-500 font-mono mt-3 text-center">
            Clique em qualquer curva do traçado para zoom sincronizado nos gráficos
          </div>
        </div>

        {/* Speed & Delta Traces */}
        <div className="col-span-2 bg-[#11111c] border border-[#1e1e32] rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Speed Trace (KM/H) & Delta Time</h2>
            <div className="flex items-center space-x-4 text-xs font-mono">
              <span className="text-blue-400 font-bold">― Volta Referência</span>
              <span className="text-red-400 font-bold">― Volta Comparada</span>
            </div>
          </div>

          {/* Speed Graph Mock */}
          <div className="h-36 bg-[#0a0a10] border border-[#1a1a2b] rounded-lg p-3 relative flex flex-col justify-between">
            <div className="text-[10px] font-mono text-gray-500">SPEED (0 - 320 KM/H) vs DISTÂNCIA (0 - 100%)</div>
            <div className="w-full h-20 relative">
              <svg viewBox="0 0 500 80" className="w-full h-full fill-none stroke-2">
                <path d="M 0 10 Q 50 10 100 70 T 200 20 T 300 60 T 400 15 T 500 10" className="stroke-blue-500/80 stroke-[2.5]" />
                <path d="M 0 10 Q 50 15 105 75 T 205 28 T 305 65 T 405 18 T 500 10" className="stroke-red-500/80 stroke-[2.5]" />
              </svg>
            </div>
            <div className="flex justify-between text-[10px] font-mono text-gray-600">
              <span>0% (Largada)</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100% (Chegada)</span>
            </div>
          </div>

          {/* Pedals & Delta Trace */}
          <div className="h-28 bg-[#0a0a10] border border-[#1a1a2b] rounded-lg p-3 flex flex-col justify-between">
            <div className="text-[10px] font-mono text-gray-500">DELTA (+/- s) & INPUTS (ACELERADOR / FREIO)</div>
            <div className="w-full h-14 relative flex items-center">
              <div className="w-full h-[1px] bg-gray-700 absolute"></div>
              <svg viewBox="0 0 500 50" className="w-full h-full fill-none">
                <path d="M 0 25 Q 100 25 150 40 T 300 15 T 500 45" className="stroke-amber-400 stroke-2" />
              </svg>
            </div>
            <div className="flex justify-between text-[10px] font-mono text-gray-400">
              <span className="text-emerald-400 font-bold">Delta Final: +1.130s</span>
              <span>Frenagem Curva 1: -14m antecipada</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Race Coach Insights Panel */}
      <div className="bg-gradient-to-br from-[#131322] to-[#1a1a2e] border border-red-500/30 rounded-xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-red-600 flex items-center justify-center text-white text-sm font-black shadow-md">
              AI
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">Insights do Engenheiro de Pista Inteligente</h2>
              <p className="text-xs text-gray-400">Diagnóstico técnico automatizado das 3 curvas onde você mais perdeu tempo em relação à sua melhor volta.</p>
            </div>
          </div>
          <span className="text-xs font-mono bg-red-950/80 text-red-400 border border-red-800/80 px-2.5 py-1 rounded-md font-bold">
            POTENCIAL DE GANHO: +1.13s
          </span>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-[#0b0b14] border border-[#202035] rounded-xl p-4 shadow-md">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-black text-red-400">CURVA 1 (VARIANTE DEL RETTIFILO)</span>
              <span className="text-xs font-mono font-bold text-red-400 bg-red-950/60 px-2 py-0.5 rounded border border-red-900">-0.48s</span>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              <strong className="text-white">Frenagem 14 metros antecipada.</strong> Você começou a frear antes da placa de 150m, perdendo velocidade de reta desnecessariamente. Confie mais no ABS no início da zona.
            </p>
          </div>

          <div className="bg-[#0b0b14] border border-[#202035] rounded-xl p-4 shadow-md">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-black text-amber-400">CURVA 7 (VARIANTE ASCARI)</span>
              <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-900">-0.39s</span>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              <strong className="text-white">Menor velocidade mínima no apex (-8 km/h).</strong> Carregamento excessivo de volante gerou subesterço no meio da chicane, atrasando a retomada de aceleração plena em 12m.
            </p>
          </div>

          <div className="bg-[#0b0b14] border border-[#202035] rounded-xl p-4 shadow-md">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-black text-emerald-400">CURVA 11 (PARABOLICA)</span>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-900">-0.26s</span>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              <strong className="text-white">Atraso na abertura do acelerador.</strong> Você esperou o carro alinhar completamente antes de dar 100% de throttle. Abra o raio da saída usando toda a zebra externa.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
export default TelemetryLabView
