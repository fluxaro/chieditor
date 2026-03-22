import { useState, useEffect, useRef, useMemo } from 'react'
import Fuse from 'fuse.js'
import useStore from '../store/useStore'
import { readFileContent, getLanguage } from '../utils/fileUtils'
import { useBreakpoint } from '../hooks/useBreakpoint'

const STATIC_COMMANDS = [
  { id: 'toggle-preview', label: 'Toggle Preview', icon: '🖥', category: 'View' },
  { id: 'toggle-terminal', label: 'Toggle Terminal', icon: '⌨️', category: 'View' },
  { id: 'toggle-sidebar', label: 'Toggle Sidebar', icon: '📁', category: 'View' },
  { id: 'theme-dark', label: 'Theme: Dark', icon: '🌑', category: 'Theme' },
  { id: 'theme-light', label: 'Theme: Light', icon: '☀️', category: 'Theme' },
  { id: 'theme-dracula', label: 'Theme: Dracula', icon: '🧛', category: 'Theme' },
  { id: 'theme-monokai', label: 'Theme: Monokai', icon: '🎨', category: 'Theme' },
  { id: 'theme-nord', label: 'Theme: Nord', icon: '❄️', category: 'Theme' },
  { id: 'theme-solarized', label: 'Theme: Solarized', icon: '🌅', category: 'Theme' },
  { id: 'font-size-increase', label: 'Font Size: Increase', icon: '🔡', category: 'Editor' },
  { id: 'font-size-decrease', label: 'Font Size: Decrease', icon: '🔡', category: 'Editor' },
  { id: 'open-folder', label: 'Open Folder', icon: '📂', category: 'File' },
  { id: 'settings', label: 'Open Settings', icon: '⚙️', category: 'Preferences' },
]

export default function CommandPalette() {
  const {
    paletteOpen, setPaletteOpen,
    flatFiles, openTab,
    setPreviewOpen, previewOpen,
    setTerminalOpen, terminalOpen,
    setSidebarOpen, sidebarOpen,
    setTheme,
    editorFontSize, setEditorFontSize,
    setSettingsOpen,
    setOpenedFolder, setFileTree, setFlatFiles, setDirectoryHandle,
    addNotification,
  } = useStore()

  const { isMobile } = useBreakpoint()

  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const inputRef = useRef(null)
  const listRef = useRef(null)

  // Build combined items: files + commands
  const allItems = useMemo(() => {
    const fileItems = flatFiles.map(f => ({
      id: `file:${f.path}`,
      label: f.name,
      detail: f.path,
      icon: '📄',
      category: 'Files',
      file: f,
    }))
    return [...fileItems, ...STATIC_COMMANDS]
  }, [flatFiles])

  // Fuse search
  const fuse = useMemo(() => new Fuse(allItems, {
    keys: ['label', 'detail', 'category'],
    threshold: 0.4,
    includeScore: true,
  }), [allItems])

  const results = useMemo(() => {
    if (!query.trim()) return allItems.slice(0, 20)
    return fuse.search(query).map(r => r.item).slice(0, 20)
  }, [query, allItems, fuse])

  // Reset on open
  useEffect(() => {
    if (paletteOpen) {
      setQuery('')
      setSelected(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [paletteOpen])

  // Keyboard navigation
  useEffect(() => {
    if (!paletteOpen) return
    function onKey(e) {
      if (e.key === 'Escape') { setPaletteOpen(false); return }
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)) }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)) }
      if (e.key === 'Enter') { e.preventDefault(); executeItem(results[selected]) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [paletteOpen, results, selected])

  // Scroll selected into view
  useEffect(() => {
    const el = listRef.current?.children[selected]
    el?.scrollIntoView({ block: 'nearest' })
  }, [selected])

  async function executeItem(item) {
    if (!item) return
    setPaletteOpen(false)

    if (item.file) {
      try {
        const content = await readFileContent(item.file.handle)
        openTab({ path: item.file.path, name: item.file.name, content, language: getLanguage(item.file.name) })
      } catch { addNotification('Cannot open file', 'error') }
      return
    }

    switch (item.id) {
      case 'toggle-preview': setPreviewOpen(!previewOpen); break
      case 'toggle-terminal': setTerminalOpen(!terminalOpen); break
      case 'toggle-sidebar': setSidebarOpen(!sidebarOpen); break
      case 'theme-dark': setTheme('dark'); break
      case 'theme-light': setTheme('light'); break
      case 'theme-dracula': setTheme('dracula'); break
      case 'theme-monokai': setTheme('monokai'); break
      case 'theme-nord': setTheme('nord'); break
      case 'theme-solarized': setTheme('solarized'); break
      case 'font-size-increase': setEditorFontSize(Math.min(editorFontSize + 1, 28)); break
      case 'font-size-decrease': setEditorFontSize(Math.max(editorFontSize - 1, 10)); break
      case 'settings': setSettingsOpen(true); break
      case 'open-folder': {
        try {
          const dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' })
          const { buildTree, flattenTree } = await import('../utils/fileUtils')
          const tree = await buildTree(dirHandle)
          setDirectoryHandle(dirHandle)
          setFileTree(tree)
          setFlatFiles(flattenTree(tree))
          setOpenedFolder({ name: dirHandle.name, path: dirHandle.name })
          addNotification(`Opened: ${dirHandle.name}`, 'success')
        } catch (e) {
          if (e.name !== 'AbortError') addNotification('Failed to open folder', 'error')
        }
        break
      }
    }
  }

  if (!paletteOpen) return null

  return (
    <div
      className="fixed inset-0 flex items-start justify-center"
      style={{
        zIndex: 9998,
        paddingTop: isMobile ? 0 : 72,
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(3px)',
        animation: 'fadeIn 0.15s ease',
      }}
      onMouseDown={e => { if (e.target === e.currentTarget) setPaletteOpen(false) }}
    >
      <div
        style={{
          width: isMobile ? '100vw' : 'min(560px, 94vw)',
          height: isMobile ? '100dvh' : 'auto',
          maxHeight: isMobile ? '100dvh' : '70vh',
          background: 'var(--bg-tertiary)',
          border: isMobile ? 'none' : '1px solid var(--border-color)',
          borderRadius: isMobile ? 0 : 10,
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          overflow: 'hidden',
          fontFamily: 'var(--ui-font)',
          display: 'flex',
          flexDirection: 'column',
          animation: isMobile ? 'slideInUp 0.22s cubic-bezier(0.4,0,0.2,1)' : 'fadeIn 0.15s ease',
        }}
      >
        {/* Search input */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid var(--border-color)', gap: 10 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setSelected(0) }}
            placeholder="Search files and commands..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: 14,
              fontFamily: 'var(--ui-font)',
            }}
          />
          <kbd style={{ fontSize: 10, color: 'var(--text-muted)', background: 'var(--bg-active)', border: '1px solid var(--border-color)', borderRadius: 3, padding: '1px 5px' }}>ESC</kbd>
        </div>

        {/* Results */}
        <div ref={listRef} style={{ flex: 1, overflowY: 'auto', maxHeight: isMobile ? undefined : 360 }}>
          {results.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              No results for "{query}"
            </div>
          ) : (
            results.map((item, i) => (
              <div
                key={item.id}
                onClick={() => executeItem(item)}
                onMouseEnter={() => setSelected(i)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '7px 14px',
                  cursor: 'pointer',
                  background: i === selected ? 'var(--bg-active)' : 'transparent',
                  borderLeft: i === selected ? '2px solid var(--accent)' : '2px solid transparent',
                }}
              >
                <span style={{ fontSize: 14, width: 20, textAlign: 'center' }}>{item.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.label}
                  </div>
                  {item.detail && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.detail}
                    </div>
                  )}
                </div>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', background: 'var(--bg-secondary)', padding: '1px 6px', borderRadius: 3, flexShrink: 0 }}>
                  {item.category}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '6px 14px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 16, fontSize: 10, color: 'var(--text-muted)' }}>
          <span><kbd style={kbdStyle}>↑↓</kbd> navigate</span>
          <span><kbd style={kbdStyle}>Enter</kbd> select</span>
          <span><kbd style={kbdStyle}>Esc</kbd> close</span>
        </div>
      </div>
    </div>
  )
}

const kbdStyle = {
  background: 'var(--bg-active)',
  border: '1px solid var(--border-color)',
  borderRadius: 3,
  padding: '0 4px',
  fontSize: 10,
  marginRight: 4,
}
