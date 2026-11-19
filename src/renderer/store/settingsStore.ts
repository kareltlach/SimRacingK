import { create } from 'zustand'

export type TabId = 'dashboard' | 'hud-studio' | 'telemetry-lab' | 'sessions' | 'hardware' | 'settings'

export interface NetworkSettings {
  udpPorts: Record<string, number>
  lanRelayEnabled: boolean
  lanRelayPort: number
  companionPort: number
}

export interface DisplaySettings {
  units: 'metric' | 'imperial'
  theme: 'dark' | 'light'
  fps: number
}

export interface ShortcutBinding {
  id: string
  label: string
  keys: string
}

export interface AppSettings {
  network: NetworkSettings
  display: DisplaySettings
  shortcuts: ShortcutBinding[]
  steamApiKey: string
}

const defaultSettings: AppSettings = {
  network: {
    udpPorts: {
      ac: 9996,
      acc: 9000,
      f1: 20777,
      iracing: 0,
      rf2: 6789,
      ams2: 5606,
      dirt2: 20777,
      wrc: 20777,
    },
    lanRelayEnabled: false,
    lanRelayPort: 9100,
    companionPort: 8080,
  },
  display: {
    units: 'metric',
    theme: 'dark',
    fps: 60,
  },
  shortcuts: [
    { id: 'toggle-overlay', label: 'Toggle Overlay', keys: 'Ctrl+Shift+O' },
    { id: 'next-layout', label: 'Next Layout', keys: 'Ctrl+Shift+Right' },
    { id: 'prev-layout', label: 'Previous Layout', keys: 'Ctrl+Shift+Left' },
    { id: 'toggle-recording', label: 'Toggle Recording', keys: 'Ctrl+Shift+R' },
  ],
  steamApiKey: '',
}

interface SettingsState {
  activeTab: TabId
  settings: AppSettings
  setActiveTab: (tab: TabId) => void
  updateSettings: (partial: Partial<AppSettings>) => void
  updateNetwork: (partial: Partial<NetworkSettings>) => void
  updateDisplay: (partial: Partial<DisplaySettings>) => void
  loadSettings: () => Promise<void>
  saveSettings: () => Promise<void>
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  activeTab: 'dashboard',
  settings: defaultSettings,

  setActiveTab: (tab) => set({ activeTab: tab }),

  updateSettings: (partial) =>
    set((s) => ({ settings: { ...s.settings, ...partial } })),

  updateNetwork: (partial) =>
    set((s) => ({
      settings: { ...s.settings, network: { ...s.settings.network, ...partial } },
    })),

  updateDisplay: (partial) =>
    set((s) => ({
      settings: { ...s.settings, display: { ...s.settings.display, ...partial } },
    })),

  loadSettings: async () => {
    try {
      const settings = await window.api.settings.get()
      if (settings) set({ settings: { ...defaultSettings, ...settings } })
    } catch {
      /* use defaults */
    }
  },

  saveSettings: async () => {
    try {
      await window.api.settings.set(get().settings)
    } catch {
      /* noop */
    }
  },
}))
