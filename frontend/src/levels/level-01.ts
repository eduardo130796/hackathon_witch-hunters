import {
  ADVANCED_WITCH_DETECTION_RADIUS,
  ARENA_WITCH_DETECTION_RADIUS,
  CATACOMBS_WITCH_DETECTION_RADIUS,
} from '../config/balance';

// ÚNICA fonte de verdade sobre o layout da fase 1: tamanho do mundo, trechos, inimigos,
// pontos de controle, chefe e saída. A LevelScene só lê este arquivo e não escreve nenhuma
// posição própria. TypeScript puro, sem Phaser, para o layout ser testado sem o motor.

export type EnemyType = 'witch' | 'innocent' | 'boss';

// x e y em px do mundo; y é a linha dos pés (a origem dos personagens fica nos pés).
// patrolHalfWidth é a distância de patrulha para cada lado do ponto de nascimento.
export interface EnemySpawn {
  type: EnemyType;
  x: number;
  y: number;
  patrolHalfWidth: number;
}

export interface LevelSegment {
  id: string;
  startX: number;
  endX: number;
  // Prefixo das texturas de fundo do trecho: as camadas se chamam `${backgroundKey}-layer1`,
  // `-layer2` e `-layer3`, carregadas de public/assets/backgrounds/<id do trecho>/.
  backgroundKey: string;
  enemySpawns: EnemySpawn[];
  // Raio de detecção das bruxas comuns deste trecho. Sem valor, vale o da bruxa comum.
  witchDetectionRadius?: number;
}

interface LevelCheckpoint {
  id: string;
  x: number;
}

export interface LevelLayout {
  worldWidth: number;
  groundY: number;
  playerStartX: number;
  segments: LevelSegment[];
  checkpoints: LevelCheckpoint[];
  bossArenaCheckpointId: string;
  finalZoneStartX: number;
}

// px. Pouco mais de cinco telas de 1280px: cemitério, ruínas, catacumbas e a arena (com a
// saída no fim). Com o quarto trecho a fase cresceu de 5120px para 6920px: o novo trecho tem a
// mesma largura das ruínas (1800px), e os outros mantiveram a sua, para o ritmo de cada um não
// mudar. A pé (260px/s), atravessá-la leva cerca de 27 s, bem dentro do bônus de 300 s.
const WORLD_WIDTH = 6920;
// px. O chão tem 64px na base da tela de 720px, deixando o resto livre para pular.
const GROUND_Y = 656;
// Cada trecho começa onde está seu ponto de controle: morrer num trecho devolve o jogador ao
// começo dele.
const RUINS_START_X = 1600;
const CATACOMBS_START_X = 3400;
const ARENA_START_X = 5200;

export const LEVEL_01: LevelLayout = {
  worldWidth: WORLD_WIDTH,
  groundY: GROUND_Y,
  // A 20% da primeira tela, com espaço para andar nos dois sentidos.
  playerStartX: 256,
  segments: [
    {
      // Trecho de aprendizado: poucas bruxas, detecção padrão e inocentes misturados para o
      // jogador aprender a escolher onde golpear. A primeira bruxa fica a mais de 300px do
      // início, para a partida não começar com perseguição.
      id: 'graveyard',
      startX: 0,
      endX: RUINS_START_X,
      backgroundKey: 'bg-graveyard',
      enemySpawns: [
        { type: 'innocent', x: 512, y: GROUND_Y, patrolHalfWidth: 80 },
        { type: 'witch', x: 750, y: GROUND_Y, patrolHalfWidth: 120 },
        { type: 'innocent', x: 934, y: GROUND_Y, patrolHalfWidth: 60 },
        { type: 'witch', x: 1250, y: GROUND_Y, patrolHalfWidth: 90 },
      ],
    },
    {
      // Mais bruxas e que enxergam mais longe: o jogador já sabe lutar e é posto à prova.
      id: 'ruins',
      startX: RUINS_START_X,
      endX: CATACOMBS_START_X,
      backgroundKey: 'bg-ruins',
      witchDetectionRadius: ADVANCED_WITCH_DETECTION_RADIUS,
      enemySpawns: [
        { type: 'witch', x: 2050, y: GROUND_Y, patrolHalfWidth: 100 },
        { type: 'innocent', x: 2300, y: GROUND_Y, patrolHalfWidth: 80 },
        { type: 'witch', x: 2550, y: GROUND_Y, patrolHalfWidth: 120 },
        { type: 'innocent', x: 2800, y: GROUND_Y, patrolHalfWidth: 60 },
        { type: 'witch', x: 3100, y: GROUND_Y, patrolHalfWidth: 100 },
      ],
    },
    {
      // Último teste antes do chefe: quatro bruxas (uma a mais que as ruínas), mais atentas, e
      // um único inocente no meio delas, onde golpear sem olhar custa caro.
      id: 'catacombs',
      startX: CATACOMBS_START_X,
      endX: ARENA_START_X,
      backgroundKey: 'bg-catacombs',
      witchDetectionRadius: CATACOMBS_WITCH_DETECTION_RADIUS,
      enemySpawns: [
        { type: 'witch', x: 3800, y: GROUND_Y, patrolHalfWidth: 100 },
        { type: 'witch', x: 4150, y: GROUND_Y, patrolHalfWidth: 100 },
        { type: 'innocent', x: 4330, y: GROUND_Y, patrolHalfWidth: 50 },
        { type: 'witch', x: 4550, y: GROUND_Y, patrolHalfWidth: 100 },
        { type: 'witch', x: 4900, y: GROUND_Y, patrolHalfWidth: 100 },
      ],
    },
    {
      // O chefe fica a 700px da entrada, para ser visto antes de perseguir o jogador. As
      // duas bruxas de apoio, ainda mais atentas, protegem a entrada e a saída da arena.
      id: 'boss-arena',
      startX: ARENA_START_X,
      endX: WORLD_WIDTH,
      backgroundKey: 'bg-boss-arena',
      witchDetectionRadius: ARENA_WITCH_DETECTION_RADIUS,
      enemySpawns: [
        { type: 'witch', x: 5550, y: GROUND_Y, patrolHalfWidth: 100 },
        { type: 'boss', x: 5900, y: GROUND_Y, patrolHalfWidth: 150 },
        { type: 'witch', x: 6300, y: GROUND_Y, patrolHalfWidth: 80 },
      ],
    },
  ],
  // Um ponto de controle no início de cada trecho depois do primeiro. O último marca a entrada
  // da arena: quem morre lutando com o chefe volta ali, sem refazer a fase inteira.
  checkpoints: [
    { id: 'ruins-gate', x: RUINS_START_X },
    { id: 'catacombs-gate', x: CATACOMBS_START_X },
    { id: 'boss-arena', x: ARENA_START_X },
  ],
  bossArenaCheckpointId: 'boss-arena',
  // Saída nos últimos 320px da arena, depois do chefe. Só vale com o chefe derrotado.
  finalZoneStartX: 6600,
};

/**
 * Encontra o trecho onde está uma posição horizontal.
 *
 * @param level Layout da fase.
 * @param x Posição em px do mundo.
 * @returns O trecho que contém x; antes do primeiro ou depois do último, o trecho da ponta.
 */
export function segmentAt(level: LevelLayout, x: number): LevelSegment {
  const found = level.segments.find((segment) => x >= segment.startX && x < segment.endX);
  if (found) {
    return found;
  }
  const first = level.segments[0];
  const last = level.segments[level.segments.length - 1];
  if (!first || !last) {
    throw new Error('A fase precisa de pelo menos um trecho.');
  }
  return x < first.startX ? first : last;
}
