import { useEffect, useCallback } from 'react';
import { useGame } from './useGame';
import './App.css';

const TILE_COLORS = {
  0:    { bg: 'rgba(238,228,218,0.35)', color: 'transparent' },
  2:    { bg: '#eee4da', color: '#776e65' },
  4:    { bg: '#ede0c8', color: '#776e65' },
  8:    { bg: '#f2b179', color: '#f9f6f2' },
  16:   { bg: '#f59563', color: '#f9f6f2' },
  32:   { bg: '#f67c5f', color: '#f9f6f2' },
  64:   { bg: '#f65e3b', color: '#f9f6f2' },
  128:  { bg: '#edcf72', color: '#f9f6f2' },
  256:  { bg: '#edcc61', color: '#f9f6f2' },
  512:  { bg: '#edc850', color: '#f9f6f2' },
  1024: { bg: '#edc53f', color: '#f9f6f2' },
  2048: { bg: '#edc22e', color: '#f9f6f2' },
};

function getTileStyle(value) {
  const style = TILE_COLORS[value] || { bg: '#3c3a32', color: '#f9f6f2' };
  const fontSize = value >= 1024 ? '1.5rem' : value >= 128 ? '2rem' : '2.4rem';
  return {
    backgroundColor: style.bg,
    color: style.color,
    fontSize,
    boxShadow: value > 0 ? '0 2px 4px rgba(0,0,0,0.15)' : 'none',
  };
}

function Tile({ value, state }) {
  const cls = state === 'new' ? ' tile--new' : state === 'merged' ? ' tile--merged' : '';
  return (
    <div className={`tile${cls}`} style={getTileStyle(value)}>
      {value > 0 && value}
    </div>
  );
}

export default function App() {
  const { grid, score, best, status, move, restart, continueGame } = useGame();

  const handleKey = useCallback((e) => {
    const map = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };
    if (map[e.key]) {
      e.preventDefault();
      move(map[e.key]);
    }
  }, [move]);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  useEffect(() => {
    let startX = 0, startY = 0;
    const onTouchStart = (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };
    const onTouchEnd = (e) => {
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
      if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? 'right' : 'left');
      else move(dy > 0 ? 'down' : 'up');
    };
    window.addEventListener('touchstart', onTouchStart);
    window.addEventListener('touchend', onTouchEnd);
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [move]);

  return (
    <div className="app">
      <header>
        <h1>2048</h1>
        <div className="scores">
          <div className="score-box">
            <span className="score-label">SCORE</span>
            <span className="score-value">{score}</span>
          </div>
          <div className="score-box">
            <span className="score-label">BEST</span>
            <span className="score-value">{best}</span>
          </div>
        </div>
      </header>

      <div className="controls">
        <p className="subtitle">Join the tiles, get to <strong>2048!</strong></p>
        <button className="btn-new" onClick={restart}>New Game</button>
      </div>

      <div className="grid-wrapper">
        <div className="grid">
          {grid.flat().map((cell, i) => <Tile key={i} value={cell.value} state={cell.state} />)}
        </div>

        {status === 'won' && (
          <div className="overlay won">
            <div className="overlay-content">
              <p>You win!</p>
              <div className="overlay-buttons">
                <button onClick={continueGame}>Keep going</button>
                <button onClick={restart}>New Game</button>
              </div>
            </div>
          </div>
        )}
        {status === 'lost' && (
          <div className="overlay lost">
            <div className="overlay-content">
              <p>Game over!</p>
              <button onClick={restart}>Try again</button>
            </div>
          </div>
        )}
      </div>

      <p className="hint">Use arrow keys or swipe to move tiles</p>
    </div>
  );
}
