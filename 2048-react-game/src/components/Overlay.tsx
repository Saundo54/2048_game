interface OverlayProps {
  status: 'won' | 'over';
  onNewGame: () => void;
}

export default function Overlay({ status, onNewGame }: OverlayProps) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: status === 'won' ? 'rgba(237,194,46,0.75)' : 'rgba(238,228,218,0.73)',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        zIndex: 10,
      }}
    >
      <div style={{ fontSize: '2.5rem', fontWeight: 800, color: status === 'won' ? '#fff' : '#776e65' }}>
        {status === 'won' ? 'You win!' : 'Game over!'}
      </div>
      <button
        onClick={onNewGame}
        style={{
          background: '#8f7a66',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          padding: '12px 28px',
          fontSize: '1rem',
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        Try again
      </button>
    </div>
  );
}
