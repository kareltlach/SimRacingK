import { create } from 'zustand'

export interface SessionInfo {
  id: number
  gameId: string
  trackName: string
  carName: string
  date: string
  lapCount: number
  bestLapTime: number | null
  conditions: string
}

export interface LapInfo {
  id: number
  sessionId: number
  lapNumber: number
  lapTime: number
  sector1: number | null
  sector2: number | null
  sector3: number | null
  valid: boolean
  fuelUsed: number
}

export interface TelemetrySample {
  trackProgress: number
  speedKmh: number
  throttle: number
  brake: number
  steer: number
  gear: number
  rpm: number
  worldPosX: number
  worldPosZ: number
  tireTempFL: number
  tireTempFR: number
  tireTempRL: number
  tireTempRR: number
  timestamp: number
  deltaTime: number
}

interface SessionState {
  sessions: SessionInfo[]
  selectedSessionId: number | null
  laps: LapInfo[]
  selectedLaps: number[]
  telemetrySamples: Map<number, TelemetrySample[]>
  isLoading: boolean
  sortField: keyof SessionInfo
  sortDirection: 'asc' | 'desc'
  filterGame: string
  filterTrack: string

  loadSessions: () => Promise<void>
  selectSession: (id: number | null) => void
  loadLaps: (sessionId: number) => Promise<void>
  toggleLapSelection: (lapId: number) => void
  clearSelectedLaps: () => void
  loadSamples: (lapId: number) => Promise<void>
  setSortField: (field: keyof SessionInfo) => void
  setFilterGame: (game: string) => void
  setFilterTrack: (track: string) => void
  exportSession: (sessionId: number, format: 'apextel' | 'csv') => Promise<void>
  importSession: (filePath: string) => Promise<void>
}

export const useSessionStore = create<SessionState>((set, get) => ({
  sessions: [],
  selectedSessionId: null,
  laps: [],
  selectedLaps: [],
  telemetrySamples: new Map(),
  isLoading: false,
  sortField: 'date',
  sortDirection: 'desc',
  filterGame: '',
  filterTrack: '',

  loadSessions: async () => {
    set({ isLoading: true })
    try {
      const sessions = await window.api.sessions.list()
      set({ sessions, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  selectSession: (id) => set({ selectedSessionId: id, selectedLaps: [] }),

  loadLaps: async (sessionId) => {
    try {
      const laps = await window.api.sessions.getLaps(sessionId)
      set({ laps })
    } catch {
      set({ laps: [] })
    }
  },

  toggleLapSelection: (lapId) =>
    set((s) => ({
      selectedLaps: s.selectedLaps.includes(lapId)
        ? s.selectedLaps.filter((id) => id !== lapId)
        : s.selectedLaps.length < 2
          ? [...s.selectedLaps, lapId]
          : [s.selectedLaps[1], lapId],
    })),

  clearSelectedLaps: () => set({ selectedLaps: [] }),

  loadSamples: async (lapId) => {
    const state = get()
    if (state.telemetrySamples.has(lapId)) return
    try {
      const samples = await window.api.sessions.getSamples(lapId)
      const map = new Map(state.telemetrySamples)
      map.set(lapId, samples)
      set({ telemetrySamples: map })
    } catch {
      /* noop */
    }
  },

  setSortField: (field) =>
    set((s) => ({
      sortField: field,
      sortDirection: s.sortField === field && s.sortDirection === 'asc' ? 'desc' : 'asc',
    })),

  setFilterGame: (game) => set({ filterGame: game }),
  setFilterTrack: (track) => set({ filterTrack: track }),

  exportSession: async (sessionId, format) => {
    await window.api.sessions.exportSession(sessionId, format)
  },

  importSession: async (filePath) => {
    await window.api.sessions.importSession(filePath)
    await get().loadSessions()
  },
}))
