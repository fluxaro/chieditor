import { useEffect, useRef, useCallback } from 'react'
import MonacoEditor from '@monaco-editor/react'
import useStore, { getHandle } from '../store/useStore'
import { writeFileContent } from '../utils/fileUtils'
import { defineMonacoThemes, MONACO_THEMES } from '../utils/monacoThemes'
import TabBar from './TabBar'

const SAVE_DEBOUNCE = 600

export default function Editor() {
  const {
    tabs, activeTabId, getActiveTab,
    updateTabContent, markTabSaved,
    theme, editorFontFamily, editorFontSize,
    addNotification,
  } = useStore()

  const saveTimers = useRef({})
  const monacoRef = useRef(null)
  const editorRef = useRef(null)

  const activeTab = getActiveTab()

  // ── Monaco setup ──────────────────────────────────────────────────────
  function handleEditorWillMount(monaco) {
    monacoRef.current = monaco
    defineMonacoThemes(monaco)
  }

  function handleEditorDidMount(editor, monaco) {
    editorRef.current = editor

    // Keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      const tab = useStore.getState().getActiveTab()
      if (tab) saveFile(tab.id, tab.content)
    })

    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyP,
      () => useStore.getState().setPaletteOpen(true)
    )

    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.Backquote,
      () => {
        const s = useStore.getState()
        s.setTerminalOpen(!s.terminalOpen)
      }
    )
  }

  // ── Save file ─────────────────────────────────────────────────────────
  const saveFile = useCallback(async (tabId, content) => {
    const handle = getHandle(tabId)
    if (!handle) return
    try {
      await writeFileContent(handle, content)
      markTabSaved(tabId)
    } catch (e) {
      addNotification(`Save failed: ${e.message}`, 'error')
    }
  }, [markTabSaved, addNotification])

  // ── Handle content change with debounced autosave ─────────────────────
  function handleChange(value) {
    if (!activeTabId || value === undefined) return
    updateTabContent(activeTabId, value)

    // Debounced autosave
    clearTimeout(saveTimers.current[activeTabId])
    saveTimers.current[activeTabId] = setTimeout(() => {
      saveFile(activeTabId, value)
    }, SAVE_DEBOUNCE)
  }

  // ── Sync theme ────────────────────────────────────────────────────────
  useEffect(() => {
    if (monacoRef.current) {
      monacoRef.current.editor.setTheme(MONACO_THEMES[theme] || 'chiditor-dark')
    }
  }, [theme])

  // ── Sync font ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({
        fontFamily: editorFontFamily,
        fontSize: editorFontSize,
      })
    }
  }, [editorFontFamily, editorFontSize])

  const monacoTheme = MONACO_THEMES[theme] || 'chiditor-dark'

  return (
    <div className="flex flex-col flex-1 overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      <TabBar />

      {activeTab ? (
        <div className="flex-1 overflow-hidden">
          {activeTab.language === 'image' ? (
            <ImageViewer tab={activeTab} />
          ) : (
          <MonacoEditor
            key={activeTab.id}
            height="100%"
            language={activeTab.language}
            value={activeTab.content}
            theme={monacoTheme}
            beforeMount={handleEditorWillMount}
            onMount={handleEditorDidMount}
            onChange={handleChange}
            options={{
              fontFamily: editorFontFamily,
              fontSize: editorFontSize,
              fontLigatures: true,
              lineNumbers: 'on',
              minimap: { enabled: true, scale: 1 },
              scrollBeyondLastLine: false,
              wordWrap: 'off',
              tabSize: 2,
              insertSpaces: true,
              autoIndent: 'full',
              formatOnPaste: true,
              formatOnType: false,
              smoothScrolling: true,
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
              renderLineHighlight: 'line',
              bracketPairColorization: { enabled: true },
              guides: { bracketPairs: true, indentation: true },
              suggest: { showKeywords: true, showSnippets: true },
              quickSuggestions: { other: true, comments: false, strings: false },
              padding: { top: 12, bottom: 12 },
              scrollbar: {
                verticalScrollbarSize: 6,
                horizontalScrollbarSize: 6,
                useShadows: false,
              },
              overviewRulerLanes: 0,
              hideCursorInOverviewRuler: true,
              renderWhitespace: 'none',
              folding: true,
              foldingHighlight: true,
              showFoldingControls: 'mouseover',
              contextmenu: true,
              mouseWheelZoom: true,
              accessibilitySupport: 'auto',
            }}
          />
          )}
        </div>
      ) : (
        <WelcomeScreen />
      )}
    </div>
  )
}

function WelcomeScreen() {
  const { openedFolder } = useStore()
  return (
    <div
      className="flex-1 flex flex-col items-center justify-center gap-6"
      style={{ background: 'var(--bg-primary)', color: 'var(--text-muted)' }}
    >
      <svg width="56" height="56" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="8" height="8" rx="1.5" fill="var(--accent)" opacity="0.8" />
        <rect x="13" y="3" width="8" height="8" rx="1.5" fill="var(--accent)" opacity="0.5" />
        <rect x="3" y="13" width="8" height="8" rx="1.5" fill="var(--accent)" opacity="0.5" />
        <rect x="13" y="13" width="8" height="8" rx="1.5" fill="var(--accent)" opacity="0.2" />
      </svg>
      <div className="text-center" style={{ lineHeight: 1.8 }}>
        <p style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>Chiditor</p>
        <p style={{ fontSize: 13 }}>
          {openedFolder ? `${openedFolder.name} — select a file to edit` : 'Open a folder to get started'}
        </p>
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 2 }}>
        <div><kbd style={kbdStyle}>Ctrl+Shift+P</kbd> Command Palette</div>
        <div><kbd style={kbdStyle}>Ctrl+S</kbd> Save File</div>
        <div><kbd style={kbdStyle}>Ctrl+`</kbd> Toggle Terminal</div>
      </div>
    </div>
  )
}

const kbdStyle = {
  background: 'var(--bg-tertiary)',
  border: '1px solid var(--border-color)',
  borderRadius: 4,
  padding: '1px 6px',
  fontSize: 11,
  fontFamily: 'var(--editor-font)',
  marginRight: 8,
}

function ImageViewer({ tab }) {
  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-primary)',
      gap: 12, overflow: 'auto', padding: 24,
    }}>
      <img
        src={tab.content}
        alt={tab.name}
        style={{
          maxWidth: '100%', maxHeight: 'calc(100% - 48px)',
          objectFit: 'contain',
          borderRadius: 6,
          boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
        }}
      />
      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--ui-font)' }}>
        {tab.name}
      </span>
    </div>
  )
}
