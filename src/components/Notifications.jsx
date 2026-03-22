import useStore from '../store/useStore'

const ICONS = {
  success: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  error: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  info: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  warning: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
}

const COLORS = {
  success: { bg: 'rgba(63,185,80,0.12)', border: 'rgba(63,185,80,0.3)', color: '#3fb950' },
  error: { bg: 'rgba(248,81,73,0.12)', border: 'rgba(248,81,73,0.3)', color: '#f85149' },
  info: { bg: 'rgba(88,166,255,0.12)', border: 'rgba(88,166,255,0.3)', color: '#58a6ff' },
  warning: { bg: 'rgba(210,153,34,0.12)', border: 'rgba(210,153,34,0.3)', color: '#d29922' },
}

export default function Notifications() {
  const { notifications } = useStore()

  if (notifications.length === 0) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 32,
        right: 16,
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        pointerEvents: 'none',
      }}
    >
      {notifications.map(n => {
        const c = COLORS[n.type] || COLORS.info
        return (
          <div
            key={n.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 14px',
              background: c.bg,
              border: `1px solid ${c.border}`,
              borderRadius: 7,
              color: c.color,
              fontSize: 12,
              fontFamily: 'var(--ui-font)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
              backdropFilter: 'blur(8px)',
              animation: 'slideIn 0.2s ease',
              maxWidth: 320,
            }}
          >
            <span style={{ flexShrink: 0 }}>{ICONS[n.type] || ICONS.info}</span>
            <span style={{ lineHeight: 1.4 }}>{n.msg}</span>
          </div>
        )
      })}
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  )
}
