import { create } from 'zustand'

export interface OverlayWidgetConfig {
  id: string
  name: string
  category: 'Standings' | 'Car & Inputs' | 'Timing' | 'Maps' | 'Fuel & Energy' | 'Telemetry'
  icon: string
  isNew?: boolean
  isFavorite?: boolean
  enabled: boolean
  x: number
  y: number
  width: number
  height: number
  scale: number
  opacity: number
  theme: 'dark' | 'transparent' | 'carbon'
  refreshRateHz: number
  options: Record<string, any>
  previewImage?: string
  customOverlayData?: any
}

export interface OverlayProfile {
  id: string
  name: string
  game: string
  carPattern: string
  widgets: OverlayWidgetConfig[]
}

const DEFAULT_WIDGETS: OverlayWidgetConfig[] = [
  {
    id: 'delta-trace',
    name: 'Delta Trace & Best Lap',
    category: 'Timing',
    icon: '📈',
    isNew: true,
    isFavorite: true,
    enabled: true,
    x: 480,
    y: 60,
    width: 640,
    height: 140,
    scale: 1.0,
    opacity: 95,
    theme: 'dark',
    refreshRateHz: 60,
    options: { showMiniMap: true, showTurnNumbers: true, deltaComparison: 'sessionBest' }
  },
  {
    id: 'relatives',
    name: 'Relatives & Radar Spotter',
    category: 'Standings',
    icon: '👥',
    isFavorite: true,
    enabled: true,
    x: 1400,
    y: 280,
    width: 380,
    height: 320,
    scale: 1.0,
    opacity: 90,
    theme: 'dark',
    refreshRateHz: 60,
    options: { maxCarsAhead: 3, maxCarsBehind: 3, showIRating: true }
  },
  {
    id: 'input-telemetry',
    name: 'Input Telemetry & Steering',
    category: 'Car & Inputs',
    icon: '🎮',
    isFavorite: true,
    enabled: true,
    x: 760,
    y: 880,
    width: 400,
    height: 120,
    scale: 1.0,
    opacity: 95,
    theme: 'dark',
    refreshRateHz: 60,
    options: { showWheel: true, traceSeconds: 5, showFFBMeter: true }
  },
  {
    id: 'track-map',
    name: 'Live 2D Track Map (GPS)',
    category: 'Maps',
    icon: '🗺️',
    enabled: false,
    x: 100,
    y: 680,
    width: 320,
    height: 320,
    scale: 1.0,
    opacity: 85,
    theme: 'dark',
    refreshRateHz: 30,
    options: { showSectorColors: true, carDotsRadius: 5 }
  },
  {
    id: 'tachometer-cluster',
    name: 'Advanced Digital Cluster',
    category: 'Car & Inputs',
    icon: '⚡',
    isNew: true,
    isFavorite: true,
    enabled: false,
    x: 700,
    y: 400,
    width: 520,
    height: 200,
    scale: 1.0,
    opacity: 100,
    theme: 'carbon',
    refreshRateHz: 60,
    options: { ledProgression: 'standard', flashLimiter: true }
  },
  {
    id: 'fuel-calculator',
    name: 'Fuel Calculator & Pit Helper',
    category: 'Fuel & Energy',
    icon: '⛽',
    enabled: true,
    x: 1400,
    y: 60,
    width: 280,
    height: 160,
    scale: 1.0,
    opacity: 90,
    theme: 'dark',
    refreshRateHz: 10,
    options: { alertLapsRemaining: 2.5 }
  },
  {
    id: 'tire-monitor',
    name: 'Tire Thermal & Brake Monitor',
    category: 'Car & Inputs',
    icon: '🛞',
    enabled: false,
    x: 80,
    y: 280,
    width: 280,
    height: 340,
    scale: 1.0,
    opacity: 90,
    theme: 'dark',
    refreshRateHz: 30,
    options: { unit: 'celsius', showPressures: true }
  },
  {
    id: 'trend-chart',
    name: 'Position & Laptime Trend Chart',
    category: 'Timing',
    icon: '📊',
    isNew: true,
    enabled: false,
    x: 1200,
    y: 640,
    width: 480,
    height: 280,
    scale: 1.0,
    opacity: 90,
    theme: 'dark',
    refreshRateHz: 10,
    options: { compareWithLeader: true }
  }
]

interface RacelabStoreState {
  widgets: OverlayWidgetConfig[]
  selectedWidgetId: string
  activeCategory: string
  filterText: string
  isEditMode: boolean
  isOverlayLocked: boolean
  isOverlayWindowOpen: boolean
  currentSimGame: string
  selectedTrackId: string
  profiles: OverlayProfile[]
  activeProfileId: string

  // Actions
  selectWidget: (id: string) => void
  selectTrack: (trackId: string) => void
  setCategory: (cat: string) => void
  setFilterText: (text: string) => void
  toggleWidgetEnabled: (id: string) => void
  toggleWidgetFavorite: (id: string) => void
  updateWidgetProps: (id: string, updates: Partial<OverlayWidgetConfig>) => void
  toggleEditMode: () => void
  toggleLock: () => void
  toggleOverlayWindow: () => void
  saveCurrentLayoutAsProfile: (profileName: string) => void
  loadProfile: (profileId: string) => void
  toggleOnlyThisWidget: (widgetId: string) => void
  addNewCustomWidget: (name: string, category: OverlayWidgetConfig['category']) => string
  deleteWidget: (id: string) => void
}

export const useRacelabStore = create<RacelabStoreState>((set, get) => ({
  widgets: DEFAULT_WIDGETS,
  selectedWidgetId: 'delta-trace',
  activeCategory: 'ALL',
  filterText: '',
  isEditMode: false,
  isOverlayLocked: true,
  isOverlayWindowOpen: false,
  currentSimGame: 'Assetto Corsa Competizione',
  selectedTrackId: 'monza',
  profiles: [
    {
      id: 'default-gt3',
      name: 'GT3 Sprint Cup (Todos Ativos)',
      game: 'ACC',
      carPattern: 'GT3.*',
      widgets: DEFAULT_WIDGETS
    },
    {
      id: 'minimal-delta',
      name: 'Apenas Delta & Timing',
      game: 'ACC',
      carPattern: '.*',
      widgets: DEFAULT_WIDGETS.map(w => ({ ...w, enabled: w.id === 'delta-trace' }))
    },
    {
      id: 'cockpit-cluster',
      name: 'Painel Cluster & Inputs',
      game: 'ACC',
      carPattern: '.*',
      widgets: DEFAULT_WIDGETS.map(w => ({ ...w, enabled: w.id === 'tachometer-cluster' || w.id === 'input-telemetry' }))
    }
  ],
  activeProfileId: 'default-gt3',

  selectWidget: (id) => set({ selectedWidgetId: id }),
  selectTrack: (trackId) => set({ selectedTrackId: trackId }),
  setCategory: (cat) => set({ activeCategory: cat }),
  setFilterText: (text) => set({ filterText: text }),

  toggleWidgetEnabled: (id) =>
    set((s) => ({
      widgets: s.widgets.map((w) => (w.id === id ? { ...w, enabled: !w.enabled } : w))
    })),

  // Permite abrir APENAS um widget por vez com 1 clique
  toggleOnlyThisWidget: (widgetId: string) =>
    set((s) => ({
      widgets: s.widgets.map((w) => ({ ...w, enabled: w.id === widgetId })),
      selectedWidgetId: widgetId
    })),

  // Salvar o layout customizado atual montado pelo usuário
  saveCurrentLayoutAsProfile: (profileName: string) => {
    const currentWidgets = get().widgets
    const newProfile: OverlayProfile = {
      id: `profile-${Date.now()}`,
      name: profileName || `Meu Layout (${new Date().toLocaleTimeString()})`,
      game: get().currentSimGame,
      carPattern: '.*',
      widgets: JSON.parse(JSON.stringify(currentWidgets))
    }
    set((s) => ({
      profiles: [...s.profiles, newProfile],
      activeProfileId: newProfile.id
    }))
  },

  // Carregar perfil/layout salvo
  loadProfile: (profileId: string) => {
    const profile = get().profiles.find((p) => p.id === profileId)
    if (profile) {
      set({
        widgets: JSON.parse(JSON.stringify(profile.widgets)),
        activeProfileId: profile.id
      })
    }
  },

  toggleWidgetFavorite: (id) =>
    set((s) => ({
      widgets: s.widgets.map((w) => (w.id === id ? { ...w, isFavorite: !w.isFavorite } : w))
    })),

  updateWidgetProps: (id, updates) =>
    set((s) => ({
      widgets: s.widgets.map((w) => (w.id === id ? { ...w, ...updates } : w))
    })),

  toggleEditMode: () => set((s) => ({ isEditMode: !s.isEditMode })),
  toggleLock: () => {
    const nextLocked = !get().isOverlayLocked
    set({ isOverlayLocked: nextLocked })
    if (window.api?.overlay?.setClickThrough) {
      window.api.overlay.setClickThrough(nextLocked)
    }
  },

  toggleOverlayWindow: () => {
    if (window.api?.overlay?.toggle) {
      window.api.overlay.toggle()
      set((s) => ({ isOverlayWindowOpen: !s.isOverlayWindowOpen }))
    }
  },

  addNewCustomWidget: (name, category) => {
    const newId = `custom-${Date.now()}`
    const newW: OverlayWidgetConfig = {
      id: newId,
      name,
      category,
      icon: '✨',
      isNew: true,
      enabled: true,
      x: 500,
      y: 500,
      width: 420,
      height: 240,
      scale: 1.0,
      opacity: 95,
      theme: 'dark',
      refreshRateHz: 60,
      options: {}
    }
    set((s) => ({
      widgets: [...s.widgets, newW],
      selectedWidgetId: newId,
    }))
    return newId
  },

  deleteWidget: (id) =>
    set((s) => ({
      widgets: s.widgets.filter((w) => w.id !== id),
      selectedWidgetId: s.widgets[0]?.id || ''
    }))
}))
