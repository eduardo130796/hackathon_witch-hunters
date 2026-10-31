import Phaser from 'phaser';
import {
  GATE_MESSAGE_COOLDOWN_MS,
  GATE_TOUCH_DISTANCE,
  SEGMENT_GATE_WALL_WIDTH,
} from '../config/balance';
import { isSegmentCleared } from '../domain/segment-gates';
import type { Player } from '../entities/Player';
import type { LevelLayout } from '../levels/level-01';
import { showFloatingText } from '../ui/components/FloatingText';
import { COLORS, LAYOUT, SPACING } from '../ui/theme';

interface Gate {
  segmentId: string;
  x: number;
  hostiles: readonly { isAlive(): boolean }[];
  // Sem valor depois que o portão abre; aberto, ele não fecha mais.
  wall?: { zone: Phaser.GameObjects.Zone; collider: Phaser.Physics.Arcade.Collider };
}

interface SegmentGateDependencies {
  scene: Phaser.Scene;
  level: LevelLayout;
  player: Player;
  // Hostis que contam para o portão de cada trecho, pelo id do trecho (EnemySpawner).
  hostilesBySegment: ReadonlyMap<string, readonly { isAlive(): boolean }[]>;
  // Aviso mostrado ao encostar num portão fechado (narrative-01.ts).
  blockedMessage: string;
}

// Portões de trecho: uma parede invisível em gateX (level-01.ts) que segura só o jogador até
// os hostis do trecho morrerem (domain/segment-gates.ts). Assim nenhum trecho é pulado
// correndo. Os inimigos atravessam a parede: eles nunca ficam presos do lado errado.
//
// Respawn: os mortos continuam mortos e um portão aberto não fecha, então voltar a um ponto
// de controle nunca refaz nem desfaz a contagem.
export class SegmentGateSystem {
  private readonly gates: Gate[];
  private nextMessageAt = 0;

  constructor(private readonly deps: SegmentGateDependencies) {
    this.gates = deps.level.segments.flatMap((segment) =>
      segment.gateX === undefined ? [] : [this.createGate(segment.id, segment.gateX)],
    );
  }

  // O encontro da bruxa da floresta só começa com o trecho limpo. Sem portão, sempre limpo.
  isCleared(segmentId: string): boolean {
    const gate = this.gates.find((candidate) => candidate.segmentId === segmentId);
    return gate === undefined || this.hostilesDead(gate);
  }

  // Chamado a cada quadro: abre os portões dos trechos limpos e avisa quem empurra um fechado.
  update(): void {
    for (const gate of this.gates) {
      if (!gate.wall) {
        continue;
      }
      if (this.hostilesDead(gate)) {
        gate.wall.collider.destroy();
        gate.wall.zone.destroy();
        gate.wall = undefined;
      } else {
        this.warnIfPushing(gate);
      }
    }
  }

  private hostilesDead(gate: Gate): boolean {
    return isSegmentCleared(gate.hostiles.map((hostile) => hostile.isAlive()));
  }

  // A parede começa em x e vai para a direita: o jogador para com o corpo encostado em x.
  private createGate(segmentId: string, x: number): Gate {
    const { scene, player, hostilesBySegment } = this.deps;
    const zone = scene.add.zone(x, 0, SEGMENT_GATE_WALL_WIDTH, scene.scale.height).setOrigin(0);
    scene.physics.add.existing(zone, true);
    return {
      segmentId,
      x,
      hostiles: hostilesBySegment.get(segmentId) ?? [],
      wall: { zone, collider: scene.physics.add.collider(player, zone) },
    };
  }

  // Aviso no máximo a cada GATE_MESSAGE_COOLDOWN_MS, acima da cabeça do jogador.
  private warnIfPushing(gate: Gate): void {
    const { scene, player, blockedMessage } = this.deps;
    const now = scene.time.now;
    const bodyRight = player.getHurtbox().right;
    if (now < this.nextMessageAt || gate.x - bodyRight > GATE_TOUCH_DISTANCE) {
      return;
    }
    if (bodyRight > gate.x + SEGMENT_GATE_WALL_WIDTH) {
      return;
    }
    this.nextMessageAt = now + GATE_MESSAGE_COOLDOWN_MS;
    const y = this.deps.level.groundY - LAYOUT.level.floatingTextHeight - SPACING.sm;
    showFloatingText(scene, { x: player.x, y, text: blockedMessage, color: COLORS.danger });
  }
}
