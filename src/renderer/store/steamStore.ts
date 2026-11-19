import { create } from 'zustand'

export interface SteamProfile {
  steamId: string
  nickname: string
  avatarUrl: string
  profileUrl: string
  totalHours: number
  ownedGames: SteamGame[]
}

export interface SteamGame {
  appId: number
  name: string
  playtimeHours: number
  iconUrl: string
}

interface SteamState {
  profile: SteamProfile | null
  isLoggedIn: boolean
  isLoading: boolean
  error: string | null

  login: (apiKey: string) => Promise<void>
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
}

export const useSteamStore = create<SteamState>((set) => ({
  profile: null,
  isLoggedIn: false,
  isLoading: false,
  error: null,

  login: async (apiKey: string) => {
    set({ isLoading: true, error: null })
    try {
      const profile = await window.api.steam.login(apiKey)
      set({ profile, isLoggedIn: true, isLoading: false })
    } catch (err: any) {
      set({ error: err.message ?? 'Login failed', isLoading: false })
    }
  },

  logout: async () => {
    try {
      await window.api.steam.logout()
    } catch {
      /* noop */
    }
    set({ profile: null, isLoggedIn: false, error: null })
  },

  refreshProfile: async () => {
    set({ isLoading: true })
    try {
      const profile = await window.api.steam.getProfile()
      set({ profile, isLoggedIn: !!profile, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },
}))
