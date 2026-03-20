interface ScoreBoxProps {
  label: string;
  value: number;
}

export default function ScoreBox({ label, value }: ScoreBoxProps) {
  return (
    <div
      style={{
        background: '#bbada0',
        borderRadius: '6px',
        padding: '8px 20px',
        textAlign: 'center',
        minWidth: '80px',
      }}
    >
      <div style={{ color: '#eee4da', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </div>
      <div style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 700 }}>{value}</div>
    </div>
  );
}
