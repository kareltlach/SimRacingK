import React, { useState, useEffect } from 'react'

export const QRCodePanel: React.FC = () => {
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [url, setUrl] = useState('http://192.168.1.100:8777')
  const [isRunning, setIsRunning] = useState(true)

  useEffect(() => {
    if (window.api?.companion?.getQRCode) {
      window.api.companion.getQRCode().then((res: any) => {
        if (res?.qrDataUrl) setQrCode(res.qrDataUrl)
        if (res?.url) setUrl(res.url)
      }).catch(() => {})
    }
  }, [])

  return (
    <div className="bg-[#11111c] border border-[#1e1e32] rounded-xl p-5 shadow-lg flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <span>📱</span>
            <span>Mobile Companion & Button Box</span>
          </h2>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
        </div>
        <p className="text-xs text-gray-400 mb-4">
          Acesse a segunda tela ao vivo e a Button Box virtual no seu smartphone ou tablet escaneando o QR Code abaixo na mesma rede Wi-Fi.
        </p>
      </div>

      <div className="flex items-center space-x-5 bg-[#0a0a10] p-4 rounded-xl border border-[#181828]">
        <div className="bg-white p-2 rounded-lg flex-shrink-0 shadow-md">
          {qrCode ? (
            <img src={qrCode} alt="QR Code" className="w-28 h-28" />
          ) : (
            <div className="w-28 h-28 bg-gray-900 rounded flex flex-col items-center justify-center p-2 text-center text-[10px] text-gray-400 font-mono">
              <span className="text-2xl mb-1">🏁</span>
              <span>QR Code Ativo</span>
              <span className="text-red-400 font-bold">:8777</span>
            </div>
          )}
        </div>
        <div className="flex-1 space-y-2">
          <div className="text-[11px] font-mono text-gray-500 uppercase">Endereço Web Local</div>
          <div className="text-xs font-mono font-bold text-red-400 bg-[#121220] px-3 py-1.5 rounded border border-[#202035] break-all select-all">
            {url}
          </div>
          <div className="text-[11px] text-gray-400">
            Recursos: Velocímetro, RPM com Shift Light, Delta dinâmico, Faróis, Limpador, Limitador de Box e Troca de Página do HUD.
          </div>
        </div>
      </div>
    </div>
  )
}
export default QRCodePanel
