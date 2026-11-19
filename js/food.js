
// Esta casa é um dos 4 cantinhos do tabuleiro?
function isCorner(x, y, gridSize) {
  const last = gridSize - 1;
  return (x === 0 || x === last) && (y === 0 || y === last);
}

export function spawnFood(snakeBody, gridSize, avoidCorners = false) {
  const freeCells = [];

  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      if (avoidCorners && isCorner(x, y, gridSize)) continue;

      const occupied = snakeBody.some((part) => part.x === x && part.y === y);
      if (!occupied) {
        freeCells.push({ x, y });
      }
    }
  }

  if (freeCells.length === 0) return null;

  const index = Math.floor(Math.random() * freeCells.length);
  return freeCells[index];
}