---
name: project-guidelines
description: Project development rules, process cleanup, and packaging guidelines for ApexTelemetry Studio.
---

# ApexTelemetry Studio - Diretrizes de Desenvolvimento e Execução

## 1. Regra de Ouro: NÃO Compilar Binários Automaticamente
- **NUNCA** execute `electron-builder` (`npx electron-builder`, `npm run dist:win`, etc.) automaticamente ou em cada interação.
- A compilação de binários consome tempo e recursos excessivos de tokens e disco.
- **Apenas compile ou gere instaladores/binários quando o USUÁRIO pedir explicitamente** (ex: *"gere os executáveis", "compile para windows e mac", "gere o build final"*).
- Durante o desenvolvimento e ajustes, utilize apenas `npm run build` para validar o código TypeScript/Vite ou execute em modo dev.

## 2. Encerramento Completo da Aplicação (Zero Processos Órfãos)
- Ao fechar a janela principal (`mainWindow` emitir `closed`), chame `app.quit()`.
- O listener de saída `will-quit` deve obrigatoriamente:
  - Destruir e fechar a janela de overlay (`overlayWindow.destroy()`).
  - Parar os loops de polling de processos (`detector.stopPolling()`).
  - Encerrar instâncias do `TelemetryBus` e subprocessos Python leitores de Shared Memory.
  - Parar o servidor WebSocket/HTTP `CompanionServer`.
  - Desregistrar atalhos globais (`unregisterGlobalShortcuts()`).
- Quando a aplicação for fechada, nenhum widget ou processo de segundo plano pode continuar rodando ou impedindo uma nova abertura.

## 3. Overlays e HUDs
- A janela do overlay deve ter fundo 100% transparente (`backgroundColor: '#00000000'`, `background: transparent`).
- Cada widget do HUD é solto e independente:
  - Pode ser arrastado individualmente para qualquer tela/monitor conectado.
  - Pode ter seu fundo alternado para transparente (sem caixas ou caixilhos escuros forçados).
  - Pode ser ocultado ou fechado individualmente.

## 4. Comunicação
- Responda sempre em Português do Brasil de forma concisa e direta ao ponto.
