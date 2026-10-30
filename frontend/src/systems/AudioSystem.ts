import Phaser from 'phaser';
import {
  AMBIENCE_MAX_INTERVAL_MS,
  AMBIENCE_MIN_INTERVAL_MS,
  AMBIENCE_VOLUME,
  BOSS_INTRO_TO_MUSIC_DELAY_MS,
  FOOTSTEPS_VOLUME,
  MUSIC_VOLUME,
  SFX_VOLUMES,
} from '../config/balance';
import { CONTROLS } from '../config/controls';
import {
  BOSS_SEGMENT_ID,
  FOOTSTEPS_KEY,
  MENU_MUSIC_KEY,
  OPTIONAL_SFX,
  SEGMENT_MUSIC_KEYS,
  SFX_VARIANT_COUNTS,
  sfxVariantKey,
  type OptionalSfx,
  type SfxCategory,
} from '../config/audio-manifest';
import { TIMING_MS } from '../ui/theme';

type SoundManager = Phaser.Game['sound'];
type GameSound = ReturnType<SoundManager['add']>;

const MUTE_STORAGE_KEY = 'jogo-halloween:muted';
const MUTED_VALUE = 'true';

// localStorage pode lançar erro (modo privado, cookies bloqueados). Sem acesso, o jogo
// começa com som e a preferência só não é lembrada.
function readStoredMute(): boolean {
  try {
    return window.localStorage.getItem(MUTE_STORAGE_KEY) === MUTED_VALUE;
  } catch {
    return false;
  }
}

function storeMute(muted: boolean): void {
  try {
    window.localStorage.setItem(MUTE_STORAGE_KEY, String(muted));
  } catch {
    // Sem armazenamento, o mudo vale só até recarregar a página; o jogo segue normalmente.
  }
}

interface MusicTrack {
  key: string;
  sound: GameSound;
}

// Único módulo que toca som (seção 9.11). Cenas e sistemas pedem "toque o golpe" e não
// conhecem chave de arquivo, volume ou sorteio de variação.
//
// O gerenciador de som do Phaser é do jogo inteiro, não de uma cena: por isso há uma instância
// por jogo (getAudioSystem), e a música atual atravessa as trocas de cena.
//
// Arquivo ausente nunca quebra o jogo: antes de tocar, a chave é conferida no cache de áudio, e
// se não estiver lá o pedido é ignorado em silêncio. Um som faltando é um detalhe; um erro ou
// um aviso a cada golpe atrapalharia mais que o silêncio.
export class AudioSystem {
  private music?: MusicTrack;
  private footsteps?: GameSound;
  private readonly lastVariantByCategory = new Map<SfxCategory, number>();
  private currentSegmentId?: string;
  private bossIntroPlayed = false;

  constructor(
    private readonly sound: SoundManager,
    private readonly audioCache: Phaser.Cache.BaseCache,
  ) {
    sound.mute = readStoredMute();
  }

  playAttack(): void {
    this.playRandomVariant('attack', SFX_VOLUMES.attack);
  }

  playAttackMagic(): void {
    this.playRandomVariant('attack-magic', SFX_VOLUMES.attackMagic);
  }

  playHurt(): void {
    this.playRandomVariant('hurt', SFX_VOLUMES.hurt);
  }

  // Som único e mais intenso, reservado à morte do jogador.
  playDeath(): void {
    this.playRandomVariant('death', SFX_VOLUMES.death);
  }

  playEnemyDeath(): void {
    this.playRandomVariant('enemy-death', SFX_VOLUMES.enemyDeath);
  }

  playCheckpoint(): void {
    this.playRandomVariant('checkpoint', SFX_VOLUMES.checkpoint);
  }

  playScoreUp(): void {
    this.playOptional('scoreUp');
  }

  playVictory(): void {
    this.playOptional('victory');
  }

  playClick(): void {
    this.playOptional('uiClick');
  }

  // Um único som em loop, reaproveitado: criar um novo a cada passo empilharia cópias.
  startFootsteps(): void {
    if (!this.audioCache.exists(FOOTSTEPS_KEY)) {
      return;
    }
    this.footsteps ??= this.sound.add(FOOTSTEPS_KEY, { loop: true, volume: FOOTSTEPS_VOLUME });
    if (!this.footsteps.isPlaying) {
      this.footsteps.play();
    }
  }

  stopFootsteps(): void {
    this.footsteps?.stop();
  }

  // Prepara o áudio de uma partida nova: zera o anúncio do chefe e o trecho atual, inicia a
  // atmosfera e garante que os passos parem quando a fase acabar.
  startLevel(scene: Phaser.Scene): void {
    this.bossIntroPlayed = false;
    this.currentSegmentId = undefined;
    this.startAmbienceLoop(scene);
    this.bindMuteKey(scene);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.stopFootsteps());
  }

  // Pode ser chamado a cada quadro: só age quando o trecho muda. Ao entrar na arena pela
  // primeira vez, o anúncio do chefe toca sozinho e a música dele entra depois.
  playSegmentMusic(scene: Phaser.Scene, segmentId: string): void {
    if (segmentId === this.currentSegmentId) {
      return;
    }
    this.currentSegmentId = segmentId;
    const musicKey = SEGMENT_MUSIC_KEYS[segmentId];
    if (!musicKey) {
      return;
    }
    if (segmentId !== BOSS_SEGMENT_ID || this.bossIntroPlayed) {
      this.playMusic(scene, musicKey);
      return;
    }
    this.bossIntroPlayed = true;
    this.fadeOutMusic(scene);
    this.playRandomVariant('boss-intro', SFX_VOLUMES.bossIntro);
    scene.time.delayedCall(BOSS_INTRO_TO_MUSIC_DELAY_MS, () => {
      // Se o jogador morreu e voltou a outro trecho durante a espera, a música do chefe não
      // deve entrar por cima da trilha daquele trecho.
      if (this.currentSegmentId === segmentId) {
        this.playMusic(scene, musicKey);
      }
    });
  }

  playMenuTheme(scene: Phaser.Scene): void {
    this.currentSegmentId = undefined;
    this.playMusic(scene, MENU_MUSIC_KEY);
  }

  // Tecla de mudo. Só nas cenas que chamam isto: na tela de resultado a letra M precisa
  // poder ser digitada no nick sem silenciar o jogo.
  bindMuteKey(scene: Phaser.Scene): void {
    const keyboard = scene.input.keyboard;
    if (!keyboard) {
      return;
    }
    // O valor novo é guardado numa variável, e não relido de sound.mute: no Web Audio a leitura
    // vem do ganho do áudio, que só é atualizado no próximo ciclo, e devolveria o valor antigo.
    const toggle = (): void => {
      const muted = !this.sound.mute;
      this.sound.mute = muted;
      storeMute(muted);
    };
    const eventNames = CONTROLS.mute.map((keyName) => `keydown-${keyName}`);
    for (const eventName of eventNames) {
      keyboard.on(eventName, toggle);
    }
    // O teclado da cena sobrevive a reinícios; sem remover, cada partida somaria um ouvinte
    // e uma tecla passaria a alternar o mudo duas vezes (sem efeito nenhum).
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      for (const eventName of eventNames) {
        keyboard.off(eventName, toggle);
      }
    });
  }

  // Sorteia uma das variações da categoria. Variar o arquivo evita que um som repetido muitas
  // vezes (golpe, dano) soe mecânico; repetir a última variação é proibido pelo mesmo motivo,
  // então dois golpes seguidos nunca têm o mesmo som quando há mais de uma opção.
  private playRandomVariant(category: SfxCategory, volume: number): void {
    const count = SFX_VARIANT_COUNTS[category];
    const last = this.lastVariantByCategory.get(category);
    let variant = Phaser.Math.Between(1, count);
    if (count > 1 && variant === last) {
      // Avança uma posição, voltando ao 1 depois da última: escolhe outra sem novo sorteio.
      variant = (variant % count) + 1;
    }
    this.lastVariantByCategory.set(category, variant);
    this.playIfLoaded(sfxVariantKey(category, variant), volume);
  }

  private playOptional(name: OptionalSfx): void {
    this.playIfLoaded(OPTIONAL_SFX[name].key, SFX_VOLUMES[name]);
  }

  // sound.play cria o som, toca e o destrói ao terminar: efeitos curtos não se acumulam.
  private playIfLoaded(key: string, volume: number): void {
    if (this.audioCache.exists(key)) {
      this.sound.play(key, { volume });
    }
  }

  // Atmosfera em intervalos sorteados, só durante a fase: o timer é do relógio da cena e some
  // com ela, então o menu fica sem esses sons sem precisar de um "pare" explícito.
  private startAmbienceLoop(scene: Phaser.Scene): void {
    const scheduleNext = (): void => {
      const delay = Phaser.Math.Between(AMBIENCE_MIN_INTERVAL_MS, AMBIENCE_MAX_INTERVAL_MS);
      scene.time.delayedCall(delay, () => {
        this.playRandomVariant('ambience', AMBIENCE_VOLUME);
        scheduleNext();
      });
    };
    scheduleNext();
  }

  // Troca a trilha com fade: a atual some enquanto a nova entra, e nunca ficam duas tocando
  // depois da transição. Pedir a trilha que já toca não faz nada, então ir do menu ao ranking
  // e voltar não reinicia a música.
  //
  // Navegadores bloqueiam áudio até o primeiro clique ou tecla. O Phaser já trata isso: a
  // trilha pedida antes do gesto fica aguardando e começa assim que o áudio é liberado, sem
  // erro. Por isso a música do menu só é ouvida depois da primeira interação.
  private playMusic(scene: Phaser.Scene, key: string): void {
    if (this.music?.key === key || !this.audioCache.exists(key)) {
      return;
    }
    this.fadeOutMusic(scene);
    const track = this.sound.add(key, { loop: true, volume: 0 });
    track.play();
    this.music = { key, sound: track };
    this.fadeVolume(scene, track, MUSIC_VOLUME, () => undefined);
  }

  private fadeOutMusic(scene: Phaser.Scene): void {
    const current = this.music;
    if (!current) {
      return;
    }
    this.music = undefined;
    this.fadeVolume(scene, current.sound, 0, () => current.sound.destroy());
  }

  // Tween de volume no relógio da cena. Se a cena acabar no meio do fade, o tween morre com
  // ela; por isso o fim é aplicado na hora (volume final e, no fade de saída, o som destruído),
  // para nenhuma trilha ficar presa a meio volume ou tocando junto com a próxima.
  private fadeVolume(
    scene: Phaser.Scene,
    track: GameSound,
    volume: number,
    onDone: () => void,
  ): void {
    const finish = (): void => {
      scene.events.off(Phaser.Scenes.Events.SHUTDOWN, finishEarly);
      onDone();
    };
    const tween = scene.tweens.add({
      targets: track,
      volume,
      duration: TIMING_MS.normal,
      onComplete: finish,
    });
    const finishEarly = (): void => {
      tween.remove();
      track.setVolume(volume);
      onDone();
    };
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, finishEarly);
  }
}

const audioSystemsByGame = new WeakMap<Phaser.Game, AudioSystem>();

// Devolve o AudioSystem do jogo, criando-o na primeira chamada.
export function getAudioSystem(game: Phaser.Game): AudioSystem {
  const existing = audioSystemsByGame.get(game);
  if (existing) {
    return existing;
  }
  const created = new AudioSystem(game.sound, game.cache.audio);
  audioSystemsByGame.set(game, created);
  return created;
}
