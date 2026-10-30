import Phaser from 'phaser';

// Resultado de receber um golpe. O CombatSystem usa isto para contabilizar pontuação sem
// precisar conhecer a vida de cada entidade.
export type HitOutcome = 'ignored' | 'hurt' | 'killed';

// Direção para onde a entidade olha: 1 é direita, -1 é esquerda.
export type Facing = 1 | -1;

// Área que recebe golpes: o corpo físico, e não a imagem inteira. As imagens têm sobras
// transparentes (capa, espada) que não devem levar dano.
export function bodyBounds(body: Phaser.Physics.Arcade.Body): Phaser.Geom.Rectangle {
  return new Phaser.Geom.Rectangle(body.x, body.y, body.width, body.height);
}

// Área que causa dano: uma faixa colada à frente do corpo, da altura dele, com o alcance
// do golpe. Fica fora do corpo para o atacante não precisar se sobrepor ao alvo.
export function frontHitbox(
  body: Phaser.Physics.Arcade.Body,
  facing: Facing,
  reach: number,
): Phaser.Geom.Rectangle {
  const x = facing === 1 ? body.right : body.left - reach;
  return new Phaser.Geom.Rectangle(x, body.y, reach, body.height);
}

// O tipo do Phaser admite corpo estático ou nulo; personagens são sempre Arcade dinâmicos.
export function dynamicBody(sprite: Phaser.Physics.Arcade.Sprite): Phaser.Physics.Arcade.Body {
  if (!(sprite.body instanceof Phaser.Physics.Arcade.Body)) {
    throw new Error('O corpo físico do personagem não foi criado.');
  }
  return sprite.body;
}
