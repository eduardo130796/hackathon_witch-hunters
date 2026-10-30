import Phaser from 'phaser';
import type { LevelSegment } from '../levels/level-01';
import { ensureFogTexture } from '../ui/effects/FogLayer';
import { COLORS, EFFECTS, TIMING_MS } from '../ui/theme';

type BackgroundSegment = Pick<LevelSegment, 'id' | 'backgroundKey'>;
type FogConfig = (typeof EFFECTS.levelBackgroundLayers)[number];

// Camadas de arte real, da mais distante para a mais próxima. Valores de composição visual,
// e não de jogo, por isso ficam aqui, junto de quem desenha o fundo.
//
// scrollFactor é a fração do movimento da câmera que a camada acompanha. Na vida real, quando
// quem olha anda, o que está longe parece quase parado e o que está perto passa rápido: quanto
// mais distante a camada, menor o scrollFactor, e essa diferença de velocidade cria a ilusão
// de profundidade. Todas ficam abaixo de 1, que é a velocidade do chão e dos personagens.
//
// depth negativo põe as três atrás do chão (0), dos inimigos (0) e do jogador (1).
const ART_LAYERS = [
  // layer1: céu, lua e castelos no horizonte. 0.2: o mais distante, quase não se move.
  { scrollFactor: 0.2, depth: -30 },
  // layer2: ruínas, árvores e lápides a meia distância. 0.5: metade da velocidade da câmera.
  { scrollFactor: 0.5, depth: -20 },
  // layer3: mato, cercas quebradas e galhos em primeiro plano. 0.8: quase a velocidade do
  // chão. Decisão de profundidade, tomada olhando cada imagem: em todos os trechos ela fica
  // ATRÁS dos personagens. O mato é denso justamente na faixa de baixo, onde o cavaleiro e as
  // bruxas pisam; na frente, esconderia pernas, golpes e a pose de ataque da bruxa, que é o
  // aviso para desviar. Por trecho:
  //  - graveyard: mato e cercas embaixo, galhos só nos cantos de cima;
  //  - ruins: mato alto, cercas e cruzes embaixo; o que chega ao topo é névoa escura e galhos
  //    nos cantos, sem nada que valha cobrir o personagem;
  //  - catacombs: mesma composição, com um milharal seco no meio da altura do personagem;
  //  - boss-arena: mato e cogumelos brilhantes embaixo, árvores nos cantos.
  // Nenhuma tem um elemento fino e esparso (como galhos atravessando a tela) que justificasse
  // ficar na frente, por isso todas usam a mesma profundidade.
  { scrollFactor: 0.8, depth: -10 },
] as const;

// Números das camadas de arte (1, 2, 3), para a BootScene carregar os arquivos certos.
export const BACKGROUND_LAYER_NUMBERS = ART_LAYERS.map((_, index) => index + 1);

// Nome da textura de uma camada: 'bg-graveyard' e 1 viram 'bg-graveyard-layer1'.
export function backgroundLayerKey(backgroundKey: string, layerNumber: number): string {
  return `${backgroundKey}-layer${layerNumber}`;
}

// Tingimento provisório, usado só quando falta a arte de um trecho (alguma das três camadas
// não carregou). Hoje os quatro trechos têm imagens; as cores ficam como reserva, para um
// arquivo ausente deixar aquele trecho com a névoa tingida em vez de um fundo vazio, sem afetar
// os outros. A sequência fria, alaranjada, roxa e vermelha mantém a progressão até o chefe.
const PLACEHOLDER_TINT_BY_SEGMENT: Readonly<Record<string, number>> = {
  graveyard: COLORS.textMuted,
  ruins: COLORS.accent,
  catacombs: COLORS.panelBorder,
  'boss-arena': COLORS.danger,
};

type Fadeable =
  Phaser.GameObjects.TileSprite | Phaser.GameObjects.Rectangle | Phaser.GameObjects.Image;

// Um objeto de fundo e a transparência que ele tem quando seu trecho está na tela.
interface FadeSlot {
  object: Fadeable;
  alpha: number;
}

interface FogLayer {
  sprite: Phaser.GameObjects.TileSprite;
  config: FogConfig;
}

// Fundo da fase: arte real com paralaxe em cada trecho cujas três camadas carregaram
// (`${backgroundKey}-layer1`, `-layer2` e `-layer3`, por exemplo 'bg-ruins-layer1'), e um
// fundo provisório (névoa procedural tingida) só no trecho em que alguma estiver faltando.
export class BackgroundSystem {
  // Véu de cor atrás da névoa. setTint só é desenhado pelo renderizador WebGL; sem WebGL, o
  // Phaser usa Canvas e ignora o tingimento. O véu é um retângulo comum, visível nos dois.
  private readonly wash: Phaser.GameObjects.Rectangle;
  private readonly fogLayers: FogLayer[];
  private readonly artBySegment = new Map<string, Phaser.GameObjects.Image[]>();
  private currentSegmentId?: string;

  constructor(
    private readonly scene: Phaser.Scene,
    segments: readonly BackgroundSegment[],
    private readonly worldWidth: number,
  ) {
    const { width, height } = scene.scale;
    // Tudo nasce invisível: switchBackground mostra só o conjunto do trecho atual.
    this.wash = scene.add
      .rectangle(0, 0, width, height, COLORS.background)
      .setOrigin(0)
      .setScrollFactor(0)
      .setAlpha(0)
      .setDepth(EFFECTS.levelBackgroundWash.depth);
    this.fogLayers = this.createFogLayers();
    for (const segment of segments) {
      const art = this.createArtLayers(segment.backgroundKey);
      if (art) {
        this.artBySegment.set(segment.id, art);
      }
    }
  }

  // Chamado a cada quadro com a posição da câmera. As camadas de arte usam scrollFactor e o
  // Phaser as desloca sozinho; só a névoa, presa à tela, precisa ser movida aqui.
  update(cameraScrollX: number): void {
    for (const { sprite, config } of this.fogLayers) {
      sprite.tilePositionX = cameraScrollX * config.parallaxFactor;
    }
  }

  // Na primeira chamada aplica direto, para a fase não abrir com um fade. Nas seguintes,
  // apaga o fundo, troca e acende de novo: uma troca abrupta pareceria um erro de desenho, e
  // não a entrada em outro lugar.
  switchBackground(segmentId: string): void {
    if (segmentId === this.currentSegmentId) {
      return;
    }
    const isFirst = this.currentSegmentId === undefined;
    this.currentSegmentId = segmentId;
    if (isFirst) {
      this.applyPlaceholderTint(segmentId);
      for (const slot of this.slotsFor(segmentId)) {
        slot.object.setAlpha(slot.alpha);
      }
      return;
    }
    // Apaga todos os objetos, e não só os do trecho anterior: se um fade foi interrompido por
    // uma nova troca, nada fica meio visível. Os que já estão invisíveis não mudam.
    const everything = this.allObjects();
    this.scene.tweens.killTweensOf(everything);
    this.scene.tweens.add({
      targets: everything,
      alpha: 0,
      duration: TIMING_MS.normal,
      onComplete: () => {
        this.applyPlaceholderTint(segmentId);
        this.fadeIn(segmentId);
      },
    });
  }

  private fadeIn(segmentId: string): void {
    for (const slot of this.slotsFor(segmentId)) {
      this.scene.tweens.add({
        targets: slot.object,
        alpha: slot.alpha,
        duration: TIMING_MS.normal,
      });
    }
  }

  private slotsFor(segmentId: string): FadeSlot[] {
    const art = this.artBySegment.get(segmentId);
    if (art) {
      return art.map((object) => ({ object, alpha: 1 }));
    }
    return [
      { object: this.wash, alpha: EFFECTS.levelBackgroundWash.alpha },
      ...this.fogLayers.map(({ sprite, config }) => ({ object: sprite, alpha: config.alpha })),
    ];
  }

  private allObjects(): Fadeable[] {
    const art = [...this.artBySegment.values()].flat();
    return [this.wash, ...this.fogLayers.map((layer) => layer.sprite), ...art];
  }

  private applyPlaceholderTint(segmentId: string): void {
    if (this.artBySegment.has(segmentId)) {
      return;
    }
    const tint = PLACEHOLDER_TINT_BY_SEGMENT[segmentId] ?? COLORS.text;
    this.wash.setFillStyle(tint);
    for (const { sprite } of this.fogLayers) {
      sprite.setTint(tint);
    }
  }

  // Névoa presa à tela (scrollFactor 0); a paralaxe vem de mover a textura dentro da camada,
  // para ela nunca acabar no fim de um mundo mais largo que a tela.
  private createFogLayers(): FogLayer[] {
    const fogKey = ensureFogTexture(this.scene);
    const fogHeight = this.scene.textures.getFrame(fogKey).height;
    const { width, height } = this.scene.scale;
    return EFFECTS.levelBackgroundLayers.map((config) => {
      const layerHeight = height * config.heightRatio;
      const sprite = this.scene.add
        .tileSprite(0, height - layerHeight, width, layerHeight, fogKey)
        .setOrigin(0)
        .setScrollFactor(0)
        .setAlpha(0)
        .setDepth(EFFECTS.levelBackgroundDepth)
        // Estica a névoa para caber uma vez na altura, como no menu: repetida na vertical,
        // mostraria uma emenda reta. A altura vem da textura, e não de sprite.frame, que na
        // TileSprite é uma tela interna com tamanho em potência de 2.
        .setTileScale(1, layerHeight / fogHeight);
      return { sprite, config };
    });
  }

  // Devolve undefined se faltar alguma das imagens: um trecho só troca o placeholder pela
  // arte quando tem o conjunto completo, para não misturar névoa e ilustração.
  private createArtLayers(backgroundKey: string): Phaser.GameObjects.Image[] | undefined {
    const keys = BACKGROUND_LAYER_NUMBERS.map((number) =>
      backgroundLayerKey(backgroundKey, number),
    );
    if (!keys.every((key) => this.scene.textures.exists(key))) {
      return undefined;
    }
    return ART_LAYERS.flatMap((layer, index) =>
      this.createMirroredStrip(backgroundLayerKey(backgroundKey, index + 1), layer),
    );
  }

  // Uma camada é uma fileira de cópias da ilustração, alternando normal e espelhada. As
  // imagens não foram pintadas para repetir: a borda direita não casa com a esquerda, e uma
  // repetição simples (TileSprite) mostrava uma emenda vertical. Espelhando uma cópia sim,
  // outra não, cada borda encosta no seu próprio reflexo, e a junção some. Usar Images com
  // flipX não cria texturas novas nem telas gigantes, que passariam do limite de 4096px de
  // muitas placas de vídeo.
  private createMirroredStrip(
    key: string,
    layer: (typeof ART_LAYERS)[number],
  ): Phaser.GameObjects.Image[] {
    const { width, height } = this.scene.scale;
    const frame = this.scene.textures.getFrame(key);
    // Mesma escala nos dois eixos, para não distorcer a ilustração: ela é ajustada à altura
    // da tela (724px viram 720px).
    const scale = height / frame.height;
    const copyWidth = frame.width * scale;
    // Com scrollFactor f, a camada se desloca f × scrollX na tela. Começando em x = 0, para
    // a borda direita nunca entrar na tela a fileira precisa medir a tela mais o quanto ela
    // anda no fim da fase: largura + rolagem × f. Ex.: com o mundo de 6920px, a rolagem vai
    // até 5640px; a layer3 (0.8) precisa de 1280 + 4512 = 5792px (3 cópias de cerca de
    // 2160px), e a layer1 (0.2), de 2408px (2 cópias).
    const cameraScrollRange = this.worldWidth - width;
    const stripWidth = width + cameraScrollRange * layer.scrollFactor;
    const copies = Math.ceil(stripWidth / copyWidth);
    return Array.from({ length: copies }, (_, copyIndex) =>
      this.scene.add
        // Cópias sobrepostas em 1px: sem isso, o arredondamento da escala pode deixar uma
        // fresta de um pixel entre elas.
        .image(copyIndex * (copyWidth - 1), 0, key)
        .setOrigin(0)
        .setScale(scale)
        .setFlipX(copyIndex % 2 === 1)
        .setScrollFactor(layer.scrollFactor)
        .setAlpha(0)
        .setDepth(layer.depth),
    );
  }
}
