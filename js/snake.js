
// Cada direção é um "passo" no plano: x anda de lado, y anda pra cima/baixo.
// Atenção: no canvas o y cresce PRA BAIXO, por isso "up" é y = -1.
export const DIRECTIONS = {
  up:    { x: 0,  y: -1 },
  down:  { x: 0,  y: 1 },
  left:  { x: -1, y: 0 },
  right: { x: 1,  y: 0 },
};

export class Snake {
  constructor(startX, startY) {
    // O corpo é uma lista de quadradinhos {x, y}.
    // Posição 0 = cabeça. Última posição = cauda.
    // Começa com 3 segmentos, olhando pra direita.
    this.body = [
      { x: startX,     y: startY },
      { x: startX - 1, y: startY },
      { x: startX - 2, y: startY },
    ];
    this.direction = DIRECTIONS.right;
  }

  get head() {
    return this.body[0];
  }

  // Onde a cabeça VAI ficar no próximo passo.
  getNextHead() {
    return {
      x: this.head.x + this.direction.x,
      y: this.head.y + this.direction.y,
    };
  }

  hitsItself(nextHead, willGrow) {
    const partsThatStayInPlace = willGrow ? this.body : this.body.slice(0, -1);
    return partsThatStayInPlace.some(
      (part) => part.x === nextHead.x && part.y === nextHead.y
    );
  }

  // Dá um passo. gambiarra: coloca uma cabeça nova na frente e,
  // se não for crescer, tira a cauda. Pra crescer, é só NÃO tirar.
  move(willGrow) {
    this.body.unshift(this.getNextHead());
    if (!willGrow) {
      this.body.pop();
    }
  }
}