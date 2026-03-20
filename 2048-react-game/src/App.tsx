import { useRef } from 'react';
import Board from './components/Board';
import Overlay from './components/Overlay';
import ScoreBox from './components/ScoreBox';
import { useGame } from './useGame';
import { Direction } from './gameLogic';

export default function App() {
  const { state, handleMove, newGame } = useGame();
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (!touchStart.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    touchStart.current = null;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    if (Math.max(absDx, absDy) < 20) return;
    let dir: Direction;
    if (absDx > absDy) dir = dx > 0 ? 'right' : 'left';
    else dir = dy > 0 ? 'down' : 'up';
    handleMove(dir);
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#faf8ef',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '"Clear Sans", "Helvetica Neue", Arial, sans-serif',
        userSelect: 'none',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '460px', marginBottom: '16px' }}>
        <div style={{ fontSize: '3.5rem', fontWeight: 800, color: '#776e65' }}>2048</div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <ScoreBox label="Score" value={state.score} />
          <ScoreBox label="Best" value={state.bestScore} />
          <button
            onClick={newGame}
            style={{
              background: '#8f7a66',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              padding: '10px 16px',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            New Game
          </button>
        </div>
      </div>

      {/* Board */}
      <div
        style={{ position: 'relative' }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <Board grid={state.grid} />
        {(state.status === 'won' || state.status === 'over') && (
          <Overlay status={state.status} onNewGame={newGame} />
        )}
      </div>

      {/* Instructions */}
      <p style={{ marginTop: '20px', color: '#776e65', fontSize: '0.85rem' }}>
        Use arrow keys or WASD to move. Swipe on mobile.
      </p>
    </div>
  );
}
