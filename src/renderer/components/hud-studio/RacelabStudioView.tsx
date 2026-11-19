import React, { useState, useEffect } from 'react'
import { useRacelabStore, OverlayWidgetConfig } from '../../store/racelabStore'
import { useTelemetryStore } from '../../store/telemetryStore'
import { SUPPORTED_SIM_GAMES, SupportedGameMeta } from '../../../shared/supportedGames'
import { SUPPORTED_TRACKS, TrackData, normalizeTrackId } from '../../../shared/supportedTracks'
import { TachometerWidget } from '../widgets/TachometerWidget'
import { InputGraphWidget } from '../widgets/InputGraphWidget'
import { TireMonitorWidget } from '../widgets/TireMonitorWidget'
import { RadarWidget } from '../widgets/RadarWidget'
import { TimingFuelWidget } from '../widgets/TimingFuelWidget'
import { RelativesStandingsWidget } from '../widgets/RelativesStandingsWidget'
import { TrackMapGPSWidget } from '../widgets/TrackMapGPSWidget'
import { TrendChartWidget } from '../widgets/TrendChartWidget'
import { DeltaTraceWidget } from '../widgets/DeltaTraceWidget'
import { FuelCalculatorWidget } from '../widgets/FuelCalculatorWidget'
import { CustomOverlayView } from '../widgets/CustomOverlayView'
import { CustomOverlayEditorModal } from './CustomOverlayEditorModal'
import { CustomOverlayData } from '../../../shared/customOverlayTypes'

export const RacelabStudioView: React.FC = () => {
  const widgets = useRacelabStore((s) => s.widgets)
  const selectedWidgetId = useRacelabStore((s) => s.selectedWidgetId)
  const selectWidget = useRacelabStore((s) => s.selectWidget)
  const toggleWidgetEnabled = useRacelabStore((s) => s.toggleWidgetEnabled)
  const toggleWidgetFavorite = useRacelabStore((s) => s.toggleWidgetFavorite)
  const updateWidgetProps = useRacelabStore((s) => s.updateWidgetProps)
  const isOverlayLocked = useRacelabStore((s) => s.isOverlayLocked)
  const toggleLock = useRacelabStore((s) => s.toggleLock)
  const toggleOverlayWindow = useRacelabStore((s) => s.toggleOverlayWindow)
  const filterText = useRacelabStore((s) => s.filterText)
  const setFilterText = useRacelabStore((s) => s.setFilterText)
  const toggleOnlyThisWidget = useRacelabStore((s) => s.toggleOnlyThisWidget)
  const saveCurrentLayoutAsProfile = useRacelabStore((s) => s.saveCurrentLayoutAsProfile)
  const loadProfile = useRacelabStore((s) => s.loadProfile)
  const profiles = useRacelabStore((s) => s.profiles)
  const activeProfileId = useRacelabStore((s) => s.activeProfileId)
  const addNewCustomWidget = useRacelabStore((s) => s.addNewCustomWidget)
  const deleteWidget = useRacelabStore((s) => s.deleteWidget)
  const [showSaveLayoutModal, setShowSaveLayoutModal] = useState(false)
  const [layoutSaveName, setLayoutSaveName] = useState('')
  const [showLayoutDropdown, setShowLayoutDropdown] = useState(false)

  const [activeTab, setActiveTab] = useState<'ALL' | 'FAVORITES'>('ALL')
  const [showNewModal, setShowNewModal] = useState(false)
  const [newWidgetName, setNewWidgetName] = useState('')
  const [newWidgetCategory, setNewWidgetCategory] = useState<OverlayWidgetConfig['category']>('Timing')
  const [editingCustomWidgetId, setEditingCustomWidgetId] = useState<string | null>(null)

  const selectedTrackId = useRacelabStore((s) => s.selectedTrackId) || 'monza'
  const selectTrack = useRacelabStore((s) => s.selectTrack)
  const currentTrack: TrackData = SUPPORTED_TRACKS[selectedTrackId] || SUPPORTED_TRACKS.monza
  const [showTrackDropdown, setShowTrackDropdown] = useState<boolean>(false)
  // Auto-detection state
  const [activeSim, setActiveSim] = useState<SupportedGameMeta>(SUPPORTED_SIM_GAMES.acc)
  const [isSimRunning, setIsSimRunning] = useState<boolean>(true)
  const [showSimDropdown, setShowSimDropdown] = useState<boolean>(false)

  const telemetryData = useTelemetryStore((s) => s.currentData)
  const isConnected = useTelemetryStore((s) => s.isConnected)
  const activeTrackFromTelemetry = useTelemetryStore((s) => s.activeTrack)

  // Sincroniza a pista e localização em tempo real automaticamente a partir do jogo ativo
  useEffect(() => {
    // Apenas sobreescreve automaticamente se vier de um simulador real ativo e não estiver em 'monza' padrão
    if (activeTrackFromTelemetry && activeTrackFromTelemetry !== 'Monza (Synthetic)') {
      const autoTrackId = normalizeTrackId(activeTrackFromTelemetry)
      if (autoTrackId && autoTrackId !== selectedTrackId) {
        selectTrack(autoTrackId)
      }
    }
  }, [activeTrackFromTelemetry, selectedTrackId, selectTrack])

  const selectedWidget = widgets.find((w) => w.id === selectedWidgetId) || widgets[0]

  useEffect(() => {
    const api = (window as any).api
    if (api?.telemetry?.getActiveSim) {
      api.telemetry.getActiveSim().then((res: any) => {
        if (res?.game) setActiveSim(res.game)
        if (res?.isRunning !== undefined) setIsSimRunning(res.isRunning)
      }).catch(() => {})
    }

    if (api?.telemetry?.onSimChange) {
      const unsub = api.telemetry.onSimChange((res: any) => {
        if (res?.game) setActiveSim(res.game)
        if (res?.isRunning !== undefined) setIsSimRunning(res.isRunning)
      })
      return () => unsub?.()
    }
  }, [])

  const categories = [
    { name: 'Standings', icon: '📋' },
    { name: 'Car & Inputs', icon: '🎮' },
    { name: 'Timing', icon: '⏱️' },
    { name: 'Maps', icon: '🗺️' },
    { name: 'Fuel & Energy', icon: '⛽' },
  ]

  // Widgets criados pelo usuário (overlays personalizados)
  const customWidgets = widgets.filter(
    (w) => w.id.startsWith('custom-') || w.customOverlayData
  )

  const filteredWidgets = widgets.filter((w) => {
    if (w.id.startsWith('custom-') || w.customOverlayData) return false // separado na seção "Meus Overlays"
    if (activeTab === 'FAVORITES' && !w.isFavorite) return false
    if (filterText && !w.name.toLowerCase().includes(filterText.toLowerCase())) return false
    return true
  })

  const filteredCustomWidgets = customWidgets.filter((w) => {
    if (filterText && !w.name.toLowerCase().includes(filterText.toLowerCase())) return false
    return true
  })

  const handleOpenStandaloneOverlay = (widget: OverlayWidgetConfig) => {
    const api = (window as any).api
    if (api?.overlay?.openStandaloneWidget) {
      const isCustom = widget.id.startsWith('custom') || !!widget.customOverlayData
      api.overlay.openStandaloneWidget({
        id: widget.id,
        name: widget.name,
        type: isCustom ? 'custom' :
              widget.id === 'delta-trace' ? 'deltaTrace' :
              widget.id === 'tachometer-cluster' ? 'tachometer' :
              widget.id === 'input-telemetry' ? 'inputGraph' :
              widget.id === 'tire-monitor' ? 'tireMonitor' :
              widget.id === 'relatives' ? 'relatives' :
              widget.id === 'track-map' ? 'trackMap' :
              widget.id === 'fuel-calculator' ? 'fuelCalculator' :
              widget.id,
        width: widget.width || 420,
        height: widget.height || 220,
        x: widget.x || 100,
        y: widget.y || 100,
        scale: widget.scale || 1.0,
        opacity: (widget.opacity || 95) / 100,
        theme: widget.theme || 'transparent',
        trackId: selectedTrackId,
        customData: widget.customOverlayData ? encodeURIComponent(JSON.stringify(widget.customOverlayData)) : undefined,
      })
    }
  }

  const handleCreateWidget = () => {
    if (newWidgetName.trim()) {
      const newId = addNewCustomWidget(newWidgetName.trim(), newWidgetCategory)
      setNewWidgetName('')
      setShowNewModal(false)
      setEditingCustomWidgetId(newId)
    }
  }

  const handleSelectSimManual = (game: SupportedGameMeta) => {
    setActiveSim(game)
    setShowSimDropdown(false)
    const api = (window as any).api
    if (api?.telemetry?.start) {
      api.telemetry.start(game.adapterKey)
    }
  }

  return (
    <div className="flex h-screen w-screen bg-[#0d0e12] text-gray-200 select-none font-sans overflow-hidden">
      {/* ─── LEFT SIDEBAR (RACELAB NAVIGATION) ─── */}
      <aside className="w-72 bg-[#12131a] border-r border-[#1e202c] flex flex-col justify-between z-20 shadow-2xl">
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Top Brand & Sim Switcher Header */}
          <div className="p-3 border-b border-[#1e202c]">
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center space-x-2">
                <span className="w-5 h-5 bg-[#e11d48] rounded flex items-center justify-center text-[10px] font-black text-white shadow-md shadow-rose-900/50">
                  ▲
                </span>
                <span className="font-black text-sm tracking-widest text-white uppercase font-mono">
                  RACELAB<span className="text-[#e11d48]">.STUDIO</span>
                </span>
              </div>
              <span className="text-[10px] text-gray-500 font-mono">v0.7.1</span>
            </div>

            {/* ─── OFFICIAL ACTIVE SIMULATOR CARD (WITH REAL LOGO) ─── */}
            <div className="relative mb-2">
              <button
                onClick={() => setShowSimDropdown(!showSimDropdown)}
                className="w-full bg-[#181a24] hover:bg-[#1f2230] border border-[#26293b] hover:border-[#e11d48]/50 p-2 rounded-xl flex items-center justify-between transition-all cursor-pointer shadow-md text-left"
              >
                <div className="flex items-center space-x-2.5 truncate">
                  {/* Official Steam Brand Logo */}
                  <div className="w-12 h-7 rounded overflow-hidden bg-black/60 border border-gray-700/60 flex-shrink-0 flex items-center justify-center">
                    <img
                      src={activeSim.headerUrl}
                      alt={activeSim.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="truncate">
                    <div className="flex items-center space-x-1.5">
                      <span className={`w-2 h-2 rounded-full ${isSimRunning ? 'bg-emerald-400 animate-pulse' : 'bg-blue-400'}`}></span>
                      <span className="text-[9px] font-mono font-bold uppercase text-gray-400">
                        {isSimRunning ? 'DETECTADO ATIVO' : 'SELECIONADO'}
                      </span>
                    </div>
                    <div className="text-xs font-black text-white truncate font-sans">
                      {activeSim.name}
                    </div>
                  </div>
                </div>
                <span className="text-gray-400 text-xs ml-1">▼</span>
              </button>

              {/* Sim Selection Dropdown Menu */}
              {showSimDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#12141c] border border-[#2b2e40] rounded-xl shadow-2xl p-1.5 z-50 space-y-1">
                  <div className="text-[10px] font-mono text-gray-500 px-2 py-1 font-bold uppercase border-b border-gray-800">
                    SIMULADORES SUPORTADOS
                  </div>
                  {Object.values(SUPPORTED_SIM_GAMES).map((g) => (
                    <div
                      key={g.id}
                      onClick={() => handleSelectSimManual(g)}
                      className={`flex items-center space-x-2.5 p-1.5 rounded-lg cursor-pointer transition-all ${
                        activeSim.id === g.id
                          ? 'bg-[#1e2333] border border-[#e11d48]/60 text-white'
                          : 'hover:bg-[#181a24] text-gray-300'
                      }`}
                    >
                      <div className="w-10 h-6 rounded overflow-hidden bg-black flex-shrink-0 border border-gray-700">
                        <img src={g.headerUrl} alt={g.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="truncate text-xs font-bold">{g.name}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ─── PISTA ATIVA (AUTOMATICAMENTE SINCRONIZADA OU SELECIONADA) ─── */}
            <div className="relative mb-3">
              <button
                type="button"
                onClick={() => setShowTrackDropdown(!showTrackDropdown)}
                className="w-full bg-[#141620] hover:bg-[#191c29] border border-[#232636] hover:border-[#3b82f6]/50 p-2 rounded-xl flex items-center justify-between shadow-sm cursor-pointer transition-all text-left"
                title="Clique para alternar ou selecionar manualmente a pista"
              >
                <div className="flex items-center space-x-2 truncate">
                  <span className="text-base">🏁</span>
                  <div className="truncate">
                    <div className="flex items-center space-x-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${isSimRunning && isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                      <span className={`text-[9px] font-mono font-bold uppercase ${isSimRunning && isConnected ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {isSimRunning && isConnected ? 'PISTA ATIVA (TELEMETRIA)' : 'PISTA SELECIONADA'}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-white truncate">
                      {currentTrack.circuit || currentTrack.name}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-[10px] font-mono font-bold text-gray-400 px-1.5 py-0.5 rounded bg-black/40">
                    {currentTrack.lengthKm}
                  </span>
                  <span className="text-gray-400 text-xs">▼</span>
                </div>
              </button>

              {/* Menu Dropdown de Seleção de Pistas */}
              {showTrackDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#12141c] border border-[#2b2e40] rounded-xl shadow-2xl p-1.5 z-50 max-h-64 overflow-y-auto space-y-1">
                  <div className="text-[10px] font-mono text-gray-500 px-2 py-1 font-bold uppercase border-b border-gray-800">
                    SELECIONAR CIRCUITO
                  </div>
                  {Object.values(SUPPORTED_TRACKS).map((t) => (
                    <div
                      key={t.id}
                      onClick={() => {
                        selectTrack(t.id)
                        setShowTrackDropdown(false)
                        const api = (window as any).api
                        if (api?.telemetry?.setTrack) {
                          api.telemetry.setTrack(t.id)
                        }
                      }}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${
                        selectedTrackId === t.id
                          ? 'bg-[#1e2333] border border-[#3b82f6]/60 text-white font-bold'
                          : 'hover:bg-[#181a24] text-gray-300'
                      }`}
                    >
                      <div className="truncate">
                        <div className="text-xs font-bold truncate">{t.name}</div>
                        <div className="text-[10px] text-gray-500 truncate">{t.circuit}</div>
                      </div>
                      <span className="text-[9px] font-mono text-gray-400 bg-black/50 px-1.5 py-0.5 rounded flex-shrink-0">
                        {t.lengthKm}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Red Pill Toggle (OVERLAYS / FAVORITES / ALL) */}
            <div className="flex bg-[#0a0a0f] p-1 rounded-lg border border-[#1e202c] text-xs font-bold">
              <button
                onClick={() => setActiveTab('ALL')}
                className={`flex-1 py-1.5 rounded-md flex items-center justify-center space-x-1.5 transition-all ${
                  activeTab === 'ALL'
                    ? 'bg-[#e11d48] text-white shadow-lg shadow-rose-900/40'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <span>🛡️</span>
                <span>OVERLAYS</span>
              </button>
              <button
                onClick={() => setActiveTab('FAVORITES')}
                className={`w-10 py-1.5 rounded-md flex items-center justify-center transition-all ${
                  activeTab === 'FAVORITES'
                    ? 'bg-[#e11d48] text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <span>⭐</span>
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="p-3 border-b border-[#1a1b24]">
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs text-gray-500">🔍</span>
              <input
                type="text"
                placeholder="Type to filter..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="w-full bg-[#0a0a0f] border border-[#1e202c] rounded-md py-1.5 pl-8 pr-3 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-[#e11d48] transition-all"
              />
            </div>
          </div>

          {/* Category Tree & Widget List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-4">

            {/* ─── SEÇÃO: MEUS OVERLAYS PERSONALIZADOS ─── */}
            <div className="space-y-1">
              <div className="flex items-center justify-between px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-indigo-400 border-b border-indigo-900/40">
                <span className="flex items-center space-x-1.5">
                  <span>✨</span>
                  <span>Meus Overlays</span>
                </span>
                <span className="text-[10px] text-indigo-600 font-mono">({filteredCustomWidgets.length})</span>
              </div>

              {filteredCustomWidgets.length === 0 ? (
                <div className="px-3 py-2 text-[10px] text-gray-600 italic font-mono">
                  Nenhum overlay criado ainda.
                </div>
              ) : (
                <div className="space-y-0.5">
                  {filteredCustomWidgets.map((w) => {
                    const isSelected = selectedWidgetId === w.id
                    return (
                      <div
                        key={w.id}
                        onClick={() => selectWidget(w.id)}
                        className={`group flex items-center justify-between px-2.5 py-2 rounded-md text-xs cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-indigo-950/60 border-l-2 border-indigo-500 text-white font-bold shadow-inner'
                            : 'text-gray-400 hover:text-gray-200 hover:bg-[#15161f]'
                        }`}
                      >
                        <div className="flex items-center space-x-2 truncate flex-1 min-w-0">
                          <span className="text-sm flex-shrink-0">{w.icon || '✨'}</span>
                          <span className="truncate">{w.name}</span>
                        </div>

                        <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100 flex-shrink-0 ml-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingCustomWidgetId(w.id)
                              selectWidget(w.id)
                            }}
                            className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-700/80 hover:bg-indigo-500 text-white transition-all"
                            title="Abrir editor visual"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleOpenStandaloneOverlay(w)
                            }}
                            className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#e11d48]/80 hover:bg-[#ff003b] text-white transition-all"
                            title="Abrir overlay em janela flutuante"
                          >
                            🚀
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleWidgetEnabled(w.id)
                            }}
                            className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${
                              w.enabled
                                ? 'bg-emerald-500 shadow-md shadow-emerald-500/50 text-[10px] text-white'
                                : 'bg-[#262838] hover:bg-gray-600'
                            }`}
                          >
                            {w.enabled && '✓'}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              if (window.confirm(`Excluir o overlay "${w.name}"?`)) {
                                deleteWidget(w.id)
                              }
                            }}
                            className="px-1 py-0.5 rounded text-[9px] font-bold text-red-500 hover:bg-red-950/50 transition-all"
                            title="Excluir overlay"
                          >
                            🗑
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* ─── SEPARADOR ─── */}
            <div className="border-t border-[#1e202c] mx-2" />

            {categories.map((cat) => {
              const catWidgets = filteredWidgets.filter((w) => w.category === cat.name)
              if (catWidgets.length === 0) return null

              return (
                <div key={cat.name} className="space-y-1">
                  <div className="flex items-center justify-between px-2 py-1 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    <span>{cat.name}</span>
                    <span className="text-[10px] text-gray-600 font-mono">({catWidgets.length})</span>
                  </div>

                  <div className="space-y-0.5">
                    {catWidgets.map((w) => {
                      const isSelected = selectedWidgetId === w.id
                      return (
                        <div
                          key={w.id}
                          onClick={() => selectWidget(w.id)}
                          className={`group flex items-center justify-between px-2.5 py-2 rounded-md text-xs cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-[#1b1d28] border-l-2 border-[#e11d48] text-white font-bold shadow-inner'
                              : 'text-gray-400 hover:text-gray-200 hover:bg-[#15161f]'
                          }`}
                        >
                          <div className="flex items-center space-x-2 truncate">
                            <span className="text-sm">{w.icon}</span>
                            <span className="truncate">{w.name}</span>
                          </div>

                          <div className="flex items-center space-x-1.5 opacity-80 group-hover:opacity-100">
                            {w.isNew && (
                              <span className="text-[9px] bg-red-950 text-red-400 border border-red-800 px-1 rounded font-bold uppercase">
                                NEW
                              </span>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleOpenStandaloneOverlay(w)
                              }}
                              className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#e11d48]/80 hover:bg-[#ff003b] text-white transition-all shadow-sm"
                              title="Abrir este overlay individual em uma nova janela"
                            >
                              🚀
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleWidgetEnabled(w.id)
                              }}
                              className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${
                                w.enabled
                                  ? 'bg-emerald-500 shadow-md shadow-emerald-500/50 text-[10px] text-white'
                                  : 'bg-[#262838] hover:bg-gray-600'
                              }`}
                            >
                              {w.enabled && '✓'}
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Bottom Action: Create Custom Overlay */}
        <div className="p-3 border-t border-[#1e202c] bg-[#0c0d12]">
          <button
            onClick={() => setShowNewModal(true)}
            className="w-full py-2 bg-indigo-900/40 hover:bg-indigo-800/50 text-indigo-200 border border-indigo-800/60 hover:border-indigo-500 rounded-md text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-md"
          >
            <span className="text-indigo-400">＋</span>
            <span>CRIAR NOVO OVERLAY</span>
          </button>
        </div>
      </aside>

      {/* ─── MAIN CONTENT AREA (VISUAL GALLERY + CANVAS EDITOR) ─── */}
      <main className="flex-1 flex flex-col bg-[#090a0e] overflow-hidden">
        {/* Top Header Navigation Bar */}
        <header className="h-14 bg-[#12131a] border-b border-[#1e202c] px-6 flex items-center justify-between z-10 shadow-md">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-xs font-bold text-gray-400">
              <button className="px-2.5 py-1 bg-[#1a1b26] rounded border border-[#262838] hover:text-white">
                🏠 Home
              </button>
              <button className="px-2.5 py-1 bg-[#e11d48]/10 text-[#e11d48] border border-[#e11d48]/30 rounded font-bold">
                🪟 Overlays Studio
              </button>
              <button className="px-2.5 py-1 bg-[#1a1b26] rounded border border-[#262838] hover:text-white">
                📊 Telemetry
              </button>
            </div>
          </div>

          {/* Right Status & Controls (WITH GAME BRAND BADGE) */}
          <div className="flex items-center space-x-3 text-xs">
            {/* ─── SELETOR DE LAYOUTS SALVOS ─── */}
            <div className="relative">
              <button
                onClick={() => setShowLayoutDropdown(!showLayoutDropdown)}
                className="px-3 py-1.5 bg-[#161824] hover:bg-[#1f2233] border border-[#2a2d40] text-gray-200 rounded-md font-bold flex items-center space-x-1.5 cursor-pointer shadow-sm transition-all"
              >
                <span>📐</span>
                <span className="truncate max-w-[140px]">
                  {profiles.find(p => p.id === activeProfileId)?.name || 'Layouts'}
                </span>
                <span className="text-[10px] text-gray-400">▼</span>
              </button>

              {showLayoutDropdown && (
                <div className="absolute right-0 top-full mt-1 w-64 bg-[#12141c] border border-[#2b2e40] rounded-xl shadow-2xl p-1.5 z-50 space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono text-gray-500 px-2 py-1 font-bold uppercase border-b border-gray-800">
                    <span>MEUS LAYOUTS</span>
                    <button
                      onClick={() => {
                        setShowLayoutDropdown(false)
                        setShowSaveLayoutModal(true)
                      }}
                      className="text-emerald-400 hover:text-emerald-300 font-bold"
                    >
                      ＋ Salvar Atual
                    </button>
                  </div>
                  {profiles.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        loadProfile(p.id)
                        setShowLayoutDropdown(false)
                      }}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${
                        activeProfileId === p.id
                          ? 'bg-[#1b2533] border border-emerald-500/60 text-white font-bold'
                          : 'hover:bg-[#181a24] text-gray-300'
                      }`}
                    >
                      <span className="text-xs truncate">{p.name}</span>
                      <span className="text-[10px] text-gray-500 font-mono">
                        ({p.widgets.filter(w => w.enabled).length} ativos)
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Live Detected Sim Logo Badge */}
            <div className="flex items-center space-x-2.5 bg-[#161824] pl-1.5 pr-3 py-1 rounded-lg border border-[#2a2d40] shadow-sm">
              <img
                src={activeSim.headerUrl}
                alt={activeSim.name}
                className="w-9 h-5 rounded object-cover shadow-sm"
              />
              <div className="text-left">
                <div className="text-[9px] font-mono font-bold text-gray-400 uppercase leading-none">
                  {isSimRunning ? 'SIMULADOR ATIVO' : 'CONECTADO'}
                </div>
                <div className="text-xs font-bold text-white leading-tight">
                  {activeSim.shortName}
                </div>
              </div>
            </div>

            {/* Live Telemetry Rate */}
            <div className="flex items-center space-x-2 bg-[#090a0e] px-3 py-1.5 rounded-md border border-[#1e202c]">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-emerald-400'}`}></span>
              <span className="font-mono font-bold text-[11px] text-gray-300">
                60 FPS REALTIME
              </span>
            </div>

            {/* Lock Click-Through Button */}
            <button
              onClick={toggleLock}
              className={`px-3 py-1.5 rounded-md font-bold text-xs flex items-center space-x-1.5 border transition-all cursor-pointer ${
                isOverlayLocked
                  ? 'bg-[#181924] border-[#2a2c3d] text-gray-300'
                  : 'bg-amber-950/60 border-amber-600 text-amber-300'
              }`}
            >
              <span>{isOverlayLocked ? '🔒' : '🔓'}</span>
              <span>{isOverlayLocked ? 'LOCKED' : 'EDIT MODE'}</span>
            </button>

            {/* Launch Transparent HUD Button */}
            <button
              onClick={toggleOverlayWindow}
              className="px-4 py-1.5 bg-gradient-to-r from-[#e11d48] to-[#ff003b] hover:from-rose-500 hover:to-red-500 text-white font-bold rounded-md shadow-lg shadow-rose-950/60 transition-all flex items-center space-x-2 cursor-pointer"
            >
              <span>🚀</span>
              <span>START OVERLAYS</span>
            </button>
          </div>
        </header>

        {/* ─── RACELAB INTERACTIVE GALLERY & CANVAS PREVIEW ─── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Top Banner Feature Overlay Card (Delta Trace style) */}
          <div className="relative rounded-2xl overflow-hidden border border-[#222433] bg-[#12131d] shadow-2xl group">
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/80 z-0"></div>
            <div className="absolute inset-0 bg-[radial-gradient(#1e202e_1px,transparent_1px)] [background-size:16px_16px] opacity-25"></div>

            <div className="relative z-10 p-6 flex flex-col justify-between min-h-[300px]">
              {/* Header row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-xs bg-[#e11d48] text-white font-black px-2 py-0.5 rounded tracking-wider uppercase font-mono shadow-md">
                    FEATURED OVERLAY
                  </span>
                  <h2 className="text-lg font-black text-white tracking-wide">
                    {selectedWidget.name}
                  </h2>
                </div>

                <div className="flex items-center space-x-3">
                  {(selectedWidget.id.startsWith('custom') || selectedWidget.customOverlayData) && (
                    <button
                      onClick={() => setEditingCustomWidgetId(selectedWidget.id)}
                      className="px-3 py-1.5 bg-[#4f46e5] hover:bg-[#4338ca] text-white font-black rounded-lg text-xs tracking-wide shadow-lg shadow-indigo-950/60 transition-all flex items-center space-x-1.5 cursor-pointer"
                      title="Abrir construtor visual de elementos para este overlay"
                    >
                      <span>✏️</span>
                      <span>Editar Overlay Visual</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleOpenStandaloneOverlay(selectedWidget)}
                    className="px-3 py-1.5 bg-[#e11d48] hover:bg-[#ff003b] text-white font-black rounded-lg text-xs tracking-wide shadow-lg shadow-rose-950/60 transition-all flex items-center space-x-1.5 cursor-pointer"
                    title="Abre uma janela de overlay independente do RaceLab com este widget"
                  >
                    <span>🚀</span>
                    <span>Open Overlay (Janela Flutuante)</span>
                  </button>

                  <button
                    onClick={() => toggleOnlyThisWidget(selectedWidget.id)}
                    className="px-2.5 py-1.5 bg-[#1a1b24] hover:bg-[#252838] border border-gray-700/60 rounded-lg text-xs font-bold text-gray-300 hover:text-white transition-all cursor-pointer shadow-sm"
                    title="Desativa todos os outros e ativa somente este widget na tela"
                  >
                    🎯 Só este no HUD
                  </button>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <span className="text-xs font-semibold text-gray-400">Ativar na Tela</span>
                    <input
                      type="checkbox"
                      checked={selectedWidget.enabled}
                      onChange={() => toggleWidgetEnabled(selectedWidget.id)}
                      className="accent-[#e11d48] w-4 h-4 rounded cursor-pointer"
                    />
                  </label>
                  <button
                    onClick={() => toggleWidgetFavorite(selectedWidget.id)}
                    className="text-base text-gray-400 hover:text-amber-400 transition-all"
                  >
                    {selectedWidget.isFavorite ? '⭐' : '☆'}
                  </button>
                </div>
              </div>

              {/* Dynamic Live Widget Showcase Simulation */}
              <div className="my-6 flex items-center justify-center overflow-hidden">
                <div
                  className="rounded-xl shadow-2xl p-2 transition-all flex items-center justify-center overflow-hidden"
                  style={{
                    backgroundColor: selectedWidget.theme === 'transparent' ? 'transparent' : 'rgba(15,23,42,0.92)',
                    opacity: selectedWidget.opacity / 100,
                    width: Math.min(680, selectedWidget.width),
                    height: Math.min(260, selectedWidget.height),
                  }}
                >
                  {selectedWidget.id === 'delta-trace' && (
                    <DeltaTraceWidget
                      delta={selectedWidget.enabled ? (telemetryData?.delta || 0) : 0}
                      speedKmh={selectedWidget.enabled ? (telemetryData?.speedKmh || (telemetryData as any)?.speed || 0) : 0}
                      gear={selectedWidget.enabled ? (telemetryData?.gear || 0) : 0}
                      rpm={selectedWidget.enabled ? (telemetryData?.rpm || 0) : 0}
                      width={Math.min(660, selectedWidget.width)}
                      height={Math.min(180, selectedWidget.height)}
                      transparent={selectedWidget.theme === 'transparent'}
                      trackName={currentTrack.name}
                      s1Time={selectedWidget.enabled ? currentTrack.s1Avg : '--.---'}
                      s2Time={selectedWidget.enabled ? currentTrack.s2Avg : '--.---'}
                      s3Time={selectedWidget.enabled ? currentTrack.s3Avg : '--.---'}
                      optTime={selectedWidget.enabled ? currentTrack.optLap : '--:--.---'}
                      isActive={selectedWidget.enabled}
                    />
                  )}
                  {selectedWidget.id === 'relatives' && (
                    <RelativesStandingsWidget
                      width={Math.min(420, selectedWidget.width)}
                      height={Math.min(260, selectedWidget.height)}
                      transparent={selectedWidget.theme === 'transparent'}
                      trackName={telemetryData?.sessionInfo?.trackName || currentTrack.name}
                      competitors={(telemetryData as any)?.competitors}
                    />
                  )}
                  {selectedWidget.id === 'input-telemetry' && (
                    <InputGraphWidget
                      throttle={selectedWidget.enabled ? (telemetryData?.throttle || 0) : 0}
                      brake={selectedWidget.enabled ? (telemetryData?.brake || 0) : 0}
                      clutch={selectedWidget.enabled ? (telemetryData?.clutch || 0) : 0}
                      steeringAngle={selectedWidget.enabled ? (telemetryData?.steeringAngle || 0) : 0}
                      width={Math.min(480, selectedWidget.width)}
                      height={Math.min(180, selectedWidget.height)}
                      transparent={selectedWidget.theme === 'transparent'}
                    />
                  )}
                  {selectedWidget.id === 'track-map' && (
                    <TrackMapGPSWidget
                      width={Math.min(360, selectedWidget.width)}
                      height={Math.min(260, selectedWidget.height)}
                      transparent={selectedWidget.theme === 'transparent'}
                      circuitName={currentTrack.circuit}
                      trackLength={currentTrack.lengthKm}
                      svgPath={currentTrack.svgPath}
                      sector1Path={currentTrack.sectors.s1}
                      sector2Path={currentTrack.sectors.s2}
                      isActive={selectedWidget.enabled}
                      trackProgress={selectedWidget.enabled ? (telemetryData?.trackProgress || 0) : 0}
                    />
                  )}
                  {selectedWidget.id === 'tachometer-cluster' && (
                    <TachometerWidget
                      rpm={selectedWidget.enabled ? (telemetryData?.rpm || 0) : 0}
                      maxRpm={8500}
                      gear={selectedWidget.enabled ? (telemetryData?.gear || 0) : 0}
                      speedKmh={selectedWidget.enabled ? (telemetryData?.speedKmh || 0) : 0}
                      absActive={selectedWidget.enabled ? (!!telemetryData?.absActive) : false}
                      tcActive={selectedWidget.enabled ? (!!telemetryData?.tcActive) : false}
                      pitLimiter={selectedWidget.enabled ? (!!telemetryData?.pitLimiterActive) : false}
                      flags=""
                      width={Math.min(540, selectedWidget.width)}
                      height={Math.min(190, selectedWidget.height)}
                      transparent={selectedWidget.theme === 'transparent'}
                    />
                  )}
                  {selectedWidget.id === 'fuel-calculator' && (
                    <FuelCalculatorWidget
                      fuelRemaining={selectedWidget.enabled ? (telemetryData?.fuelRemaining || 62.0) : 0}
                      fuelPerLap={selectedWidget.enabled ? (telemetryData?.fuelPerLap || 2.9) : 0}
                      estimatedLapsRemaining={selectedWidget.enabled ? ((telemetryData?.fuelRemaining || 62.0) / (telemetryData?.fuelPerLap || 2.9)) : 0}
                      width={Math.min(360, selectedWidget.width)}
                      height={Math.min(170, selectedWidget.height)}
                      transparent={selectedWidget.theme === 'transparent'}
                    />
                  )}
                  {selectedWidget.id === 'tire-monitor' && (
                    <TireMonitorWidget
                      tireTemps={selectedWidget.enabled ? (telemetryData?.tireTemps || { fl: [70, 70, 70], fr: [70, 70, 70], rl: [70, 70, 70], rr: [70, 70, 70] }) : { fl: [0, 0, 0], fr: [0, 0, 0], rl: [0, 0, 0], rr: [0, 0, 0] }}
                      tirePressures={selectedWidget.enabled ? (telemetryData?.tirePressures || { fl: 25.5, fr: 25.5, rl: 26.0, rr: 26.0 }) : { fl: 0, fr: 0, rl: 0, rr: 0 }}
                      brakeTemps={selectedWidget.enabled ? (telemetryData?.brakeTemps || { fl: 27, fr: 27, rl: 28, rr: 28 }) : { fl: 0, fr: 0, rl: 0, rr: 0 }}
                      width={Math.min(320, selectedWidget.width)}
                      height={Math.min(280, selectedWidget.height)}
                      transparent={selectedWidget.theme === 'transparent'}
                    />
                  )}
                  {selectedWidget.id === 'trend-chart' && (
                    <TrendChartWidget
                      width={Math.min(480, selectedWidget.width)}
                      height={Math.min(260, selectedWidget.height)}
                      transparent={selectedWidget.theme === 'transparent'}
                    />
                  )}
                  {(selectedWidget.id.startsWith('custom') || selectedWidget.customOverlayData) && (
                    <CustomOverlayView
                      data={selectedWidget.customOverlayData || {
                        id: selectedWidget.id,
                        name: selectedWidget.name,
                        canvasWidth: selectedWidget.width || 420,
                        canvasHeight: selectedWidget.height || 220,
                        backgroundColor: '#111318',
                        elements: [],
                      }}
                      telemetry={telemetryData}
                      width={Math.min(680, selectedWidget.width)}
                      height={Math.min(260, selectedWidget.height)}
                    />
                  )}
                </div>
              </div>

              {/* Bottom Customizer Bar for Selected Widget */}
              <div className="bg-[#0b0c10]/80 p-3 rounded-xl border border-[#1e202c] flex items-center justify-between text-xs">
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-400 font-mono">Tamanho (W x H):</span>
                    <input
                      type="number"
                      value={selectedWidget.width}
                      onChange={(e) => updateWidgetProps(selectedWidget.id, { width: parseInt(e.target.value) || 100 })}
                      className="w-16 bg-[#161720] border border-[#2a2c3d] rounded px-1.5 py-1 font-mono text-white text-center"
                    />
                    <span className="text-gray-500">×</span>
                    <input
                      type="number"
                      value={selectedWidget.height}
                      onChange={(e) => updateWidgetProps(selectedWidget.id, { height: parseInt(e.target.value) || 100 })}
                      className="w-16 bg-[#161720] border border-[#2a2c3d] rounded px-1.5 py-1 font-mono text-white text-center"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-gray-400 font-mono">Escala:</span>
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.05"
                      value={selectedWidget.scale}
                      onChange={(e) => updateWidgetProps(selectedWidget.id, { scale: parseFloat(e.target.value) })}
                      className="w-24 accent-[#e11d48] cursor-pointer"
                    />
                    <span className="font-mono text-gray-300">{selectedWidget.scale}x</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-gray-400 font-mono">Opacidade:</span>
                    <input
                      type="range"
                      min="20"
                      max="100"
                      step="5"
                      value={selectedWidget.opacity}
                      onChange={(e) => updateWidgetProps(selectedWidget.id, { opacity: parseInt(e.target.value) })}
                      className="w-24 accent-[#e11d48] cursor-pointer"
                    />
                    <span className="font-mono text-gray-300">{selectedWidget.opacity}%</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => updateWidgetProps(selectedWidget.id, { theme: selectedWidget.theme === 'dark' ? 'transparent' : 'dark' })}
                    className="px-3 py-1 bg-[#161720] hover:bg-[#202230] text-gray-200 border border-[#2a2c3d] rounded text-xs font-semibold cursor-pointer"
                  >
                    Tema: {selectedWidget.theme.toUpperCase()}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ─── 4-CARD RACELAB GRID OF ALL INSTALLED OVERLAYS ─── */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider font-mono">
                BIBLIOTECA DE WIDGETS CONFIGURADOS ({filteredWidgets.length})
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-5">
              {filteredWidgets.map((w) => (
                <div
                  key={w.id}
                  onClick={() => selectWidget(w.id)}
                  className={`bg-[#12131a] rounded-xl border p-4 transition-all cursor-pointer shadow-lg hover:border-[#e11d48]/60 ${
                    selectedWidgetId === w.id
                      ? 'border-[#e11d48] ring-1 ring-[#e11d48]/50 bg-[#161822]'
                      : 'border-[#1e202c]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2.5">
                      <span className="text-xl">{w.icon}</span>
                      <div>
                        <h4 className="font-bold text-sm text-white">{w.name}</h4>
                        <span className="text-[10px] text-gray-500 font-mono uppercase">{w.category}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {(w.id.startsWith('custom') || w.customOverlayData) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingCustomWidgetId(w.id)
                          }}
                          className="px-2 py-1 rounded text-[10px] font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all cursor-pointer shadow-sm"
                          title="Abrir editor visual"
                        >
                          ✏️ Editar
                        </button>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleOpenStandaloneOverlay(w)
                        }}
                        className="px-2.5 py-1 rounded text-[11px] font-bold bg-[#e11d48] hover:bg-[#ff003b] text-white transition-all cursor-pointer shadow-sm shadow-rose-950/40"
                        title="Abrir janela de overlay independente do RaceLab"
                      >
                        🚀 Open Overlay
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleOnlyThisWidget(w.id)
                        }}
                        className="px-2 py-1 rounded text-[10px] font-bold bg-[#1a1b24] hover:bg-[#252838] border border-gray-700/60 text-gray-300 hover:text-white transition-all cursor-pointer"
                        title="Ativar apenas este no HUD"
                      >
                        🎯 Só este
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleWidgetEnabled(w.id)
                        }}
                        className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                          w.enabled
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/60'
                            : 'bg-[#222433] text-gray-400 hover:bg-gray-700'
                        }`}
                      >
                        {w.enabled ? 'ATIVO' : 'DESATIVADO'}
                      </button>
                    </div>
                  </div>

                  {/* Widget Card Mini Preview */}
                  <div className="h-32 bg-[#090a0f] rounded-lg border border-[#1b1c26] p-2 flex flex-col justify-between relative overflow-hidden">
                    <div className="flex justify-between text-[10px] font-mono text-gray-500">
                      <span>POS: ({w.x}, {w.y})</span>
                      <span>{w.width}×{w.height}</span>
                    </div>

                    <div className="flex-1 flex items-center justify-center scale-75 origin-center overflow-hidden">
                      {w.id === 'delta-trace' && (
                        <DeltaTraceWidget
                          delta={w.enabled ? (telemetryData?.delta || 0) : 0}
                          speedKmh={w.enabled ? (telemetryData?.speedKmh || (telemetryData as any)?.speed || 0) : 0}
                          gear={w.enabled ? (telemetryData?.gear || 0) : 0}
                          rpm={w.enabled ? (telemetryData?.rpm || 0) : 0}
                          width={440}
                          height={120}
                          trackName={currentTrack.name}
                          s1Time={w.enabled ? currentTrack.s1Avg : '--.---'}
                          s2Time={w.enabled ? currentTrack.s2Avg : '--.---'}
                          s3Time={w.enabled ? currentTrack.s3Avg : '--.---'}
                          optTime={w.enabled ? currentTrack.optLap : '--:--.---'}
                          isActive={w.enabled}
                        />
                      )}
                      {w.id === 'relatives' && (
                        <RelativesStandingsWidget
                          width={340}
                          height={130}
                          trackName={telemetryData?.sessionInfo?.trackName || currentTrack.name}
                          competitors={(telemetryData as any)?.competitors}
                        />
                      )}
                      {w.id === 'input-telemetry' && (
                        <InputGraphWidget
                          throttle={w.enabled ? (telemetryData?.throttle || 0) : 0}
                          brake={w.enabled ? (telemetryData?.brake || 0) : 0}
                          clutch={0}
                          steeringAngle={w.enabled ? (telemetryData?.steeringAngle || 0) : 0}
                          width={340}
                          height={110}
                        />
                      )}
                      {w.id === 'track-map' && (
                        <TrackMapGPSWidget
                          width={280}
                          height={120}
                          circuitName={currentTrack.circuit}
                          trackLength={currentTrack.lengthKm}
                          svgPath={currentTrack.svgPath}
                          sector1Path={currentTrack.sectors.s1}
                          sector2Path={currentTrack.sectors.s2}
                          isActive={w.enabled}
                          trackProgress={w.enabled ? (telemetryData?.trackProgress || 0) : 0}
                        />
                      )}
                      {w.id === 'tachometer-cluster' && (
                        <TachometerWidget
                          rpm={w.enabled ? (telemetryData?.rpm || 0) : 0}
                          maxRpm={8500}
                          gear={w.enabled ? (telemetryData?.gear || 0) : 0}
                          speedKmh={w.enabled ? (telemetryData?.speedKmh || 0) : 0}
                          absActive={w.enabled ? (!!telemetryData?.absActive) : false}
                          tcActive={w.enabled ? (!!telemetryData?.tcActive) : false}
                          pitLimiter={w.enabled ? (!!telemetryData?.pitLimiterActive) : false}
                          flags=""
                          width={380}
                          height={120}
                        />
                      )}
                      {w.id === 'fuel-calculator' && (
                        <FuelCalculatorWidget
                          fuelRemaining={w.enabled ? (telemetryData?.fuelRemaining || 62.0) : 0}
                          fuelPerLap={w.enabled ? (telemetryData?.fuelPerLap || 2.9) : 0}
                          estimatedLapsRemaining={w.enabled ? ((telemetryData?.fuelRemaining || 62.0) / (telemetryData?.fuelPerLap || 2.9)) : 0}
                          width={280}
                          height={110}
                        />
                      )}
                      {w.id === 'tire-monitor' && (
                        <TireMonitorWidget
                          tireTemps={w.enabled ? (telemetryData?.tireTemps || { fl: [70, 70, 70], fr: [70, 70, 70], rl: [70, 70, 70], rr: [70, 70, 70] }) : { fl: [0, 0, 0], fr: [0, 0, 0], rl: [0, 0, 0], rr: [0, 0, 0] }}
                          tirePressures={w.enabled ? (telemetryData?.tirePressures || { fl: 25.5, fr: 25.5, rl: 26.0, rr: 26.0 }) : { fl: 0, fr: 0, rl: 0, rr: 0 }}
                          brakeTemps={w.enabled ? (telemetryData?.brakeTemps || { fl: 27, fr: 27, rl: 28, rr: 28 }) : { fl: 0, fr: 0, rl: 0, rr: 0 }}
                          width={260}
                          height={140}
                        />
                      )}
                      {w.id === 'trend-chart' && (
                        <TrendChartWidget width={360} height={120} />
                      )}
                      {(w.id.startsWith('custom') || w.customOverlayData) && (
                        <CustomOverlayView
                          data={w.customOverlayData || {
                            id: w.id,
                            name: w.name,
                            canvasWidth: w.width || 420,
                            canvasHeight: w.height || 220,
                            backgroundColor: '#111318',
                            elements: [],
                          }}
                          telemetry={telemetryData}
                          width={320}
                          height={120}
                        />
                      )}
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-gray-600 font-mono border-t border-gray-800/60 pt-1">
                      <span>REFRESH: {w.refreshRateHz}Hz</span>
                      <span className="text-[#e11d48] font-bold">CUSTOMIZÁVEL</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* ─── MODAL SALVAR LAYOUT CUSTOMIZADO ─── */}
      {showSaveLayoutModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#12131a] border border-[#222433] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-[#1e202c] pb-3">
              <h3 className="text-base font-black text-white">Salvar Layout Atual de Overlays</h3>
              <button onClick={() => setShowSaveLayoutModal(false)} className="text-gray-400 hover:text-white text-lg cursor-pointer">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-400 block mb-1">Nome do Layout</label>
                <input
                  type="text"
                  placeholder="Ex: Monza GT3 Race HUD"
                  value={layoutSaveName}
                  onChange={(e) => setLayoutSaveName(e.target.value)}
                  className="w-full bg-[#0a0a0f] border border-[#262838] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="text-[11px] text-gray-500 font-mono">
                Os {widgets.filter(w => w.enabled).length} widgets atualmente marcados como ATIVOS serão gravados neste layout.
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-3">
              <button
                onClick={() => setShowSaveLayoutModal(false)}
                className="flex-1 py-2 bg-[#1a1b24] hover:bg-[#222430] text-gray-300 rounded-lg text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (layoutSaveName.trim()) {
                    saveCurrentLayoutAsProfile(layoutSaveName.trim())
                    setLayoutSaveName('')
                    setShowSaveLayoutModal(false)
                  }
                }}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-emerald-950/60 cursor-pointer"
              >
                Salvar Layout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL PARA CRIAR NOVO OVERLAY ─── */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#12131a] border border-[#222433] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-[#1e202c] pb-3">
              <h3 className="text-base font-black text-white">Criar Novo Overlay Personalizado</h3>
              <button onClick={() => setShowNewModal(false)} className="text-gray-400 hover:text-white text-lg cursor-pointer">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-400 block mb-1">Nome do Widget</label>
                <input
                  type="text"
                  placeholder="Ex: Minha Barra de LED Custom"
                  value={newWidgetName}
                  onChange={(e) => setNewWidgetName(e.target.value)}
                  className="w-full bg-[#0a0a0f] border border-[#262838] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-[#e11d48]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 block mb-1">Categoria</label>
                <select
                  value={newWidgetCategory}
                  onChange={(e) => setNewWidgetCategory(e.target.value as any)}
                  className="w-full bg-[#0a0a0f] border border-[#262838] rounded-lg p-2 text-xs text-white focus:outline-none"
                >
                  <option value="Timing">Timing</option>
                  <option value="Standings">Standings</option>
                  <option value="Car & Inputs">Car & Inputs</option>
                  <option value="Maps">Maps</option>
                  <option value="Fuel & Energy">Fuel & Energy</option>
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-3">
              <button
                onClick={() => setShowNewModal(false)}
                className="flex-1 py-2 bg-[#1a1b24] hover:bg-[#222430] text-gray-300 rounded-lg text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateWidget}
                className="flex-1 py-2 bg-[#e11d48] hover:bg-rose-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-rose-950/60 cursor-pointer"
              >
                Salvar & Abrir Editor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL DO EDITOR WYSIWYG DE OVERLAY PERSONALIZADO ─── */}
      {editingCustomWidgetId && (() => {
        const targetWidget = widgets.find((w) => w.id === editingCustomWidgetId)
        if (!targetWidget) return null
        const initialData: CustomOverlayData = targetWidget.customOverlayData || {
          canvasWidth: 420,
          canvasHeight: 240,
          backgroundColor: '#0a0d14',
          elements: [
            {
              id: 'el-bg',
              name: 'Fundo do Painel',
              type: 'rectangle',
              x: 0, y: 0, width: 420, height: 240,
              zIndex: 1,
              backgroundColor: '#0a0d14',
              borderColor: '#1e293b',
              borderWidth: 2,
              borderRadius: 12,
              opacity: 1,
            },
            {
              id: 'el-speed-lbl',
              name: 'Label Velocidade',
              type: 'text',
              x: 20, y: 30, width: 140, height: 24,
              zIndex: 2,
              text: 'VELOCIDADE',
              fontSize: 11,
              fontWeight: 'bold',
              textColor: '#94a3b8',
              textAlign: 'left',
            },
            {
              id: 'el-speed-val',
              name: 'Valor Velocidade',
              type: 'text',
              x: 20, y: 54, width: 140, height: 50,
              zIndex: 3,
              text: '0',
              fontSize: 42,
              fontWeight: '900',
              fontFamily: 'mono',
              textColor: '#38bdf8',
              textAlign: 'left',
              binding: { propertyKey: 'speedKmh', suffix: ' KM/H', decimals: 0 },
            },
            {
              id: 'el-gear-val',
              name: 'Indicador de Marcha',
              type: 'text',
              x: 180, y: 35, width: 80, height: 70,
              zIndex: 4,
              text: 'N',
              fontSize: 52,
              fontWeight: '900',
              fontFamily: 'mono',
              textColor: '#f59e0b',
              textAlign: 'center',
              backgroundColor: '#111827',
              borderColor: '#374151',
              borderWidth: 2,
              borderRadius: 8,
              binding: { propertyKey: 'gear' },
            },
            {
              id: 'el-rpm-bar',
              name: 'Barra de RPM',
              type: 'gauge-linear',
              x: 20, y: 125, width: 380, height: 18,
              zIndex: 5,
              minVal: 0,
              maxVal: 8500,
              fillColor: '#ef4444',
              inactiveColor: '#1e293b',
              borderRadius: 4,
              binding: { propertyKey: 'rpm' },
            },
          ],
        }

        return (
          <CustomOverlayEditorModal
            initialData={initialData}
            widgetName={targetWidget.name}
            telemetryData={telemetryData}
            onClose={() => setEditingCustomWidgetId(null)}
            onSave={(savedData) => {
              updateWidgetProps(editingCustomWidgetId, {
                customOverlayData: savedData,
                width: savedData.canvasWidth,
                height: savedData.canvasHeight,
              })
              setEditingCustomWidgetId(null)
            }}
          />
        )
      })()}
    </div>
  )
}
export default RacelabStudioView
