import Phaser from 'phaser';
import { PLAYER_MAX_HEALTH } from '../config/balance';
import type { Innocent } from '../entities/Innocent';
import { Player } from '../entities/Player';
import type { Witch } from '../entities/Witch';
import { LEVEL_01, segmentAt } from '../levels/level-01';
import { BackgroundSystem } from '../systems/BackgroundSystem';
import { AudioCueSystem } from '../systems/AudioCueSystem';
import { getAudioSystem, type AudioSystem } from '../systems/AudioSystem';
import { CheckpointSystem } from '../systems/CheckpointSystem';
import { CombatFeedbackSystem } from '../systems/CombatFeedbackSystem';
import { CombatSystem } from '../systems/CombatSystem';
import { EffectsSystem } from '../systems/EffectsSystem';
import { spawnLevelEnemies } from '../systems/EnemySpawner';
import { LevelFlowSystem } from '../systems/LevelFlowSystem';
import { PlayerInput } from '../systems/PlayerInput';
import { ScoreTracker } from '../systems/ScoreTracker';
import { Hud } from '../ui/Hud';
import { HealthBar } from '../ui/components/HealthBar';
import { CheckpointFlag, addExitPortal } from '../ui/components/LevelMarkers';
import { addVignette } from '../ui/effects/Vignette';
import { COLORS, LAYOUT } from '../ui/theme';
import { SCENE_KEYS } from './scene-keys';

// Fase 1. A cena só monta as peças a partir de levels/level-01.ts, sem nenhuma posição
// própria; as regras de combate, de andamento da partida e de fundo ficam nos sistemas.
export class LevelScene extends Phaser.Scene {
  // Atribuídos em create(), que o Phaser sempre executa antes do primeiro update().
  private player!: Player;
  private playerInput!: PlayerInput;
  private enemies!: (Witch | Innocent)[];
  private combat!: CombatSystem;
  private feedback!: CombatFeedbackSystem;
  private audio!: AudioSystem;
  private audioCues!: AudioCueSystem;
  private flow!: LevelFlowSystem;
  private background!: BackgroundSystem;
  private hud!: Hud;

  constructor() {
    super(SCENE_KEYS.level);
  }

  create(): void {
    addVignette(this);
    const level = LEVEL_01;
    const { groundY } = level;
    const ground = this.createWorld();
    this.background = new BackgroundSystem(this, level.segments, level.worldWidth);

    // A origem do Player fica nos pés, então ele nasce exatamente sobre o chão.
    // Um só EffectsSystem para a cena: o controle de hitstop sobreposto e do tremor mais
    // forte só funciona se todos os pedidos passarem pela mesma instância.
    const effects = new EffectsSystem(this.tweens);
    this.player = new Player(this, level.playerStartX, groundY, effects);
    this.player.setDepth(LAYOUT.level.playerDepth);
    this.playerInput = new PlayerInput(this);
    this.cameras.main.startFollow(this.player, true);

    const { witches, innocents, boss } = spawnLevelEnemies(this, level, this.player);
    this.enemies = [...witches, ...innocents];
    this.physics.add.collider([this.player, ...this.enemies], ground);

    // Relógio do laço do jogo, e não this.time.now: o relógio da cena só é sincronizado no
    // primeiro update, então aqui no create ele ainda guarda o instante em que o jogo abriu.
    const scoreTracker = new ScoreTracker(() => this.game.loop.time);
    this.feedback = new CombatFeedbackSystem(this, effects, this.player);
    this.audio = getAudioSystem(this.game);
    this.audio.startLevel(this);
    this.audioCues = new AudioCueSystem(this.audio, this.player, witches, innocents);
    this.combat = new CombatSystem(
      { player: this.player, witches, innocents, scoreTracker },
      this.feedback,
    );
    this.flow = new LevelFlowSystem({
      scene: this,
      player: this.player,
      boss,
      bossBar: new HealthBar(this, boss.displayName),
      scoreTracker,
      checkpointSystem: new CheckpointSystem(
        { x: level.playerStartX, y: groundY },
        PLAYER_MAX_HEALTH,
      ),
      checkpoints: level.checkpoints.map(({ id, x }) => ({
        id,
        x,
        flag: new CheckpointFlag(this, x, groundY),
      })),
      bossArenaCheckpointId: level.bossArenaCheckpointId,
      groundY,
      finalZoneStartX: level.finalZoneStartX,
      onMatchEnd: (outcome) => this.scene.start(SCENE_KEYS.result, outcome),
      onCheckpointActivated: () => this.audio.playCheckpoint(),
      onVictory: () => this.audio.playVictory(),
    });
    addExitPortal(this, level.finalZoneStartX, groundY);
    this.hud = new Hud(this);
  }

  // Ordem: primeiro todos se movem, depois o combate compara as posições finais do quadro, o
  // andamento da partida reage ao resultado e, por último, fundo e HUD mostram tudo. Depois
  // do fim da partida, jogador e combate param: nada mais muda o placar congelado.
  update(): void {
    const playing = !this.flow.hasEnded();
    if (playing) {
      this.player.update(this.playerInput);
    }
    for (const enemy of this.enemies) {
      enemy.update();
    }
    if (playing) {
      this.combat.update();
    }
    this.flow.update();
    this.feedback.update();
    this.audioCues.update();
    // switchBackground ignora o trecho atual, então chamar a cada quadro só troca ao cruzar
    // uma borda, inclusive ao voltar para um trecho anterior depois de um respawn.
    // A música usa a mesma detecção de trecho do fundo, e também só troca ao cruzar uma borda.
    const segmentId = segmentAt(LEVEL_01, this.player.x).id;
    this.background.switchBackground(segmentId);
    this.audio.playSegmentMusic(this, segmentId);
    this.background.update(this.cameras.main.scrollX);
    this.hud.render(this.player.getHealth(), this.flow.getCounters());
  }

  // Mundo mais largo que a tela: física e câmera usam os mesmos limites, para a câmera
  // parar na borda da fase em vez de mostrar o vazio além dela. O chão vai da linha dos pés
  // até a base da tela.
  private createWorld(): Phaser.GameObjects.Rectangle {
    const { worldWidth, groundY } = LEVEL_01;
    const { height } = this.scale;
    this.physics.world.setBounds(0, 0, worldWidth, height);
    this.cameras.main.setBounds(0, 0, worldWidth, height);
    const ground = this.add
      .rectangle(0, groundY, worldWidth, height - groundY, COLORS.panel)
      .setOrigin(0)
      .setStrokeStyle(LAYOUT.level.groundBorderWidth, COLORS.panelBorder);
    this.physics.add.existing(ground, true);
    return ground;
  }
}
