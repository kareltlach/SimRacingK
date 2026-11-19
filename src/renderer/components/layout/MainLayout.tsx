import React from 'react'
import Sidebar from './Sidebar'
import { useSettingsStore } from '../../store/settingsStore'
import DashboardView from '../dashboard/DashboardView'
import HudStudioView from '../hud-studio/HudStudioView'
import TelemetryLabView from '../telemetry-lab/TelemetryLabView'
import SessionsView from '../sessions/SessionsView'
import HardwareView from '../hardware/HardwareView'
import SettingsView from '../settings/SettingsView'

export const MainLayout: React.FC = () => {
  const activeTab = useSettingsStore((s) => s.activeTab)

  return (
    <div className="flex h-screen w-screen bg-[#0a0a0f] text-gray-100 overflow-hidden font-sans">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-y-auto bg-[#08080d]">
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'hud-studio' && <HudStudioView />}
        {activeTab === 'telemetry-lab' && <TelemetryLabView />}
        {activeTab === 'sessions' && <SessionsView />}
        {activeTab === 'hardware' && <HardwareView />}
        {activeTab === 'settings' && <SettingsView />}
      </main>
    </div>
  )
}
export default MainLayout
