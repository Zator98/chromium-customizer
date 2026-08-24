interface HeaderProps {
  onNewRule: () => void;
}

export function Header({ onNewRule }: HeaderProps) {
  return (
    <header style={{ padding: '16px', borderBottom: '1px solid #30363d', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#58a6ff' }}>
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <path d="M3 9h18M9 21V9M15 21V9" />
        </svg>
        <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Chromium Customizer</h1>
      </div>
      <div style={{ flex: 1 }} />
      <button onClick={onNewRule} style={{ padding: '8px 16px', background: '#238636', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}>
        + New Rule
      </button>
    </header>
  );
}
