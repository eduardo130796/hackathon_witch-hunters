import Phaser from 'phaser';
import {
  PLACEHOLDER_GROUND_HEIGHT,
  PLACEHOLDER_INNOCENT_SPAWNS,
  PLACEHOLDER_PLAYER_START_X_RATIO,
  PLACEHOLDER_WITCH_SPAWNS,
} from '../config/balance';
import type { EnemyPlacement } from '../entities/Enemy';
import { Innocent } from '../entities/Innocent';
import { Player } from '../entities/Player';
import { Witch } from '../entities/Witch';
import { CombatSystem } from '../systems/CombatSystem';
import { EffectsSystem } from '../systems/EffectsSystem';
import { PlayerInput } from '../systems/PlayerInput';
import { ScoreTracker } from '../systems/ScoreTracker';
import { Hud } from '../ui/Hud';
import { addVignette } from '../ui/effects/Vignette';
import { COLORS, LAYOUT } from '../ui/theme';
import { SCENE_KEYS } from './scene-keys';

interface SpawnPoint {
  xRatio: number;
  patrolHalfWidth: number;
}

// Fase provisória: chão, personagem, inimigos e HUD, para validar combate e pontuação antes
// do mapa de levels/level-01.ts existir.
export class LevelScene extends Phaser.Scene {
  // Atribuídos em create(), que o Phaser sempre executa antes do primeiro update().
  private player!: Player;
  private playerInput!: PlayerInput;
  private enemies!: (Witch | Innocent)[];
  private combat!: CombatSystem;
  private scoreTracker!: ScoreTracker;
  private hud!: Hud;

  constructor() {
    super(SCENE_KEYS.level);
  }

  create(): void {
    addVignette(this);
    const groundTop = this.scale.height - PLACEHOLDER_GROUND_HEIGHT;
    const ground = this.createGround(groundTop);

    // A origem do Player fica nos pés, então ele nasce exatamente sobre o chão.
    const effects = new EffectsSystem(this.tweens);
    this.player = new Player(
      this,
      this.scale.width * PLACEHOLDER_PLAYER_START_X_RATIO,
      groundTop,
      effects,
    ).setDepth(LAYOUT.level.playerDepth);
    this.playerInput = new PlayerInput(this);

    const witches = PLACEHOLDER_WITCH_SPAWNS.map(
      (spawn) => new Witch(this, this.placementAt(spawn, groundTop), this.player),
    );
    const innocents = PLACEHOLDER_INNOCENT_SPAWNS.map(
      (spawn) => new Innocent(this, this.placementAt(spawn, groundTop)),
    );
    this.enemies = [...witches, ...innocents];
    this.physics.add.collider([this.player, ...this.enemies], ground);

    // Relógio do laço do jogo, e não this.time.now: o relógio da cena só é sincronizado no
    // primeiro update, então aqui no create ele ainda guarda o instante em que o jogo abriu.
    this.scoreTracker = new ScoreTracker(() => this.game.loop.time);
    this.combat = new CombatSystem({
      player: this.player,
      witches,
      innocents,
      scoreTracker: this.scoreTracker,
    });
    this.hud = new Hud(this);
  }

  // Ordem: primeiro todos se movem, depois o combate compara as posições finais do quadro e,
  // por último, o HUD mostra o resultado.
  update(): void {
    this.player.update(this.playerInput);
    for (const enemy of this.enemies) {
      enemy.update();
    }
    this.combat.update();
    this.hud.render(this.player.getHealth(), this.scoreTracker.getCounters());
  }

  private createGround(groundTop: number): Phaser.GameObjects.Rectangle {
    const { width } = this.scale;
    const ground = this.add
      .rectangle(
        width / 2,
        groundTop + PLACEHOLDER_GROUND_HEIGHT / 2,
        width,
        PLACEHOLDER_GROUND_HEIGHT,
        COLORS.panel,
      )
      .setStrokeStyle(LAYOUT.level.groundBorderWidth, COLORS.panelBorder);
    this.physics.add.existing(ground, true);
    return ground;
  }

  private placementAt(spawn: SpawnPoint, groundY: number): EnemyPlacement {
    const x = this.scale.width * spawn.xRatio;
    return {
      x,
      groundY,
      patrolFromX: x - spawn.patrolHalfWidth,
      patrolToX: x + spawn.patrolHalfWidth,
    };
  }
}
