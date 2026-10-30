import Phaser from 'phaser';
import { INNOCENT_POSES, innocentTextureKey } from '../entities/Innocent';
import { PLAYER_STATES, playerTextureKey } from '../entities/Player';
import { WITCH_POSES, witchTextureKey } from '../entities/Witch';
import { addVignette } from '../ui/effects/Vignette';
import { waitForGameFonts } from '../ui/load-fonts';
import { SCENE_KEYS } from './scene-keys';

const SPRITES_PATH = 'assets/sprites';

interface SpriteFile {
  key: string;
  url: string;
}

// Cada personagem tem uma pasta com um PNG por pose (walk.png, hurt.png...), e a chave da
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

const SPRITE_FILES: readonly SpriteFile[] = [
  ...spriteFiles('knight', PLAYER_STATES, playerTextureKey),
  ...spriteFiles('witch', WITCH_POSES, witchTextureKey),
  ...spriteFiles('innocent', INNOCENT_POSES, innocentTextureKey),
];

// Primeira cena: não desenha texto nenhum. Carrega as imagens e garante que as fontes
// chegaram antes do menu.
export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.boot);
  }

  preload(): void {
    for (const file of SPRITE_FILES) {
      this.load.image(file.key, file.url);
    }
  }

  create(): void {
    addVignette(this);
    // pixelArt: true usa o pixel mais próximo ao redimensionar, ótimo para pixel art, mas
    // os personagens são ilustrações reduzidas à metade: sem filtro linear, as bordas
    // ficariam serrilhadas.
    for (const file of SPRITE_FILES) {
      this.textures.get(file.key).setFilter(Phaser.Textures.FilterMode.LINEAR);
    }
    void waitForGameFonts().then(() => this.scene.start(SCENE_KEYS.menu));
  }
}
