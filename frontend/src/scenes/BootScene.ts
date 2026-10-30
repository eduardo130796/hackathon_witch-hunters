import Phaser from 'phaser';
import { INNOCENT_POSES, innocentTextureKey } from '../entities/Innocent';
import { KNIGHT_SHEET_KEY } from '../entities/knight-animations';
import { WITCH_POSES, witchTextureKey } from '../entities/Witch';
import { KNIGHT_FRAME_SIZE } from '../config/balance';
import { AUDIO_FILES } from '../config/audio-manifest';
import { LEVEL_01 } from '../levels/level-01';
import { BACKGROUND_LAYER_NUMBERS, backgroundLayerKey } from '../systems/BackgroundSystem';
import { addVignette } from '../ui/effects/Vignette';
import { waitForGameFonts } from '../ui/load-fonts';
import { SCENE_KEYS } from './scene-keys';

const SPRITES_PATH = 'assets/sprites';
const BACKGROUNDS_PATH = 'assets/backgrounds';
// Versão limpa da sheet: fundo transparente e grade uniforme. A original tem fundo escuro
// opaco e linhas de alturas diferentes, que fariam um quadro invadir o vizinho.
const KNIGHT_SHEET_URL = `${SPRITES_PATH}/knight-sheet-transparent.png`;

interface SpriteFile {
  key: string;
  url: string;
}

// Bruxa e inocente têm uma pasta com um PNG por pose (walk.png, hurt.png...), e a chave da
// textura vem da própria entidade, para os nomes não se repetirem em dois lugares.
function spriteFiles<Pose extends string>(
  folder: string,
  poses: readonly Pose[],
  textureKey: (pose: Pose) => string,
): SpriteFile[] {
  return poses.map((pose) => ({
    key: textureKey(pose),
    url: `${SPRITES_PATH}/${folder}/${pose}.png`,
  }));
}

// Fundos de todos os trechos da fase: uma pasta por trecho, com o nome do id, e layer1.png
// (distante) a layer3.png (próxima). A chave da textura vem do backgroundKey em level-01.ts.
//
// Todos são pedidos, sem uma lista à parte de "quais existem": essa lista precisaria ser
// atualizada à mão e poderia esconder uma arte recém-adicionada. Se um arquivo faltar, o loader
// do Phaser registra o erro no console e segue sem travar; a textura simplesmente não existe, e
// o BackgroundSystem (via textures.exists) usa o fundo provisório só naquele trecho. O erro no
// console é útil: avisa qual arquivo de arte está faltando.
const BACKGROUND_FILES: SpriteFile[] = LEVEL_01.segments.flatMap((segment) =>
  BACKGROUND_LAYER_NUMBERS.map((layerNumber) => ({
    key: backgroundLayerKey(segment.backgroundKey, layerNumber),
    url: `${BACKGROUNDS_PATH}/${segment.id}/layer${layerNumber}.png`,
  })),
);

const IMAGE_FILES: readonly SpriteFile[] = [
  ...spriteFiles('witch', WITCH_POSES, witchTextureKey),
  ...spriteFiles('innocent', INNOCENT_POSES, innocentTextureKey),
  ...BACKGROUND_FILES,
];

// Primeira cena: não desenha texto nenhum. Carrega as imagens e garante que as fontes
// chegaram antes do menu.
export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.boot);
  }

  preload(): void {
    for (const file of IMAGE_FILES) {
      this.load.image(file.key, file.url);
    }
    // Sons e músicas vêm do manifesto, que só lista arquivos presentes na pasta.
    for (const file of AUDIO_FILES) {
      this.load.audio(file.key, file.url);
    }
    // O cavaleiro é uma sprite sheet (grade uniforme de quadros), não uma imagem por pose:
    // o Phaser fatia a imagem em quadros numerados, que as animações do Player percorrem.
    this.load.spritesheet(KNIGHT_SHEET_KEY, KNIGHT_SHEET_URL, {
      frameWidth: KNIGHT_FRAME_SIZE,
      frameHeight: KNIGHT_FRAME_SIZE,
    });
  }

  create(): void {
    addVignette(this);
    // pixelArt: true usa o pixel mais próximo ao redimensionar, ótimo para pixel art, mas
    // personagens e fundos são ilustrações redimensionadas: sem filtro linear, as bordas
    // ficariam serrilhadas.
    for (const key of [...IMAGE_FILES.map((file) => file.key), KNIGHT_SHEET_KEY]) {
      this.textures.get(key).setFilter(Phaser.Textures.FilterMode.LINEAR);
    }
    void waitForGameFonts().then(() => this.scene.start(SCENE_KEYS.menu));
  }
}
