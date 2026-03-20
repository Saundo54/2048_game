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

function loadState() {
  try {
    const grid = JSON.parse(localStorage.getItem('2048-grid'));
    const score = parseInt(localStorage.getItem('2048-score') || '0', 10);
    const status = localStorage.getItem('2048-status') || 'playing';
    const keepPlaying = localStorage.getItem('2048-keep-playing') === 'true';
    if (grid) return { grid, score, status, keepPlaying };
  } catch { /* ignore parse errors */ }
  return null;
}

function saveState(grid, score, status, keepPlaying) {
  const clean = grid.map(row => row.map(cell => ({ value: cell.value, state: 'idle' })));
  localStorage.setItem('2048-grid', JSON.stringify(clean));
  localStorage.setItem('2048-score', score);
  localStorage.setItem('2048-status', status);
  localStorage.setItem('2048-keep-playing', keepPlaying);
}

export function useGame() {
  const saved = loadState();
  const [grid, setGrid] = useState(() => saved ? saved.grid : initGrid());
  const [score, setScore] = useState(() => saved ? saved.score : 0);
  const [best, setBest] = useState(() => parseInt(localStorage.getItem('2048-best') || '0', 10));
  const [status, setStatus] = useState(() => saved ? saved.status : 'playing');
  const [keepPlaying, setKeepPlaying] = useState(() => saved ? saved.keepPlaying : false);

  const move = useCallback((direction) => {
    if (status === 'lost') return;
    if (status === 'won' && !keepPlaying) return;

    setGrid(prev => {
      const { grid: newGrid, score: gained, moved } = applyMove(prev, direction);
      if (!moved) return prev;

      const withTile = addRandomTile(newGrid);
      const newStatus = (!keepPlaying && hasWon(withTile)) ? 'won'
        : !canMove(withTile) ? 'lost'
        : 'playing';

      setScore(s => {
        const next = s + gained;
        setBest(b => {
          const newBest = Math.max(b, next);
          localStorage.setItem('2048-best', newBest);
          return newBest;
        });
        saveState(withTile, next, newStatus, keepPlaying);
        return next;
      });

      setStatus(newStatus);
      return withTile;
    });
  }, [status, keepPlaying]);

  const continueGame = useCallback(() => {
    setKeepPlaying(true);
    setStatus('playing');
    setGrid(prev => { saveState(prev, score, 'playing', true); return prev; });
  }, [score]);

  const restart = useCallback(() => {
    const fresh = initGrid();
    setGrid(fresh);
    setScore(0);
    setStatus('playing');
    setKeepPlaying(false);
    saveState(fresh, 0, 'playing', false);
  }, []);

  return { grid, score, best, status, move, restart, continueGame };
}
