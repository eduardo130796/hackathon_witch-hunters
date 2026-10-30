// Números de balanceamento da jogabilidade. Ajustar a sensação do jogo começa por aqui.

// px/s: atravessa a tela de 1280px em cerca de 5 s, rápido para fugir e lento o bastante para mirar.
export const PLAYER_MOVE_SPEED = 260;

// px/s, negativo porque o eixo Y do Phaser cresce para baixo. Com GRAVITY_Y, o pulo sobe
// cerca de 137px (v² / 2g), pouco mais que a altura do personagem: alcança plataformas sem voar.
export const PLAYER_JUMP_VELOCITY = -620;

// px/s². Gravidade alta deixa o pulo curto e responsivo, como em plataformas de ação.
export const GRAVITY_Y = 1400;

// ms em que a pose de ataque fica na tela. Curto o bastante para o jogador voltar a se mover
// logo, longo o bastante para o golpe ser percebido.
export const ATTACK_DURATION_MS = 350;

// ms em que a pose de dano fica na tela; menor que INVINCIBILITY_MS para o jogador retomar o
// controle visual antes de voltar a ficar vulnerável.
export const HURT_DURATION_MS = 400;

// Pontos de vida. Com 5, o jogador aguenta alguns erros sem que a fase vire punição.
export const PLAYER_MAX_HEALTH = 5;

// ms em que o pulo ainda vale depois de sair da borda; perdoa o atraso humano de reação.
export const PLAYER_COYOTE_TIME_MS = 100;

// ms em que um pulo apertado pouco antes de tocar o chão fica guardado e dispara ao pousar.
export const PLAYER_JUMP_BUFFER_MS = 120;

// ms de invencibilidade após levar dano, para um mesmo inimigo não tirar várias vidas seguidas.
export const INVINCIBILITY_MS = 1000;

// --- Combate ---

// Pontos de vida tirados por golpe. Valores inteiros e pequenos tornam cada acerto legível:
// o jogador conta golpes, não porcentagens.
export const PLAYER_ATTACK_DAMAGE = 1;
export const WITCH_ATTACK_DAMAGE = 1;

// px além da borda do corpo do cavaleiro que a espada alcança. Medido na pose de ataque:
// a lâmina passa cerca de meio corpo à frente do tronco.
export const PLAYER_ATTACK_REACH = 64;

// --- Inimigos ---

// Duas vidas: a bruxa aguenta um golpe e mostra a pose de dano antes de morrer, então o
// jogador vê que acertou sem que a luta fique longa.
export const WITCH_MAX_HEALTH = 2;
// Duas vidas também no inocente: o primeiro golpe só fere e serve de aviso antes da penalidade
// de pontuação, que só vem se o jogador insistir.
export const INNOCENT_MAX_HEALTH = 2;

// px na tela. Próximos dos ~120px visíveis do cavaleiro, mas com menos sobra transparente,
// para o herói continuar se destacando na cena.
export const WITCH_DISPLAY_HEIGHT = 120;
export const INNOCENT_DISPLAY_HEIGHT = 104;

// Fração da imagem ocupada pela caixa de colisão dos inimigos, centralizada, como no cavaleiro.
// 0.35 da largura cobre tronco e pernas, sem o chapéu, o cajado e a barra do vestido.
export const ENEMY_HITBOX_WIDTH_RATIO = 0.35;
// 0.93 da altura: medindo os PNGs, os pés ficam em média 9px acima da borda inferior (de
// 256px). Uma caixa centralizada com 93% da altura termina nessa linha.
export const ENEMY_HITBOX_HEIGHT_RATIO = 0.93;

// px/s. A bruxa patrulha devagar e persegue mais rápido, mas sempre abaixo de
// PLAYER_MOVE_SPEED (260): o jogador consegue fugir se quiser.
export const WITCH_PATROL_SPEED = 70;
export const WITCH_CHASE_SPEED = 150;
// px/s. O inocente anda mais devagar que a bruxa, para os dois serem fáceis de distinguir.
export const INNOCENT_PATROL_SPEED = 50;

// px entre os pés da bruxa e os do jogador. 300px é cerca de 1/4 da tela: ela reage antes
// de o jogador chegar, mas não o persegue desde o outro lado do mapa.
export const WITCH_DETECTION_RADIUS = 300;
// px. Com os dois corpos encostados, os pés ficam a cerca de 56px; 80px dispara o ataque
// um pouco antes do contato, como um golpe com o braço estendido.
export const WITCH_ATTACK_RANGE = 80;
// px além da borda do corpo da bruxa que o golpe alcança.
export const WITCH_ATTACK_REACH = 48;

// ms. O golpe da bruxa só fere depois da preparação (windup): é a janela para o jogador
// perceber a pose de ataque e recuar ou golpear primeiro.
export const WITCH_ATTACK_WINDUP_MS = 300;
// ms de pose de ataque, preparação incluída.
export const WITCH_ATTACK_DURATION_MS = 600;
// ms de espera entre o fim de um ataque e o próximo, para a bruxa não atacar sem parar.
export const WITCH_ATTACK_COOLDOWN_MS = 900;

// ms na pose de dano. Menor que ATTACK_DURATION_MS (350) do jogador, para a reação do
// inimigo terminar antes de o próximo golpe poder acertar.
export const ENEMY_HURT_DURATION_MS = 300;

// --- Chefe ---

// O chefe é uma bruxa mais forte. Seis vidas pedem seis golpes: três vezes a bruxa comum,
// uma luta que exige desviar dos ataques, mas termina antes de cansar.
export const BOSS_MAX_HEALTH = 6;
// Cada golpe do chefe tira duas velas, o dobro da bruxa: errar perto dele custa caro.
export const BOSS_DAMAGE = 2;
// Fator sobre WITCH_DISPLAY_HEIGHT. 1.8 deixa o chefe bem maior que o cavaleiro (216px
// contra ~120px), lido como ameaça à primeira vista, sem passar de 1/3 da tela.
export const BOSS_SCALE = 1.8;

// --- Fluxo da partida ---

// Respawns permitidos na partida inteira. Com 3, o jogador tem 4 tentativas no total:
// errar faz parte de aprender a luta do chefe, mas morrer sem limite tiraria o peso de
// cada vida e deixaria a partida infinita.
export const MAX_RESPAWNS = 3;

// ms entre a morte e o retorno ao ponto de controle: o mesmo tempo de ver a pose de morte
// usado antes da tela de resultado, para o jogador entender que morreu.
export const RESPAWN_DELAY_MS = 1500;

// ms entre a morte final (respawns esgotados) e a tela de resultado: tempo para ver a pose de
// morte e entender o que aconteceu antes da troca de tela.
export const DEATH_TO_RESULT_DELAY_MS = 1500;

// ms entre entrar na zona final e a tela de resultado: um respiro para o jogador perceber
// que venceu, em vez de a tela trocar no mesmo quadro.
export const VICTORY_DELAY_MS = 1500;

// --- Dificuldade por trecho (lida por levels/level-01.ts) ---

// px. Nas ruínas a bruxa reage 100px antes que no cemitério (300): o jogador já aprendeu a
// lutar e passa a ser surpreendido com mais frequência.
export const ADVANCED_WITCH_DETECTION_RADIUS = 400;
// px. Nas catacumbas, um passo entre as ruínas e a arena: a dificuldade sobe aos poucos.
export const CATACOMBS_WITCH_DETECTION_RADIUS = 440;
// px. Na arena as bruxas de apoio enxergam ainda mais longe, para a luta com o chefe não
// virar um duelo isolado.
export const ARENA_WITCH_DETECTION_RADIUS = 480;

// --- Animações do cavaleiro ---

// px da sprite sheet do cavaleiro (knight-sheet-transparent.png). A arte original vem numa
// grade irregular (linhas de 140 a 160px, espadas invadindo o quadro vizinho); ela foi
// remontada numa grade uniforme de 7 colunas por 11 linhas com quadros de 224x224. O quadro
// é grande assim porque as estocadas chegam a 110px do tronco, e um quadro menor cortaria a
// lâmina.
export const KNIGHT_FRAME_SIZE = 224;
export const KNIGHT_SHEET_COLUMNS = 7;
// Quadros de cada linha da sheet, na ordem das linhas: nem toda linha preenche as 7 colunas,
// e tocar uma célula vazia faria o cavaleiro sumir por um instante.
export const KNIGHT_ROW_FRAME_COUNTS = [7, 7, 6, 6, 6, 6, 7, 7, 6, 7, 6] as const;

// px dentro do quadro. Na remontagem, os pés de todos os quadros foram colocados nesta linha
// (4px acima da borda inferior) e o tronco no centro da largura. A origem do sprite fica
// aqui, para que a coordenada y do jogador seja o chão.
export const KNIGHT_FEET_Y = 220;

// px dentro do quadro: altura do cavaleiro de pé, do elmo aos pés, medida na linha de idle.
export const KNIGHT_FIGURE_HEIGHT = 135;

// px na tela. Altura visível do cavaleiro, a mesma das antigas imagens por pose: cerca de 1/6
// da tela de 720px, espaço suficiente para ver inimigos e plataformas. A escala do sprite é
// esta altura dividida por KNIGHT_FIGURE_HEIGHT.
export const PLAYER_FIGURE_DISPLAY_HEIGHT = 120;

// px dentro do quadro (o Phaser aplica a escala ao corpo). A colisão cobre só tronco e
// pernas, sem capa e espada, senão o jogador bateria em paredes com a ponta da capa.
// 52px de largura, centralizados no tronco: centralizar também mantém o corpo no lugar
// quando a imagem é espelhada para a esquerda, já que o Phaser não espelha o offset.
export const KNIGHT_HITBOX_WIDTH = 52;
// 128px de altura, terminando em KNIGHT_FEET_Y: vai de logo abaixo do topo do elmo até os
// pés, então o corpo encosta no chão sem afundar nem flutuar.
export const KNIGHT_HITBOX_HEIGHT = 128;

// Quadros das linhas usadas em ataque e dano (linhas 2, 3 e 4 da sheet), para derivar o ritmo.
const KNIGHT_ATTACK_FRAMES = 6;
const KNIGHT_HURT_FRAMES = 6;

// Quadros por segundo. Respirar em loop pede ritmo lento; mais rápido pareceria ofegante.
export const KNIGHT_IDLE_FRAME_RATE = 6;
// A caminhada usa a linha de passos em guarda; 10 quadros/s acompanham a velocidade de
// PLAYER_MOVE_SPEED sem os pés parecerem deslizar.
export const KNIGHT_WALK_FRAME_RATE = 10;
// Derivado de ATTACK_DURATION_MS: a linha inteira toca exatamente durante o estado de
// ataque, então a espada só fere enquanto o golpe aparece na tela (cerca de 17 quadros/s).
export const KNIGHT_ATTACK_FRAME_RATE = (KNIGHT_ATTACK_FRAMES * 1000) / ATTACK_DURATION_MS;
// Derivado de HURT_DURATION_MS: o recuo e a recuperação cabem no tempo da pose de dano.
export const KNIGHT_HURT_FRAME_RATE = (KNIGHT_HURT_FRAMES * 1000) / HURT_DURATION_MS;
// Com 9 quadros/s os 7 quadros do salto duram cerca de 0,8 s, perto de um pulo completo no ar.
export const KNIGHT_JUMP_FRAME_RATE = 9;
// A queda tem 6 quadros; com 8 quadros/s termina em 0,75 s, antes de RESPAWN_DELAY_MS, e o
// jogador ainda vê o cavaleiro caído antes de reaparecer.
export const KNIGHT_DEATH_FRAME_RATE = 8;
// A vitória é contemplativa: lenta, pouco mais de 1 s para ajoelhar, brilhar e levantar.
export const KNIGHT_VICTORY_FRAME_RATE = 6;

// repeat do Phaser: -1 repete para sempre; 0 toca uma vez e para no último quadro.
export const ANIMATION_LOOP_FOREVER = -1;
export const ANIMATION_PLAY_ONCE = 0;

// --- Feedback de combate ---
// Só sensação visual: nenhum destes valores muda dano, vida ou pontuação.

// ms de congelamento da física ao conectar um golpe (hitstop). Entre 50 e 100 ms o olho
// percebe o "impacto" sem sentir o jogo travado; acima disso parece queda de quadros.
export const HITSTOP_DURATION_MS = 70;
// ms ao matar: um pouco mais que um golpe comum, para o golpe final pesar mais.
export const KILL_HITSTOP_DURATION_MS = 100;
// ms ao morrer: bem mais longo, para dar peso ao momento antes do escurecimento tomar a tela.
export const DEATH_HITSTOP_DURATION_MS = 220;

// Intensidade do tremor de câmera, em fração do tamanho da tela (padrão do Phaser).
// 0.005 é cerca de 6px em 1280px: perceptível sem embaralhar a leitura da cena.
export const SHAKE_INTENSITY = 0.005;
export const SHAKE_DURATION_MS = 120;
// Matar treme um pouco mais e por mais tempo que um golpe comum.
export const KILL_SHAKE_INTENSITY = 0.008;
export const KILL_SHAKE_DURATION_MS = 180;
// Morte do jogador: tremor forte (cerca de 25px) e longo, o evento mais grave da partida.
export const SHAKE_INTENSITY_HEAVY = 0.02;
export const DEATH_SHAKE_DURATION_MS = 450;

// px/s do empurrão horizontal no inimigo atingido. Maior que WITCH_CHASE_SPEED (150), para o
// recuo vencer a perseguição e ser visível.
export const KNOCKBACK_FORCE = 320;
// px/s para cima (negativo no Phaser): um pequeno salto deixa o recuo legível mesmo de longe.
export const KNOCKBACK_LIFT = -160;
// ms em que a IA do inimigo não sobrescreve o empurrão. Conta o tempo do hitstop, por isso é
// maior que ele; e fica abaixo de ENEMY_HURT_DURATION_MS (300) para o recuo acabar dentro da
// pose de dano.
export const KNOCKBACK_DURATION_MS = 240;
// Fração do empurrão aplicada ao chefe: ele é maior e mais pesado, e recuar como uma bruxa
// comum tiraria a sensação de ameaça.
export const BOSS_KNOCKBACK_RATIO = 0.35;

// px/s do empurrão no jogador ao levar dano, para longe de quem atacou. Maior que
// PLAYER_MOVE_SPEED (260), para ser sentido mesmo segurando a direção contrária.
export const PLAYER_KNOCKBACK_FORCE = 300;
export const PLAYER_KNOCKBACK_LIFT = -220;
// ms sem controle horizontal depois do dano. Menor que HURT_DURATION_MS (400): o jogador
// recupera o controle antes de a pose de dano acabar, então o empurrão não vira punição.
export const PLAYER_KNOCKBACK_DURATION_MS = 200;

// Partículas de sangue. 'kill' tem mais gotas, maiores, mais rápidas e mais duradouras que
// 'hit', para a morte parecer mais impactante que um golpe comum.
// speed em px/s, lifespanMs em ms, scale em múltiplos do raio da gota.
export const BLOOD_SPLATTER = {
  hit: { count: 5, speedMin: 90, speedMax: 220, scale: 1, lifespanMs: 420 },
  kill: { count: 12, speedMin: 140, speedMax: 340, scale: 1.6, lifespanMs: 700 },
} as const;
// px de raio da gota na textura gerada; a escala acima aumenta a partir dele.
export const BLOOD_DROPLET_RADIUS = 3;
// px/s². Gravidade leve, menor que GRAVITY_Y: as gotas fazem um arco curto antes de sumir.
export const BLOOD_GRAVITY_Y = 700;
// Graus de abertura do jato em torno da direção do golpe: espalha sem virar um círculo.
export const BLOOD_SPREAD_DEGREES = 80;
// Graus acima da horizontal para onde o jato aponta, para o sangue subir antes de cair.
export const BLOOD_LIFT_DEGREES = 35;

// --- Áudio ---
// Volumes de 0 a 1, relativos ao volume geral do navegador. A música fica baixa de propósito:
// ela é fundo, e os efeitos (golpe, dano) precisam ser ouvidos por cima dela.

// Trilha do menu e dos trechos da fase.
export const MUSIC_VOLUME = 0.35;
// Sons de atmosfera esporádicos: mais baixos que a música, para soarem distantes.
export const AMBIENCE_VOLUME = 0.25;
// Loop de passos: baixo, porque toca o tempo todo enquanto o jogador anda e cansaria alto.
export const FOOTSTEPS_VOLUME = 0.3;

// Efeitos curtos. Dano e morte do jogador são os mais altos: são os avisos mais importantes.
// O golpe do jogador é frequente, então fica abaixo deles para não saturar.
export const SFX_VOLUMES = {
  attack: 0.55,
  attackMagic: 0.6,
  hurt: 0.75,
  death: 0.9,
  enemyDeath: 0.6,
  checkpoint: 0.6,
  bossIntro: 0.9,
  scoreUp: 0.5,
  victory: 0.8,
  uiClick: 0.5,
} as const;

// ms entre dois sons de atmosfera, sorteados neste intervalo. Raros e irregulares, para
// soarem como o ambiente e não como um relógio; o mínimo evita dois sons quase seguidos.
export const AMBIENCE_MIN_INTERVAL_MS = 15000;
export const AMBIENCE_MAX_INTERVAL_MS = 30000;

// ms entre o início do som de entrada da arena e o início da música do chefe. O intro toca
// sozinho primeiro, como um anúncio; a música entra depois, com fade, sob o fim do intro.
export const BOSS_INTRO_TO_MUSIC_DELAY_MS = 2500;
