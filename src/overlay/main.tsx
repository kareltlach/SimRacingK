import React from 'react'
import { createRoot } from 'react-dom/client'
import { OverlayApp } from './OverlayApp'

const container = document.getElementById('overlay-root')!
const root = createRoot(container)
root.render(
  <React.StrictMode>
    <OverlayApp />
  </React.StrictMode>
)
