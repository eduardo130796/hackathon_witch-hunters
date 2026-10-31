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
  menu: { titleYRatio: 0.3, firstButtonYRatio: 0.52, buttonGap: 80 },
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
    // px acima do chão onde nascem os avisos flutuantes: um pouco mais que a altura do
    // cavaleiro (128px), para o texto não cobrir o personagem.
    floatingTextHeight: 140,
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

// --- Diálogo narrativo e fundos provisórios dos trechos novos ---

// Painel de fala na base da tela, no estilo dos painéis góticos (fundo panel, borda
// panelBorder). Acima do HUD (1001): enquanto alguém fala, o texto é o mais importante na tela.
export const DIALOGUE_BOX = {
  width: 1120,
  height: 168,
  // Distância do topo da tela: abaixo do HUD e da barra de chefe (que termina perto de y=90)
  // e bem acima dos personagens (pés em y=656). Embaixo, o painel escondia quem está falando.
  topMargin: 112,
  borderWidth: 2,
  padding: 24,
  speakerGap: 12,
  depth: 1002,
  speakerFontSize: '22px',
  textFontSize: '20px',
  // Aviso discreto de como avançar, no canto inferior direito do painel.
  hintFontSize: '14px',
} as const;

// Tingimento provisório dos trechos sem arte de fundo própria. A floresta é verde-acinzentada
// escura (mata fechada à noite); o trecho final, vermelho-alaranjado intenso, destaca o clímax.
export const SEGMENT_PLACEHOLDER_TINTS = {
  forest: 0x3a4a3c,
  finalStage: 0xe0451c,
} as const;

// --- Chefe demônio (só visual) ---
export const DEMON_VISUALS = {
  // Ataques à frente do cavaleiro (depth 1) e do sangue (2): o perigo nunca fica escondido.
  attackDepth: 3,
  // Destaque do ponto fraco: pulsa entre os dois alfas enquanto ele está exposto.
  weakPoint: { depth: 0.5, minAlpha: 0.15, maxAlpha: 0.6 },
  // Anel cinza que se abre no ponto fraco quando o golpe é bloqueado.
  blockedRing: { lineWidth: 4, endScale: 1.6 },
  // Explosão da bola de fogo: partículas laranja e vermelhas em todas as direções.
  explosion: {
    count: 18,
    speedMin: 120,
    speedMax: 360,
    gravityY: 500,
    scale: 2.2,
    lifespanMs: 550,
    radius: 4,
  },
} as const;

// --- Abertura da história (StoryScene) ---
export const STORY_LAYOUT = {
  // Fundo do slide bem apagado: o cenário dá o clima, mas o texto continua legível sobre ele.
  backgroundAlpha: 0.3,
  titleYRatio: 0.3,
  // Topo do texto (origem no alto): linhas novas crescem para baixo sem empurrar o título.
  textTopYRatio: 0.4,
  textWidth: 880,
  textFontSize: '26px',
  lineSpacing: 10,
  hintYRatio: 0.92,
  hintFontSize: '14px',
  // Acima da vinheta (1000), para o texto e o aviso não serem escurecidos nas bordas.
  textDepth: 1001,
} as const;

// --- Tela "Como jogar" (HowToPlayScene) ---
export const HOW_TO_PLAY_LAYOUT = {
  titleYRatio: 0.1,
  headingYRatio: 0.2,
  firstRowYRatio: 0.28,
  rowHeight: 40,
  // Controles à esquerda (ação e teclas), dicas à direita. A coluna de teclas é larga para
  // caber "W / Espaço / Seta para cima"; as dicas quebram linha e cedem o espaço.
  actionXRatio: 0.08,
  keysXRatio: 0.28,
  tipsXRatio: 0.6,
  tipsWidthRatio: 0.34,
  tipGap: 14,
  backButtonYRatio: 0.9,
} as const;

// --- Vitória na tela de resultado (VictoryBanner) ---
export const VICTORY_BANNER = {
  // Maior que o título comum das telas (heading, 40px): a vitória é o ápice da partida.
  titleFontSize: '72px',
  subtitleFontSize: '22px',
  // Brilho: sombra sem deslocamento e bem borrada, na própria cor do título.
  glowBlur: 24,
  // Margem da textura do texto: sem ela o borrão do brilho é cortado num retângulo rente às
  // letras. Igual ao glowBlur, para o brilho inteiro caber.
  glowPadding: 24,
  // Entrada: o título cresce de startScale até 1 em TIMING_MS.slow; depois respira até
  // pulseScale. A respiração é ambiente e contínua, não uma transição, por isso não usa
  // TIMING_MS (mesmo critério da deriva da névoa).
  startScale: 0.6,
  pulseScale: 1.04,
  pulseMs: 1600,
  // Brasas que sobem devagar pela tela, atrás do painel de pontos: celebração discreta, só
  // com círculos desenhados em código, sem textura.
  embers: {
    count: 28,
    minRadius: 1.5,
    maxRadius: 3.5,
    alpha: 0.7,
    minRiseMs: 4000,
    maxRiseMs: 7500,
    // px de deriva lateral máxima de cada brasa durante a subida.
    drift: 40,
  },
} as const;

// --- Transição entre trechos da fase (BackgroundSystem) e cartão de título (LocationTitle) ---
export const SEGMENT_TRANSITION = {
  // Crossfade longo: os dois cenários ficam visíveis e se misturam, e a troca parece a
  // chegada a outro lugar, não um corte. Mais de 1,5 s deixaria o fundo "sujo" por tempo demais.
  crossfadeMs: 1200,
  // Véu escuro que sobe até peakAlpha na metade do crossfade e volta a zero: esconde o
  // momento em que as camadas dos dois trechos se sobrepõem. Fica acima do fundo (até -1) e
  // abaixo do chão e dos personagens (0), para escurecer só o cenário.
  veil: { peakAlpha: 0.5, depth: -0.6 },
  // Faixa de névoa que atravessa a tela junto com o véu; distance é quantos px a textura
  // desliza durante o crossfade, para a névoa parecer soprada e não parada.
  fogSweep: { peakAlpha: 0.6, heightRatio: 0.8, distance: 320, depth: -0.5 },
  // O trecho que sai desce para esta faixa de profundidade enquanto some, para o que entra
  // ser desenhado inteiro por cima dele, sem camadas de um intercaladas com as do outro.
  outgoingDepthOffset: -100,
} as const;

export const LOCATION_TITLE = {
  // Abaixo do painel de diálogo (DIALOGUE_BOX: topo 112, altura 168, termina em y=280): o
  // cartão pode aparecer no mesmo momento em que alguém fala sem que um cubra o outro. E acima
  // das cabeças dos personagens (pés em y=656, cerca de 128px de altura).
  centerY: 340,
  // Acima da vinheta (1000), para não ser escurecido, e abaixo do escurecimento da morte
  // (1000.2), do HUD e do diálogo, que são mais importantes que o nome do lugar.
  depth: 1000.1,
  nameFontSize: '44px',
  subtitleFontSize: '18px',
  lineWidth: 420,
  lineThickness: 2,
  // Espaço entre a linha de cima, o nome, o subtítulo e a linha de baixo.
  gap: 12,
  shadowBlur: 8,
  // Contorno escuro do subtítulo: o texto fino some sobre céus claros ou vermelhos sem ele.
  subtitleStrokeThickness: 3,
  // px que o cartão sobe enquanto aparece: movimento discreto, de letreiro que surge.
  rise: 12,
  // Espera o crossfade passar da metade, para o nome surgir já sobre o cenário novo.
  enterDelayMs: 500,
  // Mesmo tempo para aparecer e sumir: o tween usa yoyo, que repete a duração na volta.
  fadeMs: TIMING_MS.slow,
  holdMs: 2200,
} as const;
