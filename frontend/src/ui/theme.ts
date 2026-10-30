// Única fonte de cores, fontes e tempos visuais do jogo. Nenhum outro arquivo usa hexadecimal
// ou nome de fonte diretamente, para que a identidade visual mude em um só lugar.

export const COLORS = {
  background: 0x0d0a14,
  panel: 0x2a1638,
  panelBorder: 0x7a4fa0,
  accent: 0xff7a1a,
  text: 0xe8dcc4,
  textMuted: 0x9a8aa8,
  magic: 0x7dff8a,
  danger: 0xc0233a,
} as const;

// "Press Start 2P" precisa de aspas: no CSS, um nome com palavra iniciada por dígito
// só é válido entre aspas, e o Phaser repassa este texto para o canvas como CSS.
export const FONTS = {
  title: 'Cinzel',
  body: 'Cinzel',
  hud: '"Press Start 2P"',
} as const;

export const FONT_SIZES = {
  title: '64px',
  heading: '40px',
  button: '24px',
  body: '18px',
  hud: '12px',
  // Pontuação que sobe do inimigo morto: maior que o HUD para ser lida no meio da luta.
  floatingScore: '20px',
  table: '16px',
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 32,
  xl: 64,
} as const;

export const TIMING_MS = {
  fast: 120,
  normal: 300,
  slow: 800,
} as const;

// Medidas de tela. "YRatio" é fração da altura e "XRatio" fração da largura da tela, para o
// layout não depender da resolução.
export const LAYOUT = {
  // disabledAlpha: botão esmaecido deixa claro que o clique não vai funcionar agora.
  button: { width: 280, height: 64, borderWidth: 2, hoverScale: 1.05, disabledAlpha: 0.5 },
  menu: { titleYRatio: 0.3, firstButtonYRatio: 0.58, buttonGap: 80 },
  ranking: {
    titleYRatio: 0.1,
    tableTopYRatio: 0.2,
    rowHeight: 38,
    // Colunas: posição, nick (com a marca "inspetor" logo depois), pontos e tempo. Pontos e
    // tempo são alinhados à direita, para os dígitos ficarem em coluna.
    columns: { rankXRatio: 0.17, nicknameXRatio: 0.24, scoreXRatio: 0.72, timeXRatio: 0.84 },
    messageYRatio: 0.45,
    retryButtonYRatio: 0.6,
    backButtonYRatio: 0.9,
  },
  result: {
    titleYRatio: 0.1,
    // Entre o título e o painel de pontos: a primeira coisa lida depois do título.
    outcomeYRatio: 0.17,
    breakdownTopYRatio: 0.2,
    breakdownWidth: 640,
    breakdownRowHeight: 40,
    noteYRatio: 0.55,
    nicknameLabelYRatio: 0.62,
    nicknameInputYRatio: 0.68,
    feedbackYRatio: 0.75,
    buttonsYRatio: 0.86,
    // Distância entre os centros dos dois botões: largura do botão mais um respiro.
    buttonsGap: 320,
  },
  // Campo HTML de nick, em unidades do jogo (1280×720); o overlay converte para pixels da
  // página conforme a escala do canvas.
  nicknameInput: { width: 360, height: 52, fontSizePx: 22, borderWidth: 2 },
  // O jogador fica à frente dos inimigos (depth 0): eles são criados depois dele e, sem
  // isso, o cobririam ao se cruzarem.
  level: {
    groundBorderWidth: 2,
    playerDepth: 1,
    // Marcadores provisórios, desenhados com retângulos até existir arte própria. A bandeira
    // tem mais ou menos a altura do cavaleiro (128px), para ser vista de longe.
    checkpointFlag: { poleWidth: 6, poleHeight: 140, bannerWidth: 48, bannerHeight: 32 },
    // Portal da saída: largo e translúcido, lido como "passagem" e não como parede.
    exitPortal: { width: 96, height: 200, alpha: 0.35 },
    // px que o texto flutuante sobe enquanto some.
    floatingTextRise: 48,
  },
  // Barra de vida do chefe no topo da tela, abaixo da linha do HUD (velas e tempo).
  bossBar: { width: 560, height: 16, borderWidth: 2, topY: 56, labelGap: 8 },
  hud: {
    // Acima da vinheta (depth 1000): senão o escurecimento das bordas apagaria o HUD,
    // que fica justamente nos cantos.
    depth: 1001,
    candle: { width: 10, height: 24, flameWidth: 6, flameHeight: 8, gap: 8 },
    // Zeros à esquerda mantêm a largura do número fixa enquanto a pontuação muda.
    scoreDigits: 6,
  },
} as const;

export const EFFECTS = {
  vignette: {
    // Acima de tudo que existe no mundo e na interface, para escurecer as bordas de qualquer tela.
    depth: 1000,
    // Raios como fração da largura: dentro do interno nada escurece; no externo, edgeAlpha.
    innerRadiusRatio: 0.3,
    outerRadiusRatio: 0.75,
    edgeAlpha: 0.85,
  },
  // Duas camadas em velocidades diferentes criam sensação de profundidade (paralaxe).
  // A deriva é um movimento ambiente contínuo, não uma transição, por isso não usa TIMING_MS.
  fogLayers: [
    { heightRatio: 0.45, alpha: 0.35, driftDurationMs: 60_000 },
    { heightRatio: 0.3, alpha: 0.55, driftDurationMs: 35_000 },
  ],
  // Camadas de fundo da fase, da mais distante para a mais próxima. parallaxFactor é a fração
  // do movimento da câmera que a camada acompanha: a distante anda menos, o que cria
  // profundidade. Mais opacas que a névoa do menu, para o tingimento por trecho ser visível.
  levelBackgroundLayers: [
    { heightRatio: 0.75, alpha: 0.5, parallaxFactor: 0.2 },
    { heightRatio: 0.45, alpha: 0.75, parallaxFactor: 0.5 },
  ],
  // Profundidade do fundo: atrás do chão, dos personagens e de tudo o que é criado depois.
  levelBackgroundDepth: -1,
  // Véu de cor do trecho, atrás das camadas. Fraco o bastante para não competir com os
  // personagens, forte o bastante para a cor do trecho ser notada.
  levelBackgroundWash: { alpha: 0.18, depth: -2 },
  // As poses são imagens estáticas: uma leve compressão vertical simula respiração e
  // evita que o personagem pareça uma foto colada no cenário.
  breathing: { minScaleRatio: 0.97 },
  // Transparência mínima ao piscar durante a invencibilidade: visível, mas claramente diferente.
  blink: { alpha: 0.3 },
  // Sangue à frente dos personagens (o jogador está em depth 1), para as gotas não sumirem
  // atrás do corpo de quem foi atingido.
  blood: { depth: 2 },
  // Camadas de tela (scrollFactor 0) entre a vinheta (1000) e o HUD (1001). Acima da vinheta
  // para o vermelho e o escurecimento cobrirem a tela inteira por igual, inclusive as bordas;
  // abaixo do HUD porque é justamente ao levar dano ou morrer que o jogador olha as velas.
  // O flash fica acima do escurecimento: o golpe fatal ainda pisca antes de a tela apagar.
  deathShade: { depth: 1000.2, alpha: 0.78 },
  damageFlash: { depth: 1000.4, alpha: 0.35 },
} as const;

const HEX_RADIX = 16;
const CSS_HEX_LENGTH = 6;
const RED_SHIFT = 16;
const GREEN_SHIFT = 8;
const CHANNEL_MASK = 0xff;

// O Phaser usa cores numéricas em formas, mas texto e canvas exigem cores no formato CSS.
export function cssColor(color: number): string {
  return `#${color.toString(HEX_RADIX).padStart(CSS_HEX_LENGTH, '0')}`;
}

export function cssRgba(color: number, alpha: number): string {
  const red = (color >> RED_SHIFT) & CHANNEL_MASK;
  const green = (color >> GREEN_SHIFT) & CHANNEL_MASK;
  const blue = color & CHANNEL_MASK;
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}
