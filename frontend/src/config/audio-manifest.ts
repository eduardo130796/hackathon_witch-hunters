// Lista de todos os arquivos de som do jogo, em public/assets/audio/. A BootScene carrega
// daqui e o AudioSystem monta as chaves a partir dos mesmos nomes, para nada se repetir.

const AUDIO_PATH = 'assets/audio';

// Sons com variações numeradas (attack-1, attack-2...). O número é quantos arquivos existem
// na pasta sfx/<categoria>/: o AudioSystem sorteia entre 1 e esse número.
export const SFX_VARIANT_COUNTS = {
  attack: 3,
  'attack-magic': 1,
  hurt: 4,
  death: 1,
  'enemy-death': 5,
  checkpoint: 1,
  ambience: 3,
  'boss-intro': 1,
} as const;

export type SfxCategory = keyof typeof SFX_VARIANT_COUNTS;

export function sfxVariantKey(category: SfxCategory, variant: number): string {
  return `${category}-${variant}`;
}

export const FOOTSTEPS_KEY = 'footsteps-loop';

// Sons opcionais: o jogo funciona sem eles. available diz se o arquivo já está na pasta.
//
// Arquivo ausente não é pedido ao servidor, em vez de "pedir e deixar falhar": no servidor de
// desenvolvimento do Vite, uma URL inexistente devolve o index.html com status 200, e o Phaser
// registra um erro de decodificação de áudio no console a cada carga. Para ligar um destes,
// basta colocar o arquivo na pasta e mudar available para true. O AudioSystem ainda confere o
// cache antes de tocar, então um available errado também não quebra o jogo.
// (O hover dos botões, ui/hover.mp3, fica de fora: ainda não há arquivo nem uso no jogo.)
export const OPTIONAL_SFX = {
  scoreUp: { key: 'score-up', url: 'sfx/score/score-up.mp3', available: false },
  victory: { key: 'victory', url: 'sfx/victory/victory.mp3', available: false },
  uiClick: { key: 'click', url: 'sfx/ui/click.mp3', available: false },
} as const;

export type OptionalSfx = keyof typeof OPTIONAL_SFX;

export const MENU_MUSIC_KEY = 'menu-theme';

// Trilha de cada trecho da fase. O mapa é explícito, e não 'ambient-' + id do trecho, porque
// os nomes não batem: o trecho 'boss-arena' usa o arquivo ambient-boss.mp3. Trecho fora do
// mapa simplesmente mantém a música que estiver tocando.
export const SEGMENT_MUSIC_KEYS: Readonly<Record<string, string>> = {
  graveyard: 'ambient-graveyard',
  ruins: 'ambient-ruins',
  catacombs: 'ambient-catacombs',
  'boss-arena': 'ambient-boss',
};

// Trecho cuja entrada toca o som de anúncio do chefe antes da música.
export const BOSS_SEGMENT_ID = 'boss-arena';

interface AudioFile {
  key: string;
  url: string;
}

function variantFiles(): AudioFile[] {
  // Object.keys perde o tipo das chaves; a conversão é segura porque a lista é a própria constante.
  const categories = Object.keys(SFX_VARIANT_COUNTS) as SfxCategory[];
  return categories.flatMap((category) =>
    Array.from({ length: SFX_VARIANT_COUNTS[category] }, (_, index) => {
      const key = sfxVariantKey(category, index + 1);
      return { key, url: `${AUDIO_PATH}/sfx/${category}/${key}.mp3` };
    }),
  );
}

function musicFiles(): AudioFile[] {
  const keys = [MENU_MUSIC_KEY, ...Object.values(SEGMENT_MUSIC_KEYS)];
  return keys.map((key) => ({ key, url: `${AUDIO_PATH}/music/${key}.mp3` }));
}

export const AUDIO_FILES: readonly AudioFile[] = [
  ...variantFiles(),
  { key: FOOTSTEPS_KEY, url: `${AUDIO_PATH}/sfx/footsteps/${FOOTSTEPS_KEY}.mp3` },
  ...Object.values(OPTIONAL_SFX)
    .filter((sound) => sound.available)
    .map(({ key, url }) => ({ key, url: `${AUDIO_PATH}/${url}` })),
  ...musicFiles(),
];
