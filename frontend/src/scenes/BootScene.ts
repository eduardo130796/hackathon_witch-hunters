import Phaser from 'phaser';
import { INNOCENT_POSES, innocentTextureKey } from '../entities/Innocent';
import { KNIGHT_SHEET_KEY } from '../entities/knight-animations';
import { ENEMY_SHEETS } from '../entities/enemy-animations';
import { KNIGHT_FRAME_SIZE } from '../config/balance';
import { AUDIO_FILES } from '../config/audio-manifest';
import { LEVEL_01, type LevelSegment } from '../levels/level-01';
import { BACKGROUND_LAYER_NUMBERS, backgroundLayerKey } from '../systems/BackgroundSystem';
import { DEMON_BACKDROP_KEY } from '../systems/DemonArenaSystem';
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

// O inocente tem uma pasta com um PNG por pose (walk.png, hurt.png...), e a chave da
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

// Fundos dos trechos da fase: uma pasta por trecho, com o nome do id. Com arte em camadas,
// layer1.png (distante) a layer3.png (próxima); com imagem única, background.png. A chave da
// textura vem do backgroundKey em level-01.ts.
//
// Todos são pedidos, sem uma lista à parte de "quais existem": essa lista precisaria ser
// atualizada à mão e poderia esconder uma arte recém-adicionada. Se um arquivo faltar, o loader
// do Phaser registra o erro no console e segue sem travar; a textura simplesmente não existe, e
// o BackgroundSystem (via textures.exists) usa o fundo provisório só naquele trecho. O erro no
// console é útil: avisa qual arquivo de arte está faltando.
function backgroundFiles(segment: LevelSegment): SpriteFile[] {
  const folder = `${BACKGROUNDS_PATH}/${segment.backgroundFolder ?? segment.id}`;
  switch (segment.backgroundArt) {
    case 'layers':
      return BACKGROUND_LAYER_NUMBERS.map((layerNumber) => ({
        key: backgroundLayerKey(segment.backgroundKey, layerNumber),
        url: `${folder}/layer${layerNumber}.png`,
      }));
    case 'single':
      return [{ key: segment.backgroundKey, url: `${folder}/background.png` }];
    default:
      return [];
  }
}

// Arte do chefe final: o cenário da arena (a cena inteira, com o demônio) e as duas peças dos
// ataques. As chaves das peças são as que o DemonBoss usa.
const DEMON_FILES: readonly SpriteFile[] = [
  { key: DEMON_BACKDROP_KEY, url: `${SPRITES_PATH}/demon-boss/body.png` },
  { key: 'demon-boss-claw', url: `${SPRITES_PATH}/demon-boss/claw.png` },
  { key: 'demon-boss-fireball', url: `${SPRITES_PATH}/demon-boss/fireball.png` },
];

const IMAGE_FILES: readonly SpriteFile[] = [
  ...spriteFiles('innocent', INNOCENT_POSES, innocentTextureKey),
  ...LEVEL_01.segments.flatMap(backgroundFiles),
  ...DEMON_FILES,
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
    // Inimigos com sprite sheet (bruxa, lobo, lobisomem): grade e arquivo vêm de enemy-animations.ts.
    for (const sheet of ENEMY_SHEETS) {
      this.load.spritesheet(sheet.textureKey, `${SPRITES_PATH}/${sheet.fileName}`, {
        frameWidth: sheet.frameWidth,
        frameHeight: sheet.frameHeight,
      });
    }
  }

  create(): void {
    addVignette(this);
    // pixelArt: true usa o pixel mais próximo ao redimensionar, ótimo para pixel art, mas
    // personagens e fundos são ilustrações redimensionadas: sem filtro linear, as bordas
    // ficariam serrilhadas.
    const enemySheetKeys = ENEMY_SHEETS.map((sheet) => sheet.textureKey);
    for (const key of [
      ...IMAGE_FILES.map((file) => file.key),
      KNIGHT_SHEET_KEY,
      ...enemySheetKeys,
    ]) {
      this.textures.get(key).setFilter(Phaser.Textures.FilterMode.LINEAR);
    }
    void waitForGameFonts().then(() => this.scene.start(SCENE_KEYS.menu));
  }
}
