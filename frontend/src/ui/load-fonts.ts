import { FONTS } from './theme';

// O Phaser desenha texto em canvas uma única vez: se a fonte web ainda não carregou,
// o texto fica com a fonte padrão do navegador e não é redesenhado depois.
const FONT_FACES = [`1em ${FONTS.body}`, `bold 1em ${FONTS.title}`, `1em ${FONTS.hud}`];

export async function waitForGameFonts(): Promise<void> {
  // allSettled em vez de all: sem internet o jogo segue com a fonte reserva, em vez de travar no boot.
  await Promise.allSettled(FONT_FACES.map((fontFace) => document.fonts.load(fontFace)));
}
