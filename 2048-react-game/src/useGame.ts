import { useCallback, useEffect, useReducer } from 'react';
import {
  Grid,
  Direction,
  GameState,
  addRandomTile,
  hasMovesLeft,
  hasWon,
  initGame,
  move,
} from './gameLogic';

const STORAGE_KEY = '2048-react-game';

type Action =
  | { type: 'MOVE'; direction: Direction }
  | { type: 'NEW_GAME' };

function loadState(): Partial<GameState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveState(state: GameState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

function createInitialState(): GameState {
  const saved = loadState();
  return {
    grid: saved.grid ?? initGame(),
    score: saved.score ?? 0,
    bestScore: saved.bestScore ?? 0,
    status: saved.status ?? 'playing',
  };
}

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'NEW_GAME': {
      const next: GameState = {
        grid: initGame(),
        score: 0,
        bestScore: state.bestScore,
        status: 'playing',
      };
      saveState(next);
      return next;
    }
    case 'MOVE': {
      if (state.status !== 'playing') return state;

      const { grid: movedGrid, score: gained, moved } = move(state.grid, action.direction);
      if (!moved) return state;

      const newGrid: Grid = addRandomTile(movedGrid);
      const newScore = state.score + gained;
      const newBest = Math.max(state.bestScore, newScore);

      let status: GameState['status'] = 'playing';
      if (hasWon(newGrid)) status = 'won';
      else if (!hasMovesLeft(newGrid)) status = 'over';

      const next: GameState = {
        grid: newGrid,
        score: newScore,
        bestScore: newBest,
        status,
      };
      saveState(next);
      return next;
    }
    default:
      return state;
  }
}

export function useGame() {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);

  const handleMove = useCallback((direction: Direction) => {
    dispatch({ type: 'MOVE', direction });
  }, []);

  const newGame = useCallback(() => {
    dispatch({ type: 'NEW_GAME' });
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const map: Record<string, Direction> = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right',
        w: 'up',
        s: 'down',
        a: 'left',
        d: 'right',
      };
      const dir = map[e.key];
      if (dir) {
        e.preventDefault();
        handleMove(dir);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleMove]);

  return { state, handleMove, newGame };
}
