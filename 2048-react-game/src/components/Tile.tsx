interface TileProps {
  value: number;
}

const TILE_COLORS: Record<number, { bg: string; text: string }> = {
  2:    { bg: '#eee4da', text: '#776e65' },
  4:    { bg: '#ede0c8', text: '#776e65' },
  8:    { bg: '#f2b179', text: '#f9f6f2' },
  16:   { bg: '#f59563', text: '#f9f6f2' },
  32:   { bg: '#f67c5f', text: '#f9f6f2' },
  64:   { bg: '#f65e3b', text: '#f9f6f2' },
  128:  { bg: '#edcf72', text: '#f9f6f2' },
  256:  { bg: '#edcc61', text: '#f9f6f2' },
  512:  { bg: '#edc850', text: '#f9f6f2' },
  1024: { bg: '#edc53f', text: '#f9f6f2' },
  2048: { bg: '#edc22e', text: '#f9f6f2' },
};

export default function Tile({ value }: TileProps) {
  const colors = TILE_COLORS[value] ?? { bg: '#3c3a32', text: '#f9f6f2' };
  const fontSize = value >= 1000 ? '1.4rem' : value >= 100 ? '1.8rem' : '2.2rem';

  return (
    <div
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
        fontSize,
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '6px',
        width: '100%',
        height: '100%',
        animation: 'tileAppear 0.1s ease',
      }}
    >
      {value}
    </div>
  );
}
