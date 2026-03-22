import { useEffect, useCallback } from 'react'
import useStore from './store/useStore'
import { useBreakpoint } from './hooks/useBreakpoint'
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
import MobileNav from './components/MobileNav'

export default function App() {
  const {
    theme, setPaletteOpen, setSettingsOpen,
    setSidebarOpen, sidebarOpen,
    setTerminalOpen, terminalOpen,
    setPreviewOpen, previewOpen,
    overlayColor,
  } = useStore()

  const { isMobile, isTablet } = useBreakpoint()

  // On mobile/tablet, close panels that don't fit on mount
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false)
      setPreviewOpen(false)
      setTerminalOpen(false)
    } else if (isTablet) {
      setSidebarOpen(false)
      setPreviewOpen(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile, isTablet])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

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

  const handleKeyDown = useCallback((e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
      e.preventDefault(); setPaletteOpen(true)
    }
    if ((e.ctrlKey || e.metaKey) && e.key === ',') {
      e.preventDefault(); setSettingsOpen(true)
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault(); setSidebarOpen(!sidebarOpen)
    }
    if ((e.ctrlKey || e.metaKey) && e.key === '`') {
      e.preventDefault(); setTerminalOpen(!terminalOpen)
    }
  }, [setPaletteOpen, setSettingsOpen, setSidebarOpen, sidebarOpen, setTerminalOpen, terminalOpen])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100dvh', width: '100vw',
      overflow: 'hidden',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
    }}>
      <TopBar />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        {/* Sidebar — drawer on mobile/tablet, inline on desktop */}
        {isMobile || isTablet ? (
          <>
            {/* Backdrop */}
            {sidebarOpen && (
              <div
                onClick={() => setSidebarOpen(false)}
                style={{
                  position: 'absolute', inset: 0, zIndex: 40,
                  background: 'rgba(0,0,0,0.5)',
                }}
              />
            )}
            {/* Drawer */}
            <div style={{
              position: 'absolute', top: 0, left: 0, bottom: 0, zIndex: 50,
              transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
              transition: 'transform 0.22s cubic-bezier(0.4,0,0.2,1)',
              width: 260,
            }}>
              <Sidebar />
            </div>
          </>
        ) : (
          <Sidebar />
        )}

        {/* Editor + Terminal */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', minWidth: 0 }}>
          <Editor />
          {!isMobile && <Terminal />}
        </div>

        {/* Preview — drawer on mobile, inline on desktop */}
        {isMobile ? (
          <>
            {previewOpen && (
              <div
                onClick={() => setPreviewOpen(false)}
                style={{
                  position: 'absolute', inset: 0, zIndex: 40,
                  background: 'rgba(0,0,0,0.5)',
                }}
              />
            )}
            <div style={{
              position: 'absolute', top: 0, right: 0, bottom: 0, zIndex: 50,
              width: '92vw',
              transform: previewOpen ? 'translateX(0)' : 'translateX(100%)',
              transition: 'transform 0.22s cubic-bezier(0.4,0,0.2,1)',
            }}>
              <Preview />
            </div>
          </>
        ) : (
          <Preview />
        )}
      </div>

      {/* Mobile terminal — bottom sheet */}
      {isMobile && terminalOpen && (
        <div style={{
          position: 'absolute', bottom: 48, left: 0, right: 0, zIndex: 60,
          maxHeight: '50dvh',
          borderTop: '1px solid var(--border-color)',
          background: 'var(--bg-secondary)',
          display: 'flex', flexDirection: 'column',
        }}>
          <Terminal />
        </div>
      )}

      <StatusBar />

      {/* Mobile bottom nav */}
      {isMobile && <MobileNav />}

      <CommandPalette />
      <Settings />
      <ContextMenu />
      <Notifications />
    </div>
  )
}
