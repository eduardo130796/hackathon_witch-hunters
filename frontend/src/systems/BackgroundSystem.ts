import Phaser from 'phaser';
import type { LevelSegment } from '../levels/level-01';
import { LocationTitle } from '../ui/components/LocationTitle';
import { ensureFogTexture } from '../ui/effects/FogLayer';
import {
  COLORS,
  EFFECTS,
  SEGMENT_PLACEHOLDER_TINTS,
  SEGMENT_TRANSITION,
  TIMING_MS,
} from '../ui/theme';

type BackgroundSegment = Pick<
  LevelSegment,
  'id' | 'backgroundKey' | 'backgroundArt' | 'displayName' | 'subtitle'
>;
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

// Trecho com imagem única (o trecho final, background.png): uma só camada, que já traz o chão
// de pedra onde o cavaleiro anda. Por isso scrollFactor 1, igual ao chão do jogo: com
// paralaxe, o chão desenhado deslizaria sob os pés do personagem. floorRatio é a altura do
// topo do chão de pedra na imagem (cerca de 524px de 724px), medida olhando o arquivo; a
// escala faz essa linha cair na linha dos pés (groundY), e a parte de baixo da imagem (os
// arcos sob a ponte) fica escondida atrás do chão do jogo e fora da tela.
const SINGLE_IMAGE_LAYER = { scrollFactor: 1, depth: -20, floorRatio: 0.724 } as const;

interface StripLayer {
  scrollFactor: number;
  depth: number;
}

// Números das camadas de arte (1, 2, 3), para a BootScene carregar os arquivos certos.
export const BACKGROUND_LAYER_NUMBERS = ART_LAYERS.map((_, index) => index + 1);

// Nome da textura de uma camada: 'bg-graveyard' e 1 viram 'bg-graveyard-layer1'.
export function backgroundLayerKey(backgroundKey: string, layerNumber: number): string {
  return `${backgroundKey}-layer${layerNumber}`;
}

// Tingimento provisório, usado só quando falta a arte de um trecho (alguma das três camadas
// não carregou). Cemitério, catacumbas e arena têm imagens; neles as cores ficam como
// reserva, para um arquivo ausente deixar o trecho com a névoa tingida em vez de um fundo
// vazio. Hoje todos os trechos têm arte (a floresta usa a das ruínas, ver level-01.ts), então
// as cores são só essa reserva.
const PLACEHOLDER_TINT_BY_SEGMENT: Readonly<Record<string, number>> = {
  graveyard: COLORS.textMuted,
  forest: SEGMENT_PLACEHOLDER_TINTS.forest,
  catacombs: COLORS.panelBorder,
  'boss-arena': COLORS.danger,
  'final-stage': SEGMENT_PLACEHOLDER_TINTS.finalStage,
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
  // Ligado quando um cenário de tela cheia (a arena do demônio) cobre o fundo: daí em diante
  // nenhuma troca de trecho volta a acender as camadas por baixo dele.
  private coveredByBackdrop = false;
  private readonly world: { width: number; groundY: number };
  // Véu escuro e faixa de névoa que passam pela tela durante o crossfade (ver
  // SEGMENT_TRANSITION), para esconder a sobreposição dos dois cenários.
  private readonly veil: Phaser.GameObjects.Rectangle;
  private readonly fogSweep: Phaser.GameObjects.TileSprite;
  // Profundidade original de cada objeto: o trecho que sai é rebaixado durante o crossfade e
  // precisa voltar ao lugar certo depois.
  private readonly baseDepths = new Map<Fadeable, number>();
  // Agenda que devolve as profundidades ao fim do crossfade; cancelada a cada nova troca.
  private settleTimer?: Phaser.Time.TimerEvent;
  private readonly locationTitle: LocationTitle;
  private readonly segmentsById: ReadonlyMap<string, BackgroundSegment>;
  // Trechos cujo cartão de título já apareceu: o nome só surge na primeira entrada, e não a
  // cada vez que o jogador volta ou renasce no trecho.
  private readonly announcedSegments = new Set<string>();

  constructor(
    private readonly scene: Phaser.Scene,
    level: { segments: readonly BackgroundSegment[]; worldWidth: number; groundY: number },
  ) {
    this.world = { width: level.worldWidth, groundY: level.groundY };
    const { width, height } = scene.scale;
    // Tudo nasce invisível: switchBackground mostra só o conjunto do trecho atual.
    this.wash = scene.add
      .rectangle(0, 0, width, height, COLORS.background)
      .setOrigin(0)
      .setScrollFactor(0)
      .setAlpha(0)
      .setDepth(EFFECTS.levelBackgroundWash.depth);
    this.fogLayers = this.createFogLayers();
    for (const segment of level.segments) {
      const art =
        segment.backgroundArt === 'single'
          ? this.createSingleImage(segment.backgroundKey)
          : this.createArtLayers(segment.backgroundKey);
      if (art) {
        this.artBySegment.set(segment.id, art);
      }
    }
    for (const object of this.allObjects()) {
      this.baseDepths.set(object, object.depth);
    }
    this.veil = scene.add
      .rectangle(0, 0, width, height, COLORS.background)
      .setOrigin(0)
      .setScrollFactor(0)
      .setAlpha(0)
      .setDepth(SEGMENT_TRANSITION.veil.depth);
    this.fogSweep = this.createFogSweep();
    this.locationTitle = new LocationTitle(scene);
    this.segmentsById = new Map(level.segments.map((segment) => [segment.id, segment]));
  }

  // Chamado a cada quadro com a posição da câmera. As camadas de arte usam scrollFactor e o
  // Phaser as desloca sozinho; só a névoa, presa à tela, precisa ser movida aqui.
  update(cameraScrollX: number): void {
    for (const { sprite, config } of this.fogLayers) {
      sprite.tilePositionX = cameraScrollX * config.parallaxFactor;
    }
  }

  // Na primeira chamada aplica direto, para a fase não abrir com um fade. Nas seguintes, faz
  // um crossfade longo: o cenário novo surge por cima do antigo enquanto este some, com um
  // véu escuro e uma faixa de névoa passando no meio. Uma troca rápida pareceria um erro de
  // desenho, e não a chegada a outro lugar. Na primeira entrada em cada trecho, mostra o nome
  // do lugar.
  switchBackground(segmentId: string): void {
    if (segmentId === this.currentSegmentId || this.coveredByBackdrop) {
      return;
    }
    const isFirst = this.currentSegmentId === undefined;
    this.currentSegmentId = segmentId;
    this.applyPlaceholderTint(segmentId);
    if (isFirst) {
      for (const slot of this.slotsFor(segmentId)) {
        slot.object.setAlpha(slot.alpha);
      }
    } else {
      this.crossfadeTo(segmentId);
    }
    this.announce(segmentId);
  }

  // Cada objeto vai do alfa em que está agora até o alfa final (o do trecho novo, ou zero),
  // e todos os tweens anteriores são cancelados antes. Por isso ir e voltar rápido por uma
  // borda nunca empilha tweens nem deixa camada meio transparente: a última troca sempre
  // termina com cada objeto no alfa certo.
  private crossfadeTo(segmentId: string): void {
    const everything = this.allObjects();
    this.scene.tweens.killTweensOf(everything);
    this.settleTimer?.remove();
    const incoming = new Map(this.slotsFor(segmentId).map((slot) => [slot.object, slot.alpha]));
    for (const object of everything) {
      const targetAlpha = incoming.get(object);
      const baseDepth = this.baseDepths.get(object) ?? object.depth;
      // O que sai desce para baixo de todo o conjunto novo, e o que entra volta à
      // profundidade original: assim as camadas dos dois trechos não se intercalam.
      object.setDepth(
        targetAlpha === undefined ? baseDepth + SEGMENT_TRANSITION.outgoingDepthOffset : baseDepth,
      );
      // Camadas de outros trechos, já apagadas, não precisam de tween.
      if (object.alpha === (targetAlpha ?? 0)) {
        continue;
      }
      this.scene.tweens.add({
        targets: object,
        alpha: targetAlpha ?? 0,
        duration: SEGMENT_TRANSITION.crossfadeMs,
        ease: 'Sine.easeInOut',
      });
    }
    this.settleTimer = this.scene.time.delayedCall(SEGMENT_TRANSITION.crossfadeMs, () =>
      this.restoreDepths(),
    );
    this.pulseSeamCover();
  }

  // Véu e névoa sobem até o pico na metade do crossfade e voltam a zero no fim. Começam do
  // alfa atual, para uma troca no meio de outra não piscar.
  private pulseSeamCover(): void {
    const halfMs = SEGMENT_TRANSITION.crossfadeMs / 2;
    const pulses = [
      { target: this.veil, peakAlpha: SEGMENT_TRANSITION.veil.peakAlpha },
      { target: this.fogSweep, peakAlpha: SEGMENT_TRANSITION.fogSweep.peakAlpha },
    ];
    for (const { target, peakAlpha } of pulses) {
      this.scene.tweens.killTweensOf(target);
      this.scene.tweens.add({
        targets: target,
        alpha: peakAlpha,
        duration: halfMs,
        ease: 'Sine.easeOut',
        onComplete: () => {
          this.scene.tweens.add({
            targets: target,
            alpha: 0,
            duration: halfMs,
            ease: 'Sine.easeIn',
          });
        },
      });
    }
    this.scene.tweens.add({
      targets: this.fogSweep,
      tilePositionX: this.fogSweep.tilePositionX + SEGMENT_TRANSITION.fogSweep.distance,
      duration: SEGMENT_TRANSITION.crossfadeMs,
    });
  }

  private restoreDepths(): void {
    for (const [object, depth] of this.baseDepths) {
      object.setDepth(depth);
    }
  }

  private announce(segmentId: string): void {
    const segment = this.segmentsById.get(segmentId);
    if (!segment || this.announcedSegments.has(segmentId)) {
      return;
    }
    this.announcedSegments.add(segmentId);
    this.locationTitle.show(segment.displayName, segment.subtitle);
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

  // Faixa de névoa presa à tela, na cor do texto apagado da própria textura, acima do fundo e
  // abaixo do chão. Só aparece durante as trocas de trecho.
  private createFogSweep(): Phaser.GameObjects.TileSprite {
    const fogKey = ensureFogTexture(this.scene);
    const fogHeight = this.scene.textures.getFrame(fogKey).height;
    const { width, height } = this.scene.scale;
    const sweepHeight = height * SEGMENT_TRANSITION.fogSweep.heightRatio;
    return this.scene.add
      .tileSprite(0, height - sweepHeight, width, sweepHeight, fogKey)
      .setOrigin(0)
      .setScrollFactor(0)
      .setAlpha(0)
      .setDepth(SEGMENT_TRANSITION.fogSweep.depth)
      .setTileScale(1, sweepHeight / fogHeight);
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
    const { height } = this.scene.scale;
    return ART_LAYERS.flatMap((layer, index) => {
      const key = backgroundLayerKey(backgroundKey, index + 1);
      // Ajustada à altura da tela (724px viram 720px).
      return this.createMirroredStrip(
        key,
        layer,
        height / this.scene.textures.getFrame(key).height,
      );
    });
  }

  // Imagem única: a mesma fileira espelhada das camadas, só que uma vez, na escala que põe o
  // chão de pedra da ilustração na linha dos pés (ver SINGLE_IMAGE_LAYER). Sem a textura, o
  // trecho usa o tingimento provisório, como nas camadas.
  private createSingleImage(key: string): Phaser.GameObjects.Image[] | undefined {
    if (!this.scene.textures.exists(key)) {
      return undefined;
    }
    const floorY = this.scene.textures.getFrame(key).height * SINGLE_IMAGE_LAYER.floorRatio;
    return this.createMirroredStrip(key, SINGLE_IMAGE_LAYER, this.world.groundY / floorY);
  }

  // Esconde de vez o fundo da fase, com o mesmo fade das trocas, para um cenário de tela
  // cheia (a arena do demônio) ocupar o lugar dele. Depois disso as trocas de trecho são
  // ignoradas.
  hideForBackdrop(): void {
    this.coveredByBackdrop = true;
    this.settleTimer?.remove();
    this.restoreDepths();
    this.locationTitle.hide();
    const everything = [...this.allObjects(), this.veil, this.fogSweep];
    this.scene.tweens.killTweensOf(everything);
    this.scene.tweens.add({ targets: everything, alpha: 0, duration: TIMING_MS.slow });
  }

  // Uma camada é uma fileira de cópias da ilustração, alternando normal e espelhada. As
  // imagens não foram pintadas para repetir: a borda direita não casa com a esquerda, e uma
  // repetição simples (TileSprite) mostrava uma emenda vertical. Espelhando uma cópia sim,
  // outra não, cada borda encosta no seu próprio reflexo, e a junção some. Usar Images com
  // flipX não cria texturas novas nem telas gigantes, que passariam do limite de 4096px de
  // muitas placas de vídeo.
  // A escala é a mesma nos dois eixos, para não distorcer a ilustração.
  private createMirroredStrip(
    key: string,
    layer: StripLayer,
    scale: number,
  ): Phaser.GameObjects.Image[] {
    const { width } = this.scene.scale;
    const copyWidth = this.scene.textures.getFrame(key).width * scale;
    // Com scrollFactor f, a camada se desloca f × scrollX na tela. Começando em x = 0, para
    // a borda direita nunca entrar na tela a fileira precisa medir a tela mais o quanto ela
    // anda no fim da fase: largura + rolagem × f. Ex.: com o mundo de 6920px, a rolagem vai
    // até 5640px; a layer3 (0.8) precisa de 1280 + 4512 = 5792px (3 cópias de cerca de
    // 2160px), e a layer1 (0.2), de 2408px (2 cópias).
    const cameraScrollRange = this.world.width - width;
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
