import React, { useState } from 'react'
import { useSteamStore } from '../../store/steamStore'

const SUPPORTED_GAMES = [
  { id: 244210, name: 'Assetto Corsa', status: 'Instalado' },
  { id: 805550, name: 'Assetto Corsa Competizione', status: 'Instalado' },
  { id: 2440510, name: 'Forza Motorsport', status: 'Detectado' },
  { id: 1551360, name: 'Forza Horizon 5', status: 'Detectado' },
  { id: 2399420, name: 'Le Mans Ultimate', status: 'Instalado' },
  { id: 1849250, name: 'EA Sports WRC', status: 'Detectado' },
]

export const SteamProfile: React.FC = () => {
  const profile = useSteamStore((s) => s.profile)
  const [apiKey, setApiKey] = useState('')
  const login = useSteamStore((s) => s.login)

  const handleLogin = () => {
    login(apiKey || 'DEMO_STEAM_KEY')
  }

  return (
    <div className="bg-[#11111c] border border-[#1e1e32] rounded-xl p-5 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-white flex items-center space-x-2">
          <span>🎮</span>
          <span>Vínculo Steam & Simuladores</span>
        </h2>
        <span className="text-xs bg-[#1a1a2b] text-gray-400 px-2.5 py-1 rounded-md border border-[#2a2a40] font-mono">
          Steam OpenID v2.0
        </span>
      </div>

      <div className="flex items-center space-x-4 mb-5 pb-5 border-b border-[#1b1b2d]">
        <img
          src={profile?.avatarUrl || 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg'}
          alt="Avatar"
          className="w-14 h-14 rounded-full border-2 border-red-500/60 shadow-md"
        />
        <div>
          <div className="text-base font-bold text-white flex items-center space-x-2">
            <span>{profile?.nickname || 'Apex Sim Racer'}</span>
            <span className="text-[10px] bg-red-950/80 text-red-400 px-2 py-0.5 rounded border border-red-800 font-mono">PRO PILOT</span>
          </div>
          <div className="text-xs text-gray-500 font-mono mt-0.5">
            SteamID: {profile?.steamId || '76561198000000000'} | Horas em Pista: <span className="text-gray-300 font-bold">{profile?.totalHours || 342}h</span>
          </div>
        </div>
      </div>

      <div>
        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
          Simuladores Suportados na Biblioteca
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {SUPPORTED_GAMES.map((game) => (
            <div key={game.id} className="bg-[#0b0b13] p-2.5 rounded-lg border border-[#181828] flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-200">{game.name}</span>
              <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                {game.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
export default SteamProfile
