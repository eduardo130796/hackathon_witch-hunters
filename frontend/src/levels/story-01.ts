// Slides da abertura, mostrados pela StoryScene antes da fase. Dados puros, sem Phaser, no
// mesmo espírito de narrative-01.ts: o texto da história pode ser lido e testado sem o motor.
// A ordem segue o caminho da fase (cemitério, floresta, catacumbas, arena e altar), para a
// abertura preparar o jogador para o que ele vai encontrar.

export interface StorySlide {
  // Fundo esmaecido do slide: uma das texturas de cenário carregadas pela BootScene.
  backgroundKey: string;
  title: string;
  text: string;
}

export const STORY_01: readonly StorySlide[] = [
  {
    backgroundKey: 'bg-graveyard-layer1',
    title: 'Vellmark',
    text: 'Vellmark era uma vila quieta, cercada de túmulos antigos e de uma floresta que ninguém ousava atravessar depois do anoitecer.',
  },
  {
    backgroundKey: 'bg-catacombs-layer1',
    title: 'O despertar',
    text: 'Numa noite sem lua, as bruxas despertaram nas catacumbas. Os sinos calaram, as velas se apagaram, e o medo tomou cada casa.',
  },
  {
    backgroundKey: 'bg-ruins-layer1',
    title: 'A praga se espalha',
    text: 'Elas tomaram o cemitério e a floresta. Lobos famintos e um lobisomem caçam quem tenta fugir pela mata.',
  },
  {
    backgroundKey: 'bg-boss-arena-layer1',
    title: 'A Bruxa Anciã',
    text: 'À frente do coven está a Bruxa Anciã, a mais velha e cruel de todas, que guarda o caminho até a catedral.',
  },
  {
    backgroundKey: 'bg-final-stage-boss',
    title: 'O Demônio',
    text: 'Mas por trás de tudo há algo pior. No altar da catedral, um Demônio aguarda o momento de consumir Vellmark por inteiro.',
  },
  {
    backgroundKey: 'bg-final-stage-approach',
    title: 'O caçador',
    text: 'Ninguém mais ficou para lutar. Só você, um caçador solitário com uma espada, segue noite adentro para pôr fim a esse pesadelo.',
  },
];
