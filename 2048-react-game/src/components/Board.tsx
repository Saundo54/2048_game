import { Grid } from '../gameLogic';
import Tile from './Tile';

interface BoardProps {
  grid: Grid;
}

export default function Board({ grid }: BoardProps) {
  const CELL_SIZE = 100;
  const GAP = 12;
  const COLS = 4;
  const boardSize = CELL_SIZE * COLS + GAP * (COLS + 1);

  return (
    <div
      style={{
        background: '#bbada0',
        borderRadius: '8px',
        padding: `${GAP}px`,
        display: 'grid',
        gridTemplateColumns: `repeat(${COLS}, ${CELL_SIZE}px)`,
        gridTemplateRows: `repeat(${COLS}, ${CELL_SIZE}px)`,
        gap: `${GAP}px`,
        width: `${boardSize}px`,
        boxSizing: 'border-box',
      }}
    >
      {grid.flat().map((cell, i) => (
        <div
          key={i}
          style={{
            background: 'rgba(238,228,218,0.35)',
            borderRadius: '6px',
            width: `${CELL_SIZE}px`,
            height: `${CELL_SIZE}px`,
          }}
        >
          {cell !== null && <Tile value={cell} />}
        </div>
      ))}
    </div>
  );
}
