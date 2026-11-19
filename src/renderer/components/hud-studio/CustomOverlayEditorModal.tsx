import React, { useState, useRef, useCallback, useEffect } from 'react'
import {
  CustomOverlayData,
  CustomOverlayElement,
  CustomElementType,
  AVAILABLE_TELEMETRY_FIELDS,
  resolveTelemetryValue
} from '../../../shared/customOverlayTypes'

interface Props {
  initialData?: CustomOverlayData
  widgetName: string
  telemetryData: any
  onSave: (data: CustomOverlayData) => void
  onClose: () => void
}

export const CustomOverlayEditorModal: React.FC<Props> = ({
  initialData,
  widgetName,
  telemetryData,
  onSave,
  onClose,
}) => {
  const [canvasWidth, setCanvasWidth] = useState(initialData?.canvasWidth || 420)
  const [canvasHeight, setCanvasHeight] = useState(initialData?.canvasHeight || 240)
  const [backgroundColor, setBackgroundColor] = useState(initialData?.backgroundColor || 'rgba(15,23,42,0.95)')
  const [elements, setElements] = useState<CustomOverlayElement[]>(
    initialData?.elements && initialData.elements.length > 0
      ? initialData.elements
      : [
          {
            id: 'el-bg',
            name: 'Fundo do Painel',
            type: 'rectangle',
            x: 0,
            y: 0,
            width: 420,
            height: 240,
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
            x: 20,
            y: 30,
            width: 140,
            height: 24,
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
            x: 20,
            y: 54,
            width: 140,
            height: 50,
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
            x: 180,
            y: 35,
            width: 80,
            height: 70,
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
            x: 20,
            y: 125,
            width: 380,
            height: 18,
            zIndex: 5,
            minVal: 0,
            maxVal: 8500,
            fillColor: '#ef4444',
            inactiveColor: '#1e293b',
            borderRadius: 4,
            binding: { propertyKey: 'rpm' },
          },
        ]
  )

  const [selectedElementId, setSelectedElementId] = useState<string | null>(elements[1]?.id || null)
  const [activeTab, setActiveTab] = useState<'toolbox' | 'layers'>('toolbox')
  const [searchTelemetry, setSearchTelemetry] = useState('')

  const canvasRef = useRef<HTMLDivElement>(null)
  const selectedEl = elements.find((e) => e.id === selectedElementId) || null

  const handleUpdateSelected = (updates: Partial<CustomOverlayElement>) => {
    if (!selectedElementId) return
    setElements((prev) =>
      prev.map((el) => (el.id === selectedElementId ? { ...el, ...updates } : el))
    )
  }

  const handleAddElement = (type: CustomElementType) => {
    const newId = `el-${Date.now()}`
    let newEl: CustomOverlayElement = {
      id: newId,
      name: `${type.toUpperCase()} ${elements.length + 1}`,
      type,
      x: 30,
      y: 30,
      width: type === 'text' ? 120 : type === 'gauge-linear' ? 240 : 80,
      height: type === 'text' ? 30 : type === 'gauge-linear' ? 20 : 60,
      zIndex: elements.length + 1,
      backgroundColor: type === 'rectangle' ? '#1e293b' : 'transparent',
      borderColor: '#334155',
      borderWidth: type === 'rectangle' ? 1 : 0,
      borderRadius: type === 'circle' ? 999 : 6,
      opacity: 1,
      text: type === 'text' ? 'Novo Texto' : '',
      fontSize: 16,
      textColor: '#ffffff',
      fontWeight: 'bold',
      textAlign: 'center',
    }

    if (type === 'gauge-linear') {
      newEl.minVal = 0
      newEl.maxVal = 100
      newEl.fillColor = '#3b82f6'
      newEl.inactiveColor = '#1e293b'
    } else if (type === 'led-bar') {
      newEl.fillColor = '#22c55e'
      newEl.inactiveColor = '#1e293b'
      newEl.text = 'ABS'
    }

    setElements((prev) => [...prev, newEl])
    setSelectedElementId(newId)
  }

  const handleDeleteSelected = () => {
    if (!selectedElementId) return
    setElements((prev) => prev.filter((el) => el.id !== selectedElementId))
    setSelectedElementId(null)
  }

  const handleDuplicateSelected = () => {
    if (!selectedEl) return
    const dup: CustomOverlayElement = {
      ...selectedEl,
      id: `el-${Date.now()}`,
      name: `${selectedEl.name} (Cópia)`,
      x: selectedEl.x + 15,
      y: selectedEl.y + 15,
      zIndex: elements.length + 1,
    }
    setElements((prev) => [...prev, dup])
    setSelectedElementId(dup.id)
  }

  const handleSave = () => {
    onSave({
      canvasWidth,
      canvasHeight,
      backgroundColor,
      elements,
    })
    onClose()
  }

  const filteredTelemetry = AVAILABLE_TELEMETRY_FIELDS.filter(
    (f) =>
      f.label.toLowerCase().includes(searchTelemetry.toLowerCase()) ||
      f.key.toLowerCase().includes(searchTelemetry.toLowerCase()) ||
      f.category.toLowerCase().includes(searchTelemetry.toLowerCase())
  )

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col select-none text-gray-200">
      {/* ── Top Header Toolbar ── */}
      <header className="h-12 bg-[#0f1016] border-b border-[#1f2230] px-4 flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-3">
          <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
          <h2 className="font-bold text-sm text-white tracking-wide">
            SIMRACING K - EDITOR VISUAL DE OVERLAYS: <span className="text-rose-400">{widgetName}</span>
          </h2>
          <span className="text-[10px] bg-rose-950 text-rose-300 px-2 py-0.5 rounded font-mono border border-rose-800/50">
            {canvasWidth} x {canvasHeight} PX
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onClose}
            className="px-3 py-1 bg-[#1a1b26] hover:bg-[#252838] text-xs font-bold text-gray-300 rounded border border-[#2e3245] transition-all cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1 bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white rounded shadow-lg shadow-emerald-950/60 transition-all flex items-center space-x-1 cursor-pointer"
          >
            <span>✓</span>
            <span>Salvar Overlay</span>
          </button>
        </div>
      </header>

      {/* ── Main Studio Workspace Layout (Toolbox | Canvas | Properties) ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* ── LEFT PANEL: TOOLBOX & CAMADAS ── */}
        <aside className="w-64 bg-[#0d0e14] border-r border-[#1f2230] flex flex-col">
          <div className="flex border-b border-[#1f2230]">
            <button
              onClick={() => setActiveTab('toolbox')}
              className={`flex-1 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'toolbox'
                  ? 'border-rose-500 text-white bg-[#141622]'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              🛠 Elementos
            </button>
            <button
              onClick={() => setActiveTab('layers')}
              className={`flex-1 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'layers'
                  ? 'border-rose-500 text-white bg-[#141622]'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              📑 Camadas ({elements.length})
            </button>
          </div>

          <div className="flex-1 p-3 overflow-y-auto space-y-3">
            {activeTab === 'toolbox' ? (
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Adicionar ao Overlay
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleAddElement('text')}
                    className="p-2.5 bg-[#141622] hover:bg-[#1e2133] border border-[#25283a] hover:border-rose-500/50 rounded-lg flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer"
                  >
                    <span className="text-lg">🔤</span>
                    <span className="text-[11px] font-bold">Texto / Dado</span>
                  </button>
                  <button
                    onClick={() => handleAddElement('rectangle')}
                    className="p-2.5 bg-[#141622] hover:bg-[#1e2133] border border-[#25283a] hover:border-rose-500/50 rounded-lg flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer"
                  >
                    <span className="text-lg">⏹</span>
                    <span className="text-[11px] font-bold">Retângulo</span>
                  </button>
                  <button
                    onClick={() => handleAddElement('circle')}
                    className="p-2.5 bg-[#141622] hover:bg-[#1e2133] border border-[#25283a] hover:border-rose-500/50 rounded-lg flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer"
                  >
                    <span className="text-lg">⚪</span>
                    <span className="text-[11px] font-bold">Círculo</span>
                  </button>
                  <button
                    onClick={() => handleAddElement('gauge-linear')}
                    className="p-2.5 bg-[#141622] hover:bg-[#1e2133] border border-[#25283a] hover:border-rose-500/50 rounded-lg flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer"
                  >
                    <span className="text-lg">📊</span>
                    <span className="text-[11px] font-bold">Barra Gauge</span>
                  </button>
                  <button
                    onClick={() => handleAddElement('led-bar')}
                    className="p-2.5 bg-[#141622] hover:bg-[#1e2133] border border-[#25283a] hover:border-rose-500/50 rounded-lg flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer"
                  >
                    <span className="text-lg">💡</span>
                    <span className="text-[11px] font-bold">LED / Status</span>
                  </button>
                </div>

                <div className="pt-4 border-t border-[#1f2230] space-y-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Tamanho do Canvas (Overlay)
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] text-gray-500 block mb-0.5">Largura (W)</label>
                      <input
                        type="number"
                        value={canvasWidth}
                        onChange={(e) => setCanvasWidth(Math.max(100, parseInt(e.target.value) || 200))}
                        className="w-full bg-[#141622] border border-[#25283a] rounded p-1 text-white text-center font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 block mb-0.5">Altura (H)</label>
                      <input
                        type="number"
                        value={canvasHeight}
                        onChange={(e) => setCanvasHeight(Math.max(50, parseInt(e.target.value) || 100))}
                        className="w-full bg-[#141622] border border-[#25283a] rounded p-1 text-white text-center font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                {elements
                  .slice()
                  .reverse()
                  .map((el) => (
                    <div
                      key={el.id}
                      onClick={() => setSelectedElementId(el.id)}
                      className={`px-2.5 py-1.5 rounded flex items-center justify-between text-xs cursor-pointer transition-all ${
                        el.id === selectedElementId
                          ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40'
                          : 'bg-[#141622] text-gray-300 hover:bg-[#1a1d2c]'
                      }`}
                    >
                      <span className="truncate">{el.name}</span>
                      <span className="text-[10px] font-mono text-gray-500">{el.type}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </aside>

        {/* ── CENTER: INTERACTIVE CANVAS VIEWPORT ── */}
        <main className="flex-1 bg-[#06070a] flex items-center justify-center p-6 relative overflow-auto">
          {/* Canvas Work Area */}
          <div
            ref={canvasRef}
            style={{
              width: `${canvasWidth}px`,
              height: `${canvasHeight}px`,
              backgroundColor: backgroundColor,
              boxShadow: '0 0 40px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.1)',
              position: 'relative',
              borderRadius: '8px',
            }}
            className="overflow-hidden"
          >
            {elements.map((el) => {
              const isSelected = el.id === selectedElementId
              return (
                <div
                  key={el.id}
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedElementId(el.id)
                  }}
                  style={{
                    position: 'absolute',
                    left: `${el.x}px`,
                    top: `${el.y}px`,
                    width: `${el.width}px`,
                    height: `${el.height}px`,
                    zIndex: el.zIndex || 1,
                    backgroundColor: el.backgroundColor || 'transparent',
                    borderColor: isSelected ? '#e11d48' : el.borderColor || 'transparent',
                    borderWidth: isSelected ? Math.max(2, el.borderWidth || 2) : el.borderWidth || 0,
                    borderRadius: el.borderRadius ? `${el.borderRadius}px` : 0,
                    borderStyle: isSelected || el.borderWidth ? 'solid' : 'none',
                    opacity: el.opacity !== undefined ? el.opacity : 1,
                    cursor: 'move',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: el.textAlign === 'left' ? 'flex-start' : el.textAlign === 'right' ? 'flex-end' : 'center',
                    padding: '2px 4px',
                    boxSizing: 'border-box',
                  }}
                  className={`group select-none transition-shadow ${
                    isSelected ? 'ring-2 ring-rose-500/50 shadow-lg shadow-rose-950/80' : ''
                  }`}
                >
                  {/* Element Content Render */}
                  {renderElementPreview(el, telemetryData)}
                </div>
              )
            })}
          </div>

          <div className="absolute bottom-3 left-4 text-[10px] text-gray-500 font-mono">
            Dica: Clique em qualquer elemento para editar suas propriedades e linkar com dados da telemetria ao vivo.
          </div>
        </main>

        {/* ── RIGHT PANEL: PROPRIEDADES & DATA BINDING TELEMETRIA ── */}
        <aside className="w-80 bg-[#0d0e14] border-l border-[#1f2230] flex flex-col overflow-y-auto">
          {selectedEl ? (
            <div className="p-4 space-y-4">
              {/* Header do Elemento Selecionado */}
              <div className="flex items-center justify-between pb-2 border-b border-[#1f2230]">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase">{selectedEl.name}</h4>
                  <span className="text-[10px] font-mono text-gray-500">{selectedEl.type}</span>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={handleDuplicateSelected}
                    title="Duplicar"
                    className="p-1 hover:bg-[#1a1d2c] rounded text-gray-300 text-xs cursor-pointer"
                  >
                    📄
                  </button>
                  <button
                    onClick={handleDeleteSelected}
                    title="Excluir"
                    className="p-1 hover:bg-rose-950/50 text-rose-400 rounded text-xs cursor-pointer"
                  >
                    🗑
                  </button>
                </div>
              </div>

              {/* ── VINCULAR COM DADOS DO JOGO (TELEMETRY BINDING) ── */}
              <div className="p-3 bg-gradient-to-b from-[#141624] to-[#0f111a] border border-[#2b2f44] rounded-xl space-y-2.5 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span>⚡</span> VINCULAR DADO DO JOGO
                  </span>
                  {selectedEl.binding?.propertyKey && (
                    <button
                      onClick={() => handleUpdateSelected({ binding: undefined })}
                      className="text-[9px] text-gray-400 hover:text-rose-400 underline cursor-pointer"
                    >
                      Desvincular
                    </button>
                  )}
                </div>

                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Buscar Telemetria do Jogo</label>
                  <input
                    type="text"
                    placeholder="Filtrar (ex: RPM, velocidade, pneu, marcha...)"
                    value={searchTelemetry}
                    onChange={(e) => setSearchTelemetry(e.target.value)}
                    className="w-full bg-[#0a0a0f] border border-[#25283a] rounded p-1.5 text-xs text-white focus:outline-none focus:border-rose-500 mb-2"
                  />

                  <select
                    value={selectedEl.binding?.propertyKey || ''}
                    onChange={(e) => {
                      const key = e.target.value
                      if (!key) {
                        handleUpdateSelected({ binding: undefined })
                      } else {
                        const field = AVAILABLE_TELEMETRY_FIELDS.find((f) => f.key === key)
                        handleUpdateSelected({
                          binding: {
                            propertyKey: key,
                            suffix: field?.unit ? ` ${field.unit}` : '',
                            decimals: key.includes('Time') ? undefined : key === 'gear' ? 0 : 0,
                          },
                        })
                      }
                    }}
                    className="w-full bg-[#0a0a0f] border border-[#25283a] rounded p-1.5 text-xs text-amber-300 font-mono font-bold focus:outline-none"
                  >
                    <option value="">-- Nenhum (Texto Fixo) --</option>
                    {filteredTelemetry.map((field) => (
                      <option key={field.key} value={field.key}>
                        [{field.category}] {field.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Opções de Formatação do Dado Vinculado */}
                {selectedEl.binding?.propertyKey && (
                  <div className="pt-2 border-t border-[#232738] space-y-2 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] text-gray-400 block">Prefixo</label>
                        <input
                          type="text"
                          placeholder="ex: KM: "
                          value={selectedEl.binding.prefix || ''}
                          onChange={(e) =>
                            handleUpdateSelected({
                              binding: { ...selectedEl.binding!, prefix: e.target.value },
                            })
                          }
                          className="w-full bg-[#0a0a0f] border border-[#25283a] rounded p-1 text-white text-[11px]"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-gray-400 block">Sufixo / Unidade</label>
                        <input
                          type="text"
                          placeholder="ex: km/h"
                          value={selectedEl.binding.suffix || ''}
                          onChange={(e) =>
                            handleUpdateSelected({
                              binding: { ...selectedEl.binding!, suffix: e.target.value },
                            })
                          }
                          className="w-full bg-[#0a0a0f] border border-[#25283a] rounded p-1 text-white text-[11px]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] text-gray-400 block">Casas Decimais</label>
                        <input
                          type="number"
                          min="0"
                          max="4"
                          value={selectedEl.binding.decimals !== undefined ? selectedEl.binding.decimals : 0}
                          onChange={(e) =>
                            handleUpdateSelected({
                              binding: {
                                ...selectedEl.binding!,
                                decimals: parseInt(e.target.value) || 0,
                              },
                            })
                          }
                          className="w-full bg-[#0a0a0f] border border-[#25283a] rounded p-1 text-white text-[11px] text-center"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-gray-400 block">Valor Fallback</label>
                        <input
                          type="text"
                          placeholder="ex: --"
                          value={selectedEl.binding.fallback || ''}
                          onChange={(e) =>
                            handleUpdateSelected({
                              binding: { ...selectedEl.binding!, fallback: e.target.value },
                            })
                          }
                          className="w-full bg-[#0a0a0f] border border-[#25283a] rounded p-1 text-white text-[11px]"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ── POSICIONAMENTO E GEOMETRIA ── */}
              <div className="space-y-2 text-xs">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Geometria & Posição
                </span>
                <div className="grid grid-cols-4 gap-1.5 font-mono text-center">
                  <div>
                    <label className="text-[9px] text-gray-500 block">X</label>
                    <input
                      type="number"
                      value={selectedEl.x}
                      onChange={(e) => handleUpdateSelected({ x: parseInt(e.target.value) || 0 })}
                      className="w-full bg-[#141622] border border-[#25283a] rounded p-1 text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-gray-500 block">Y</label>
                    <input
                      type="number"
                      value={selectedEl.y}
                      onChange={(e) => handleUpdateSelected({ y: parseInt(e.target.value) || 0 })}
                      className="w-full bg-[#141622] border border-[#25283a] rounded p-1 text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-gray-500 block">W</label>
                    <input
                      type="number"
                      value={selectedEl.width}
                      onChange={(e) => handleUpdateSelected({ width: Math.max(10, parseInt(e.target.value) || 10) })}
                      className="w-full bg-[#141622] border border-[#25283a] rounded p-1 text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-gray-500 block">H</label>
                    <input
                      type="number"
                      value={selectedEl.height}
                      onChange={(e) => handleUpdateSelected({ height: Math.max(5, parseInt(e.target.value) || 5) })}
                      className="w-full bg-[#141622] border border-[#25283a] rounded p-1 text-white text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* ── ESTILO VISUAL, CORES E TIPOGRAFIA ── */}
              <div className="space-y-3 pt-2 border-t border-[#1f2230] text-xs">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Aparência & Estilos
                </span>

                {/* Texto Fixo (quando não vinculado) */}
                {(!selectedEl.binding?.propertyKey || selectedEl.type === 'text') && (
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1">Texto Estático / Rótulo</label>
                    <input
                      type="text"
                      value={selectedEl.text || ''}
                      onChange={(e) => handleUpdateSelected({ text: e.target.value })}
                      className="w-full bg-[#141622] border border-[#25283a] rounded p-1.5 text-white"
                    />
                  </div>
                )}

                {/* Cores de Fundo e Borda */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1">Cor de Fundo</label>
                    <div className="flex items-center space-x-1.5">
                      <input
                        type="color"
                        value={selectedEl.backgroundColor && selectedEl.backgroundColor.startsWith('#') ? selectedEl.backgroundColor : '#111827'}
                        onChange={(e) => handleUpdateSelected({ backgroundColor: e.target.value })}
                        className="w-7 h-7 bg-transparent rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={selectedEl.backgroundColor || ''}
                        onChange={(e) => handleUpdateSelected({ backgroundColor: e.target.value })}
                        className="flex-1 bg-[#141622] border border-[#25283a] rounded p-1 text-white font-mono text-[10px]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1">Cor do Texto</label>
                    <div className="flex items-center space-x-1.5">
                      <input
                        type="color"
                        value={selectedEl.textColor && selectedEl.textColor.startsWith('#') ? selectedEl.textColor : '#ffffff'}
                        onChange={(e) => handleUpdateSelected({ textColor: e.target.value })}
                        className="w-7 h-7 bg-transparent rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={selectedEl.textColor || ''}
                        onChange={(e) => handleUpdateSelected({ textColor: e.target.value })}
                        className="flex-1 bg-[#141622] border border-[#25283a] rounded p-1 text-white font-mono text-[10px]"
                      />
                    </div>
                  </div>
                </div>

                {/* Tamanho da Fonte e Arredondamento */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1">Tamanho da Fonte (PX)</label>
                    <input
                      type="number"
                      value={selectedEl.fontSize || 14}
                      onChange={(e) => handleUpdateSelected({ fontSize: parseInt(e.target.value) || 12 })}
                      className="w-full bg-[#141622] border border-[#25283a] rounded p-1 text-white text-center font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1">Raio da Borda (Radius)</label>
                    <input
                      type="number"
                      value={selectedEl.borderRadius || 0}
                      onChange={(e) => handleUpdateSelected({ borderRadius: parseInt(e.target.value) || 0 })}
                      className="w-full bg-[#141622] border border-[#25283a] rounded p-1 text-white text-center font-mono"
                    />
                  </div>
                </div>

                {/* Alinhamento de Texto */}
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Alinhamento</label>
                  <div className="grid grid-cols-3 gap-1">
                    {(['left', 'center', 'right'] as const).map((align) => (
                      <button
                        key={align}
                        onClick={() => handleUpdateSelected({ textAlign: align })}
                        className={`py-1 text-xs font-bold rounded cursor-pointer ${
                          selectedEl.textAlign === align
                            ? 'bg-rose-500 text-white'
                            : 'bg-[#141622] text-gray-400 hover:text-white'
                        }`}
                      >
                        {align.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Configurações de Gauge se for barra */}
                {selectedEl.type === 'gauge-linear' && (
                  <div className="pt-2 border-t border-[#1f2230] space-y-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      Escala do Gauge
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] text-gray-400 block">Mínimo</label>
                        <input
                          type="number"
                          value={selectedEl.minVal || 0}
                          onChange={(e) => handleUpdateSelected({ minVal: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-[#141622] border border-[#25283a] rounded p-1 text-white text-center"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-gray-400 block">Máximo</label>
                        <input
                          type="number"
                          value={selectedEl.maxVal || 100}
                          onChange={(e) => handleUpdateSelected({ maxVal: parseFloat(e.target.value) || 100 })}
                          className="w-full bg-[#141622] border border-[#25283a] rounded p-1 text-white text-center"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-gray-500 space-y-2">
              <span className="text-3xl">👆</span>
              <p className="text-xs">Selecione um elemento na tela ou na aba de Camadas para customizar seus estilos e vinculá-lo aos dados da telemetria.</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}

function renderElementPreview(el: CustomOverlayElement, telemetryData: any) {
  let val: any = el.text || ''

  if (el.binding?.propertyKey) {
    const liveVal = resolveTelemetryValue(telemetryData, el.binding.propertyKey)
    if (liveVal !== undefined && liveVal !== null) {
      if (typeof liveVal === 'number') {
        const dec = el.binding.decimals !== undefined ? el.binding.decimals : 0
        val = liveVal.toFixed(dec)
      } else {
        val = String(liveVal)
      }
      if (el.binding.prefix) val = `${el.binding.prefix}${val}`
      if (el.binding.suffix) val = `${val}${el.binding.suffix}`
    } else {
      const field = AVAILABLE_TELEMETRY_FIELDS.find((f) => f.key === el.binding?.propertyKey)
      val = field?.example || el.text || '--'
      if (el.binding.suffix && !val.includes(el.binding.suffix)) val = `${val}${el.binding.suffix}`
    }
  }

  if (el.type === 'gauge-linear') {
    return (
      <div className="w-full h-full relative overflow-hidden" style={{ background: el.inactiveColor || '#1e293b', borderRadius: el.borderRadius || 4 }}>
        <div className="h-full" style={{ width: '65%', background: el.fillColor || '#ef4444', borderRadius: el.borderRadius || 4 }} />
        {el.text && (
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-bold text-white drop-shadow">
            {val}
          </span>
        )}
      </div>
    )
  }

  if (el.type === 'led-bar') {
    return (
      <div
        className="w-full h-full flex items-center justify-center font-bold text-[10px]"
        style={{
          background: el.fillColor || '#22c55e',
          color: '#000',
          borderRadius: el.borderRadius || 4,
          boxShadow: `0 0 10px ${el.fillColor || '#22c55e'}`,
        }}
      >
        {el.text || 'ATIVO'}
      </div>
    )
  }

  return (
    <span
      style={{
        color: el.textColor || '#ffffff',
        fontSize: el.fontSize ? `${el.fontSize}px` : '14px',
        fontWeight: el.fontWeight || 'bold',
        fontFamily: el.fontFamily === 'mono' ? 'monospace' : 'sans-serif',
        lineHeight: 1,
      }}
    >
      {val}
    </span>
  )
}

export default CustomOverlayEditorModal
