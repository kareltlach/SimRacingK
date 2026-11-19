====================================================================
                        SIMRACING K - VERSAO 0.1
====================================================================
Autor: Karel Tlach
Aplicativo de Telemetria e Overlays em Tempo Real para Simuladores

--------------------------------------------------------------------
1. SOBRE O SIMRACING K
--------------------------------------------------------------------
O SimRacing K e uma plataforma de alta performance desenvolvida para
fornecer dados cruciais de telemetria e overlays visuais no topo da tela
durante corridas virtuais (Assetto Corsa Competizione, Assetto Corsa e
outros).

--------------------------------------------------------------------
2. PRINCIPAIS RECURSOS
--------------------------------------------------------------------
* Overlays Independentes e Transparentes:
  Cada widget funciona como uma janela independente com fundo
  customizavel (transparente, escuro ou cor personalizada).

* Modo Click-Through e Reposicionamento:
  - Desbloqueado: Arraste a barra superior amarela para posicionar na tela.
  - Bloqueado: Permite clicar atraves do overlay sem interferir na pilotagem.
  - Menu de Contexto: Clique com o BOTAO DIREITO DO MOUSE sobre qualquer
    overlay para travar, destravar, alterar cores ou fechar a janela.

* Radar e Standings (Broadcasting UDP):
  Conexao nativa na porta 9000 do ACC para exibir os adversarios reais,
  gaps em segundos, paradas nos boxes e proximidade fisica (Radar 360).

* Tracado de Pistas por GPS:
  Desenha a pista dinamicamente a partir das coordenadas fisicas reais
  do carro no mundo (worldX e worldZ), garantindo fidelidade total.

* Protecao Anti-Crash:
  Acesso seguro a memoria compartilhada (Shared Memory) para garantir
  que o jogo nunca entre em conflito, seja aberto antes ou depois.

--------------------------------------------------------------------
3. CONFIGURACAO RECOMENDADA NO SIMULADOR
--------------------------------------------------------------------
* Modo de Tela:
  Execute o jogo em "Modo Janela Sem Bordas" (Borderless Windowed) para
  que os overlays flutuantes fiquem visiveis sobre o jogo.

* Assetto Corsa Competizione (ACC):
  Certifique-se de que o arquivo em:
  Documentos\Assetto Corsa Competizione\Config\broadcasting.json
  contenha:
  {
    "updListenerPort": 9000,
    "connectionPassword": "asd",
    "commandPassword": ""
  }

Aproveite ao maximo sua telemetria e boas corridas!
Desenvolvido por Karel Tlach.
====================================================================
