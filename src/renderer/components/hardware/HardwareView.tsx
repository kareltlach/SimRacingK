import React from 'react'

export const HardwareView: React.FC = () => {
  return (
    <div className="p-7 space-y-6 max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between border-b border-[#1b1b2d] pb-5">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Hardware DIY & FFB Clipping Monitor</h1>
          <p className="text-xs text-gray-400 mt-1">Configure microcontroladores Arduino/ESP32 para pedais vibratórios e calcule o ganho FFB ideal.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-[#11111c] border border-[#1e1e32] rounded-xl p-5 shadow-lg space-y-4">
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <span>🎛️</span>
            <span>Force Feedback (FFB) Clipping Analysis</span>
          </h2>
          <p className="text-xs text-gray-400">
            Monitora em tempo real a saturação do sinal FFB para evitar perda de detalhes e sugerir o ajuste percentual de ganho (Gain %) ideal para cada carro.
          </p>
          <div className="bg-[#0b0b14] p-4 rounded-xl border border-[#1a1a2b] space-y-3">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-gray-400">Saturação Atual:</span>
              <span className="text-emerald-400 font-bold">1.4% (Excelente)</span>
            </div>
            <div className="w-full bg-[#161628] h-3 rounded-full overflow-hidden">
              <div className="bg-emerald-500 w-[14%] h-full"></div>
            </div>
            <div className="text-xs font-mono text-gray-300 bg-[#121220] p-2.5 rounded border border-[#202035]">
              Ganho Recomendado: <strong className="text-emerald-400">82%</strong> (Ganho Atual: 85%)
            </div>
          </div>
        </div>

        <div className="bg-[#11111c] border border-[#1e1e32] rounded-xl p-5 shadow-lg space-y-4">
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <span>🔌</span>
            <span>Ponte Serial USB (Arduino / ESP32)</span>
          </h2>
          <p className="text-xs text-gray-400">
            Transmissão binária ultracompacta a 30Hz para acionamento de fitas LED WS2812B (Shift Light) ou motores hapticos em pedais para ABS/TC.
          </p>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-mono text-gray-400">Porta Serial</label>
              <select className="w-full bg-[#0b0b14] border border-[#202035] rounded-lg p-2 text-xs text-gray-200 mt-1 font-mono">
                <option>COM3 (Arduino Uno Rev3)</option>
                <option>COM4 (ESP32-S3 Dual Type-C)</option>
              </select>
            </div>
            <div className="flex items-center space-x-3 pt-2">
              <button className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer">
                Conectar Porta
              </button>
              <button className="px-4 py-2 bg-[#1a1a2e] hover:bg-[#252542] text-gray-300 rounded-lg text-xs font-bold border border-[#2b2b45] transition-all cursor-pointer">
                Testar LEDs / Haptic
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
export default HardwareView
