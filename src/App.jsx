import { useEffect, useCallback } from 'react'
import useStore from './store/useStore'
import TopBar from './components/TopBar'
import Sidebar from './components/Sidebar'
import Editor from './components/Editor'
import Preview from './components/Preview'
import Terminal from './components/Terminal'
import CommandPalette from './components/CommandPalette'
import Settings from './components/Settings'
import ContextMenu from './components/ContextMenu'
import Notifications from './components/Notifications'
import StatusBar from './components/StatusBar'

export default function App() {
  const {
    theme, setPaletteOpen, setSettingsOpen,
    setSidebarOpen, sidebarOpen,
    setTerminalOpen, terminalOpen,
    overlayColor,
  } = useStore()

  // Apply theme on mount and change
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  // Apply saved accent color on mount
  useEffect(() => {
    const OVERLAY_COLORS = [
      { id: 'default', color: '#58a6ff' },
      { id: 'emerald', color: '#10b981' },
      { id: 'violet', color: '#8b5cf6' },
      { id: 'rose', color: '#f43f5e' },
      { id: 'amber', color: '#f59e0b' },
      { id: 'cyan', color: '#06b6d4' },
      { id: 'orange', color: '#f97316' },
      { id: 'pink', color: '#ec4899' },
      { id: 'lime', color: '#84cc16' },
      { id: 'indigo', color: '#6366f1' },
      { id: 'teal', color: '#14b8a6' },
      { id: 'sky', color: '#0ea5e9' },
    ]
    const found = OVERLAY_COLORS.find(c => c.id === overlayColor)
    if (found && overlayColor !== 'default') {
      document.documentElement.style.setProperty('--accent', found.color)
      document.documentElement.style.setProperty('--tab-border', found.color)
      document.documentElement.style.setProperty('--text-accent', found.color)
    }
  }, [overlayColor])

  // Global keyboard shortcuts
  const handleKeyDown = useCallback((e) => {
    // Ctrl+Shift+P → command palette
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
      e.preventDefault()
      setPaletteOpen(true)
    }
    // Ctrl+, → settings
    if ((e.ctrlKey || e.metaKey) && e.key === ',') {
      e.preventDefault()
      setSettingsOpen(true)
    }
    // Ctrl+B → sidebar
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault()
      setSidebarOpen(!sidebarOpen)
    }
    // Ctrl+` → terminal
    if ((e.ctrlKey || e.metaKey) && e.key === '`') {
      e.preventDefault()
      setTerminalOpen(!terminalOpen)
    }
  }, [setPaletteOpen, setSettingsOpen, setSidebarOpen, sidebarOpen, setTerminalOpen, terminalOpen])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
      }}
    >
      {/* Top bar */}
      <TopBar />

      {/* Main area */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <Sidebar />

        {/* Editor + Terminal column */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <Editor />
          <Terminal />
        </div>

        {/* Preview pane */}
        <Preview />
      </div>

      {/* Status bar */}
      <StatusBar />

      {/* Overlays */}
      <CommandPalette />
      <Settings />
      <ContextMenu />
      <Notifications />
    </div>
  )
}
