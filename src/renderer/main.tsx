import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/globals.css'

// When opened as a standalone overlay window (e.g. from "Open Overlay" button),
// the query string contains ?standalone=1. In that case render only the
// lightweight OverlayApp instead of the full studio UI.
const params = new URLSearchParams(window.location.search)
const isStandaloneOverlay = params.get('standalone') === '1'

const container = document.getElementById('root')!
const root = createRoot(container)

if (isStandaloneOverlay) {
  // Lazy-import OverlayApp to avoid bundling the full studio on every load
  import('../overlay/OverlayApp').then(({ OverlayApp }) => {
    // Transparent background for overlay window
    document.body.style.background = 'transparent'
    document.documentElement.style.background = 'transparent'
    root.render(React.createElement(OverlayApp))
  })
} else {
  root.render(React.createElement(App))
}
