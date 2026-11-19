import React from 'react'
import { useSettingsStore, TabId } from '../../store/settingsStore'

interface TabItem {
  id: TabId
  label: string
  icon: string
}

const TABS: TabItem[] = [
  { id: 'dashboard', label: 'Dashboard & Steam', icon: '🏁' },
  { id: 'hud-studio', label: 'HUD Studio', icon: '🎨' },
  { id: 'telemetry-lab', label: 'Telemetry Lab', icon: '📊' },
  { id: 'sessions', label: 'Sessões & Histórico', icon: '📁' },
  { id: 'hardware', label: 'Hardware & Companion', icon: '🔌' },
  { id: 'settings', label: 'Configurações', icon: '⚙️' },
]

export const Sidebar: React.FC = () => {
  const activeTab = useSettingsStore((s) => s.activeTab)
  const setActiveTab = useSettingsStore((s) => s.setActiveTab)

  return (
    <aside className="w-64 bg-[#0d0d14] border-r border-[#1a1a2e] flex flex-col justify-between select-none">
      <div>
        {/* Logo / Header */}
        <div className="p-5 border-b border-[#1a1a2e] flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-orange-500 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-red-900/40">
            A
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-wide text-white">APEX<span className="text-red-500">STUDIO</span></h1>
            <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">Telemetry & Coach</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1.5">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-red-500/10 text-red-400 border border-red-500/30 shadow-inner'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-[#161626]'
                }`}
              >
                <span className="text-base">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-[#1a1a2e] bg-[#0a0a10]">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="font-mono">v0.1.0-alpha</span>
          <span className="flex items-center space-x-1.5 text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>60Hz Core</span>
          </span>
        </div>
      </div>
    </aside>
  )
}
export default Sidebar
