// Falas da fase 1: quem fala, o que diz e o que a dispara. Dados puros, sem Phaser, no mesmo
// espírito de level-01.ts, para o roteiro ser lido e testado sem o motor. O
// NarrativeTriggerSystem mostra cada fala uma única vez.

export interface NarrativeTrigger {
  id: string;
  // px do mundo onde fica a zona invisível do gatilho; a fala começa quando o jogador a
  // alcança. Sem x, a fala começa quando o personagem que vem ao encontro do jogador chega
  // perto dele (approachTrigger no spawn, em level-01.ts).
  x?: number;
  speaker: string;
  lines: string[];
}

// Para adicionar uma fala nova, basta acrescentar um item a esta lista, com um id único e o x
// desejado (ou sem x, ligada a um approachTrigger). A ordem da lista não importa. Para um
// inimigo esperar a fala terminar, use o id do gatilho em awakenedByTrigger no spawn.
export const NARRATIVE_01: readonly NarrativeTrigger[] = [
  {
    // A Anciã do cemitério vem ao encontro do cavaleiro logo no início e o avisa do perigo.
    id: 'intro-warning',
    speaker: 'Anciã',
    lines: [
      'Corra! Elas... elas acordaram nas catacumbas!',
      'Eu tentei avisar os outros, mas ninguém escutou.',
      'E as bruxas não agem sozinhas: servem a um Demônio que as espera na velha catedral.',
      'Por favor, caçador... chegue até ele e acabe com isso antes que seja tarde.',
    ],
  },
  {
    // No fim da floresta, uma bruxa sai das árvores, vem até o cavaleiro e o provoca. Quando
    // esta fala termina, ela foge para as catacumbas, sem lutar.
    id: 'witch-taunt',
    speaker: 'Bruxa',
    lines: [
      'Mais um tolo com uma espada...',
      'Vellmark já não pertence aos vivos.',
      'Meu mestre o aguarda na catedral, caçador.',
      'Vamos ver quanto tempo você dura.',
    ],
  },
  {
    // Dentro da arena do demônio (entrada em x = 7920, ponto de controle em 8040): a zona
    // fica longe da entrada para a fala só abrir com a câmera já travada e o cenário à vista.
    // A luta só começa quando esta fala termina (DemonArenaSystem).
    id: 'demon-taunt',
    x: 8150,
    speaker: 'Demônio',
    lines: [
      'Mais um verme ousa pisar em meu altar...',
      'Vellmark será consumida, e você será o primeiro a arder.',
      'Mostre-me do que é feito, caçador.',
    ],
  },
];

// Epílogo da vitória. Fica fora de NARRATIVE_01 porque não tem zona nem personagem que venha
// ao encontro do jogador: quem o abre é o VictorySequenceSystem, depois da queda do demônio.
export const VICTORY_EPILOGUE: NarrativeTrigger = {
  id: 'victory-epilogue',
  speaker: 'Narrador',
  lines: [
    'O Demônio tomba, e seu altar se desfaz em cinzas.',
    'A aurora rompe sobre Vellmark: a cidade está salva.',
    'E o nome do caçador será lembrado por muitas gerações.',
  ],
};

// Aviso ao encostar num portão de trecho ainda fechado (SegmentGateSystem).
export const GATE_BLOCKED_MESSAGE = 'Derrote todos os inimigos para avançar';
