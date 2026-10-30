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

// Medidas de tela. "Ratio" é fração da altura da tela, para o layout não depender da resolução.
export const LAYOUT = {
  button: { width: 280, height: 64, borderWidth: 2, hoverScale: 1.05 },
  menu: { titleYRatio: 0.3, firstButtonYRatio: 0.58, buttonGap: 80 },
  ranking: { titleYRatio: 0.2, messageYRatio: 0.45, backButtonYRatio: 0.8 },
  // O jogador fica à frente dos inimigos (depth 0): eles são criados depois dele e, sem
  // isso, o cobririam ao se cruzarem.
  level: { groundBorderWidth: 2, playerDepth: 1 },
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
  // As poses são imagens estáticas: uma leve compressão vertical simula respiração e
  // evita que o personagem pareça uma foto colada no cenário.
  breathing: { minScaleRatio: 0.97 },
  // Transparência mínima ao piscar durante a invencibilidade: visível, mas claramente diferente.
  blink: { alpha: 0.3 },
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
