// Chaves centralizadas: trocar de cena por texto solto quebraria em silêncio com um erro de digitação.
export const SCENE_KEYS = {
  boot: 'BootScene',
  menu: 'MenuScene',
  story: 'StoryScene',
  howToPlay: 'HowToPlayScene',
  level: 'LevelScene',
  ranking: 'RankingScene',
  result: 'ResultScene',
} as const;
