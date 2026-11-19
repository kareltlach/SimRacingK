import React, { useEffect } from 'react'
import RacelabStudioView from './components/hud-studio/RacelabStudioView'
import { useTelemetryStore } from './store/telemetryStore'

export default function App() {
  const setTelemetryData = useTelemetryStore((s) => s.setTelemetryData)

  useEffect(() => {
    const api = (window as any).api

    if (api?.telemetry?.onData) {
      const unsub = api.telemetry.onData((data: any) => {
        setTelemetryData(data)
      })
      return () => {
        unsub?.()
      }
    }
  }, [setTelemetryData])

  return <RacelabStudioView />
}
