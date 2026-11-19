import React from 'react'
import type { TelemetryData, HudWidget } from './OverlayApp'
import { TachometerWidget } from '../renderer/components/widgets/TachometerWidget'
import { InputGraphWidget } from '../renderer/components/widgets/InputGraphWidget'
import { TireMonitorWidget } from '../renderer/components/widgets/TireMonitorWidget'
import { RadarWidget } from '../renderer/components/widgets/RadarWidget'
import { TimingFuelWidget } from '../renderer/components/widgets/TimingFuelWidget'
import { RallyWidget } from '../renderer/components/widgets/RallyWidget'
import { FFBClipWidget } from '../renderer/components/widgets/FFBClipWidget'
import { RelativesStandingsWidget } from '../renderer/components/widgets/RelativesStandingsWidget'
import { TrackMapGPSWidget } from '../renderer/components/widgets/TrackMapGPSWidget'
import { TrendChartWidget } from '../renderer/components/widgets/TrendChartWidget'
import { DeltaTraceWidget } from '../renderer/components/widgets/DeltaTraceWidget'
import { FuelCalculatorWidget } from '../renderer/components/widgets/FuelCalculatorWidget'
import { CustomOverlayView } from '../renderer/components/widgets/CustomOverlayView'
import { SUPPORTED_TRACKS, normalizeTrackId } from '../shared/supportedTracks'

interface Props {
  widget: HudWidget
  telemetry: TelemetryData
  isLocked?: boolean
  onDragEnd?: (id: string, x: number, y: number) => void
  onToggleTransparent?: (id: string) => void
  onToggleVisible?: (id: string) => void
}

const WIDGET_MAP: Record<string, React.FC<{ telemetry: TelemetryData; width: number; height: number; transparent?: boolean }>> = {
  tachometer: ({ telemetry: t, width, height, transparent }) => (
    <TachometerWidget
      rpm={t.rpm} maxRpm={t.maxRpm} gear={t.gear} speedKmh={t.speedKmh}
      absActive={t.absActive} tcActive={t.tcActive} pitLimiter={t.pitLimiter} flags={t.flags}
      width={width} height={height} transparent={transparent}
    />
  ),
  inputGraph: ({ telemetry: t, width, height, transparent }) => (
    <InputGraphWidget
      throttle={t.throttle} brake={t.brake} clutch={t.clutch}
      steeringAngle={t.steeringAngle} width={width} height={height} transparent={transparent}
    />
  ),
  tireMonitor: ({ telemetry: t, width, height, transparent }) => (
    <TireMonitorWidget
      tireTemps={t.tireTemps} tirePressures={t.tirePressures}
      brakeTemps={t.brakeTemps} width={width} height={height} transparent={transparent}
    />
  ),
  radar: ({ telemetry: t, width, height, transparent }) => (
    <RadarWidget nearCars={t.nearCars} width={width} height={height} transparent={transparent} />
  ),
  relatives: ({ telemetry: t, width, height, transparent }) => {
    const rawTrack = t?.trackName || ''
    const trackId = normalizeTrackId(rawTrack)
    const trackData = SUPPORTED_TRACKS[trackId] || SUPPORTED_TRACKS.monza
    return (
      <RelativesStandingsWidget
        width={width}
        height={height}
        transparent={transparent}
        trackName={trackData.name || rawTrack || 'CIRCUIT'}
        competitors={t?.competitors}
      />
    )
  },
  trackMap: ({ telemetry: t, width, height, transparent }) => {
    const rawTrack = t?.trackName || ''
    const trackId = normalizeTrackId(rawTrack)
    const trackData = SUPPORTED_TRACKS[trackId] || SUPPORTED_TRACKS.monza
    return (
      <TrackMapGPSWidget
        width={width}
        height={height}
        transparent={transparent}
        circuitName={trackData.circuit || rawTrack.toUpperCase() || 'CIRCUIT'}
        trackLength={trackData.lengthKm || '--- KM'}
        svgPath={trackData.svgPath}
        sector1Path={trackData.sectors?.s1}
        sector2Path={trackData.sectors?.s2}
        trackProgress={t?.trackProgress ?? 0}
        worldX={t?.worldX ?? 0}
        worldZ={t?.worldZ ?? 0}
        isActive={true}
      />
    )
  },
  trendChart: ({ width, height, transparent }) => (
    <TrendChartWidget width={width} height={height} transparent={transparent} />
  ),
  deltaTrace: ({ telemetry: t, width, height, transparent }) => {
    const rawTrack = t?.trackName || ''
    const trackId = normalizeTrackId(rawTrack)
    const trackData = SUPPORTED_TRACKS[trackId] || SUPPORTED_TRACKS.monza
    return (
      <DeltaTraceWidget
        delta={t.delta}
        speedKmh={t.speedKmh}
        gear={t.gear}
        rpm={t.rpm}
        trackName={trackData.name || rawTrack || 'CIRCUIT'}
        s1Time={trackData.s1Avg || '--.---'}
        s2Time={trackData.s2Avg || '--.---'}
        s3Time={trackData.s3Avg || '--.---'}
        optTime={trackData.optLap || '--:--.---'}
        isActive={true}
        width={width}
        height={height}
        transparent={transparent}
      />
    )
  },
  fuelCalculator: ({ telemetry: t, width, height, transparent }) => (
    <FuelCalculatorWidget
      fuelRemaining={t.fuelRemaining} fuelPerLap={t.fuelPerLap}
      estimatedLapsRemaining={t.estimatedLapsRemaining}
      width={width} height={height} transparent={transparent}
    />
  ),
  timingFuel: ({ telemetry: t, width, height, transparent }) => (
    <TimingFuelWidget
      currentLapTime={t.currentLapTime} bestLapTime={t.bestLapTime}
      lastLapTime={t.lastLapTime} delta={t.delta}
      fuelRemaining={t.fuelRemaining} fuelPerLap={t.fuelPerLap}
      estimatedLapsRemaining={t.estimatedLapsRemaining}
      width={width} height={height} transparent={transparent}
    />
  ),
  rally: ({ telemetry: t, width, height, transparent }) => (
    <RallyWidget
      stageProgress={t.stageProgress} stageTime={t.stageTime}
      splitDelta={t.splitDelta} gForceX={t.gForceX} gForceY={t.gForceY}
      handbrakeActive={t.handbrakeActive} width={width} height={height} transparent={transparent}
    />
  ),
  ffbClip: ({ telemetry: t, width, height, transparent }) => (
    <FFBClipWidget ffbSignal={t.ffbSignal} width={width} height={height} transparent={transparent} />
  ),
  custom: ({ telemetry: t, width, height, transparent }) => (
    <CustomOverlayView
      data={(t as any).customOverlayData || { canvasWidth: width, canvasHeight: height, backgroundColor: 'transparent', elements: [] }}
      telemetry={t}
      width={width}
      height={height}
      transparent={transparent}
    />
  ),
}

export const OverlayRenderer: React.FC<Props> = ({
  widget,
  telemetry,
  isLocked = true,
  onDragEnd,
  onToggleTransparent,
  onToggleVisible,
}) => {
  const isCustom = widget.type === 'custom' || widget.id.startsWith('custom')
  const WidgetComponent = isCustom ? CustomOverlayView : WIDGET_MAP[widget.type]
  if (!WidgetComponent) return null

  const isTransparent = widget.theme === 'transparent' || widget.opacity <= 0.6

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isLocked) return
    e.preventDefault()
    const startX = e.clientX
    const startY = e.clientY
    const startWidgetX = widget.x
    const startWidgetY = widget.y

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX
      const deltaY = moveEvent.clientY - startY
      const newX = Math.round(startWidgetX + deltaX)
      const newY = Math.round(startWidgetY + deltaY)
      if (onDragEnd) {
        onDragEnd(widget.id, newX, newY)
      }
    }

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: widget.x,
        top: widget.y,
        width: widget.width,
        height: widget.height,
        transform: `scale(${widget.scale})`,
        transformOrigin: 'top left',
        opacity: widget.opacity,
        pointerEvents: isLocked ? 'none' : 'auto',
        willChange: 'transform, opacity, left, top',
      }}
      className={`group transition-shadow ${!isLocked ? 'cursor-move ring-2 ring-emerald-500/80 rounded-xl' : ''}`}
    >
      {/* Edit mode floating handle bar */}
      {!isLocked && (
        <div
          onMouseDown={handleMouseDown}
          className="absolute -top-7 left-0 right-0 flex items-center justify-between px-2 py-0.5 bg-[#0f172a]/95 border border-emerald-500/50 rounded-t-lg text-[10px] text-gray-200 select-none z-50 cursor-grab active:cursor-grabbing backdrop-blur-md"
        >
          <div className="flex items-center space-x-1">
            <span className="text-emerald-400 font-bold">✥ Mover</span>
            <span className="text-gray-400 font-mono">({widget.x}, {widget.y})</span>
          </div>
          <div className="flex items-center space-x-1.5" onMouseDown={(e) => e.stopPropagation()}>
            {/* Toggle Transparent Background */}
            <button
              onClick={() => onToggleTransparent?.(widget.id)}
              className={`px-1.5 py-0.2 rounded font-bold transition-all text-[9px] ${isTransparent ? 'bg-indigo-900 text-indigo-300 border border-indigo-500' : 'bg-gray-700 text-gray-300'
                }`}
              title="Alternar fundo transparente"
            >
              {isTransparent ? 'Fundo Transp.' : 'Fundo Opaco'}
            </button>
            {/* Close / Hide Widget */}
            <button
              onClick={() => onToggleVisible?.(widget.id)}
              className="text-rose-400 hover:text-rose-200 font-bold px-1"
              title="Esconder widget"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {isCustom ? (
        <CustomOverlayView
          data={widget.customOverlayData || { canvasWidth: widget.width, canvasHeight: widget.height, backgroundColor: 'transparent', elements: [] }}
          telemetry={telemetry}
          width={widget.width}
          height={widget.height}
          transparent={isTransparent}
        />
      ) : (
        <WidgetComponent
          telemetry={telemetry}
          width={widget.width}
          height={widget.height}
          transparent={isTransparent}
        />
      )}
    </div>
  )
}
