import Phaser from 'phaser';
import {
  DEMON_ARENA_WALL_WIDTH,
  DEMON_ARENA_WEAK_POINT_BOTTOM_Y,
  DEMON_WEAK_POINT,
} from '../config/balance';
import { DemonBoss } from '../entities/DemonBoss';
import type { Player } from '../entities/Player';
import { segmentAt, type DemonArenaLayout, type LevelLayout } from '../levels/level-01';
import { TIMING_MS } from '../ui/theme';
import type { BackgroundSystem } from './BackgroundSystem';
import type { BossBarSystem } from './BossBarSystem';
import type { CombatSystem } from './CombatSystem';
import type { EffectsSystem } from './EffectsSystem';

// Textura do cenário da arena (body.png): a cena inteira, já com o demônio pintado.
export const DEMON_BACKDROP_KEY = 'bg-final-stage-boss';

// Profundidade do cenário: acima das camadas de paralaxe (-30 a -10) e abaixo do destaque do
// ponto fraco (0.5), do chão e dos personagens (0 e 1).
const BACKDROP_DEPTH = -5;

interface DemonArenaDependencies {
  scene: Phaser.Scene;
  level: LevelLayout;
  player: Player;
  effects: EffectsSystem;
  combat: CombatSystem;
  background: BackgroundSystem;
  bossBars: BossBarSystem;
}

// Arena do chefe final. Ao cruzar layout.startX: câmera travada nos limites da arena, parede
// invisível na entrada, fundo trocado pelo cenário com o demônio e barra de vida no topo. A
// luta começa quando a fala de provocação termina.
//
// Respawn: a arena tem um ponto de controle logo depois da entrada (level-01.ts). Morrer na luta gasta
// uma tentativa, como qualquer morte (match-rules), e o jogador volta à entrada com um
// demônio novo, de vida cheia, que já começa a lutar (a fala não se repete).
export class DemonArenaSystem {
  private demon?: DemonBoss;
  private backdrop?: Phaser.GameObjects.Image;
  private wall?: { zone: Phaser.GameObjects.Zone; collider: Phaser.Physics.Arcade.Collider };
  private unlockedCameraBounds?: Phaser.Geom.Rectangle;
  private fightStarted = false;
  private defeated = false;
  private wasPlayerAlive = true;

  private readonly layout: DemonArenaLayout;

  constructor(private readonly deps: DemonArenaDependencies) {
    this.layout = deps.level.demonArena;
  }

  // Vitória: o demônio só avisa a derrota depois da animação de morte.
  isDemonDefeated(): boolean {
    return this.defeated;
  }

  // Chamado quando qualquer fala termina; só a provocação do demônio começa a luta.
  onTriggerComplete(triggerId: string): void {
    if (triggerId !== this.layout.tauntTriggerId) {
      return;
    }
    this.fightStarted = true;
    this.demon?.start();
  }

  // Chamado a cada quadro ANTES das falas: a arena trava no mesmo quadro em que o jogador
  // cruza a entrada, então a provocação nunca abre com a câmera ainda solta.
  enterIfReached(): void {
    if (!this.backdrop && this.deps.player.x >= this.layout.startX) {
      this.enter();
    }
  }

  // Chamado a cada quadro sem fala aberta: com a física pausada, o demônio também espera.
  update(): void {
    if (!this.backdrop) {
      return;
    }
    this.resetAfterRespawn();
    this.demon?.update();
  }

  private enter(): void {
    this.lockArena();
    this.backdrop = this.createBackdrop();
    this.deps.background.hideForBackdrop();
    const demon = this.createDemon(this.backdrop);
    this.deps.bossBars.register({
      // Lê o demônio atual, e não este: depois de um respawn ele é outra instância.
      enemy: { getHealthRatio: () => this.demon?.getHealthRatio() ?? 0 },
      label: demon.displayName,
      segmentId: segmentAt(this.deps.level, this.layout.startX).id,
    });
  }

  // Câmera do tamanho exato da arena (uma tela) e parede logo antes da entrada. Antes da
  // parede, o jogador é posto inteiro dentro da arena: um corpo já sobreposto à parede
  // atravessaria para o outro lado. Nenhuma bruxa do caminho
  // fica para trás da parede: o portão do trecho (SegmentGateSystem) exige todas mortas
  // antes da entrada.
  private lockArena(): void {
    const { scene, player } = this.deps;
    const { layout } = this;
    player.setX(Math.max(player.x, layout.left + player.getHurtbox().width));
    const camera = scene.cameras.main;
    this.unlockedCameraBounds = Phaser.Geom.Rectangle.Clone(camera.getBounds());
    camera.setBounds(layout.left, 0, layout.right - layout.left, scene.scale.height);
    const zone = scene.add
      .zone(layout.left - DEMON_ARENA_WALL_WIDTH, 0, DEMON_ARENA_WALL_WIDTH, scene.scale.height)
      .setOrigin(0);
    scene.physics.add.existing(zone, true);
    this.wall = { zone, collider: scene.physics.add.collider(player, zone) };
  }

  // Presa à tela (scrollFactor 0) e cobrindo-a inteira: centrada na horizontal, sem cortar o
  // topo (chifres). A escala é a maior entre cobrir a tela e levar a borda de baixo do ponto
  // fraco até DEMON_ARENA_WEAK_POINT_BOTTOM_Y, para ele ser alcançável com um golpe pulando.
  // Preço: a ponte pintada fica abaixo da tela; o cavaleiro pisa no chão do jogo (y 656).
  private createBackdrop(): Phaser.GameObjects.Image {
    const { scene } = this.deps;
    const { width, height } = scene.scale;
    const frame = scene.textures.getFrame(DEMON_BACKDROP_KEY);
    const scale = Math.max(
      width / frame.width,
      height / frame.height,
      DEMON_ARENA_WEAK_POINT_BOTTOM_Y / (frame.height * DEMON_WEAK_POINT.bottomRatio),
    );
    const image = scene.add
      .image(width / 2, 0, DEMON_BACKDROP_KEY)
      .setOrigin(0.5, 0)
      .setScale(scale)
      .setScrollFactor(0)
      .setDepth(BACKDROP_DEPTH)
      .setAlpha(0);
    scene.tweens.add({ targets: image, alpha: 1, duration: TIMING_MS.slow });
    return image;
  }

  private createDemon(backdrop: Phaser.GameObjects.Image): DemonBoss {
    const { scene, level, player, effects, combat } = this.deps;
    const { layout } = this;
    const demon = new DemonBoss({
      scene,
      arena: { left: layout.left, right: layout.right, groundY: level.groundY },
      player,
      effects,
      // Mesmo caminho do golpe de uma bruxa: flash, empurrão, invencibilidade e placar.
      onPlayerHit: (damage, sourceX, knockbackForce) =>
        combat.applyEnvironmentHit(damage, sourceX, knockbackForce),
      onDefeated: () => this.onDefeated(),
    });
    demon.setBackdrop(backdrop);
    combat.setDemon(demon);
    // A fala pode ter terminado antes de o demônio existir, ou ele foi recriado no respawn.
    if (this.fightStarted) {
      demon.start();
    }
    this.demon = demon;
    return demon;
  }

  // Observa a volta de morto para vivo, como o CombatFeedbackSystem: o respawn acontece no
  // LevelFlowSystem, que não precisa saber que a arena existe.
  private resetAfterRespawn(): void {
    const alive = this.deps.player.isAlive();
    const respawned = alive && !this.wasPlayerAlive;
    this.wasPlayerAlive = alive;
    if (!respawned || this.defeated || !this.backdrop) {
      return;
    }
    this.demon?.destroy();
    this.createDemon(this.backdrop);
  }

  // Destrava a arena depois da vitória sobre o demônio. Só importa se o chefe da arena
  // anterior ficou vivo para trás: a vitória exige os dois, e o jogador precisa poder voltar.
  private onDefeated(): void {
    this.defeated = true;
    this.deps.combat.setDemon(null);
    this.wall?.collider.destroy();
    this.wall?.zone.destroy();
    this.wall = undefined;
    const bounds = this.unlockedCameraBounds;
    if (bounds) {
      this.deps.scene.cameras.main.setBounds(bounds.x, bounds.y, bounds.width, bounds.height);
    }
  }
}
