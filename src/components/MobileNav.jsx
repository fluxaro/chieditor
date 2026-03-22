import useStore from '../store/useStore'

export default function MobileNav() {
  const {
    sidebarOpen, setSidebarOpen,
    previewOpen, setPreviewOpen,
    terminalOpen, setTerminalOpen,
    setPaletteOpen,
  } = useStore()

  const btns = [
    {
      label: 'Files',
      active: sidebarOpen,
      onClick: () => { setSidebarOpen(!sidebarOpen); setPreviewOpen(false) },
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
    {
      label: 'Editor',
      active: !sidebarOpen && !previewOpen,
      onClick: () => { setSidebarOpen(false); setPreviewOpen(false) },
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
        </svg>
      ),
    },
    {
      label: 'Search',
      active: false,
      onClick: () => setPaletteOpen(true),
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
      ),
    },
    {
      label: 'Preview',
      active: previewOpen,
      onClick: () => { setPreviewOpen(!previewOpen); setSidebarOpen(false) },
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
        </svg>
      ),
    },
    {
      label: 'Terminal',
      active: terminalOpen,
      onClick: () => setTerminalOpen(!terminalOpen),
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" />
        </svg>
      ),
    },
  ]

  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      height: 48,
      background: 'var(--bg-secondary)',
      borderTop: '1px solid var(--border-color)',
      flexShrink: 0,
      zIndex: 70,
    }}>
      {btns.map(btn => (
        <button
          key={btn.label}
          onClick={btn.onClick}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            height: '100%',
            background: 'transparent',
            border: 'none',
            color: btn.active ? 'var(--accent)' : 'var(--text-muted)',
            cursor: 'pointer',
            borderTop: btn.active ? '2px solid var(--accent)' : '2px solid transparent',
            transition: 'color 0.15s',
          }}
        >
          {btn.icon}
          <span style={{ fontSize: 9, fontFamily: 'var(--ui-font)', letterSpacing: '0.03em' }}>
            {btn.label}
          </span>
        </button>
      ))}
    </nav>
  )
}
