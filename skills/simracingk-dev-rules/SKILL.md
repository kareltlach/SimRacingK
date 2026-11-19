---
name: simracingk-dev-rules
description: Regras de ciclo de vida, build sob demanda e gerenciamento de processos do ApexTelemetry Studio.
---

# SimRacingK / ApexTelemetry Studio - Dev Guidelines

## Políticas Obrigatórias

### 1. Build e Empacotamento
- **NÃO** compile binários executáveis (`electron-builder`) a cada alteração.
- Gere binários **somente quando o usuário solicitar explicitamente**.
- Para validação de código, use apenas `npm run build` ou verificação com TypeScript.

### 2. Gerenciamento de Processos e Encerramento
- Fechar a aplicação deve encerrar **100% dos processos**.
- Nenhum processo Electron, Python UDP reader ou timer pode ficar órfão.
- Ao fechar a janela principal:
  - Destruir a janela de overlay imediatamente para que nenhum widget continue visível.
  - Finalizar timers de polling de simuladores.
  - Chamar `app.quit()`.
- Antes de reabrir ou testar o app, garanta que instâncias antigas foram devidamente finalizadas para não bloquear o `SingleInstanceLock`.

### 3. Layout e Visual dos Overlays
- Fundo sempre transparente (`background: transparent`).
- Componentes soltos e posicionáveis individualmente pelo usuário em qualquer tela.
