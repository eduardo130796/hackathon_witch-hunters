// Números de balanceamento da jogabilidade. Ajustar a sensação do jogo começa por aqui.

// px/s: atravessa a tela de 1280px em cerca de 5 s, rápido para fugir e lento o bastante para mirar.
export const PLAYER_MOVE_SPEED = 260;

// px/s, negativo porque o eixo Y do Phaser cresce para baixo. Com GRAVITY_Y, o pulo sobe
// cerca de 137px (v² / 2g), pouco mais que a altura do personagem: alcança plataformas sem voar.
export const PLAYER_JUMP_VELOCITY = -620;

// px/s². Gravidade alta deixa o pulo curto e responsivo, como em plataformas de ação.
export const GRAVITY_Y = 1400;

// px na tela. Todas as poses são escaladas para esta altura: assim o personagem não muda de
// tamanho ao trocar de textura, mesmo que um PNG venha com dimensões diferentes dos outros.
// 128px é cerca de 1/6 da tela de 720px, espaço suficiente para ver inimigos e plataformas.
export const PLAYER_DISPLAY_HEIGHT = 128;

// Fração da imagem ocupada pela caixa de colisão, centralizada. As poses têm muito espaço
// transparente (capa, espada): a colisão deve cobrir só o corpo, senão o jogador bateria
// em paredes com a ponta da capa.
// 0.4 da largura cobre o tronco e as pernas, sem a espada e a capa.
export const PLAYER_HITBOX_WIDTH_RATIO = 0.4;
// 0.86 da altura: medindo os PNGs, os pés ficam em média 18px acima da borda inferior
// (de 256px). Uma caixa centralizada com 86% da altura termina nessa linha, então os pés
// encostam no chão sem afundar nem flutuar.
export const PLAYER_HITBOX_HEIGHT_RATIO = 0.86;

// ms em que a pose de ataque fica na tela. Curto o bastante para o jogador voltar a se mover
// logo, longo o bastante para o golpe ser percebido.
export const ATTACK_DURATION_MS = 350;

// ms em que a pose de dano fica na tela; menor que INVINCIBILITY_MS para o jogador retomar o
// controle visual antes de voltar a ficar vulnerável.
export const HURT_DURATION_MS = 400;

// Geometria provisória da fase de teste, até o mapa de levels/level-01.ts existir.
// Chão de 64px deixa a maior parte da tela de 720px livre para pular.
export const PLACEHOLDER_GROUND_HEIGHT = 64;
// O personagem nasce a 20% da largura, com espaço para andar nos dois sentidos.
export const PLACEHOLDER_PLAYER_START_X_RATIO = 0.2;

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

// px na tela. Um pouco menores que o cavaleiro (128px), para o herói se destacar na cena.
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

// Posições provisórias dos inimigos na fase de teste, como fração da largura da tela, e
// distância de patrulha para cada lado. A bruxa mais próxima fica a mais de
// WITCH_DETECTION_RADIUS do ponto de partida, para a partida não começar com perseguição.
export const PLACEHOLDER_WITCH_SPAWNS = [
  { xRatio: 0.58, patrolHalfWidth: 120 },
  { xRatio: 0.88, patrolHalfWidth: 90 },
] as const;
export const PLACEHOLDER_INNOCENT_SPAWNS = [
  { xRatio: 0.4, patrolHalfWidth: 80 },
  { xRatio: 0.73, patrolHalfWidth: 60 },
] as const;
