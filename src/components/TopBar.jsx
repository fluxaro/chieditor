import { useState, useRef, useEffect, useCallback } from 'react'
import useStore from '../store/useStore'
import { buildTree, flattenTree } from '../utils/fileUtils'
import { useBreakpoint } from '../hooks/useBreakpoint'

const THEMES = [
  { id: 'dark', label: 'Dark' },
  { id: 'light', label: 'Light' },
  { id: 'dracula', label: 'Dracula' },
  { id: 'monokai', label: 'Monokai' },
  { id: 'nord', label: 'Nord' },
  { id: 'solarized', label: 'Solarized' },
]

// ── Menu definitions ──────────────────────────────────────────────────────
function useMenuActions() {
  const store = useStore()
  const {
    setFileTree, setFlatFiles, setOpenedFolder, setDirectoryHandle,
    setPaletteOpen, setSettingsOpen, previewOpen, setPreviewOpen,
    terminalOpen, setTerminalOpen, sidebarOpen, setSidebarOpen,
    addNotification, tabs, activeTabId, getActiveTab,
    setFolderLoading, setImageDataMap,
  } = store

  const openFolder = useCallback(async () => {
    try {
      const dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' })
      setFolderLoading(true)
      const tree = await buildTree(dirHandle)
      const flat = flattenTree(tree)

      // Read images as base64 data URIs so they work inside sandboxed iframes
      const imgMap = {}
      const IMAGE_RE = /\.(png|jpe?g|gif|webp|svg|ico|bmp|avif)$/i
      for (const node of flat) {
        if (IMAGE_RE.test(node.name)) {
          try {
            const file = await node.handle.getFile()
            const dataUri = await new Promise((resolve, reject) => {
              const reader = new FileReader()
              reader.onload = () => resolve(reader.result)
              reader.onerror = reject
              reader.readAsDataURL(file)
            })
            // Store by both full path and filename so either reference works
            imgMap[node.path] = dataUri
            imgMap[node.name] = dataUri
          } catch { /* skip unreadable image */ }
        }
      }
      setImageDataMap(imgMap)
      setDirectoryHandle(dirHandle)
      setFileTree(tree)
      setFlatFiles(flat)
      setOpenedFolder({ name: dirHandle.name, path: dirHandle.name })
      addNotification(`Opened: ${dirHandle.name}`, 'success')
    } catch (e) {
      if (e.name !== 'AbortError') addNotification('Failed to open folder', 'error')
    } finally {
      setFolderLoading(false)
    }
  }, [setFileTree, setFlatFiles, setOpenedFolder, setDirectoryHandle, addNotification, setFolderLoading, setImageDataMap])

  const newWindow = useCallback(() => {
    window.open(window.location.href, '_blank')
  }, [])

  const saveActive = useCallback(() => {
    // trigger Ctrl+S via custom event
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 's', ctrlKey: true, bubbles: true }))
  }, [])

  const closeActiveTab = useCallback(() => {
    const tab = getActiveTab()
    if (tab) store.closeTab(tab.id)
  }, [getActiveTab, store])

  return { openFolder, newWindow, saveActive, closeActiveTab, setPaletteOpen, setSettingsOpen, previewOpen, setPreviewOpen, terminalOpen, setTerminalOpen, sidebarOpen, setSidebarOpen, tabs, activeTabId }
}

// ── Dropdown Menu ─────────────────────────────────────────────────────────
function MenuDropdown({ label, items }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onMouseDown={() => setOpen(v => !v)}
        style={{
          background: open ? 'var(--bg-active)' : 'transparent',
          border: 'none',
          color: 'var(--text-secondary)',
          fontSize: 12,
          padding: '3px 8px',
          borderRadius: 4,
          cursor: 'pointer',
          fontFamily: 'var(--ui-font)',
          height: 24,
          display: 'flex',
          alignItems: 'center',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)' }}
        onMouseLeave={e => { e.currentTarget.style.background = open ? 'var(--bg-active)' : 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)' }}
      >
        {label}
      </button>
      {open && (
        <div
          style={{
            position: 'fixed',
            top: 'auto',
            left: 'auto',
            zIndex: 9999,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 6,
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            minWidth: 220,
            padding: '4px 0',
            fontFamily: 'var(--ui-font)',
          }}
          style2={{ marginTop: 2 }}
          // position below the button
          ref={el => {
            if (el && ref.current) {
              const rect = ref.current.getBoundingClientRect()
              el.style.top = (rect.bottom + 2) + 'px'
              el.style.left = rect.left + 'px'
            }
          }}
        >
          {items.map((item, i) =>
            item === '---' ? (
              <div key={i} style={{ height: 1, background: 'var(--border-color)', margin: '4px 0' }} />
            ) : (
              <button
                key={i}
                onClick={() => { item.action(); setOpen(false) }}
                disabled={item.disabled}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '5px 12px',
                  background: 'transparent',
                  border: 'none',
                  color: item.disabled ? 'var(--text-muted)' : 'var(--text-primary)',
                  fontSize: 12,
                  cursor: item.disabled ? 'default' : 'pointer',
                  textAlign: 'left',
                  gap: 16,
                }}
                onMouseEnter={e => { if (!item.disabled) e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.color = item.disabled ? 'var(--text-muted)' : '#fff' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = item.disabled ? 'var(--text-muted)' : 'var(--text-primary)' }}
              >
                <span>{item.label}</span>
                {item.shortcut && <span style={{ fontSize: 10, opacity: 0.55, whiteSpace: 'nowrap' }}>{item.shortcut}</span>}
              </button>
            )
          )}
        </div>
      )}
    </div>
  )
}

export default function TopBar() {
  const {
    theme, setTheme,
    setPaletteOpen, setSettingsOpen,
    previewOpen, setPreviewOpen,
    terminalOpen, setTerminalOpen,
    sidebarOpen, setSidebarOpen,
    folderLoading,
  } = useStore()

  const actions = useMenuActions()
  const { isMobile, isTablet } = useBreakpoint()

  const menus = [
    {
      label: 'File',
      items: [
        { label: 'Open Folder…', action: actions.openFolder, shortcut: '' },
        { label: 'New Window', action: actions.newWindow, shortcut: '' },
        '---',
        { label: 'Save', action: actions.saveActive, shortcut: 'Ctrl+S' },
        { label: 'Close Tab', action: actions.closeActiveTab, shortcut: 'Ctrl+W' },
      ],
    },
    {
      label: 'Edit',
      items: [
        { label: 'Command Palette', action: () => setPaletteOpen(true), shortcut: 'Ctrl+Shift+P' },
        '---',
        { label: 'Find', action: () => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'f', ctrlKey: true, bubbles: true })), shortcut: 'Ctrl+F' },
        { label: 'Replace', action: () => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'h', ctrlKey: true, bubbles: true })), shortcut: 'Ctrl+H' },
      ],
    },
    {
      label: 'View',
      items: [
        { label: sidebarOpen ? 'Hide Sidebar' : 'Show Sidebar', action: () => setSidebarOpen(!sidebarOpen), shortcut: 'Ctrl+B' },
        { label: terminalOpen ? 'Hide Terminal' : 'Show Terminal', action: () => setTerminalOpen(!terminalOpen), shortcut: 'Ctrl+`' },
        { label: previewOpen ? 'Hide Preview' : 'Show Preview', action: () => setPreviewOpen(!previewOpen), shortcut: '' },
        '---',
        { label: 'Zoom In', action: () => { const s = parseFloat(document.documentElement.style.fontSize || '16'); document.documentElement.style.fontSize = (s + 1) + 'px' }, shortcut: 'Ctrl++' },
        { label: 'Zoom Out', action: () => { const s = parseFloat(document.documentElement.style.fontSize || '16'); document.documentElement.style.fontSize = Math.max(10, s - 1) + 'px' }, shortcut: 'Ctrl+-' },
        { label: 'Reset Zoom', action: () => { document.documentElement.style.fontSize = '16px' }, shortcut: 'Ctrl+0' },
        '---',
        ...THEMES.map(t => ({
          label: (theme === t.id ? '✓ ' : '  ') + t.label + ' Theme',
          action: () => setTheme(t.id),
        })),
      ],
    },
    {
      label: 'Go',
      items: [
        { label: 'Go to File…', action: () => setPaletteOpen(true), shortcut: 'Ctrl+P' },
        { label: 'Go to Line…', action: () => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'g', ctrlKey: true, bubbles: true })), shortcut: 'Ctrl+G' },
      ],
    },
    {
      label: 'Help',
      items: [
        { label: 'Keyboard Shortcuts', action: () => setPaletteOpen(true), shortcut: 'Ctrl+Shift+P' },
        '---',
        { label: 'Settings', action: () => setSettingsOpen(true), shortcut: 'Ctrl+,' },
      ],
    },
  ]

  return (
    <header
      className="flex items-center justify-between px-3 select-none shrink-0"
      style={{
        height: 'var(--topbar-height)',
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-color)',
        fontFamily: 'var(--ui-font)',
      }}
    >
      {/* Left: logo + menu bar */}
      <div className="flex items-center gap-1">
        {/* Logo */}
        <div className="flex items-center gap-1.5 mr-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="8" height="8" rx="1.5" fill="var(--accent)" />
            <rect x="13" y="3" width="8" height="8" rx="1.5" fill="var(--accent)" opacity="0.6" />
            <rect x="3" y="13" width="8" height="8" rx="1.5" fill="var(--accent)" opacity="0.6" />
            <rect x="13" y="13" width="8" height="8" rx="1.5" fill="var(--accent)" opacity="0.3" />
          </svg>
          <span style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, letterSpacing: '0.02em' }}>
            Chiditor
          </span>
        </div>

        {/* Menu bar — hidden on mobile */}
        {!isMobile && menus.map(m => (
          <MenuDropdown key={m.label} label={m.label} items={m.items} />
        ))}

        {folderLoading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8, color: 'var(--text-muted)', fontSize: 11 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" style={{ animation: 'spin 1s linear infinite' }}>
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            {!isMobile && <span>Loading…</span>}
          </div>
        )}
      </div>

      {/* Center: search — hidden on mobile (use bottom nav search instead) */}
      {!isMobile && (
        <button
          onClick={() => setPaletteOpen(true)}
          className="flex items-center gap-2 px-3 py-1 rounded"
          style={{
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-muted)',
            fontSize: 12,
            minWidth: isTablet ? 140 : 200,
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <span>Search commands...</span>
          {!isTablet && <span className="ml-auto" style={{ fontSize: 10, opacity: 0.6 }}>Ctrl+Shift+P</span>}
        </button>
      )}

      {/* Right: controls */}
      <div className="flex items-center gap-1">
        {/* On mobile show open-folder + settings only */}
        {isMobile ? (
          <>
            <TopBtn title="Open Folder" onClick={actions.openFolder}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
            </TopBtn>
            <TopBtn title="Settings" onClick={() => setSettingsOpen(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </TopBtn>
          </>
        ) : (
          <>
            <TopBtn title="Toggle Sidebar (Ctrl+B)" active={sidebarOpen} onClick={() => setSidebarOpen(!sidebarOpen)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 3v18" />
              </svg>
            </TopBtn>
            <TopBtn title="Toggle Preview" active={previewOpen} onClick={() => setPreviewOpen(!previewOpen)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
              </svg>
            </TopBtn>
            <TopBtn title="Toggle Terminal (Ctrl+`)" active={terminalOpen} onClick={() => setTerminalOpen(!terminalOpen)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" />
              </svg>
            </TopBtn>
            <div style={{ width: 1, height: 16, background: 'var(--border-color)', margin: '0 4px' }} />
            <select
              value={theme}
              onChange={e => setTheme(e.target.value)}
              style={{
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                fontSize: 11,
                padding: '2px 6px',
                borderRadius: 4,
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              {THEMES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
            <TopBtn title="Settings (Ctrl+,)" onClick={() => setSettingsOpen(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </TopBtn>
          </>
        )}
      </div>
    </header>
  )
}

function TopBtn({ children, onClick, title, active }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="flex items-center justify-center rounded transition-colors"
      style={{
        width: 28, height: 28,
        background: active ? 'var(--bg-active)' : 'transparent',
        color: active ? 'var(--accent)' : 'var(--text-secondary)',
        border: 'none',
        cursor: 'pointer',
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--bg-hover)' }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
    >
      {children}
    </button>
  )
}
