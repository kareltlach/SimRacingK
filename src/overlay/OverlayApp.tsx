import React, { useEffect, useState } from 'react'
import { OverlayRenderer } from './OverlayRenderer'

export interface TelemetryData {
  rpm: number
  maxRpm: number
  gear: number
  speedKmh: number
  absActive: boolean
  tcActive: boolean
  pitLimiter: boolean
  flags: string

  throttle: number   // 0-100
  brake: number      // 0-100
  clutch: number     // 0-100
  steeringAngle: number // -1..1

  tireTemps: { fl: [number, number, number]; fr: [number, number, number]; rl: [number, number, number]; rr: [number, number, number] }
  tirePressures: { fl: number; fr: number; rl: number; rr: number }
  brakeTemps: { fl: number; fr: number; rl: number; rr: number }

  nearCars: Array<{ x: number; y: number; id: number }>

  currentLapTime: number
  bestLapTime: number
  lastLapTime: number
  delta: number
  fuelRemaining: number
  fuelPerLap: number
  estimatedLapsRemaining: number

  stageProgress: number
  stageTime: number
  splitDelta: number
  gForceX: number
  gForceY: number
  handbrakeActive: boolean

  ffbSignal: number // 0-100

  trackName?: string
  carName?: string
  trackProgress?: number
  worldX?: number
  worldZ?: number
  competitors?: Array<{
    carIndex: number
    driverName: string
    carModel: string
    raceNumber: number
    position: number
    cupPosition: number
    splinePosition: number
    laps: number
    bestLapMs: number
    lastLapMs: number
    delta: number
    location: string
    classColor: string
    isPlayer: boolean
  }>
}

export interface HudWidget {
  id: string
  type: string
  x: number
  y: number
  width: number
  height: number
  scale: number
  opacity: number
  visible: boolean
  theme?: 'dark' | 'transparent' | 'carbon' | 'custom'
  backgroundColor?: string
  customOverlayData?: any
}

export interface HudLayout {
  id: string
  name: string
  widgets: HudWidget[]
}

const DEFAULT_LAYOUT: HudLayout = {
  id: 'default',
  name: 'Default HUD',
  widgets: [
    { id: 'delta-trace', type: 'deltaTrace', x: 480, y: 50, width: 580, height: 140, scale: 1, opacity: 0.95, visible: true, theme: 'transparent' },
    { id: 'tachometer-cluster', type: 'tachometer', x: 60, y: 720, width: 440, height: 180, scale: 1, opacity: 0.95, visible: true, theme: 'transparent' },
    { id: 'input-telemetry', type: 'inputGraph', x: 740, y: 780, width: 340, height: 180, scale: 1, opacity: 0.95, visible: true, theme: 'transparent' },
    { id: 'tire-monitor', type: 'tireMonitor', x: 60, y: 340, width: 280, height: 260, scale: 1, opacity: 0.90, visible: true, theme: 'transparent' },
    { id: 'relatives', type: 'relatives', x: 1440, y: 340, width: 340, height: 280, scale: 1, opacity: 0.90, visible: true, theme: 'transparent' },
    { id: 'track-map', type: 'trackMap', x: 100, y: 680, width: 320, height: 220, scale: 1, opacity: 0.90, visible: true, theme: 'transparent' },
    { id: 'fuel-calculator', type: 'fuelCalculator', x: 500, y: 800, width: 280, height: 120, scale: 1, opacity: 0.90, visible: true, theme: 'transparent' },
  ],
}

function normalizeFrame(raw: any): TelemetryData {
  const speed = raw.speed !== undefined ? raw.speed : (raw.speedKmh || 0)
  const rpm = raw.rpm || 0
  const maxRpm = raw.maxRpm || 8500
  const gear = raw.gear !== undefined ? raw.gear : 0
  const throttle = (raw.throttle !== undefined ? raw.throttle : (raw.gas || 0)) * (raw.throttle <= 1 ? 100 : 1)
  const brake = (raw.brake !== undefined ? raw.brake : 0) * (raw.brake <= 1 ? 100 : 1)
  const clutch = (raw.clutch !== undefined ? raw.clutch : 0) * (raw.clutch <= 1 ? 100 : 1)
  const steer = raw.steeringAngle || 0

  const zones = raw.tireZones || raw.tireTemps || raw.temps
  const tFL: [number, number, number] = Array.isArray(zones?.fl)
    ? zones.fl
    : typeof zones?.fl === 'number'
      ? [zones.fl, zones.fl, zones.fl]
      : [0, 0, 0]

  const tFR: [number, number, number] = Array.isArray(zones?.fr)
    ? zones.fr
    : typeof zones?.fr === 'number'
      ? [zones.fr, zones.fr, zones.fr]
      : [0, 0, 0]

  const tRL: [number, number, number] = Array.isArray(zones?.rl)
    ? zones.rl
    : typeof zones?.rl === 'number'
      ? [zones.rl, zones.rl, zones.rl]
      : [0, 0, 0]

  const tRR: [number, number, number] = Array.isArray(zones?.rr)
    ? zones.rr
    : typeof zones?.rr === 'number'
      ? [zones.rr, zones.rr, zones.rr]
      : [0, 0, 0]

  const pFL = raw.tirePressures?.fl ?? raw.tyrePressure?.fl ?? raw.pressures?.[0] ?? 0
  const pFR = raw.tirePressures?.fr ?? raw.tyrePressure?.fr ?? raw.pressures?.[1] ?? 0
  const pRL = raw.tirePressures?.rl ?? raw.tyrePressure?.rl ?? raw.pressures?.[2] ?? 0
  const pRR = raw.tirePressures?.rr ?? raw.tyrePressure?.rr ?? raw.pressures?.[3] ?? 0

  const bFL = raw.brakeTemps?.fl ?? raw.brakeTemp?.fl ?? raw.brakes?.[0] ?? 0
  const bFR = raw.brakeTemps?.fr ?? raw.brakeTemp?.fr ?? raw.brakes?.[1] ?? 0
  const bRL = raw.brakeTemps?.rl ?? raw.brakeTemp?.rl ?? raw.brakes?.[2] ?? 0
  const bRR = raw.brakeTemps?.rr ?? raw.brakeTemp?.rr ?? raw.brakes?.[3] ?? 0

  return {
    rpm,
    maxRpm,
    gear,
    speedKmh: speed,
    absActive: !!raw.electronics?.abs || !!raw.absActive || !!raw.abs,
    tcActive: !!raw.electronics?.tc || !!raw.tcActive || !!raw.tc,
    pitLimiter: !!raw.pitLimiter || !!raw.pitLimiterActive,
    flags: raw.flags || '',
    throttle,
    brake,
    clutch,
    steeringAngle: steer,
    tireTemps: { fl: tFL, fr: tFR, rl: tRL, rr: tRR },
    tirePressures: { fl: pFL, fr: pFR, rl: pRL, rr: pRR },
    brakeTemps: { fl: bFL, fr: bFR, rl: bRL, rr: bRR },
    nearCars: raw.carsNearby || raw.nearCars || [],
    currentLapTime: raw.lapTiming?.currentLapTime || raw.currentLapTime || 0,
    bestLapTime: raw.lapTiming?.bestLapTime || raw.bestLapTime || 0,
    lastLapTime: raw.lapTiming?.lastLapTime || raw.lastLapTime || 0,
    delta: raw.delta || 0,
    fuelRemaining: raw.fuelLevel || raw.fuelRemaining || 0,
    fuelPerLap: raw.fuelConsumptionPerLap || raw.fuelPerLap || 0,
    estimatedLapsRemaining: Math.round((raw.fuelLevel || raw.fuelRemaining || 0) / Math.max(0.1, raw.fuelConsumptionPerLap || raw.fuelPerLap || 2.9)),
    stageProgress: raw.trackProgress ? raw.trackProgress * 100 : 0,
    stageTime: 0,
    splitDelta: 0,
    gForceX: raw.gForceX || 0,
    gForceY: raw.gForceY || 0,
    handbrakeActive: false,
    ffbSignal: Math.round((raw.ffbSignal || 0.5) * 100),
    trackName: raw.sessionInfo?.trackName || raw.trackName || raw.track || '',
    carName: raw.sessionInfo?.carName || raw.carName || raw.car || '',
    trackProgress: raw.trackProgress !== undefined ? raw.trackProgress : (raw.progress || 0),
    worldX: raw.worldX || 0,
    worldZ: raw.worldZ || 0,
    competitors: raw.competitors || [],
  }
}

export const OverlayApp: React.FC = () => {
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null)
  const [layout, setLayout] = useState<HudLayout>(DEFAULT_LAYOUT)
  const [isLocked, setIsLocked] = useState(false)  // Inicia desbloqueado para o usuário poder mover e customizar imediatamente
  const [isStandalone, setIsStandalone] = useState(false)
  const [standaloneWidget, setStandaloneWidget] = useState<HudWidget | null>(null)
  const [isHoveringControl, setIsHoveringControl] = useState(false)
  const [showContextMenu, setShowContextMenu] = useState(false)
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [widgetName, setWidgetName] = useState('')
  const [customBgColor, setCustomBgColor] = useState<string>('rgba(15,23,42,0.85)')
  const [selectedTrackFromParam, setSelectedTrackFromParam] = useState<string>('')

  // Detect query params for standalone window mode (?standalone=1&widgetId=...&widgetType=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const isSolo = params.get('standalone') === '1'
    const widgetId = params.get('widgetId') || ''
    const widgetType = params.get('widgetType') || ''
    const widgetNameParam = params.get('widgetName') || widgetId
    const trackIdParam = params.get('trackId') || ''
    const initW = parseInt(params.get('initW') || '400')
    const initH = parseInt(params.get('initH') || '200')
    let parsedCustomData: any = undefined
    try {
      const rawCustom = params.get('customData')
      if (rawCustom) {
        parsedCustomData = JSON.parse(decodeURIComponent(rawCustom))
      }
    } catch {}

    if (isSolo && widgetId) {
      setIsStandalone(true)
      setWidgetName(widgetNameParam)
      if (trackIdParam) {
        setSelectedTrackFromParam(trackIdParam)
      }
      const mappedType = widgetType || (
        widgetId === 'delta-trace' ? 'deltaTrace' :
          widgetId === 'tachometer-cluster' ? 'tachometer' :
            widgetId === 'input-telemetry' ? 'inputGraph' :
              widgetId === 'tire-monitor' ? 'tireMonitor' :
                widgetId === 'relatives' ? 'relatives' :
                  widgetId === 'track-map' ? 'trackMap' :
                    widgetId === 'fuel-calculator' ? 'fuelCalculator' :
                    widgetId.startsWith('custom') ? 'custom' :
                      widgetId
      )

      setStandaloneWidget({
        id: widgetId,
        type: mappedType,
        x: 0,
        y: 0,
        width: initW,
        height: initH,
        scale: 1,
        opacity: 0.95,
        visible: true,
        theme: 'transparent',
        customOverlayData: parsedCustomData,
      })
    }
  }, [])

  // Subscribe to telemetry data
  useEffect(() => {
    const api = (window as any).api || (window as any).overlayApi
    if (api?.telemetry?.onData) {
      const unsub = api.telemetry.onData((raw: any) => {
        setTelemetry(normalizeFrame(raw))
      })
      return () => unsub?.()
    }
  }, [])

  // Listen for edit mode toggle from main window
  useEffect(() => {
    const api = (window as any).api || (window as any).overlayApi
    if (api?.overlay?.onToggleEdit) {
      const unsub = api.overlay.onToggleEdit((editMode: boolean) => {
        setIsLocked(!editMode)
      })
      return () => unsub?.()
    }
  }, [])

  // ─── Sync click-through with isLocked state ───
  useEffect(() => {
    const api = (window as any).api || (window as any).overlayApi
    if (!api?.overlay) return
    if (isLocked) {
      // Quando travado: ignora eventos de mouse mas com forward: true para permitir hover
      api.overlay.setIgnoreMouseEvents?.(true, { forward: true })
    } else {
      // Quando destravado: captura todos os cliques normalmente
      api.overlay.setIgnoreMouseEvents?.(false)
    }
  }, [isLocked])

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Captura a posição do clique direito do usuário
    const clickX = Math.min(e.clientX, window.innerWidth - 180)
    const clickY = Math.min(e.clientY, window.innerHeight - 160)
    setContextMenuPos({ x: Math.max(8, clickX), y: Math.max(8, clickY) })
    setShowContextMenu(true)
    // Se estiver bloqueado, desbloqueia temporariamente para interagir com o menu
    if (isLocked) {
      setIsLocked(false)
    }
  }

  const handleClose = () => {
    const api = (window as any).api || (window as any).overlayApi
    if (api?.app?.close) {
      api.app.close()
    } else {
      window.close()
    }
  }

  const handleToggleLock = () => {
    setIsLocked(prev => !prev)
  }

  const handleToggleTheme = () => {
    setStandaloneWidget(prev => {
      if (!prev) return null
      // Ciclo: transparent -> dark -> custom -> transparent
      const nextTheme = prev.theme === 'transparent' ? 'dark' : prev.theme === 'dark' ? 'custom' : 'transparent'
      return { ...prev, theme: nextTheme }
    })
  }

  const handleWidgetDragEnd = (widgetId: string, x: number, y: number) => {
    setLayout(prev => ({
      ...prev,
      widgets: prev.widgets.map(w => w.id === widgetId ? { ...w, x, y } : w)
    }))
    const api = (window as any).api || (window as any).overlayApi
    api?.overlay?.saveWidgetPosition?.(widgetId, x, y)
  }

  const handleToggleTransparent = (widgetId: string) => {
    if (standaloneWidget?.id === widgetId) {
      handleToggleTheme()
      return
    }
    setLayout(prev => ({
      ...prev,
      widgets: prev.widgets.map(w =>
        w.id === widgetId
          ? { ...w, theme: w.theme === 'transparent' ? 'dark' : 'transparent' }
          : w
      )
    }))
  }

  const handleToggleVisible = (widgetId: string) => {
    if (isStandalone) { window.close(); return }
    setLayout(prev => ({
      ...prev,
      widgets: prev.widgets.map(w => w.id === widgetId ? { ...w, visible: false } : w)
    }))
  }

  const rawData = telemetry || normalizeFrame({ speed: 0, rpm: 0, gear: 0 })
  // Se houver uma pista passada por parâmetro (ou escolhida no studio) e a telemetria não tiver uma pista real ativa ou for monza synthetic, usa a selecionada
  const data: TelemetryData = {
    ...rawData,
    trackName: (rawData.trackName && rawData.trackName !== 'Monza (Synthetic)')
      ? rawData.trackName
      : (selectedTrackFromParam || rawData.trackName || '')
  }

  // ─── STANDALONE SINGLE OVERLAY MODE ─────────────────────────────────────────
  // Replicates RaceLab behavior: frameless transparent window, widget fills the
  // entire window, hover-only control bar appears at top-left corner.
  // The OS window itself is dragged via -webkit-app-region when unlocked.
  if (isStandalone && standaloneWidget) {
    const isTrans = standaloneWidget.theme === 'transparent'
    const isDark = standaloneWidget.theme === 'dark' || !standaloneWidget.theme
    const isCustom = standaloneWidget.theme === 'custom'

    const currentBg = isTrans
      ? 'transparent'
      : isCustom
        ? customBgColor
        : 'linear-gradient(180deg, rgba(15,23,42,0.92) 0%, rgba(15,23,42,0.85) 100%)'

    return (
      <div
        onContextMenu={handleContextMenu}
        className="w-screen h-screen overflow-hidden relative select-none"
        style={{
          background: currentBg,
          backdropFilter: isTrans ? 'none' : 'blur(8px)',
          borderRadius: isTrans ? '0px' : '12px',
          border: isTrans ? 'none' : '1px solid rgba(255,255,255,0.1)',
          pointerEvents: isLocked ? 'none' : 'auto',
          WebkitAppRegion: isLocked ? 'no-drag' : 'drag',
        } as any}
      >
        {/* ── Drag Header Handle Bar (Visível e com grab cursor quando desbloqueado para movimentar) ── */}
        {!isLocked && (
          <div
            className="absolute top-0 left-0 right-0 h-7 z-40 flex items-center justify-center bg-black/40 border-b border-amber-500/30 text-amber-300 font-mono text-[10px] tracking-wider cursor-move"
            style={{ WebkitAppRegion: 'drag' } as any}
          >
            <span className="flex items-center gap-1.5 opacity-90 animate-pulse font-bold">
              ✥ ARRASTE PARA REPOSICIONAR • [EM EDIÇÃO]
            </span>
          </div>
        )}

        {/* ── Widget fills window ── */}
        <div
          className={`absolute inset-0 flex items-center justify-center overflow-hidden ${!isLocked ? 'pt-7' : ''}`}
          style={{ pointerEvents: 'none' }}
        >
          <OverlayRenderer
            widget={{
              ...standaloneWidget,
              x: 0,
              y: 0,
              width: window.innerWidth,
              height: window.innerHeight,
              scale: 1,
              theme: 'transparent', // O background agora é controlado pelo container pai
            }}
            telemetry={data}
            isLocked={true}
            onDragEnd={() => { }}
            onToggleTransparent={handleToggleTransparent}
            onToggleVisible={handleToggleVisible}
          />
        </div>

        {/* ── Control bar (Top-Left corner) ── */}
        <div
          className={`absolute top-0 left-0 z-50 flex items-center space-x-1.5 px-2.5 py-1 transition-all duration-200 ${isHoveringControl || !isLocked
            ? 'opacity-100'
            : 'opacity-0 pointer-events-none'
            }`}
          style={{
            pointerEvents: 'auto',
            WebkitAppRegion: 'no-drag',
            background: 'rgba(10,10,18,0.92)',
            backdropFilter: 'blur(10px)',
            borderRadius: '0 0 8px 0',
            borderRight: '1px solid rgba(255,255,255,0.15)',
            borderBottom: '1px solid rgba(255,255,255,0.15)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          } as any}
          onMouseEnter={() => setIsHoveringControl(true)}
          onMouseLeave={() => setIsHoveringControl(false)}
        >
          {/* Status dot + widget name */}
          <span className="w-2 h-2 rounded-full bg-rose-500 shadow shadow-rose-500/80 flex-shrink-0" />
          <span className="text-[10px] font-mono font-bold text-gray-200 uppercase tracking-wider truncate max-w-[110px]">
            {widgetName || standaloneWidget.id}
          </span>
          <span className="text-gray-600 mx-0.5">|</span>

          {/* Background selector: Transparent / Dark / Custom Color */}
          <button
            onClick={handleToggleTheme}
            className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[#1e202c] hover:bg-[#282c3c] text-gray-200 border border-gray-700/60 transition-all cursor-pointer"
            title="Alternar entre Transparente, Escuro ou Cor Personalizada"
          >
            {isTrans ? '◻ Transp.' : isDark ? '◼ Escuro' : '🎨 Cor'}
          </button>

          {/* Color Picker input quando em modo 'custom' ou para escolher cor */}
          <label className="relative flex items-center cursor-pointer" title="Escolher cor de fundo personalizada">
            <span
              className="w-4 h-4 rounded border border-gray-500 shadow-sm inline-block"
              style={{ background: customBgColor }}
            />
            <input
              type="color"
              value={customBgColor.startsWith('#') ? customBgColor : '#0f172a'}
              onChange={(e) => {
                setCustomBgColor(e.target.value)
                setStandaloneWidget(prev => prev ? { ...prev, theme: 'custom' } : null)
              }}
              className="absolute opacity-0 w-0 h-0 cursor-pointer"
            />
          </label>

          {/* Lock / Unlock Toggle */}
          <button
            onClick={handleToggleLock}
            className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border transition-all cursor-pointer flex items-center gap-1 ${isLocked
              ? 'bg-[#111827] text-emerald-400 border-emerald-800/80 hover:bg-emerald-950'
              : 'bg-amber-950 text-amber-300 border-amber-600 hover:bg-amber-900 shadow-sm'
              }`}
            title={isLocked ? 'Clique para liberar e mover a janela' : 'Clique para travar no local e ativar click-through no jogo'}
          >
            <span>{isLocked ? '🔒 Mover' : '🔓 Travando...'}</span>
          </button>

          {/* Close button */}
          <button
            onClick={handleClose}
            className="w-5 h-5 flex items-center justify-center rounded bg-gray-800/80 hover:bg-rose-600 text-gray-300 hover:text-white text-xs font-bold transition-all cursor-pointer border border-gray-700"
            title="Fechar overlay"
          >
            ✕
          </button>
        </div>

        {/* ── Always Interactive Hover & Right-Click Zone ──
            Permite passar o mouse ou clicar com o botão direito para reabrir o menu a qualquer momento */}
        <div
          className="absolute top-0 left-0 right-0 h-10 z-40"
          style={{ pointerEvents: 'auto', WebkitAppRegion: 'no-drag' } as any}
          onMouseEnter={() => setIsHoveringControl(true)}
          onMouseLeave={() => setIsHoveringControl(false)}
          onContextMenu={handleContextMenu}
        />

        {/* ── Context Menu (Menu do Botão Direito) ── */}
        {showContextMenu && (
          <div
            className="fixed inset-0 z-50 select-none"
            style={{ pointerEvents: 'auto', WebkitAppRegion: 'no-drag' } as any}
            onClick={() => setShowContextMenu(false)}
            onContextMenu={(e) => { e.preventDefault(); setShowContextMenu(false) }}
          >
            <div
              className="absolute bg-[#11131c]/95 border border-[#2b2d42] backdrop-blur-md rounded-xl shadow-2xl p-1.5 min-w-[170px] text-xs font-sans text-gray-200"
              style={{ left: contextMenuPos.x, top: contextMenuPos.y }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-2 py-1 text-[10px] font-mono font-bold text-gray-400 border-b border-gray-800/80 mb-1 flex items-center justify-between">
                <span className="truncate">{widgetName || standaloneWidget.id}</span>
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              </div>

              {/* Botão de Travar / Destravar */}
              <button
                onClick={() => {
                  handleToggleLock()
                  setShowContextMenu(false)
                }}
                className="w-full flex items-center space-x-2 px-2 py-1.5 rounded-lg hover:bg-[#1f2233] text-left transition-all cursor-pointer font-bold"
              >
                <span>{isLocked ? '🔓' : '🔒'}</span>
                <span>{isLocked ? 'Destravar (Mover Overlay)' : 'Travar no Lugar'}</span>
              </button>

              {/* Fundo Transparente */}
              <button
                onClick={() => {
                  setStandaloneWidget(prev => prev ? { ...prev, theme: 'transparent' } : null)
                  setShowContextMenu(false)
                }}
                className="w-full flex items-center space-x-2 px-2 py-1.5 rounded-lg hover:bg-[#1f2233] text-left transition-all cursor-pointer"
              >
                <span>◻</span>
                <span>Fundo Transparente</span>
              </button>

              {/* Fundo Escuro */}
              <button
                onClick={() => {
                  setStandaloneWidget(prev => prev ? { ...prev, theme: 'dark' } : null)
                  setShowContextMenu(false)
                }}
                className="w-full flex items-center space-x-2 px-2 py-1.5 rounded-lg hover:bg-[#1f2233] text-left transition-all cursor-pointer"
              >
                <span>◼</span>
                <span>Fundo Escuro</span>
              </button>

              {/* Escolher Cor */}
              <label className="w-full flex items-center space-x-2 px-2 py-1.5 rounded-lg hover:bg-[#1f2233] text-left transition-all cursor-pointer">
                <span className="w-3.5 h-3.5 rounded border border-gray-500 inline-block" style={{ background: customBgColor }} />
                <span>Escolher Cor de Fundo</span>
                <input
                  type="color"
                  value={customBgColor.startsWith('#') ? customBgColor : '#0f172a'}
                  onChange={(e) => {
                    setCustomBgColor(e.target.value)
                    setStandaloneWidget(prev => prev ? { ...prev, theme: 'custom' } : null)
                  }}
                  className="opacity-0 w-0 h-0"
                />
              </label>

              <div className="h-px bg-gray-800 my-1" />

              {/* Fechar */}
              <button
                onClick={handleClose}
                className="w-full flex items-center space-x-2 px-2 py-1.5 rounded-lg hover:bg-rose-950/60 text-rose-400 hover:text-rose-300 text-left transition-all cursor-pointer font-bold"
              >
                <span>✕</span>
                <span>Fechar Overlay</span>
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ─── FULL MULTI-WIDGET CANVAS MODE ───────────────────────────────────────────
  return (
    <div
      className="relative w-screen h-screen overflow-hidden select-none"
      style={{
        background: 'transparent',
        pointerEvents: isLocked ? 'none' : 'auto'
      }}
    >
      {/* Floating toolbar — always interactive */}
      <div
        className="fixed top-2 left-1/2 -translate-x-1/2 z-50 flex items-center space-x-2 bg-[#12131d]/95 backdrop-blur-md border border-[#2b2d42] px-3 py-1.5 rounded-full shadow-2xl text-xs text-gray-200 transition-all opacity-90 hover:opacity-100"
        style={{ pointerEvents: 'auto' }}
      >
        <span className="w-2 h-2 rounded-full bg-rose-500 shadow shadow-rose-500/60" />
        <span className="font-black text-[10px] text-white font-mono tracking-wider uppercase">
          APEX OVERLAYS
        </span>
        <span className="text-gray-600">|</span>

        <button
          onClick={handleToggleLock}
          className={`px-2.5 py-0.5 rounded font-bold transition-all flex items-center space-x-1 cursor-pointer ${isLocked
            ? 'bg-[#111827] text-emerald-400 border border-emerald-800/60 hover:bg-emerald-950'
            : 'bg-amber-950 text-amber-300 border border-amber-700 hover:bg-amber-900'
            }`}
        >
          <span>{isLocked ? '🔒 Bloqueado' : '🔓 Modo Edição'}</span>
        </button>

        <button
          onClick={handleClose}
          className="hover:text-rose-400 hover:bg-rose-950/60 px-2 py-0.5 rounded transition-all font-bold text-gray-400 cursor-pointer"
        >
          ✕ Fechar
        </button>
      </div>

      {layout.widgets.filter(w => w.visible).map(widget => (
        <OverlayRenderer
          key={widget.id}
          widget={widget}
          telemetry={data}
          isLocked={isLocked}
          onDragEnd={handleWidgetDragEnd}
          onToggleTransparent={handleToggleTransparent}
          onToggleVisible={handleToggleVisible}
        />
      ))}
    </div>
  )
}
export default OverlayApp
