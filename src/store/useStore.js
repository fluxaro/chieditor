import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ─── File System helpers ───────────────────────────────────────────────────
let fileHandleMap = new Map() // path → FileSystemFileHandle

export function registerHandle(path, handle) {
  fileHandleMap.set(path, handle)
}
export function getHandle(path) {
  return fileHandleMap.get(path)
}
export function removeHandle(path) {
  fileHandleMap.delete(path)
}
export function clearHandles() {
  fileHandleMap = new Map()
}

// ─── Store ─────────────────────────────────────────────────────────────────
const useStore = create(
  persist(
    (set, get) => ({
      // ── File tree ──────────────────────────────────────────────────────
      fileTree: [],          // nested tree nodes
      flatFiles: [],         // flat list for palette / search
      openedFolder: null,    // { name, path }
      directoryHandle: null, // root FileSystemDirectoryHandle (not persisted)

      folderLoading: false,
      setFolderLoading: (v) => set({ folderLoading: v }),

      setFileTree: (tree) => set({ fileTree: tree }),
      setFlatFiles: (files) => set({ flatFiles: files }),
      setOpenedFolder: (folder) => set({ openedFolder: folder }),
      setDirectoryHandle: (handle) => set({ directoryHandle: handle }),

      // image data URI registry for preview (path/name → base64 data URI)
      imageDataMap: {},
      setImageDataMap: (map) => set({ imageDataMap: map }),

      // flat registry of ALL file handles in the opened folder (path → handle)
      fileRegistry: {},
      setFileRegistry: (reg) => set({ fileRegistry: reg }),

      // ── Tabs ───────────────────────────────────────────────────────────
      tabs: [],        // [{ id, path, name, content, language, unsaved }]
      activeTabId: null,

      openTab: (file) => {
        const { tabs } = get()
        const existing = tabs.find(t => t.path === file.path)
        if (existing) {
          set({ activeTabId: existing.id })
          return
        }
        const tab = {
          id: file.path,
          path: file.path,
          name: file.name,
          content: file.content || '',
          language: file.language || 'plaintext',
          unsaved: false,
        }
        set({ tabs: [...tabs, tab], activeTabId: tab.id })
      },

      closeTab: (id) => {
        const { tabs, activeTabId } = get()
        const idx = tabs.findIndex(t => t.id === id)
        const newTabs = tabs.filter(t => t.id !== id)
        let newActive = activeTabId
        if (activeTabId === id) {
          if (newTabs.length === 0) newActive = null
          else if (idx > 0) newActive = newTabs[idx - 1].id
          else newActive = newTabs[0].id
        }
        set({ tabs: newTabs, activeTabId: newActive })
      },

      setActiveTab: (id) => set({ activeTabId: id }),

      updateTabContent: (id, content) => {
        const { tabs } = get()
        set({
          tabs: tabs.map(t =>
            t.id === id ? { ...t, content, unsaved: true } : t
          ),
        })
      },

      markTabSaved: (id) => {
        const { tabs } = get()
        set({ tabs: tabs.map(t => t.id === id ? { ...t, unsaved: false } : t) })
      },

      getActiveTab: () => {
        const { tabs, activeTabId } = get()
        return tabs.find(t => t.id === activeTabId) || null
      },

      // ── Preview ────────────────────────────────────────────────────────
      previewOpen: false,
      previewFile: null,   // path of HTML file to preview
      setPreviewOpen: (v) => set({ previewOpen: v }),
      setPreviewFile: (p) => set({ previewFile: p }),

      // ── Terminal panel ─────────────────────────────────────────────────
      terminalOpen: true,
      setTerminalOpen: (v) => set({ terminalOpen: v }),

      // ── Command palette ────────────────────────────────────────────────
      paletteOpen: false,
      setPaletteOpen: (v) => set({ paletteOpen: v }),

      // ── Settings modal ─────────────────────────────────────────────────
      settingsOpen: false,
      setSettingsOpen: (v) => set({ settingsOpen: v }),

      // ── Theme & customization ──────────────────────────────────────────
      theme: 'dark',
      editorFontFamily: "'JetBrains Mono', monospace",
      editorFontSize: 14,
      uiFontFamily: "'Inter', system-ui, sans-serif",
      overlayColor: 'default',

      setTheme: (theme) => {
        set({ theme })
        document.documentElement.setAttribute('data-theme', theme)
      },
      setEditorFontFamily: (f) => set({ editorFontFamily: f }),
      setEditorFontSize: (s) => set({ editorFontSize: s }),
      setUiFontFamily: (f) => set({ uiFontFamily: f }),
      setOverlayColor: (c) => set({ overlayColor: c }),

      // ── Sidebar ────────────────────────────────────────────────────────
      sidebarWidth: 240,
      sidebarOpen: true,
      setSidebarWidth: (w) => set({ sidebarWidth: w }),
      setSidebarOpen: (v) => set({ sidebarOpen: v }),

      // ── Context menu ───────────────────────────────────────────────────
      contextMenu: null, // { x, y, node }
      setContextMenu: (m) => set({ contextMenu: m }),

      // ── Notifications ──────────────────────────────────────────────────
      notifications: [],
      addNotification: (msg, type = 'info') => {
        const id = Date.now()
        set(s => ({ notifications: [...s.notifications, { id, msg, type }] }))
        setTimeout(() => {
          set(s => ({ notifications: s.notifications.filter(n => n.id !== id) }))
        }, 3000)
      },
    }),
    {
      name: 'chiditor-prefs',
      partialize: (s) => ({
        theme: s.theme,
        editorFontFamily: s.editorFontFamily,
        editorFontSize: s.editorFontSize,
        uiFontFamily: s.uiFontFamily,
        overlayColor: s.overlayColor,
        sidebarWidth: s.sidebarWidth,
        sidebarOpen: s.sidebarOpen,
        terminalOpen: s.terminalOpen,
      }),
    }
  )
)

export default useStore
