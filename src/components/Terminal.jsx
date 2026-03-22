import { useState } from 'react'
import useStore from '../store/useStore'

export default function Terminal() {
  const { terminalOpen, setTerminalOpen, openedFolder } = useStore()
  const [height, setHeight] = useState(220)
  const [isResizing, setIsResizing] = useState(false)

  if (!terminalOpen) return null

  function startResize(e) {
    const startY = e.clientY
    const startH = height
    setIsResizing(true)

    const onMove = (ev) => {
      const newH = Math.max(120, Math.min(600, startH - (ev.clientY - startY)))
      setHeight(newH)
    }
    const onUp = () => {
      setIsResizing(false)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  const folderPath = openedFolder?.path || null

  return (
    <div
      style={{
        height,
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        fontFamily: 'var(--editor-font)',
        fontSize: 'var(--terminal-font-size)',
        userSelect: isResizing ? 'none' : 'auto',
      }}
    >
      {/* Resize handle */}
      <div
        onMouseDown={startResize}
        style={{
          height: 4,
          cursor: 'row-resize',
          background: isResizing ? 'var(--accent)' : 'transparent',
          flexShrink: 0,
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--accent)'}
        onMouseLeave={e => { if (!isResizing) e.currentTarget.style.background = 'transparent' }}
      />

      {/* Header */}
      <div
        className="flex items-center justify-between px-3 shrink-0"
        style={{
          height: 32,
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-tertiary)',
        }}
      >
        <div className="flex items-center gap-2">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2">
            <polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" />
          </svg>
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-secondary)', fontFamily: 'var(--ui-font)' }}>
            Terminal
          </span>
        </div>
        <button
          onClick={() => setTerminalOpen(false)}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2, borderRadius: 3, display: 'flex' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4" style={{ color: 'var(--text-secondary)' }}>
        <TerminalContent folderPath={folderPath} />
      </div>
    </div>
  )
}

function TerminalContent({ folderPath }) {
  const [copied, setCopied] = useState(false)

  const cdCommand = folderPath ? `cd "${folderPath}"` : null

  function copyCommand() {
    if (!cdCommand) return
    navigator.clipboard.writeText(cdCommand).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div style={{ lineHeight: 1.8 }}>
      {/* Warning banner */}
      <div
        style={{
          background: 'rgba(210, 153, 34, 0.08)',
          border: '1px solid rgba(210, 153, 34, 0.25)',
          borderRadius: 6,
          padding: '10px 14px',
          marginBottom: 16,
          fontSize: 12,
          color: 'var(--color-warning)',
          fontFamily: 'var(--ui-font)',
        }}
      >
        ⚠️ Direct OS terminal access is not available in the browser.
      </div>

      <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12, fontFamily: 'var(--ui-font)' }}>
        To work in the terminal with your project:
      </p>

      <Step num="1" text="Open your OS terminal (bash, zsh, PowerShell, etc.)" />

      <Step num="2" text={
        folderPath
          ? 'Run this command to navigate to your project folder:'
          : 'Open a folder in Chiditor first, then the command will appear here.'
      } />

      {folderPath && (
        <div
          style={{
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: 6,
            padding: '8px 12px',
            margin: '8px 0 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <code style={{ color: 'var(--color-success)', fontSize: 13 }}>
            {cdCommand}
          </code>
          <button
            onClick={copyCommand}
            style={{
              background: copied ? 'var(--color-success)' : 'var(--bg-active)',
              border: '1px solid var(--border-color)',
              color: copied ? '#fff' : 'var(--text-secondary)',
              borderRadius: 4,
              padding: '3px 10px',
              fontSize: 11,
              cursor: 'pointer',
              fontFamily: 'var(--ui-font)',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
            }}
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
      )}

      <Step num="3" text="Now run your project commands:" />

      <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {[
          { cmd: 'npm install', desc: 'Install dependencies' },
          { cmd: 'npm run dev', desc: 'Start dev server' },
          { cmd: 'npm run build', desc: 'Build for production' },
          { cmd: 'node index.js', desc: 'Run Node.js script' },
          { cmd: 'ls', desc: 'List files' },
          { cmd: 'pwd', desc: 'Print working directory' },
        ].map(({ cmd, desc }) => (
          <div key={cmd} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <code style={{ color: 'var(--text-accent)', fontSize: 12, minWidth: 140 }}>{cmd}</code>
            <span style={{ color: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--ui-font)' }}>{desc}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Step({ num, text }) {
  return (
    <div style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'flex-start' }}>
      <span style={{
        background: 'var(--accent)',
        color: '#fff',
        borderRadius: '50%',
        width: 18, height: 18,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10, fontWeight: 700,
        flexShrink: 0,
        marginTop: 1,
        fontFamily: 'var(--ui-font)',
      }}>{num}</span>
      <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--ui-font)', lineHeight: 1.6 }}>{text}</span>
    </div>
  )
}
