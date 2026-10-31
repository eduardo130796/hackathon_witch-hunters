import {
  ARENA_WITCH_DETECTION_RADIUS,
  CATACOMBS_WITCH_DETECTION_RADIUS,
  FINAL_STAGE_WITCH_DETECTION_RADIUS,
} from '../config/balance';

// ÚNICA fonte de verdade sobre o layout da fase 1: tamanho do mundo, trechos, inimigos,
// pontos de controle, chefes e saída. A LevelScene só lê este arquivo e não escreve nenhuma
// posição própria. TypeScript puro, sem Phaser, para o layout ser testado sem o motor.
// Os diálogos ficam em levels/narrative-01.ts, no mesmo espírito.

// 'boss' é o chefe da arena. O chefe final (o demônio) não é um EnemySpawn: tem a própria arena,
// descrita em demonArena, e é criado pelo DemonArenaSystem.
// 'wolf' e 'werewolf' são inimigos da floresta e, para a pontuação, contam como bruxas.
export type EnemyType = 'witch' | 'innocent' | 'boss' | 'wolf' | 'werewolf';

// x e y em px do mundo; y é a linha dos pés (a origem dos personagens fica nos pés).
// patrolHalfWidth é a distância de patrulha para cada lado do ponto de nascimento.
export interface EnemySpawn {
  type: EnemyType;
  x: number;
  y: number;
  patrolHalfWidth: number;
  // Nome na barra de vida fixa no topo da tela. Só os inimigos que são "a luta" do trecho
  // (lobisomem e chefes) têm barra; a barra aparece quando o jogador entra no trecho deles.
  healthBarLabel?: string;
  // Id de um gatilho de narrative-01.ts. O inimigo nasce adormecido (parado, sem detectar
  // nem atacar) e só acorda quando o diálogo desse gatilho termina.
  awakenedByTrigger?: string;
  // Id de um gatilho de narrative-01.ts sem x. O personagem espera parado, vai ao encontro
  // do jogador quando ele chega perto e, ao chegar, abre essa fala (a Anciã, a bruxa da
  // provocação). Só para inocentes e para bruxas adormecidas.
  approachTrigger?: string;
  // Id de um gatilho de narrative-01.ts. Quando a fala termina, a bruxa foge em vez de lutar
  // e sai da fase sem contar como morta (Witch.flee).
  fleesAfterTrigger?: string;
}

export interface LevelSegment {
  id: string;
  // Nome do lugar e frase curta, mostrados no cartão de título na primeira entrada no trecho
  // (LocationTitle). Ficam aqui, com os dados do trecho, para o texto não se espalhar em cenas.
  displayName: string;
  subtitle: string;
  startX: number;
  endX: number;
  // Chave da textura de fundo. Com arte em camadas, é o prefixo: as camadas se chamam
  // `${backgroundKey}-layer1`, `-layer2` e `-layer3`. Com imagem única, é a própria chave.
  backgroundKey: string;
  // Que arte de fundo existe em public/assets/backgrounds/<id>/. Sem arte, o fundo usa o
  // tingimento provisório; não pedir arquivo inexistente evita erro de carga no console.
  backgroundArt: BackgroundArt;
  // Pasta em public/assets/backgrounds/ de onde vem a arte. Sem valor, a pasta tem o id do
  // trecho. Existe para um trecho reaproveitar a arte de outro (a floresta usa a das ruínas).
  backgroundFolder?: string;
  enemySpawns: EnemySpawn[];
  // Raio de detecção das bruxas comuns deste trecho. Sem valor, vale o da bruxa comum.
  // Não se aplica a lobos e lobisomens, que têm seus próprios números em balance.ts.
  witchDetectionRadius?: number;
  // px do mundo do portão do trecho: parede invisível que só deixa o jogador passar depois de
  // derrotar os hostis do trecho (domain/segment-gates.ts). Fica 120px antes do ponto de
  // controle seguinte, para quem renasce nele nunca nascer encostado na parede. Sem valor, o
  // trecho não tem portão (o cemitério, sem inimigos, e o fim da fase).
  gateX?: number;
}

// 'layers': layer1.png a layer3.png, com paralaxe. 'single': um único background.png (o
// trecho final). 'none': ainda sem arte.
export type BackgroundArt = 'layers' | 'single' | 'none';

interface LevelCheckpoint {
  id: string;
  x: number;
}

// Arena do chefe final, no fim do trecho final. Ao cruzar startX, a câmera trava entre left
// e right e o jogador não consegue mais voltar. tauntTriggerId é o gatilho de
// narrative-01.ts cuja fala, ao terminar, começa a luta.
export interface DemonArenaLayout {
  startX: number;
  left: number;
  right: number;
  tauntTriggerId: string;
}

export interface LevelLayout {
  worldWidth: number;
  groundY: number;
  playerStartX: number;
  segments: LevelSegment[];
  checkpoints: LevelCheckpoint[];
  demonArena: DemonArenaLayout;
}

// px. Cinco trechos: cemitério, floresta, catacumbas, arena e trecho final. O trecho final
// tem 2280px: 1000px de caminhada até a catedral e, no fim, a arena do demônio com
// exatamente uma tela de largura (1280px), para a câmera ficar parada durante a luta. A pé
// (260px/s), a fase inteira leva cerca de 35 s, bem dentro do bônus de 300 s.
const WORLD_WIDTH = 9200;
// px. O chão tem 64px na base da tela de 720px, deixando o resto livre para pular.
const GROUND_Y = 656;
// Cada trecho começa onde está seu ponto de controle: morrer num trecho devolve o jogador ao
// começo dele.
const FOREST_START_X = 1600;
const CATACOMBS_START_X = 3400;
const ARENA_START_X = 5200;
const FINAL_STAGE_START_X = 6920;
// Entrada da arena do demônio: uma tela (1280px) antes do fim do mundo.
const FINAL_BOSS_ARENA_START_X = 7920;
// Ponto de controle da arena 120px para dentro: o jogador renasce inteiro dentro dela, longe
// da parede da entrada (64px antes de FINAL_BOSS_ARENA_START_X).
// px entre o portão de um trecho e o fim dele (ponto de controle do trecho seguinte).
const GATE_MARGIN = 120;
const DEMON_ARENA_CHECKPOINT_X = FINAL_BOSS_ARENA_START_X + 120;

export const LEVEL_01: LevelLayout = {
  worldWidth: WORLD_WIDTH,
  groundY: GROUND_Y,
  // A 20% da primeira tela, com espaço para andar nos dois sentidos.
  playerStartX: 256,
  segments: [
    {
      // Trecho de aprendizado, sem inimigos: só a Anciã, que vem ao encontro do cavaleiro e o
      // avisa do perigo (gatilho 'intro-warning'). Ela nasce a mais de 480px do início, para o
      // jogador dar alguns passos e vê-la chegar antes da fala. É um Innocent: golpeá-la custa
      // a penalidade de inocente, como em qualquer outro lugar da fase.
      id: 'graveyard',
      displayName: 'Cemitério de Vellmark',
      subtitle: 'Onde os mortos não descansam',
      startX: 0,
      endX: FOREST_START_X,
      backgroundKey: 'bg-graveyard',
      backgroundArt: 'layers',
      enemySpawns: [
        {
          type: 'innocent',
          x: 900,
          y: GROUND_Y,
          patrolHalfWidth: 0,
          approachTrigger: 'intro-warning',
        },
      ],
    },
    {
      // Lobos rápidos e frágeis abrem caminho até o lobisomem, o mini-chefe do trecho. Um
      // inocente no meio dos lobos lembra que golpear às cegas custa caro. No fim, uma bruxa
      // adormecida sai das árvores, vem até o jogador e o provoca (gatilho 'witch-taunt'); depois
      // foge para as catacumbas, para avisar as outras, sem lutar. Ela fica a mais de 480px do fim da patrulha do lobisomem, para
      // só vir depois dessa luta.
      // Sem arte própria, a floresta usa as camadas das ruínas (o trecho que ela substituiu),
      // que estavam no projeto sem uso: melhor que a névoa tingida provisória.
      id: 'forest',
      displayName: 'Floresta Sombria',
      subtitle: 'Os lobos rondam entre as árvores',
      startX: FOREST_START_X,
      endX: CATACOMBS_START_X,
      backgroundKey: 'bg-ruins',
      backgroundArt: 'layers',
      backgroundFolder: 'ruins',
      gateX: CATACOMBS_START_X - GATE_MARGIN,
      enemySpawns: [
        { type: 'wolf', x: 1850, y: GROUND_Y, patrolHalfWidth: 100 },
        { type: 'wolf', x: 2050, y: GROUND_Y, patrolHalfWidth: 100 },
        { type: 'innocent', x: 2200, y: GROUND_Y, patrolHalfWidth: 50 },
        { type: 'wolf', x: 2350, y: GROUND_Y, patrolHalfWidth: 100 },
        {
          type: 'werewolf',
          x: 2650,
          y: GROUND_Y,
          patrolHalfWidth: 150,
          healthBarLabel: 'O Lobisomem',
        },
        {
          // Depois da parede do portão (3280 a 3344): nascendo dentro dela, a bruxa aparecia
          // colada ao jogador barrado, como se o portão não existisse.
          type: 'witch',
          x: 3390,
          y: GROUND_Y,
          patrolHalfWidth: 0,
          approachTrigger: 'witch-taunt',
          fleesAfterTrigger: 'witch-taunt',
        },
      ],
    },
    {
      // Só bruxas comuns, mais atentas que as da floresta, espalhadas para virem uma a uma.
      id: 'catacombs',
      displayName: 'Catacumbas',
      subtitle: 'Onde as bruxas despertaram',
      startX: CATACOMBS_START_X,
      endX: ARENA_START_X,
      backgroundKey: 'bg-catacombs',
      backgroundArt: 'layers',
      gateX: ARENA_START_X - GATE_MARGIN,
      witchDetectionRadius: CATACOMBS_WITCH_DETECTION_RADIUS,
      enemySpawns: [
        { type: 'witch', x: 3850, y: GROUND_Y, patrolHalfWidth: 100 },
        { type: 'witch', x: 4250, y: GROUND_Y, patrolHalfWidth: 100 },
        { type: 'witch', x: 4650, y: GROUND_Y, patrolHalfWidth: 100 },
        { type: 'witch', x: 4950, y: GROUND_Y, patrolHalfWidth: 100 },
      ],
    },
    {
      // O chefe fica a 700px da entrada, para ser visto antes de perseguir o jogador. As
      // duas bruxas de apoio, ainda mais atentas, protegem a entrada e a saída da arena.
      id: 'boss-arena',
      displayName: 'Covil da Bruxa Anciã',
      subtitle: 'A senhora das bruxas aguarda',
      startX: ARENA_START_X,
      endX: FINAL_STAGE_START_X,
      backgroundKey: 'bg-boss-arena',
      backgroundArt: 'layers',
      gateX: FINAL_STAGE_START_X - GATE_MARGIN,
      witchDetectionRadius: ARENA_WITCH_DETECTION_RADIUS,
      enemySpawns: [
        { type: 'witch', x: 5550, y: GROUND_Y, patrolHalfWidth: 100 },
        {
          type: 'boss',
          x: 5900,
          y: GROUND_Y,
          patrolHalfWidth: 150,
          healthBarLabel: 'A Bruxa Anciã',
        },
        { type: 'witch', x: 6500, y: GROUND_Y, patrolHalfWidth: 80 },
      ],
    },
    {
      // Duas partes. Primeiro a caminhada pelo cemitério até a catedral (imagem única, sem o
      // chefe à vista), com três bruxas atentas que vêm juntas; depois, em
      // FINAL_BOSS_ARENA_START_X, a arena do demônio (demonArena, abaixo), sem bruxas.
      id: 'final-stage',
      displayName: 'Catedral Profanada',
      subtitle: 'O altar do Demônio',
      startX: FINAL_STAGE_START_X,
      endX: WORLD_WIDTH,
      backgroundKey: 'bg-final-stage-approach',
      backgroundArt: 'single',
      // Portão antes da arena do demônio: só entra nela quem derrotou as bruxas do caminho.
      gateX: FINAL_BOSS_ARENA_START_X - GATE_MARGIN,
      witchDetectionRadius: FINAL_STAGE_WITCH_DETECTION_RADIUS,
      enemySpawns: [
        { type: 'witch', x: 7200, y: GROUND_Y, patrolHalfWidth: 80 },
        { type: 'innocent', x: 7380, y: GROUND_Y, patrolHalfWidth: 50 },
        { type: 'witch', x: 7500, y: GROUND_Y, patrolHalfWidth: 80 },
        { type: 'witch', x: 7700, y: GROUND_Y, patrolHalfWidth: 80 },
      ],
    },
  ],
  // Um ponto de controle no início de cada trecho depois do primeiro, e um na entrada da
  // arena do demônio: quem morre lutando com um chefe volta à entrada da luta dele, sem
  // refazer a fase inteira.
  checkpoints: [
    { id: 'forest-gate', x: FOREST_START_X },
    { id: 'catacombs-gate', x: CATACOMBS_START_X },
    { id: 'boss-arena', x: ARENA_START_X },
    { id: 'final-stage-gate', x: FINAL_STAGE_START_X },
    { id: 'demon-arena', x: DEMON_ARENA_CHECKPOINT_X },
  ],
  demonArena: {
    startX: FINAL_BOSS_ARENA_START_X,
    left: FINAL_BOSS_ARENA_START_X,
    right: WORLD_WIDTH,
    tauntTriggerId: 'demon-taunt',
  },
};

// Tipos de EnemySpawn que contam como chefe para a vitória. O demônio fica fora desta lista
// porque não é um EnemySpawn; a vitória o exige à parte (domain/match-rules.ts).
export const BOSS_TYPES: readonly EnemyType[] = ['boss'];

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
