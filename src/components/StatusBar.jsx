import useStore from '../store/useStore'

export default function StatusBar() {
  const { getActiveTab, theme, openedFolder, tabs } = useStore()
  const activeTab = getActiveTab()

  return (
    <div
      className="flex items-center justify-between px-3 shrink-0"
      style={{
        height: 'var(--statusbar-height)',
        background: 'var(--accent)',
        color: 'rgba(255,255,255,0.9)',
        fontSize: 11,
        fontFamily: 'var(--ui-font)',
        userSelect: 'none',
      }}
    >
      {/* Left */}
      <div className="flex items-center gap-3">
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
          {openedFolder ? openedFolder.name : 'No folder'}
        </span>
        {tabs.length > 0 && (
          <span>{tabs.length} file{tabs.length !== 1 ? 's' : ''} open</span>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {activeTab && (
          <>
            <span>{activeTab.language}</span>
            <span style={{ opacity: 0.7 }}>|</span>
            <span>{activeTab.name}</span>
            {activeTab.unsaved && <span style={{ opacity: 0.8 }}>● unsaved</span>}
          </>
        )}
        <span style={{ opacity: 0.7 }}>|</span>
        <span style={{ textTransform: 'capitalize' }}>{theme}</span>
        <span style={{ opacity: 0.7 }}>Chiditor</span>
      </div>
    </div>
  )
}
