import Phaser from 'phaser';
import {
  BOSS_KNOCKBACK_RATIO,
  DEATH_HITSTOP_DURATION_MS,
  DEATH_SHAKE_DURATION_MS,
  HITSTOP_DURATION_MS,
  KILL_HITSTOP_DURATION_MS,
  KILL_SHAKE_DURATION_MS,
  KILL_SHAKE_INTENSITY,
  KNOCKBACK_FORCE,
  KNOCKBACK_LIFT,
  PLAYER_KNOCKBACK_FORCE,
  PLAYER_KNOCKBACK_LIFT,
  SHAKE_DURATION_MS,
  SHAKE_INTENSITY,
  SHAKE_INTENSITY_HEAVY,
} from '../config/balance';
import { Boss } from '../entities/Boss';
import type { Player } from '../entities/Player';
import { showFloatingText } from '../ui/components/FloatingText';
import { spawnBloodSplatter } from '../ui/effects/BloodSplatter';
import { addDamageFlash, type DamageFlash } from '../ui/effects/DamageFlash';
import { addDeathShade, type DeathShade } from '../ui/effects/DeathShade';
import { COLORS } from '../ui/theme';
import type { CombatListener, DemonHitEvent, EnemyHitEvent, PlayerHitEvent } from './CombatSystem';
import type { EffectsSystem } from './EffectsSystem';

// Reage aos golpes avisados pelo CombatSystem com efeitos de tela, câmera e partículas. As
// regras ficam lá; aqui só se decide como cada golpe é sentido, e a cena só liga os dois.
export class CombatFeedbackSystem implements CombatListener {
  private readonly damageFlash: DamageFlash;
  private readonly deathShade: DeathShade;
  private wasPlayerAlive = true;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly effects: EffectsSystem,
    private readonly player: Player,
  ) {
    this.damageFlash = addDamageFlash(scene);
    this.deathShade = addDeathShade(scene);
  }

  // Ordem dos efeitos: o hitstop vem antes do tremor porque congela o quadro do contato; o
  // tremor começa junto, mas dura mais que a pausa, então o mundo volta a andar ainda
  // vibrando, o que vende a força do golpe. O empurrão é aplicado durante a pausa e só
  // aparece quando a física volta, como um rebote do impacto.
  onEnemyHit(event: EnemyHitEvent): void {
    const { enemy, direction } = event;
    const hurtbox = enemy.getHurtbox();
    if (event.outcome === 'hurt') {
      this.effects.hitstop(this.scene, HITSTOP_DURATION_MS);
      this.effects.shakeCamera(this.scene, SHAKE_INTENSITY, SHAKE_DURATION_MS);
      // O chefe recua menos: é maior e mais pesado, e recuar como uma bruxa comum o deixaria
      // parecendo frágil.
      const weight = enemy instanceof Boss ? BOSS_KNOCKBACK_RATIO : 1;
      this.effects.knockback(enemy, direction, {
        horizontal: KNOCKBACK_FORCE * weight,
        lift: KNOCKBACK_LIFT * weight,
      });
      spawnBloodSplatter(this.scene, hurtbox.centerX, hurtbox.centerY, 'hit', direction);
      return;
    }
    // Golpe fatal: sem empurrão (o corpo já foi desligado), mas com mais sangue, pausa e
    // tremor maiores e a pontuação saltando do corpo, para ligar a morte ao placar.
    this.effects.hitstop(this.scene, KILL_HITSTOP_DURATION_MS);
    this.effects.shakeCamera(this.scene, KILL_SHAKE_INTENSITY, KILL_SHAKE_DURATION_MS);
    spawnBloodSplatter(this.scene, hurtbox.centerX, hurtbox.centerY, 'kill', direction);
    this.showScoreDelta(event.scoreDelta, hurtbox.centerX, hurtbox.top);
  }

  // Golpe no ponto fraco do demônio: mesma pausa e tremor de um golpe em bruxa, sem empurrão
  // (ele é parte do cenário). A morte mostra o "+100" da bruxa que ela vale no placar.
  onDemonHit(event: DemonHitEvent): void {
    const { weakPoint, direction } = event;
    const killed = event.outcome === 'killed';
    this.effects.hitstop(this.scene, killed ? KILL_HITSTOP_DURATION_MS : HITSTOP_DURATION_MS);
    this.effects.shakeCamera(
      this.scene,
      killed ? KILL_SHAKE_INTENSITY : SHAKE_INTENSITY,
      killed ? KILL_SHAKE_DURATION_MS : SHAKE_DURATION_MS,
    );
    spawnBloodSplatter(
      this.scene,
      weakPoint.centerX,
      weakPoint.centerY,
      killed ? 'kill' : 'hit',
      direction,
    );
    this.showScoreDelta(event.scoreDelta, weakPoint.centerX, weakPoint.top);
  }

  // Dano não fatal: flash vermelho, tremor e empurrão para longe da bruxa. A direção do
  // evento já é a do golpe (da bruxa para o jogador), então empurrar nela afasta o jogador do
  // atacante. O piscar de invencibilidade já é feito pelo próprio Player ao levar dano.
  // No golpe fatal fica só o flash: a reação de morte vem de update(), que vale para toda morte.
  onPlayerHit(event: PlayerHitEvent): void {
    this.damageFlash.flash();
    if (event.outcome === 'killed') {
      return;
    }
    this.effects.shakeCamera(this.scene, SHAKE_INTENSITY, SHAKE_DURATION_MS);
    this.effects.knockback(this.player, event.direction, {
      horizontal: event.knockbackForce ?? PLAYER_KNOCKBACK_FORCE,
      lift: PLAYER_KNOCKBACK_LIFT,
    });
  }

  // Chamado a cada quadro, depois do andamento da partida. Observa a passagem de vivo para
  // morto, e não o golpe fatal, para a reação valer em toda morte, venha de onde vier; e a
  // volta de morto para vivo (respawn) para limpar o escurecimento sem que o sistema de
  // pontos de controle precise conhecer efeitos visuais. Na morte final não há volta: a tela
  // fica escura até a cena de resultado substituir esta, sem atrasar a troca.
  update(): void {
    const alive = this.player.isAlive();
    if (alive === this.wasPlayerAlive) {
      return;
    }
    this.wasPlayerAlive = alive;
    if (alive) {
      this.deathShade.clear();
      return;
    }
    // Hitstop mais longo e tremor pesado dão peso ao instante da morte antes de a tela apagar.
    this.effects.hitstop(this.scene, DEATH_HITSTOP_DURATION_MS);
    this.effects.shakeCamera(this.scene, SHAKE_INTENSITY_HEAVY, DEATH_SHAKE_DURATION_MS);
    this.deathShade.darken();
  }

  private showScoreDelta(scoreDelta: number, x: number, y: number): void {
    if (scoreDelta === 0) {
      return;
    }
    const positive = scoreDelta > 0;
    showFloatingText(this.scene, {
      x,
      y,
      text: positive ? `+${scoreDelta}` : `${scoreDelta}`,
      color: positive ? COLORS.accent : COLORS.danger,
      variant: 'score',
    });
  }
}
