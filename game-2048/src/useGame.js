import { useState, useCallback } from 'react';

const SIZE = 4;

function createEmptyGrid() {
  return Array.from({ length: SIZE }, () =>
    Array.from({ length: SIZE }, () => ({ value: 0, state: 'idle' }))
  );
}

function getEmptyCells(grid) {
  const cells = [];
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++)
      if (grid[r][c].value === 0) cells.push([r, c]);
  return cells;
}

function addRandomTile(grid) {
  const empty = getEmptyCells(grid);
  if (empty.length === 0) return grid;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  const newGrid = grid.map(row => [...row]);
  newGrid[r][c] = { value: Math.random() < 0.9 ? 2 : 4, state: 'new' };
  return newGrid;
}

function initGrid() {
  let grid = createEmptyGrid();
  grid = addRandomTile(grid);
  grid = addRandomTile(grid);
  return grid;
}

// Slide and merge a single row to the left; returns { row, score, moved }
function slideLeft(row) {
  const filtered = row.filter(cell => cell.value !== 0);
  let score = 0;
  const merged = [];
  let i = 0;
  while (i < filtered.length) {
    if (i + 1 < filtered.length && filtered[i].value === filtered[i + 1].value) {
      const val = filtered[i].value * 2;
      merged.push({ value: val, state: 'merged' });
      score += val;
      i += 2;
    } else {
      merged.push({ value: filtered[i].value, state: 'idle' });
      i++;
    }
  }
  while (merged.length < SIZE) merged.push({ value: 0, state: 'idle' });
  const moved = merged.some((cell, idx) => cell.value !== row[idx].value);
  return { row: merged, score, moved };
}

function rotateClockwise(grid) {
  return grid[0].map((_, c) => grid.map(row => row[c]).reverse());
}

function rotateCounterClockwise(grid) {
  return grid[0].map((_, c) => grid.map(row => row[row.length - 1 - c]));
}

function rotate180(grid) {
  return grid.map(row => [...row].reverse()).reverse();
}

// direction: 'left' | 'right' | 'up' | 'down'
function applyMove(grid, direction) {
  // Reset all cell states before applying the move
  const reset = grid.map(row => row.map(cell => ({ value: cell.value, state: 'idle' })));
  let rotated = reset;

  // Rotate so we always slide "left"
  if (direction === 'right') rotated = rotate180(reset);
  else if (direction === 'up') rotated = rotateClockwise(reset);
  else if (direction === 'down') rotated = rotateCounterClockwise(reset);

  let totalScore = 0;
  let anyMoved = false;
  const newRotated = rotated.map(row => {
    const { row: newRow, score, moved } = slideLeft(row);
    totalScore += score;
    if (moved) anyMoved = true;
    return newRow;
  });

  // Rotate back
  let newGrid = newRotated;
  if (direction === 'right') newGrid = rotate180(newRotated);
  else if (direction === 'up') newGrid = rotateCounterClockwise(newRotated);
  else if (direction === 'down') newGrid = rotateClockwise(newRotated);

  return { grid: newGrid, score: totalScore, moved: anyMoved };
}

function hasWon(grid) {
  return grid.some(row => row.some(cell => cell.value === 2048));
}

function canMove(grid) {
  // Any empty cell?
  if (getEmptyCells(grid).length > 0) return true;
  // Any adjacent equal tiles?
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const v = grid[r][c].value;
      if (c + 1 < SIZE && grid[r][c + 1].value === v) return true;
      if (r + 1 < SIZE && grid[r + 1][c].value === v) return true;
    }
  }
  return false;
}

export function useGame() {
  const [grid, setGrid] = useState(() => initGrid());
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => parseInt(localStorage.getItem('2048-best') || '0', 10));
  const [status, setStatus] = useState('playing'); // 'playing' | 'won' | 'lost'
  const [keepPlaying, setKeepPlaying] = useState(false);

  const move = useCallback((direction) => {
    if (status === 'lost') return;
    if (status === 'won' && !keepPlaying) return;

    setGrid(prev => {
      const { grid: newGrid, score: gained, moved } = applyMove(prev, direction);
      if (!moved) return prev;

      const withTile = addRandomTile(newGrid);

      setScore(s => {
        const next = s + gained;
        setBest(b => {
          const newBest = Math.max(b, next);
          localStorage.setItem('2048-best', newBest);
          return newBest;
        });
        return next;
      });

      if (!keepPlaying && hasWon(withTile)) {
        setStatus('won');
      } else if (!canMove(withTile)) {
        setStatus('lost');
      }

      return withTile;
    });
  }, [status, keepPlaying]);

  const continueGame = useCallback(() => {
    setKeepPlaying(true);
    setStatus('playing');
  }, []);

  const restart = useCallback(() => {
    setGrid(initGrid());
    setScore(0);
    setStatus('playing');
    setKeepPlaying(false);
  }, []);

  return { grid, score, best, status, move, restart, continueGame };
}
