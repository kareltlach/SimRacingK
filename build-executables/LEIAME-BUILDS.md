# ApexTelemetry Studio - Instruções de Execução e Builds

## 1. Windows (Executável Pronto)
A pasta compilada e autônoma está disponível em:
- **Pasta:** `D:\Antigravity\SimRacingK\build-executables\Windows-x64\`
- **Executável direto:** `D:\Antigravity\SimRacingK\build-executables\Windows-x64\ApexTelemetry Studio.exe`
- **Arquivo compactado (.zip):** `D:\Antigravity\SimRacingK\build-executables\ApexTelemetry-Studio-Windows-x64.zip` (116 MB)

> Basta dar duplo clique no `ApexTelemetry Studio.exe` para rodar localmente sem precisar abrir terminal ou rodar `npm run dev`.

---

## 2. macOS (.dmg / .app / .zip)
> **Aviso da arquitetura do Electron/Apple:**
> O compilador oficial da Apple (`hdiutil`, `codesign` e `Apple Developer SDK`) só permite gerar binários nativos executáveis do macOS rodando em um sistema macOS ou via pipeline CI/CD (GitHub Actions / GitLab CI com runner `macos-latest`). O `electron-builder` no Windows bloqueia a compilação nativa para macOS com o erro:
> `Build for macOS is supported only on macOS (see electron.build/multi-platform-build)`.

### Como compilar para Mac em 1 minuto via GitHub Actions ou no Mac:
1. No seu repositório Git, adicione o arquivo `.github/workflows/build-mac.yml`:
```yaml
name: Build macOS
on: [push, workflow_dispatch]
jobs:
  build:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install
      - run: npm run build
      - run: npx electron-builder --mac
      - uses: actions/upload-artifact@v4
        with:
          name: macOS-Executables
          path: dist-binaries/*.dmg
```
2. Ou em um Mac físico ou máquina virtual, abra a pasta do projeto e execute:
```bash
npm install
npm run build
npx electron-builder --mac
```
Os arquivos `.dmg` e `.zip` (para Intel e Apple Silicon M1/M2/M3/M4) serão gerados automaticamente.
