import React from 'react'
import { createRoot } from 'react-dom/client'
import { OverlayApp } from '../overlay/OverlayApp'
import './styles/globals.css'

const container = document.getElementById('overlay-root')!
const root = createRoot(container)
root.render(<OverlayApp />)
