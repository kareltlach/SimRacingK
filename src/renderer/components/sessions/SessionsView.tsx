import React from 'react'

export const SessionsView: React.FC = () => {
  return (
    <div className="p-7 space-y-6 max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between border-b border-[#1b1b2d] pb-5">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Sessões & Banco de Voltas (SQLite)</h1>
          <p className="text-xs text-gray-400 mt-1">Histórico completo de voltas gravadas indexadas no banco local com exportação .apextel e .csv.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="px-3 py-2 bg-[#161626] hover:bg-[#202035] text-gray-200 rounded-lg text-xs font-bold border border-[#22223a] transition-all cursor-pointer">
            📥 Importar Pacote .apextel
          </button>
          <button className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold shadow-md shadow-red-950/50 transition-all cursor-pointer">
            📤 Exportar Sessão Selecionada
          </button>
        </div>
      </div>

      <div className="bg-[#11111c] border border-[#1e1e32] rounded-xl overflow-hidden shadow-lg">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#0b0b13] text-gray-400 font-mono uppercase tracking-wider border-b border-[#1a1a2b]">
            <tr>
              <th className="p-3.5">Data / Hora</th>
              <th className="p-3.5">Simulador</th>
              <th className="p-3.5">Pista</th>
              <th className="p-3.5">Carro</th>
              <th className="p-3.5 text-center">Voltas</th>
              <th className="p-3.5 text-right">Melhor Volta</th>
              <th className="p-3.5 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1a1a2b] font-medium text-gray-300">
            <tr className="hover:bg-[#141424] transition-all">
              <td className="p-3.5 font-mono text-gray-400">18/11/2026 16:30</td>
              <td className="p-3.5 font-bold text-red-400">Assetto Corsa</td>
              <td className="p-3.5">Monza GP</td>
              <td className="p-3.5">Ferrari 488 GT3</td>
              <td className="p-3.5 text-center font-mono">14</td>
              <td className="p-3.5 text-right font-mono font-bold text-emerald-400">1:47.320</td>
              <td className="p-3.5 text-center">
                <button className="text-red-400 hover:text-red-300 font-bold text-[11px] cursor-pointer">Abrir no Lab</button>
              </td>
            </tr>
            <tr className="hover:bg-[#141424] transition-all">
              <td className="p-3.5 font-mono text-gray-400">18/11/2026 15:10</td>
              <td className="p-3.5 font-bold text-red-400">ACC</td>
              <td className="p-3.5">Spa-Francorchamps</td>
              <td className="p-3.5">Porsche 992 GT3 R</td>
              <td className="p-3.5 text-center font-mono">22</td>
              <td className="p-3.5 text-right font-mono font-bold text-emerald-400">2:17.480</td>
              <td className="p-3.5 text-center">
                <button className="text-red-400 hover:text-red-300 font-bold text-[11px] cursor-pointer">Abrir no Lab</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
export default SessionsView
