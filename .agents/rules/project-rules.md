---
name: project-guidelines
description: Project development rules, process cleanup, and packaging guidelines for SimRacing K.
---

# SimRacing K - Diretrizes de Desenvolvimento e Execução

## 1. Regra Estrita: NUNCA Criar Executáveis ou Gerar Instaladores sem Pedido Prévio
- **PROIBIÇÃO TOTAL**: NUNCA execute comandos de empacotamento, criação de instalador ou build de executáveis (`electron-builder`, `npm run dist:win`, `npx electron-builder --win`, etc.) sem que o usuário solicite explicitamente com frases como: *"gere o novo executável"*, *"crie o instalador"*, *"faça o build do windows"*.
- Em qualquer ciclo de desenvolvimento, refatoração, correção de bugs ou testes, execute no máximo `npm run build` (para validação TypeScript/Vite) ou `npm run dev`.
- **Nenhum arquivo binário, instalador (.exe, .msi, .zip) ou pasta de distribuição (`dist-binaries/`, `dist/`, etc.) deve ser versionado no Git ou gerado por iniciativa do assistente.**

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
  - Deve responder ao clique com botão direito do mouse para exibir menu de ações mesmo quando em modo bloqueado.

## 4. Comunicação
- Responda sempre em Português do Brasil de forma concisa e direta ao ponto.
