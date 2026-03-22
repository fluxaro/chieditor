import { useState } from 'react'
import useStore from '../store/useStore'
import { useBreakpoint } from '../hooks/useBreakpoint'

const EDITOR_FONTS = [
  { label: 'JetBrains Mono', value: "'JetBrains Mono', monospace" },
  { label: 'Fira Code', value: "'Fira Code', monospace" },
  { label: 'Cascadia Code', value: "'Cascadia Code', monospace" },
  { label: 'Source Code Pro', value: "'Source Code Pro', monospace" },
  { label: 'Inconsolata', value: "'Inconsolata', monospace" },
  { label: 'Courier New', value: "'Courier New', monospace" },
  { label: 'Consolas', value: "'Consolas', monospace" },
  { label: 'Monaco', value: "'Monaco', monospace" },
]

const UI_FONTS = [
  { label: 'Inter', value: "'Inter', system-ui, sans-serif" },
  { label: 'Segoe UI', value: "'Segoe UI', system-ui, sans-serif" },
  { label: 'SF Pro', value: "-apple-system, BlinkMacSystemFont, sans-serif" },
  { label: 'Roboto', value: "'Roboto', sans-serif" },
  { label: 'System Default', value: "system-ui, sans-serif" },
]

const THEMES = [
  { id: 'dark', label: 'Dark', desc: 'GitHub Dark' },
  { id: 'light', label: 'Light', desc: 'GitHub Light' },
  { id: 'dracula', label: 'Dracula', desc: 'Classic Dracula' },
  { id: 'monokai', label: 'Monokai', desc: 'Sublime Monokai' },
  { id: 'nord', label: 'Nord', desc: 'Arctic Nord' },
  { id: 'solarized', label: 'Solarized', desc: 'Solarized Dark' },
]

const OVERLAY_COLORS = [
  { id: 'default', label: 'Default', color: '#58a6ff' },
  { id: 'emerald', label: 'Emerald', color: '#10b981' },
  { id: 'violet', label: 'Violet', color: '#8b5cf6' },
  { id: 'rose', label: 'Rose', color: '#f43f5e' },
  { id: 'amber', label: 'Amber', color: '#f59e0b' },
  { id: 'cyan', label: 'Cyan', color: '#06b6d4' },
  { id: 'orange', label: 'Orange', color: '#f97316' },
  { id: 'pink', label: 'Pink', color: '#ec4899' },
  { id: 'lime', label: 'Lime', color: '#84cc16' },
  { id: 'indigo', label: 'Indigo', color: '#6366f1' },
  { id: 'teal', label: 'Teal', color: '#14b8a6' },
  { id: 'sky', label: 'Sky', color: '#0ea5e9' },
]

const TABS = ['Editor', 'Appearance', 'Themes', 'Keybindings']

export default function Settings() {
  const {
    settingsOpen, setSettingsOpen,
    theme, setTheme,
    editorFontFamily, setEditorFontFamily,
    editorFontSize, setEditorFontSize,
    uiFontFamily, setUiFontFamily,
    overlayColor, setOverlayColor,
  } = useStore()

  const [activeTab, setActiveTab] = useState('Editor')
  const { isMobile } = useBreakpoint()

  if (!settingsOpen) return null

  function applyOverlay(colorId) {
    const found = OVERLAY_COLORS.find(c => c.id === colorId)
    if (!found) return
    setOverlayColor(colorId)
    document.documentElement.style.setProperty('--accent', found.color)
    document.documentElement.style.setProperty('--tab-border', found.color)
    document.documentElement.style.setProperty('--text-accent', found.color)
  }

  return (
    <div
      className="fixed inset-0 flex items-end justify-center"
      style={{
        zIndex: 9997,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(3px)',
        animation: 'fadeIn 0.15s ease',
        alignItems: isMobile ? 'flex-end' : 'center',
      }}
      onMouseDown={e => { if (e.target === e.currentTarget) setSettingsOpen(false) }}
    >
      <div
        style={{
          width: isMobile ? '100vw' : 'min(640px, 94vw)',
          maxHeight: isMobile ? '92dvh' : '82vh',
          background: 'var(--bg-secondary)',
          border: isMobile ? 'none' : '1px solid var(--border-color)',
          borderRadius: isMobile ? '16px 16px 0 0' : 10,
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          fontFamily: 'var(--ui-font)',
          animation: isMobile ? 'slideInUp 0.24s cubic-bezier(0.4,0,0.2,1)' : 'fadeIn 0.15s ease',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Settings</span>
          </div>
          <button onClick={() => setSettingsOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, borderRadius: 4, display: 'flex' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', padding: '0 20px' }}>
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
                color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-secondary)',
                padding: '8px 14px',
                fontSize: 13,
                cursor: 'pointer',
                fontFamily: 'var(--ui-font)',
                marginBottom: -1,
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {activeTab === 'Editor' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <Setting label="Editor Font" desc="Monospace font used in the code editor">
                <select value={editorFontFamily} onChange={e => setEditorFontFamily(e.target.value)} style={selectStyle}>
                  {EDITOR_FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </Setting>

              <Setting label="Font Size" desc="Editor font size in pixels">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button onClick={() => setEditorFontSize(Math.max(10, editorFontSize - 1))} style={btnStyle}>−</button>
                  <span style={{ fontSize: 14, color: 'var(--text-primary)', minWidth: 28, textAlign: 'center' }}>{editorFontSize}</span>
                  <button onClick={() => setEditorFontSize(Math.min(28, editorFontSize + 1))} style={btnStyle}>+</button>
                  <input
                    type="range" min="10" max="28" value={editorFontSize}
                    onChange={e => setEditorFontSize(Number(e.target.value))}
                    style={{ flex: 1, accentColor: 'var(--accent)' }}
                  />
                </div>
              </Setting>

              <Setting label="UI Font" desc="Font used for the interface labels and panels">
                <select value={uiFontFamily} onChange={e => setUiFontFamily(e.target.value)} style={selectStyle}>
                  {UI_FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </Setting>

              <div style={{ padding: '12px', background: 'var(--bg-tertiary)', borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>Preview</p>
                <code style={{ fontFamily: editorFontFamily, fontSize: editorFontSize, color: 'var(--text-primary)' }}>
                  const hello = () =&gt; "world";
                </code>
              </div>
            </div>
          )}

          {activeTab === 'Appearance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <Setting label="Accent Color" desc="Primary accent color used across the UI">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {OVERLAY_COLORS.map(c => (
                    <button
                      key={c.id}
                      onClick={() => applyOverlay(c.id)}
                      title={c.label}
                      style={{
                        width: 28, height: 28,
                        borderRadius: '50%',
                        background: c.color,
                        border: overlayColor === c.id ? `3px solid var(--text-primary)` : '3px solid transparent',
                        cursor: 'pointer',
                        outline: overlayColor === c.id ? `2px solid ${c.color}` : 'none',
                        outlineOffset: 2,
                        transition: 'transform 0.1s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    />
                  ))}
                </div>
              </Setting>
            </div>
          )}

          {activeTab === 'Themes' && (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
              {THEMES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  style={{
                    background: theme === t.id ? 'var(--accent-subtle)' : 'var(--bg-tertiary)',
                    border: theme === t.id ? '1px solid var(--accent)' : '1px solid var(--border-color)',
                    borderRadius: 8,
                    padding: '12px 16px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: 'var(--ui-font)',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600, color: theme === t.id ? 'var(--accent)' : 'var(--text-primary)', marginBottom: 3 }}>{t.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.desc}</div>
                </button>
              ))}
            </div>
          )}

          {activeTab === 'Keybindings' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[
                ['Ctrl+S', 'Save file'],
                ['Ctrl+Shift+P', 'Command palette'],
                ['Ctrl+`', 'Toggle terminal'],
                ['Ctrl+B', 'Toggle sidebar'],
                ['Ctrl+Shift+E', 'Focus explorer'],
                ['Ctrl+W', 'Close tab'],
                ['Ctrl+Tab', 'Next tab'],
                ['Ctrl+Z', 'Undo'],
                ['Ctrl+Shift+Z', 'Redo'],
                ['Ctrl+/', 'Toggle comment'],
                ['Ctrl+D', 'Select next occurrence'],
                ['Alt+Click', 'Multi-cursor'],
                ['Ctrl+F', 'Find'],
                ['Ctrl+H', 'Find & Replace'],
                ['Ctrl+G', 'Go to line'],
                ['F12', 'Go to definition'],
                ['Shift+Alt+F', 'Format document'],
              ].map(([key, desc]) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{desc}</span>
                  <kbd style={{ background: 'var(--bg-active)', border: '1px solid var(--border-color)', borderRadius: 4, padding: '2px 8px', fontSize: 11, color: 'var(--text-primary)', fontFamily: 'var(--editor-font)' }}>{key}</kbd>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Setting({ label, desc, children }) {
  return (
    <div>
      <div style={{ marginBottom: 6 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2 }}>{label}</div>
        {desc && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{desc}</div>}
      </div>
      {children}
    </div>
  )
}

const selectStyle = {
  background: 'var(--bg-tertiary)',
  border: '1px solid var(--border-color)',
  color: 'var(--text-primary)',
  fontSize: 13,
  padding: '6px 10px',
  borderRadius: 5,
  cursor: 'pointer',
  outline: 'none',
  width: '100%',
  fontFamily: 'var(--ui-font)',
}

const btnStyle = {
  background: 'var(--bg-active)',
  border: '1px solid var(--border-color)',
  color: 'var(--text-primary)',
  borderRadius: 4,
  width: 28, height: 28,
  cursor: 'pointer',
  fontSize: 16,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: 'var(--ui-font)',
}
