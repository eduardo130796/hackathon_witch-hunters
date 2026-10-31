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

// px na tela. A bruxa usa a altura da figura (do chapéu aos pés), igual aos ~120px visíveis
// do cavaleiro: os dois se enfrentam de igual para igual. O inocente usa a altura da imagem.
export const WITCH_DISPLAY_HEIGHT = 120;
export const INNOCENT_DISPLAY_HEIGHT = 104;

// Fração da imagem ocupada pela caixa de colisão dos inimigos com uma imagem por pose (hoje,
// só o inocente; os inimigos com sprite sheet usam caixas medidas em pixels do quadro).
// 0.35 da largura cobre tronco e pernas, sem os braços e a barra da roupa.
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
// Encontro antes de uma fala (a Anciã no cemitério, a bruxa no fim da floresta): o personagem
// só começa a andar quando o jogador está a 480px, dentro da meia tela (640px) que a câmera
// mostra de cada lado, para o jogador vê-lo chegar; anda mais rápido que a patrulha, para a
// espera não cansar (cerca de 3 s); e para a 120px, perto o bastante para parecer conversa e
// fora do alcance do golpe da bruxa (WITCH_ATTACK_RANGE, 80px).
export const NARRATIVE_APPROACH_START_RADIUS = 480;
export const NARRATIVE_APPROACH_SPEED = 110;
export const NARRATIVE_APPROACH_STOP_DISTANCE = 120;
// Fuga da bruxa da provocação (ela corre para avisar as outras): mais rápida que a
// perseguição (150), para o jogador não alcançá-la, e some a 760px do jogador, além da meia
// tela (640px) que a câmera mostra de cada lado, ou seja, já fora da tela.
// ms. Teto da espera do jogador enquanto alguém vem falar com ele: o encontro leva cerca de
// 3 s (360px a 110px/s); passado o dobro, o controle volta de qualquer jeito, para um
// personagem que não chegue (morto, preso) nunca travar a partida.
export const APPROACH_MAX_DURATION_MS = 6000;
// Portões de trecho (SegmentGateSystem). Mesma largura da parede da arena, pelo mesmo motivo:
// o jogador nunca a atravessa num quadro. O aviso de portão fechado aparece no máximo a cada
// 2 s, para não repetir enquanto o jogador continua empurrando a parede; e conta como
// "empurrando" quem está a até 8px dela.
export const SEGMENT_GATE_WALL_WIDTH = 64;
export const GATE_MESSAGE_COOLDOWN_MS = 2000;
export const GATE_TOUCH_DISTANCE = 8;
export const WITCH_FLEE_SPEED = 220;
export const WITCH_FLEE_VANISH_DISTANCE = 760;

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

// ms entre a queda do demônio e a fala de epílogo (VictorySequenceSystem): a animação de
// vitória do cavaleiro (até 7 quadros a 6 fps, ≈ 1,2 s) toca inteira e ainda sobra um respiro
// com a pose final na tela, antes de o painel de fala cobrir a cena.
export const VICTORY_POSE_MS = 1800;

// --- Dificuldade por trecho (lida por levels/level-01.ts) ---

// px. Nas catacumbas a bruxa reage 140px antes que no cemitério (300): o jogador já passou
// pela floresta (onde lobos e lobisomem usam números próprios) e é surpreendido mais vezes.
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

// --- Lobo (trecho da floresta) ---

// Uma vida: o lobo cai com um golpe. Ele compensa a fragilidade com velocidade, então a
// ameaça é chegar em bando, não aguentar a luta.
export const WOLF_MAX_HEALTH = 1;
// px/s. Mais rápidos que a bruxa (70 e 150), mas a perseguição fica abaixo de
// PLAYER_MOVE_SPEED (260): o lobo alcança quem hesita, e o jogador ainda consegue fugir.
export const WOLF_PATROL_SPEED = 110;
export const WOLF_CHASE_SPEED = 230;
// px na tela. O lobo anda de quatro: fica mais baixo que o cavaleiro (~120px), mas, como é
// comprido, a largura visível chega a ~120px e ele continua fácil de ver.
export const WOLF_DISPLAY_HEIGHT = 84;

// --- Lobisomem (mini-chefe da floresta) ---

// Cinco vidas: perto do chefe final (6), porque é o mini-chefe do trecho, mas sem igualá-lo.
export const WEREWOLF_MAX_HEALTH = 5;
// Cada golpe tira duas velas, o dobro da bruxa, como o chefe: o mini-chefe precisa assustar.
export const WEREWOLF_DAMAGE = 2;
// px/s. Mais lento que a bruxa (70 e 150): é forte e pesado, e a lentidão dá ao jogador a
// chance de golpear e recuar.
export const WEREWOLF_PATROL_SPEED = 50;
export const WEREWOLF_CHASE_SPEED = 120;
// px na tela. Cerca de 1,4 vez o cavaleiro (~120px): lido como mini-chefe à primeira vista,
// sem competir com o chefe final (216px).
export const WEREWOLF_DISPLAY_HEIGHT = 170;

// --- Animações dos inimigos (sheets em grade uniforme) ---

// Lobo (wolf-sheet.png): a arte original (wolf.png, grade irregular) foi remontada numa grade
// de 6 colunas por 9 linhas, com quadros de 300x300. O quadro é largo porque o lobo é
// comprido e o bote o estica ainda mais.
export const WOLF_FRAME_SIZE = 300;
export const WOLF_SHEET_COLUMNS = 6;
// A última linha (fim da morte, deitado) tem só 4 quadros.
export const WOLF_ROW_FRAME_COUNTS = [6, 6, 6, 6, 6, 6, 6, 6, 4] as const;
// px dentro do quadro: linha dos pés em todos os quadros, definida na remontagem.
export const WOLF_FEET_Y = 296;
// px dentro do quadro: do topo do pelo às patas, medido na linha de repouso (y 175 a 296).
export const WOLF_FIGURE_HEIGHT = 120;
// px dentro do quadro. O lobo é mais comprido que alto: 130px cobrem tronco e patas, sem o
// rabo e o focinho, e 100px vão do dorso às patas.
export const WOLF_HITBOX_WIDTH = 130;
export const WOLF_HITBOX_HEIGHT = 100;

// Lobisomem (werewolf-sheet.png): grade de 6 colunas por 11 linhas, quadros de 240x240,
// remontada a partir de werewolf.png.
export const WEREWOLF_FRAME_SIZE = 240;
export const WEREWOLF_SHEET_COLUMNS = 6;
export const WEREWOLF_ROW_FRAME_COUNTS = [6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6] as const;
export const WEREWOLF_FEET_Y = 236;
// px dentro do quadro: da juba aos pés, medido na linha de repouso (y 107 a 236).
export const WEREWOLF_FIGURE_HEIGHT = 130;
// px dentro do quadro: tronco curvado e pernas, sem as garras estendidas.
export const WEREWOLF_HITBOX_WIDTH = 80;
export const WEREWOLF_HITBOX_HEIGHT = 120;

// Quadros por segundo das animações em laço dos inimigos. Repouso devagar, para respirar;
// caminhada mais rápida, para as patas acompanharem a velocidade sem parecerem deslizar.
export const ENEMY_IDLE_FRAME_RATE = 6;
export const ENEMY_WALK_FRAME_RATE = 10;
// A queda é tocada uma vez, num ritmo que deixa o jogador ver o inimigo cair.
export const ENEMY_DEATH_FRAME_RATE = 9;

// --- Trecho final e narrativa (fase em cinco trechos) ---

// px. No trecho final as bruxas enxergam ainda mais longe que na arena (480): várias
// reagem juntas e o jogador enfrenta o "grande ataque" em vez de duelos isolados.
export const FINAL_STAGE_WITCH_DETECTION_RADIUS = 520;
// px. Largura da zona invisível de cada gatilho de diálogo. Mais larga que um passo do
// jogador por quadro, para ele nunca atravessá-la sem ser detectado.
export const NARRATIVE_TRIGGER_WIDTH = 64;
// ms por caractere no efeito de máquina de escrever: rápido o bastante para não cansar, lento
// o bastante para parecer fala.
export const DIALOGUE_CHAR_INTERVAL_MS = 28;

// Bruxa (witch-sheet.png): a arte original (witch.png, 1536x1024) tem grade irregular e um
// brilho semitransparente de fundo. Ela foi limpa e remontada numa grade de 10 colunas por
// 7 linhas, com quadros de 384x192: largos porque o cajado estendido chega longe do tronco.
export const WITCH_SHEET_FRAME_WIDTH = 384;
export const WITCH_SHEET_FRAME_HEIGHT = 192;
export const WITCH_SHEET_COLUMNS = 10;
export const WITCH_SHEET_ROW_FRAME_COUNTS = [9, 8, 8, 6, 10, 8, 4] as const;
// px dentro do quadro: linha dos pés em todos os quadros, definida na remontagem.
export const WITCH_SHEET_FEET_Y = 188;
// px dentro do quadro: do chapéu aos pés, medido na linha de repouso (y 38 a 188).
export const WITCH_SHEET_FIGURE_HEIGHT = 150;
// px dentro do quadro: tronco e saia, sem o cajado e a aba do chapéu; a altura começa logo
// abaixo da ponta do chapéu.
export const WITCH_SHEET_HITBOX_WIDTH = 60;
export const WITCH_SHEET_HITBOX_HEIGHT = 140;

// --- Arena do demônio ---

// px. Largura da parede invisível na entrada da arena, que impede o jogador de voltar ao
// trecho de caminhada durante a luta. Mais larga que o passo do jogador por quadro, para ele
// nunca atravessá-la, nem empurrado pelo recuo de um golpe.
export const DEMON_ARENA_WALL_WIDTH = 64;
// px da tela: onde fica a borda de baixo do ponto fraco do demônio. O cenário é escalado para
// isso (DemonArenaSystem). Com o pulo do cavaleiro (cerca de 137px), o golpe no alto do pulo
// cobre y ≈ 405–519; com a borda em 540, o ponto fraco (y ≈ 396–540) fica bem ao alcance de
// um golpe pulando, e a imagem ainda cobre a tela inteira.
export const DEMON_ARENA_WEAK_POINT_BOTTOM_Y = 540;

// --- Demônio (chefe final da arena) ---
// Sem DEMON_HIT_POINTS de propósito: o servidor calcula a pontuação oficial e só conhece
// bruxas, inocentes e dano. Pontos por golpe no demônio nunca contariam no ranking, então
// mostrá-los enganaria o jogador. A morte do demônio conta como uma bruxa (SCORE_RULES).

// Oito vidas: com a janela vulnerável de 3 s e a pausa de dano, cabem cerca de três golpes
// por ciclo, então a luta dura três ou quatro ciclos de ataque: clímax sem cansar.
export const DEMON_MAX_HEALTH = 8;
// Velas tiradas do jogador (de 5). A bola de fogo é avisada e fácil de evitar: tira uma.
// A garra é mais rápida e pune quem fica parado: tira duas.
export const DEMON_DAMAGE_FIREBALL = 1;
export const DEMON_DAMAGE_CLAW = 2;
// Ordem dos padrões: 'alternate' é previsível e ensina a luta; 'random' para quem já conhece.
export const DEMON_ATTACK_ORDER: 'alternate' | 'random' = 'alternate';

// ms de respiro depois do diálogo, antes do primeiro ataque: o jogador se posiciona.
export const DEMON_INTRO_DURATION_MS = 1500;
// ms em que o ponto fraco fica exposto depois de cada ataque: tempo de chegar e golpear.
export const DEMON_VULNERABLE_DURATION_MS = 3000;
// ms de reação a um golpe no ponto fraco. Maior que ATTACK_DURATION_MS (350): golpes
// seguidos não somam dano sem pausa, e cada acerto é percebido.
export const DEMON_HURT_DURATION_MS = 450;
// ms entre a morte e a vitória: tempo de ver o demônio apagar antes da tela de resultado.
export const DEMON_DEATH_DISPLAY_MS = 2500;
// Brilho final do cenário na morte (0 a 255 por canal): 70 deixa o demônio quase apagado,
// mas ainda visível, para o jogador ver quem derrotou.
export const DEMON_DEATH_BRIGHTNESS = 70;

// Ponto fraco: frações da imagem body.png EXIBIDA. ESTIMATIVA a confirmar rodando o jogo.
// Olhando a arte, as rachaduras vermelhas mais brilhantes do peito convergem em x ≈ 50% e
// y ≈ 45–50%; a estimativa inicial (50–62% de altura) ficava no fim do peito. A faixa
// 44–60% cobre o centro do brilho e desce o bastante para o cavaleiro alcançar pulando.
export const DEMON_WEAK_POINT = {
  leftRatio: 0.44,
  rightRatio: 0.56,
  topRatio: 0.44,
  bottomRatio: 0.6,
} as const;

// --- Demônio: bola de fogo ---

// ms de aviso no chão antes de a bola cair: tempo de ver e sair da zona.
export const DEMON_FIREBALL_TELEGRAPH_MS = 1200;
// Quantas bolas por ataque. Duas: uma no jogador e uma ao lado, para fugir exigir escolha.
export const DEMON_FIREBALL_COUNT = 2;
// px entre duas bolas vizinhas: maior que o dobro do raio, para sobrar chão seguro entre elas.
export const DEMON_FIREBALL_SPACING = 260;
// px de meia largura da zona de impacto: a explosão cobre cerca de 1,5 cavaleiro de cada lado.
export const FIREBALL_IMPACT_RADIUS = 80;
// px de folga das paredes da arena, para a zona de impacto não sair da tela.
export const DEMON_ARENA_MARGIN = 80;
// ms de queda, do topo da tela ao chão: rápida como um meteoro, já que o aviso veio antes.
export const DEMON_FIREBALL_FALL_MS = 450;
// ms entre a queda de uma bola e a da seguinte: dois impactos distintos se leem melhor.
export const DEMON_FIREBALL_STAGGER_MS = 200;
// px de altura da bola na tela (a imagem tem 1774px): cerca de 1,7 cavaleiro, com a cauda.
export const DEMON_FIREBALL_DISPLAY_HEIGHT = 200;
// graus de inclinação: a bola cai levemente torta, como um meteoro, e não em linha reta.
export const DEMON_FIREBALL_TILT_DEGREES = 12;
// Tremor leve no impacto: menor que o golpe do jogador (0.005), porque é frequente.
export const DEMON_FIREBALL_SHAKE_INTENSITY = 0.004;
export const DEMON_FIREBALL_SHAKE_MS = 150;

// --- Demônio: garra ---

// ms de aviso (rachaduras e tremor) antes da garra subir. Menor que o da bola de fogo:
// a garra é um único ponto, e o jogador só precisa dar um passo para o lado.
export const DEMON_CLAW_TELEGRAPH_MS = 1000;
// Tremor sutil durante o aviso: sentido, mas sem atrapalhar a leitura das rachaduras.
export const DEMON_CLAW_TELEGRAPH_SHAKE_INTENSITY = 0.002;
// ms que a garra leva para irromper: curto, para o golpe parecer violento.
export const DEMON_CLAW_RISE_MS = 180;
// ms que a garra fica erguida antes de descer: tempo de ver o golpe.
export const DEMON_CLAW_HOLD_MS = 500;
// ms de descida: mais lenta que a subida, o recuo não precisa de urgência.
export const DEMON_CLAW_RETRACT_MS = 350;
// px de altura da garra na tela (a imagem tem 1024px): o dobro do cavaleiro, uma ameaça clara.
export const DEMON_CLAW_DISPLAY_HEIGHT = 260;
// px que a base da imagem fica abaixo do chão: os destroços parecem sair de dentro dele.
export const DEMON_CLAW_SINK = 30;
// px de meia largura da zona de impacto: um pouco menos que meia garra (≈195px), para só os
// dedos ferirem.
export const CLAW_IMPACT_RADIUS = 110;
// Tremor forte e hitstop curto no impacto: a garra é o golpe mais pesado do demônio.
export const DEMON_CLAW_SHAKE_INTENSITY = 0.012;
export const DEMON_CLAW_SHAKE_MS = 300;
export const DEMON_CLAW_HITSTOP_MS = 90;
// px/s do empurrão da garra no jogador: quase o dobro de PLAYER_KNOCKBACK_FORCE (300), para
// a garra arremessar o cavaleiro, o que nenhum inimigo comum faz.
export const DEMON_CLAW_KNOCKBACK_FORCE = 560;

// --- Demônio: morte ---
// Tremor pesado e longo: a queda do chefe final é o maior evento da partida.
export const DEMON_DEATH_SHAKE_INTENSITY = 0.025;
export const DEMON_DEATH_SHAKE_MS = 1200;
