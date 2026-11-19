import React from 'react'

export const SettingsView: React.FC = () => {
  return (
    <div className="p-7 space-y-6 max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between border-b border-[#1b1b2d] pb-5">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Configurações & Rede</h1>
          <p className="text-xs text-gray-400 mt-1">Gerencie portas UDP, modo LAN Relay (PC Windows - Mac) e atalhos de teclado do sistema.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-[#11111c] border border-[#1e1e32] rounded-xl p-5 shadow-lg space-y-4">
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <span>🌐</span>
            <span>Portas UDP de Telemetria</span>
          </h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-mono text-gray-400">Forza Motorsport / Horizon (Porta UDP)</label>
              <input type="text" defaultValue="5300" className="w-full bg-[#0b0b14] border border-[#202035] rounded-lg p-2 text-xs text-gray-200 mt-1 font-mono" />
            </div>
            <div>
              <label className="text-xs font-mono text-gray-400">EA Sports WRC / Rally (Porta UDP)</label>
              <input type="text" defaultValue="20777" className="w-full bg-[#0b0b14] border border-[#202035] rounded-lg p-2 text-xs text-gray-200 mt-1 font-mono" />
            </div>
            <div>
              <label className="text-xs font-mono text-gray-400">LAN Relay Receiver (Porta macOS)</label>
              <input type="text" defaultValue="9999" className="w-full bg-[#0b0b14] border border-[#202035] rounded-lg p-2 text-xs text-gray-200 mt-1 font-mono" />
            </div>
          </div>
        </div>

        <div className="bg-[#11111c] border border-[#1e1e32] rounded-xl p-5 shadow-lg space-y-4">
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <span>⌨️</span>
            <span>Atalhos Globais do Sistema</span>
          </h2>
          <div className="space-y-3">
            <div className="bg-[#0b0b14] p-3 rounded-lg border border-[#1a1a2b] flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-gray-200">Travar / Destravar Click-Through</div>
                <div className="text-[10px] text-gray-500">Alterna clique direto nos jogos vs edição</div>
              </div>
              <span className="font-mono text-xs bg-[#161628] text-red-400 px-2.5 py-1 rounded border border-[#22223c]">Ctrl+Shift+L</span>
            </div>
            <div className="bg-[#0b0b14] p-3 rounded-lg border border-[#1a1a2b] flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-gray-200">Exibir / Ocultar Overlay</div>
                <div className="text-[10px] text-gray-500">Liga ou desliga o HUD na tela</div>
              </div>
              <span className="font-mono text-xs bg-[#161628] text-red-400 px-2.5 py-1 rounded border border-[#22223c]">Ctrl+Shift+O</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
export default SettingsView
