import Phaser from 'phaser';
import {
  DEATH_TO_RESULT_DELAY_MS,
  MAX_RESPAWNS,
  RESPAWN_DELAY_MS,
  VICTORY_DELAY_MS,
} from '../config/balance';
import type { MatchCounters } from '../domain/score-formula';
import { isVictory, resolveDeath, type MatchOutcome } from '../domain/match-rules';
import type { Boss } from '../entities/Boss';
import type { Player } from '../entities/Player';
import type { MatchResult } from '../types/api';
import { showFloatingText } from '../ui/components/FloatingText';
import type { HealthBar } from '../ui/components/HealthBar';
import type { CheckpointFlag } from '../ui/components/LevelMarkers';
import { COLORS, LAYOUT, SPACING } from '../ui/theme';
import type { CheckpointSystem } from './CheckpointSystem';
import type { ScoreTracker } from './ScoreTracker';

interface PlacedCheckpoint {
  id: string;
  x: number;
  flag: CheckpointFlag;
}

interface LevelFlowDependencies {
  scene: Phaser.Scene;
  player: Player;
  boss: Boss;
  bossBar: HealthBar;
  scoreTracker: ScoreTracker;
  checkpointSystem: CheckpointSystem;
  checkpoints: readonly PlacedCheckpoint[];
  bossArenaCheckpointId: string;
  groundY: number;
  finalZoneStartX: number;
  onMatchEnd: (outcome: MatchOutcome) => void;
  // Avisos opcionais para quem reage sem mudar o andamento (som). Callbacks, e não o
  // AudioSystem, para este sistema continuar sem saber que existe áudio.
  onCheckpointActivated?: () => void;
  onVictory?: () => void;
}

// Decide o andamento da partida a cada quadro: pontos de controle, respawn, vitória e derrota.
// As regras em si ficam em domain/match-rules.ts; aqui só se aplica o resultado no jogo.
export class LevelFlowSystem {
  private respawnsUsed = 0;
  private awaitingRespawn = false;
  // Preenchido quando a partida termina; congela o placar enquanto a tela final não chega.
  private finalResult?: MatchResult;

  constructor(private readonly deps: LevelFlowDependencies) {}

  hasEnded(): boolean {
    return this.finalResult !== undefined;
  }

  // O HUD mostra o placar congelado depois do fim, para a espera não somar tempo.
  getCounters(): MatchCounters {
    return this.finalResult ?? this.deps.scoreTracker.getCounters();
  }

  // Chamado depois do combate, com as posições e a vida finais do quadro.
  update(): void {
    if (this.hasEnded()) {
      return;
    }
    const { player, boss, bossBar, finalZoneStartX } = this.deps;
    if (!player.isAlive()) {
      this.handleDeath();
      return;
    }
    this.activateReachedCheckpoints();
    bossBar.setRatio(boss.getHealthRatio());
    if (isVictory({ playerX: player.x, finalZoneStartX, bossDefeated: !boss.isAlive() })) {
      player.freeze();
      this.deps.onVictory?.();
      this.endMatch(true);
    }
  }

  // Basta o jogador passar da bandeira: verificar por posição, e não por colisão, faz a
  // bandeira valer mesmo se o jogador a cruzar pulando.
  private activateReachedCheckpoints(): void {
    const { player, checkpointSystem, groundY } = this.deps;
    for (const checkpoint of this.deps.checkpoints) {
      if (player.x < checkpoint.x || checkpointSystem.isActivated(checkpoint.id)) {
        continue;
      }
      checkpointSystem.activate(checkpoint.id, { x: checkpoint.x, y: groundY }, player);
      checkpoint.flag.activate();
      this.deps.onCheckpointActivated?.();
      this.announce(checkpoint.x, 'Ponto de controle', COLORS.magic);
      // A bandeira da arena marca o início da luta: é quando a barra do chefe aparece.
      if (checkpoint.id === this.deps.bossArenaCheckpointId) {
        this.deps.bossBar.show();
      }
    }
  }

  // Regra de respawn (detalhada em resolveDeath): toda morte gasta uma tentativa, dentro ou
  // fora da arena; com tentativas sobrando, o jogador volta ao último ponto de controle com
  // a pontuação intacta; sem tentativas, a partida termina em derrota.
  private handleDeath(): void {
    if (this.awaitingRespawn) {
      return;
    }
    if (resolveDeath(this.respawnsUsed, MAX_RESPAWNS) === 'defeat') {
      this.endMatch(false);
      return;
    }
    this.respawnsUsed += 1;
    this.awaitingRespawn = true;
    this.deps.scene.time.delayedCall(RESPAWN_DELAY_MS, () => {
      const { player, checkpointSystem } = this.deps;
      checkpointSystem.respawn(player);
      this.awaitingRespawn = false;
      const remaining = MAX_RESPAWNS - this.respawnsUsed;
      this.announce(player.x, `Tentativas restantes: ${remaining}`, COLORS.text);
    });
  }

  // O resultado é fechado no instante do fim, para a espera até a próxima tela não contar
  // como tempo de partida.
  private endMatch(victory: boolean): void {
    const match = this.deps.scoreTracker.getFinalResult();
    this.finalResult = match;
    const delay = victory ? VICTORY_DELAY_MS : DEATH_TO_RESULT_DELAY_MS;
    this.deps.scene.time.delayedCall(delay, () => this.deps.onMatchEnd({ match, victory }));
  }

  // Texto acima da altura da bandeira, onde não cobre o personagem.
  private announce(x: number, text: string, color: number): void {
    const y = this.deps.groundY - LAYOUT.level.checkpointFlag.poleHeight - SPACING.sm;
    showFloatingText(this.deps.scene, { x, y, text, color });
  }
}
