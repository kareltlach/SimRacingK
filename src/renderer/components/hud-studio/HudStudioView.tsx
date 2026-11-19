import React, { useState } from 'react'
import { useHudStore, HudWidget } from '../../store/hudStore'

export const HudStudioView: React.FC = () => {
  const layouts = useHudStore((s) => s.layouts)
  const [selectedWidget, setSelectedWidget] = useState<string | null>('tachometer')
  const [autoSwitchGame, setAutoSwitchGame] = useState('AC')
  const [carPattern, setCarPattern] = useState('GT3.*')

  const handleLaunchOverlay = () => {
    if (window.api?.overlay?.toggle) {
      window.api.overlay.toggle()
    }
  }

  const handleToggleClickThrough = () => {
    if (window.api?.overlay?.setClickThrough) {
      window.api.overlay.setClickThrough(true)
    }
  }

  return (
    <div className="p-7 space-y-6 max-w-7xl mx-auto w-full flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-[#1b1b2d] pb-5">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">HUD Studio (Editor Visual de Overlays)</h1>
          <p className="text-xs text-gray-400 mt-1">Crie, customize e posicione widgets na tela com suporte a Smart Auto-Switch por carro e pista.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleToggleClickThrough}
            className="px-3.5 py-2 bg-[#1a1a2e] hover:bg-[#252542] text-gray-200 rounded-lg text-xs font-bold border border-[#2b2b45] transition-all cursor-pointer"
          >
            🔒 Travar Click-Through (Ctrl+Shift+L)
          </button>
          <button
            onClick={handleLaunchOverlay}
            className="px-4 py-2 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white rounded-lg text-xs font-bold shadow-lg shadow-red-950/60 transition-all flex items-center space-x-2 cursor-pointer"
          >
            <span>🚀</span>
            <span>Lançar Overlay Transparente</span>
          </button>
        </div>
      </div>

      {/* Editor Grid */}
      <div className="grid grid-cols-4 gap-6 flex-1 min-h-[500px]">
        {/* Left: Palette */}
        <div className="bg-[#11111c] border border-[#1e1e32] rounded-xl p-4 flex flex-col space-y-3">
          <h2 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">Biblioteca de Widgets (7)</h2>
          {[
            { id: 'tachometer', name: 'Cluster Digital / Tacômetro', icon: '⚡' },
            { id: 'inputs', name: 'Gráfico de Inputs & Volante', icon: '🎮' },
            { id: 'tires', name: 'Monitor Térmico de Pneus & Freios', icon: '🛞' },
            { id: 'radar', name: 'Radar de Proximidade (Spotter)', icon: '📡' },
            { id: 'timing', name: 'Timing & Calculadora de Combustível', icon: '⏱️' },
            { id: 'rally', name: 'Rally Pacenotes & Força G', icon: '🏔️' },
            { id: 'ffb', name: 'FFB Clipping & Hardware Meter', icon: '🎛️' },
          ].map((w) => (
            <button
              key={w.id}
              onClick={() => setSelectedWidget(w.id)}
              className={`w-full text-left p-3 rounded-lg text-xs font-semibold flex items-center space-x-3 border transition-all cursor-pointer ${
                selectedWidget === w.id
                  ? 'bg-red-500/15 border-red-500/40 text-white shadow-md'
                  : 'bg-[#0b0b13] border-[#181828] text-gray-400 hover:text-gray-200 hover:bg-[#141424]'
              }`}
            >
              <span className="text-base">{w.icon}</span>
              <span>{w.name}</span>
            </button>
          ))}
        </div>

        {/* Center: Canvas Simulator */}
        <div className="col-span-2 bg-[#09090f] border-2 border-dashed border-[#22223a] rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-6 shadow-inner">
          <div className="absolute top-3 left-3 text-[10px] font-mono text-gray-500 bg-[#121220] px-2 py-1 rounded border border-[#1e1e32]">
            CANVAS 1920x1080 (SNAP-TO-GRID ATIVO)
          </div>

          <div className="w-[420px] h-[240px] bg-[#0c0c16]/90 border border-red-500/40 rounded-lg shadow-2xl p-4 flex flex-col justify-between relative backdrop-blur-sm">
            <div className="flex justify-between items-center text-xs font-mono text-gray-400 border-b border-[#1b1b2d] pb-2">
              <span className="text-red-400 font-bold">{selectedWidget?.toUpperCase()} WIDGET PREVIEW</span>
              <span className="text-[10px] text-emerald-400">60 FPS ACTIVE</span>
            </div>
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="text-3xl font-black font-mono text-white">4 <span className="text-xs font-sans text-gray-400 font-normal">GEAR</span></div>
              <div className="w-full bg-[#161628] h-3 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500 w-[78%] h-full"></div>
              </div>
              <div className="text-xs font-mono text-gray-300">247 KM/H | 7,420 RPM</div>
            </div>
            <div className="flex justify-between text-[10px] font-mono text-gray-500 pt-2 border-t border-[#1b1b2d]">
              <span>ABS: ON</span>
              <span>TC: ON</span>
              <span>PIT: OFF</span>
            </div>
          </div>

          <div className="absolute bottom-3 text-xs text-gray-500 font-mono">
            Arraste pelas bordas para redimensionar ou reposicionar no monitor
          </div>
        </div>

        {/* Right: Inspector & AutoSwitch */}
        <div className="bg-[#11111c] border border-[#1e1e32] rounded-xl p-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Inspetor de Propriedades</h2>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-mono text-gray-400">Escala (Scale)</label>
                <input type="range" min="0.5" max="2.0" step="0.1" defaultValue="1.0" className="w-full accent-red-500 mt-1 cursor-pointer" />
              </div>
              <div>
                <label className="text-[11px] font-mono text-gray-400">Opacidade (%)</label>
                <input type="range" min="20" max="100" defaultValue="95" className="w-full accent-red-500 mt-1 cursor-pointer" />
              </div>
              <div>
                <label className="text-[11px] font-mono text-gray-400">Unidades de Velocidade</label>
                <select className="w-full bg-[#0b0b13] border border-[#202035] rounded p-2 text-xs text-gray-200 mt-1">
                  <option>KM/H (Métrico)</option>
                  <option>MPH (Imperial)</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-[#1e1e32]">
              <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">Smart Auto-Switch</h3>
              <div className="space-y-2">
                <div>
                  <label className="text-[10px] font-mono text-gray-500">Jogo Vinculado</label>
                  <select value={autoSwitchGame} onChange={(e) => setAutoSwitchGame(e.target.value)} className="w-full bg-[#0b0b13] border border-[#202035] rounded p-1.5 text-xs text-gray-200 mt-1">
                    <option value="AC">Assetto Corsa</option>
                    <option value="ACC">Assetto Corsa Competizione</option>
                    <option value="FORZA">Forza Motorsport</option>
                    <option value="LMU">Le Mans Ultimate</option>
                    <option value="RALLY">EA Sports WRC / Rally</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-mono text-gray-500">Padrão de Carro (Regex)</label>
                  <input
                    type="text"
                    value={carPattern}
                    onChange={(e) => setCarPattern(e.target.value)}
                    className="w-full bg-[#0b0b13] border border-[#202035] rounded p-1.5 text-xs text-gray-200 mt-1 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          <button className="w-full py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition-all mt-4 cursor-pointer">
            Salvar Layout JSON
          </button>
        </div>
      </div>
    </div>
  )
}
export default HudStudioView
