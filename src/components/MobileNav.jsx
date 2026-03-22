import useStore from '../store/useStore'

const NAV_ITEMS = [
  {
    id: 'files',
    label: 'Files',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    id: 'editor',
    label: 'Editor',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
  {
    id: 'search',
    label: 'Search',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
      </svg>
    ),
  },
  {
    id: 'preview',
    label: 'Preview',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
      </svg>
    ),
  },
  {
    id: 'terminal',
    label: 'Terminal',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" />
      </svg>
    ),
  },
]

export default function MobileNav() {
  const {
    sidebarOpen, setSidebarOpen,
    previewOpen, setPreviewOpen,
    terminalOpen, setTerminalOpen,
    setPaletteOpen,
  } = useStore()

  const activeId = sidebarOpen ? 'files' : previewOpen ? 'preview' : 'editor'

  function handlePress(id) {
    switch (id) {
      case 'files':
        setSidebarOpen(!sidebarOpen)
        setPreviewOpen(false)
        break
      case 'editor':
        setSidebarOpen(false)
        setPreviewOpen(false)
        break
      case 'search':
        setPaletteOpen(true)
        break
      case 'preview':
        setPreviewOpen(!previewOpen)
        setSidebarOpen(false)
        break
      case 'terminal':
        setTerminalOpen(!terminalOpen)
        break
    }
  }

  return (
    <nav
      style={{
        display: 'flex',
        alignItems: 'stretch',
        height: 'var(--mobile-nav-height)',
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-color)',
        flexShrink: 0,
        zIndex: 70,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {NAV_ITEMS.map(item => {
        const isActive = item.id === activeId || (item.id === 'terminal' && terminalOpen)
        return (
          <button
            key={item.id}
            onClick={() => handlePress(item.id)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              background: 'transparent',
              border: 'none',
              borderTop: isActive ? '2px solid var(--accent)' : '2px solid transparent',
              color: isActive ? 'var(--accent)' : 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px 0',
              transition: 'color 0.15s',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {item.icon}
            <span style={{
              fontSize: 10,
              fontFamily: 'var(--ui-font)',
              fontWeight: isActive ? 600 : 400,
              letterSpacing: '0.02em',
            }}>
              {item.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
