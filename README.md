# SimRacing K - versão 0.1

**SimRacing K** é uma plataforma profissional de telemetria em tempo real e estúdio de overlays para simuladores de corrida. Desenvolvido em **Electron**, **React**, **TypeScript** e **Vite**, o software replica o comportamento e fluidez de ferramentas de ponta (como RaceLab e SimHub), oferecendo overlays flutuantes independentes, transparentes, sem borda e com suporte a *click-through*.

---

## 🚀 Principais Funcionalidades

### 1. Sistema de Overlays Flutuantes Independentes
- **Janelas Frameless & Transparentes**: Cada widget pode ser aberto como uma janela independente com fundo transparente ou opaco, mantendo-se sempre no topo (*Always-on-Top*).
- **Modo Edição e Bloqueio (Click-Through)**:
  - **Desbloqueado**: Permite arrastar pela barra superior, redimensionar e customizar cor de fundo.
  - **Bloqueado**: Ativa o modo de repasse de cliques (*click-through*), permitindo pilotar e clicar no simulador sem interferência.
  - **Menu de Contexto Rápido**: Clique com o **botão direito do mouse** em qualquer overlay para destravar, travar, mudar o fundo (transparente/escuro/personalizado) ou fechar a janela.

### 2. Coleta de Telemetria Real em Alta Taxa (60 Hz)
- **Assetto Corsa Competizione (ACC)**:
  - **Memória Compartilhada Segura**: Leitura de física, gráficos e dados estáticos com proteção ativa (*OpenFileMappingW*) para nunca travar o jogo, independentemente da ordem de inicialização.
  - **Broadcasting UDP (Porta 9000)**: Conexão direta com a API nativa do ACC para obter a lista completa de pilotos, carros, voltas, posições e deltas em tempo real.
- **Assetto Corsa (AC1)**:
  - Integração via Shared Memory nativa para dados de física e sessão.
- **Mecanismo Anti-Crash**:
  - Acesso somente-leitura (`FILE_MAP_READ`) que impede o app de alocar blocos de memória vazios antes do jogo, evitando o erro fatal de violação de acesso (`EXCEPTION_ACCESS_VIOLATION`) na Unreal Engine 4.

### 3. Widgets de Telemetria Incluídos

| Widget | Descrição |
| :--- | :--- |
| **Relatives & Radar Spotter** | Tabela de posições e intervalos (deltas) dos carros ao redor em pista com identificação de boxes e radar de proximidade 360° (até 60m). |
| **Live 2D Track Map (GPS)** | Traçado dinâmico desenhado pelas coordenadas reais do carro no mundo (`worldX`, `worldZ`), garantindo precisão milimétrica em qualquer circuito. |
| **Delta Trace & Best Lap** | Gráfico de delta ao vivo comparado à melhor volta da sessão, com setores (S1, S2, S3), RPM, marcha e velocidade. |
| **Input Telemetry & Steering** | Gráfico de barras verticais e histórico de pedais (acelerador, freio, embreagem) e ângulo do volante. |
| **Tire Thermal & Brake Monitor** | Monitor térmico de pneus em 3 zonas (Interior, Meio, Exterior), pressão em PSI e temperatura dos freios em tempo real. |
| **Fuel Calculator & Strategy** | Cálculo de combustível restante no tanque, consumo médio por volta e estimativa de voltas restantes na corrida. |
| **Advanced Digital Cluster** | Painel digital de instrumentos com velocímetro, conta-giros (RPM), limitador de pit lane e alertas de ABS/TC. |

---

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 19, TypeScript, Tailwind CSS, Recharts, Lightweight Charts, Lucide Icons
- **Desktop**: Electron 33, electron-vite, electron-store
- **Backend / Telemetria**: Node.js `dgram` (UDP), Python 3 `mmap` / `struct` / `socket` com bindings Win32 (`ctypes`)
- **Build & Packaging**: Vite 6, Electron Builder

---

## 💻 Requisitos do Sistema

- **Sistema Operacional**: Windows 10 ou Windows 11 (64-bit)
- **Dependências**: Python 3.8 ou superior instalado e adicionado ao `PATH`
- **Simulador**: Assetto Corsa Competizione (ACC) ou Assetto Corsa (AC)
- **Modo de Tela do Simulador**: Recomenda-se rodar o jogo em **Modo Janela Sem Bordas (Borderless Windowed)** para exibição ideal dos overlays.

---

## ⚙️ Configuração do Assetto Corsa Competizione (ACC)

Para que o ACC envie os dados de adversários e tabela de classificação para o SimRacing K, certifique-se de que o arquivo de configuração do jogo esteja ativo:

- **Caminho**:
  `%USERPROFILE%\Documents\Assetto Corsa Competizione\Config\broadcasting.json`

- **Conteúdo padrão**:
  ```json
  {
    "updListenerPort": 9000,
    "connectionPassword": "asd",
    "commandPassword": ""
  }
  ```

---

## 📦 Como Rodar em Desenvolvimento

1. **Instalar dependências**:
   ```bash
   npm install
   ```

2. **Iniciar o ambiente de desenvolvimento**:
   ```bash
   npm run dev
   ```

3. **Compilar o código (Typecheck & Vite)**:
   ```bash
   npm run build
   ```

---

## 📁 Estrutura de Pastas

```
SimRacingK/
├── src/
│   ├── main/                 # Processo principal do Electron (Janelas, IPC, Tray)
│   ├── preload/              # Scripts de preload e contexto isolado
│   ├── overlay/              # Aplicação e renderizador dos overlays independentes
│   ├── renderer/             # Interface do Estúdio (Dashboard, Widgets, Configurações)
│   ├── shared/               # Tipos, interfaces de telemetria e constantes de pistas
│   └── telemetry/            # Adaptadores de simuladores (ACC, AC, Forza, etc.)
│       └── adapters/
│           └── ACCAdapter.ts # Leitor de Shared Memory e Broadcasting UDP do ACC
├── electron-builder.yml      # Configurações de empacotamento do instalador Windows
└── package.json              # Metadados e scripts do projeto
```

---

## 📄 Licença

Distribuído sob a licença MIT. Desenvolvido para entusiastas e pilotos virtuais de automobilismo esportivo.
