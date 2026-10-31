import Phaser from 'phaser';
import type { Innocent } from '../entities/Innocent';
import { Player } from '../entities/Player';
import type { Witch } from '../entities/Witch';
import { LEVEL_01, segmentAt } from '../levels/level-01';
import { GATE_BLOCKED_MESSAGE, NARRATIVE_01, VICTORY_EPILOGUE } from '../levels/narrative-01';
import { BackgroundSystem } from '../systems/BackgroundSystem';
import { ApproachLockSystem } from '../systems/ApproachLockSystem';
import { AudioCueSystem } from '../systems/AudioCueSystem';
import { getAudioSystem, type AudioSystem } from '../systems/AudioSystem';
import { BossBarSystem } from '../systems/BossBarSystem';
import { CombatFeedbackSystem } from '../systems/CombatFeedbackSystem';
import { CombatSystem } from '../systems/CombatSystem';
import { DemonArenaSystem } from '../systems/DemonArenaSystem';
import { EffectsSystem } from '../systems/EffectsSystem';
import { spawnLevelEnemies } from '../systems/EnemySpawner';
import { LevelFlowSystem } from '../systems/LevelFlowSystem';
import { NarrativeTriggerSystem } from '../systems/NarrativeTriggerSystem';
import { PlayerInput } from '../systems/PlayerInput';
import { SegmentGateSystem } from '../systems/SegmentGateSystem';
import { ScoreTracker } from '../systems/ScoreTracker';
import { VictorySequenceSystem } from '../systems/VictorySequenceSystem';
import { Hud } from '../ui/Hud';
import { DialogueBox } from '../ui/components/DialogueBox';
import { addVignette } from '../ui/effects/Vignette';
import { COLORS, LAYOUT } from '../ui/theme';
import { SCENE_KEYS } from './scene-keys';

// Fase 1. A cena só monta as peças a partir de levels/level-01.ts e levels/narrative-01.ts,
// sem nenhuma posição própria; combate, andamento, falas e fundo ficam nos sistemas.
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
  private narrative!: NarrativeTriggerSystem;
  private bossBars!: BossBarSystem;
  private background!: BackgroundSystem;
  private arena!: DemonArenaSystem;
  private approachLock!: ApproachLockSystem;
  private gates!: SegmentGateSystem;
  private hud!: Hud;

  constructor() {
    super(SCENE_KEYS.level);
  }

  create(): void {
    addVignette(this);
    const level = LEVEL_01;
    const { groundY } = level;
    const ground = this.createWorld();
    this.background = new BackgroundSystem(this, level);

    // A origem do Player fica nos pés, então ele nasce exatamente sobre o chão.
    // Um só EffectsSystem para a cena: hitstop e pausa do diálogo dividem a mesma física, e
    // só uma instância consegue impedir que uma pausa retome a física antes da outra.
    const effects = new EffectsSystem(this.tweens);
    this.player = new Player(this, level.playerStartX, groundY, effects);
    this.player.setDepth(LAYOUT.level.playerDepth);
    this.playerInput = new PlayerInput(this);
    this.cameras.main.startFollow(this.player, true);

    this.approachLock = new ApproachLockSystem(() => this.time.now);
    const spawned = spawnLevelEnemies(this, level, this.player, {
      canStart: (segmentId) => this.gates.isCleared(segmentId),
      onStart: () => this.approachLock.begin(),
      onArrive: (triggerId) => {
        this.approachLock.release();
        this.narrative.requestTrigger(triggerId);
      },
    });
    const { witches, innocents } = spawned;
    this.gates = new SegmentGateSystem({
      scene: this,
      level,
      player: this.player,
      hostilesBySegment: spawned.hostilesBySegment,
      blockedMessage: GATE_BLOCKED_MESSAGE,
    });
    this.enemies = [...witches, ...innocents];
    this.physics.add.collider([this.player, ...this.enemies], ground);

    const dialogue = new DialogueBox(this, effects);
    this.narrative = new NarrativeTriggerSystem({
      scene: this,
      dialogue,
      triggers: NARRATIVE_01,
      groundY,
      // Quem esperava a fala reage quando ela termina (a bruxa da provocação foge) e o demônio luta.
      onTriggerComplete: (triggerId) => {
        spawned.reactionsByTrigger.get(triggerId)?.forEach((react) => react());
        this.arena.onTriggerComplete(triggerId);
      },
    });
    this.bossBars = new BossBarSystem(this, spawned.featured);

    // Relógio do laço do jogo, e não this.time.now: o relógio da cena só é sincronizado no
    // primeiro update, então aqui no create ele ainda guarda o instante em que o jogo abriu.
    // O tempo com uma fala aberta é descontado: ler a história não custa bônus de tempo.
    const scoreTracker = new ScoreTracker(() => this.game.loop.time - dialogue.getOpenMs());
    this.feedback = new CombatFeedbackSystem(this, effects, this.player);
    this.audio = getAudioSystem(this.game);
    this.audio.startLevel(this);
    this.audioCues = new AudioCueSystem(this.audio, this.player, witches, innocents);
    this.combat = new CombatSystem(
      { player: this.player, witches, innocents, scoreTracker },
      this.feedback,
    );
    const { combat, background, bossBars } = this;
    this.arena = new DemonArenaSystem({
      scene: this,
      level,
      player: this.player,
      effects,
      combat,
      background,
      bossBars,
    });
    const victory = new VictorySequenceSystem({
      scene: this,
      player: this.player,
      dialogue,
      epilogue: VICTORY_EPILOGUE,
      onStart: () => this.audio.playVictory(),
    });
    this.flow = new LevelFlowSystem({
      scene: this,
      player: this.player,
      bosses: spawned.bosses,
      scoreTracker,
      level,
      isDemonDefeated: () => this.arena.isDemonDefeated(),
      onMatchEnd: (outcome) => this.scene.start(SCENE_KEYS.result, outcome),
      playVictorySequence: (onDone) => victory.play(onDone),
      onCheckpointActivated: () => this.audio.playCheckpoint(),
    });
    this.hud = new Hud(this);
  }

  // Ordem: primeiro todos se movem, depois o combate compara as posições finais do quadro, o
  // andamento da partida reage ao resultado e, por último, fundo e HUD mostram tudo. Depois
  // do fim da partida, jogador e combate param: nada mais muda o placar congelado.
  // Com uma fala aberta, jogador, inimigos e combate também param (a física já está pausada):
  // ninguém age enquanto o jogador lê, e os toques de pulo e golpe usados para avançar a fala
  // são descartados, para não virarem ação quando ela fecha.
  update(): void {
    // A arena trava antes das falas, e as zonas testam o corpo do jogador (hurtbox), não a
    // imagem, que é bem mais larga e abriria a fala antes de ele chegar.
    this.arena.enterIfReached();
    const reading = this.narrative.update(this.player.getHurtbox());
    const acting = !reading && !this.flow.hasEnded();
    if (reading) {
      this.playerInput.discardActionPresses();
    } else {
      this.enemies.forEach((enemy) => enemy.update());
      this.arena.update();
    }
    // Enquanto alguém vem falar com ele, o jogador espera parado e o combate fica suspenso:
    // ninguém fere ninguém, então nenhum lobo ou lobisomem pega o jogador travado, e ele não
    // golpeia quem está chegando. Os inimigos continuam andando, para o personagem chegar.
    if (acting && this.approachLock.isLocked()) {
      this.playerInput.discardActionPresses();
      this.player.holdStill();
    } else if (acting) {
      this.player.update(this.playerInput);
      this.combat.update();
    }
    this.gates.update();
    this.flow.update();
    this.feedback.update();
    this.audioCues.update();
    // Fundo, música e barras de vida usam a mesma detecção de trecho e só mudam ao cruzar
    // uma borda, inclusive ao voltar para um trecho anterior depois de um respawn.
    const segmentId = segmentAt(LEVEL_01, this.player.x).id;
    this.background.switchBackground(segmentId);
    this.audio.playSegmentMusic(this, segmentId);
    this.bossBars.update(segmentId);
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
