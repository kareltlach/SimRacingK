import React from 'react'
import { CustomOverlayData, CustomOverlayElement, resolveTelemetryValue } from '../../../shared/customOverlayTypes'

interface Props {
  data: CustomOverlayData
  telemetry: any
  width: number
  height: number
  transparent?: boolean
}

export const CustomOverlayView: React.FC<Props> = ({
  data,
  telemetry,
  width,
  height,
  transparent = false
}) => {
  const elements = data?.elements || []
  const bg = transparent ? 'transparent' : (data?.backgroundColor || 'rgba(15,23,42,0.92)')

  // Scale elements if overlay window dimensions differ from authoring canvas dimensions
  const scaleX = data?.canvasWidth ? width / data.canvasWidth : 1
  const scaleY = data?.canvasHeight ? height / data.canvasHeight : 1

  return (
    <div
      className="relative overflow-hidden select-none"
      style={{
        width,
        height,
        background: bg,
        backdropFilter: transparent ? 'none' : 'blur(8px)',
      }}
    >
      {elements.map((el) => {
        const x = el.x * scaleX
        const y = el.y * scaleY
        const w = el.width * scaleX
        const h = el.height * scaleY

        return (
          <div
            key={el.id}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: w,
              height: h,
              zIndex: el.zIndex || 1,
              opacity: el.opacity !== undefined ? el.opacity : 1,
              backgroundColor: el.backgroundColor || 'transparent',
              borderColor: el.borderColor || 'transparent',
              borderWidth: el.borderWidth || 0,
              borderRadius: el.borderRadius || 0,
              borderStyle: el.borderWidth ? 'solid' : 'none',
              boxSizing: 'border-box',
              display: 'flex',
              alignItems: 'center',
              justifyContent: el.textAlign === 'left' ? 'flex-start' : el.textAlign === 'right' ? 'flex-end' : 'center',
              padding: '2px 4px',
              overflow: 'hidden',
            }}
          >
            {renderElementContent(el, telemetry)}
          </div>
        )
      })}
    </div>
  )
}

function renderElementContent(el: CustomOverlayElement, telemetry: any) {
  let displayValue: any = el.text || ''

  if (el.binding?.propertyKey) {
    const rawVal = resolveTelemetryValue(telemetry, el.binding.propertyKey)
    if (rawVal !== undefined && rawVal !== null) {
      if (typeof rawVal === 'number') {
        const mult = el.binding.multiplier !== undefined ? el.binding.multiplier : 1
        const dec = el.binding.decimals !== undefined ? el.binding.decimals : (Number.isInteger(rawVal) ? 0 : 1)
        displayValue = (rawVal * mult).toFixed(dec)
      } else if (typeof rawVal === 'boolean') {
        displayValue = rawVal ? 'ON' : 'OFF'
      } else {
        displayValue = String(rawVal)
      }
      if (el.binding.prefix) displayValue = `${el.binding.prefix}${displayValue}`
      if (el.binding.suffix) displayValue = `${displayValue}${el.binding.suffix}`
    } else if (el.binding.fallback) {
      displayValue = el.binding.fallback
    }
  }

  // Linear Gauge
  if (el.type === 'gauge-linear') {
    const rawNum = typeof displayValue === 'string' ? parseFloat(displayValue.replace(/[^0-9.-]/g, '')) : (Number(displayValue) || 0)
    const min = el.minVal || 0
    const max = el.maxVal || 100
    const pct = Math.max(0, Math.min(100, ((rawNum - min) / (max - min)) * 100))
    const fill = el.fillColor || '#e11d48'
    const inactive = el.inactiveColor || 'rgba(255,255,255,0.1)'

    return (
      <div className="w-full h-full relative overflow-hidden" style={{ background: inactive, borderRadius: el.borderRadius || 4 }}>
        <div
          className="h-full transition-all duration-75"
          style={{ width: `${pct}%`, background: fill, borderRadius: el.borderRadius || 4 }}
        />
        {el.text && (
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-bold text-white drop-shadow">
            {displayValue}
          </span>
        )}
      </div>
    )
  }

  // LED bar / indicator
  if (el.type === 'led-bar') {
    const isActive = displayValue === 'ON' || displayValue === 'ATIVO' || Boolean(Number(displayValue) > 0)
    const onColor = el.fillColor || '#22c55e'
    const offColor = el.inactiveColor || '#1e293b'

    return (
      <div
        className="w-full h-full flex items-center justify-center font-bold text-[10px]"
        style={{
          background: isActive ? onColor : offColor,
          color: isActive ? '#000' : '#64748b',
          boxShadow: isActive ? `0 0 12px ${onColor}` : 'none',
          borderRadius: el.borderRadius || 4,
          transition: 'all 0.1s ease',
        }}
      >
        {el.text || (isActive ? 'ON' : 'OFF')}
      </div>
    )
  }

  // Standard Text / Label / Value Shape
  return (
    <span
      style={{
        color: el.textColor || '#ffffff',
        fontSize: el.fontSize ? `${el.fontSize}px` : '14px',
        fontWeight: el.fontWeight || 'bold',
        fontFamily: el.fontFamily === 'mono' ? 'monospace' : 'sans-serif',
        lineHeight: 1.1,
        whiteSpace: 'nowrap',
      }}
    >
      {displayValue}
    </span>
  )
}

export default CustomOverlayView
