export type Grid = (number | null)[][];
export type Direction = 'up' | 'down' | 'left' | 'right';

export interface GameState {
  grid: Grid;
  score: number;
  bestScore: number;
  status: 'playing' | 'won' | 'over';
}

const GRID_SIZE = 4;

export function createEmptyGrid(): Grid {
  return Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
}

export function addRandomTile(grid: Grid): Grid {
  const empty: [number, number][] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] === null) empty.push([r, c]);
    }
  }
  if (empty.length === 0) return grid;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  const newGrid = grid.map(row => [...row]);
  newGrid[r][c] = Math.random() < 0.9 ? 2 : 4;
  return newGrid;
}

export function initGame(): Grid {
  let grid = createEmptyGrid();
  grid = addRandomTile(grid);
  grid = addRandomTile(grid);
  return grid;
}

function slideAndMergeRow(row: (number | null)[]): { row: (number | null)[]; score: number } {
  const tiles = row.filter((v): v is number => v !== null);
  let score = 0;
  const merged: (number | null)[] = [];

  for (let i = 0; i < tiles.length; i++) {
    if (i + 1 < tiles.length && tiles[i] === tiles[i + 1]) {
      const val = tiles[i] * 2;
      merged.push(val);
      score += val;
      i++;
    } else {
      merged.push(tiles[i]);
    }
  }

  while (merged.length < GRID_SIZE) merged.push(null);
  return { row: merged, score };
}

function rotateGrid(grid: Grid): Grid {
  return grid[0].map((_, colIdx) => grid.map(row => row[colIdx]).reverse());
}

function rotateGridBack(grid: Grid): Grid {
  return grid[0].map((_, colIdx) => grid.map(row => row[GRID_SIZE - 1 - colIdx]));
}

export function move(grid: Grid, direction: Direction): { grid: Grid; score: number; moved: boolean } {
  let workGrid = grid.map(row => [...row]);
  let totalScore = 0;
  let moved = false;

  // Normalize all directions to "slide left"
  if (direction === 'right') {
    workGrid = workGrid.map(row => [...row].reverse());
  } else if (direction === 'up') {
    workGrid = rotateGridBack(workGrid);
  } else if (direction === 'down') {
    workGrid = rotateGrid(workGrid);
  }

  const newGrid: Grid = workGrid.map(row => {
    const { row: merged, score } = slideAndMergeRow(row);
    totalScore += score;
    if (merged.join(',') !== row.join(',')) moved = true;
    return merged;
  });

  let result = newGrid;
  if (direction === 'right') {
    result = result.map(row => [...row].reverse());
  } else if (direction === 'up') {
    result = rotateGrid(result);
  } else if (direction === 'down') {
    result = rotateGridBack(result);
  }

  return { grid: result, score: totalScore, moved };
}

export function hasWon(grid: Grid): boolean {
  return grid.some(row => row.some(cell => cell === 2048));
}

export function hasMovesLeft(grid: Grid): boolean {
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] === null) return true;
      if (c + 1 < GRID_SIZE && grid[r][c] === grid[r][c + 1]) return true;
      if (r + 1 < GRID_SIZE && grid[r][c] === grid[r + 1][c]) return true;
    }
  }
  return false;
}
