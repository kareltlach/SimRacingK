import { create } from 'zustand'

export interface HudWidget {
  id: string
  type: 'speedo' | 'tachometer' | 'gear' | 'pedals' | 'tires' | 'delta' | 'minimap'
  x: number
  y: number
  width: number
  height: number
  scale: number
  opacity: number
  config: Record<string, any>
}

export interface HudLayout {
  id: number
  name: string
  resolution: { width: number; height: number }
  widgets: HudWidget[]
  createdAt: string
  updatedAt: string
}

export interface AutoSwitchRule {
  id: string
  gameId: string
  carPattern: string
  layoutId: number
  enabled: boolean
}

interface HudState {
  layouts: HudLayout[]
  activeLayoutId: number | null
  selectedWidgetId: string | null
  editorZoom: number
  gridSize: number
  showGrid: boolean
  autoSwitchRules: AutoSwitchRule[]

  setLayouts: (layouts: HudLayout[]) => void
  setActiveLayout: (id: number | null) => void
  selectWidget: (id: string | null) => void
  setEditorZoom: (zoom: number) => void
  setGridSize: (size: number) => void
  toggleGrid: () => void

  addWidget: (widget: HudWidget) => void
  updateWidget: (id: string, updates: Partial<HudWidget>) => void
  removeWidget: (id: string) => void

  addLayout: (layout: HudLayout) => void
  updateLayout: (id: number, updates: Partial<HudLayout>) => void
  removeLayout: (id: number) => void
  duplicateLayout: (id: number) => void

  addAutoSwitchRule: (rule: AutoSwitchRule) => void
  updateAutoSwitchRule: (id: string, updates: Partial<AutoSwitchRule>) => void
  removeAutoSwitchRule: (id: string) => void
}

export const useHudStore = create<HudState>((set, get) => ({
  layouts: [],
  activeLayoutId: null,
  selectedWidgetId: null,
  editorZoom: 1,
  gridSize: 10,
  showGrid: true,
  autoSwitchRules: [],

  setLayouts: (layouts) => set({ layouts }),
  setActiveLayout: (id) => set({ activeLayoutId: id, selectedWidgetId: null }),
  selectWidget: (id) => set({ selectedWidgetId: id }),
  setEditorZoom: (zoom) => set({ editorZoom: Math.max(0.25, Math.min(3, zoom)) }),
  setGridSize: (size) => set({ gridSize: size }),
  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),

  addWidget: (widget) =>
    set((s) => {
      const layout = s.layouts.find((l) => l.id === s.activeLayoutId)
      if (!layout) return s
      return {
        layouts: s.layouts.map((l) =>
          l.id === s.activeLayoutId
            ? { ...l, widgets: [...l.widgets, widget], updatedAt: new Date().toISOString() }
            : l
        ),
        selectedWidgetId: widget.id,
      }
    }),

  updateWidget: (id, updates) =>
    set((s) => ({
      layouts: s.layouts.map((l) =>
        l.id === s.activeLayoutId
          ? {
              ...l,
              widgets: l.widgets.map((w) => (w.id === id ? { ...w, ...updates } : w)),
              updatedAt: new Date().toISOString(),
            }
          : l
      ),
    })),

  removeWidget: (id) =>
    set((s) => ({
      layouts: s.layouts.map((l) =>
        l.id === s.activeLayoutId
          ? {
              ...l,
              widgets: l.widgets.filter((w) => w.id !== id),
              updatedAt: new Date().toISOString(),
            }
          : l
      ),
      selectedWidgetId: s.selectedWidgetId === id ? null : s.selectedWidgetId,
    })),

  addLayout: (layout) => set((s) => ({ layouts: [...s.layouts, layout] })),

  updateLayout: (id, updates) =>
    set((s) => ({
      layouts: s.layouts.map((l) =>
        l.id === id ? { ...l, ...updates, updatedAt: new Date().toISOString() } : l
      ),
    })),

  removeLayout: (id) =>
    set((s) => ({
      layouts: s.layouts.filter((l) => l.id !== id),
      activeLayoutId: s.activeLayoutId === id ? null : s.activeLayoutId,
    })),

  duplicateLayout: (id) => {
    const state = get()
    const layout = state.layouts.find((l) => l.id === id)
    if (!layout) return
    const newId = Math.max(0, ...state.layouts.map((l) => l.id)) + 1
    const copy: HudLayout = {
      ...structuredClone(layout),
      id: newId,
      name: `${layout.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    set({ layouts: [...state.layouts, copy] })
  },

  addAutoSwitchRule: (rule) =>
    set((s) => ({ autoSwitchRules: [...s.autoSwitchRules, rule] })),

  updateAutoSwitchRule: (id, updates) =>
    set((s) => ({
      autoSwitchRules: s.autoSwitchRules.map((r) =>
        r.id === id ? { ...r, ...updates } : r
      ),
    })),

  removeAutoSwitchRule: (id) =>
    set((s) => ({
      autoSwitchRules: s.autoSwitchRules.filter((r) => r.id !== id),
    })),
}))
