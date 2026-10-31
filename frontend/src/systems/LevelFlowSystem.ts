import Phaser from 'phaser';
import {
  DEATH_TO_RESULT_DELAY_MS,
  MAX_RESPAWNS,
  PLAYER_MAX_HEALTH,
  RESPAWN_DELAY_MS,
} from '../config/balance';
import type { MatchCounters } from '../domain/score-formula';
import { isVictory, resolveDeath, type MatchOutcome } from '../domain/match-rules';
import type { Player } from '../entities/Player';
import type { LevelLayout } from '../levels/level-01';
import type { MatchResult } from '../types/api';
import { showFloatingText } from '../ui/components/FloatingText';
import { COLORS, LAYOUT, SPACING } from '../ui/theme';
import { CheckpointSystem } from './CheckpointSystem';
import type { ScoreTracker } from './ScoreTracker';

interface PlacedCheckpoint {
  id: string;
  x: number;
}

interface LevelFlowDependencies {
  scene: Phaser.Scene;
  player: Player;
  // Chefes comuns que precisam estar derrotados para a vitória (a barra de vida deles fica no
  // BossBarSystem). Só a pergunta isAlive, para este sistema não depender das entidades.
  bosses: readonly { isAlive(): boolean }[];
  scoreTracker: ScoreTracker;
  // Início, chão e pontos de controle da fase. Os pontos de controle são invisíveis: só
  // posições que salvam o progresso quando o jogador passa por elas.
  level: Pick<LevelLayout, 'playerStartX' | 'groundY' | 'checkpoints'>;
  // Se o demônio, chefe final, já foi derrotado. Uma pergunta, e não a entidade, pelo mesmo
  // motivo de bosses: o demônio só existe depois que o jogador entra na arena.
  isDemonDefeated: () => boolean;
  onMatchEnd: (outcome: MatchOutcome) => void;
  // Encerramento da vitória (pose, epílogo e escurecimento; ver VictorySequenceSystem). Chama
  // onDone ao terminar, e só então a partida segue para onMatchEnd, pelo mesmo caminho da
  // derrota: não existe uma segunda rota até a tela de resultado.
  playVictorySequence: (onDone: () => void) => void;
  // Aviso opcional para quem reage sem mudar o andamento (som). Callback, e não o
  // AudioSystem, para este sistema continuar sem saber que existe áudio.
  onCheckpointActivated?: () => void;
}

// Decide o andamento da partida a cada quadro: pontos de controle, respawn, vitória e derrota.
// As regras em si ficam em domain/match-rules.ts; aqui só se aplica o resultado no jogo.
export class LevelFlowSystem {
  private respawnsUsed = 0;
  private awaitingRespawn = false;
  // Preenchido quando a partida termina; congela o placar enquanto a tela final não chega.
  private finalResult?: MatchResult;
  private readonly checkpointSystem: CheckpointSystem;
  private readonly checkpoints: readonly PlacedCheckpoint[];

  constructor(private readonly deps: LevelFlowDependencies) {
    const { level } = deps;
    this.checkpointSystem = new CheckpointSystem(
      { x: level.playerStartX, y: level.groundY },
      PLAYER_MAX_HEALTH,
    );
    this.checkpoints = level.checkpoints.map(({ id, x }) => ({ id, x }));
  }

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
    const { player, bosses, isDemonDefeated } = this.deps;
    if (!player.isAlive()) {
      this.handleDeath();
      return;
    }
    this.activateReachedCheckpoints();
    const allBossesDefeated = bosses.every((boss) => !boss.isAlive());
    if (isVictory({ allBossesDefeated, demonDefeated: isDemonDefeated() })) {
      this.endMatch(true);
    }
  }

  // Basta o jogador passar da posição: verificar por x, e não por colisão, faz o ponto de
  // controle valer mesmo se o jogador o cruzar pulando.
  private activateReachedCheckpoints(): void {
    const { player } = this.deps;
    const { checkpointSystem } = this;
    const { groundY } = this.deps.level;
    for (const checkpoint of this.checkpoints) {
      if (player.x < checkpoint.x || checkpointSystem.isActivated(checkpoint.id)) {
        continue;
      }
      checkpointSystem.activate(checkpoint.id, { x: checkpoint.x, y: groundY }, player);
      this.deps.onCheckpointActivated?.();
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
      const { player } = this.deps;
      this.checkpointSystem.respawn(player);
      this.awaitingRespawn = false;
      const remaining = MAX_RESPAWNS - this.respawnsUsed;
      this.announce(player.x, `Tentativas restantes: ${remaining}`, COLORS.text);
    });
  }

  // O resultado é fechado no instante do fim, para a espera (pose de morte ou sequência de
  // vitória) não contar como tempo de partida. finalResult preenchido faz update() sair cedo,
  // então o fim acontece uma única vez, mesmo com respawns usados antes.
  private endMatch(victory: boolean): void {
    const match = this.deps.scoreTracker.getFinalResult();
    this.finalResult = match;
    const finish = (): void => this.deps.onMatchEnd({ match, victory });
    if (victory) {
      this.deps.playVictorySequence(finish);
      return;
    }
    this.deps.scene.time.delayedCall(DEATH_TO_RESULT_DELAY_MS, finish);
  }

  // Texto acima da cabeça do personagem, onde não o cobre.
  private announce(x: number, text: string, color: number): void {
    const y = this.deps.level.groundY - LAYOUT.level.floatingTextHeight - SPACING.sm;
    showFloatingText(this.deps.scene, { x, y, text, color });
  }
}
