import React from 'react'
import ConnectionStatus from './ConnectionStatus'
import SteamProfile from './SteamProfile'
import QRCodePanel from './QRCodePanel'

export const DashboardView: React.FC = () => {
  return (
    <div className="p-7 space-y-6 max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between border-b border-[#1b1b2d] pb-5">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Centro de Controle & Dashboard</h1>
          <p className="text-xs text-gray-400 mt-1">Visão geral da telemetria ativa, perfil de piloto, biblioteca Steam e segunda tela móvel.</p>
        </div>
      </div>

      <ConnectionStatus />

      <div className="grid grid-cols-2 gap-6">
        <SteamProfile />
        <QRCodePanel />
      </div>
    </div>
  )
}
export default DashboardView
