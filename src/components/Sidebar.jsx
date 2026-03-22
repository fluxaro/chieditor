import { useState, useRef, useCallback } from 'react'
import useStore, { registerHandle } from '../store/useStore'
import { FileIcon, FolderIcon } from './FileIcon'
import { readFileContent, getLanguage, buildTree, flattenTree, buildImageDataMap, buildFileRegistry, isImageFile, readImageAsDataURL } from '../utils/fileUtils'

export default function Sidebar() {
  const {
    fileTree, setFileTree, setFlatFiles,
    openedFolder, directoryHandle,
    openTab, setContextMenu,
    sidebarWidth, setSidebarWidth, sidebarOpen,
    addNotification, activeTabId,
    folderLoading, setImageDataMap, setFileRegistry,
  } = useStore()

  const [expandedDirs, setExpandedDirs] = useState(new Set())
  const [renamingNode, setRenamingNode] = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const resizerRef = useRef(null)
  const isResizing = useRef(false)

  // ── Resize sidebar ──────────────────────────────────────────────────────
  const startResize = useCallback((ev) => {
    isResizing.current = true
    const startX = ev.clientX
    const startW = sidebarWidth

    const onMove = (ev) => {
      if (!isResizing.current) return
      const newW = Math.max(160, Math.min(480, startW + ev.clientX - startX))
      setSidebarWidth(newW)
    }
    const onUp = () => {
      isResizing.current = false
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [sidebarWidth, setSidebarWidth])

  // ── Toggle folder ───────────────────────────────────────────────────────
  function toggleDir(path) {
    setExpandedDirs(prev => {
      const next = new Set(prev)
      next.has(path) ? next.delete(path) : next.add(path)
      return next
    })
  }

  // ── Open file in editor ─────────────────────────────────────────────────
  async function openFile(node) {
    try {
      registerHandle(node.path, node.handle)
      // Image files → open as image preview tab
      if (isImageFile(node.name)) {
        const dataUri = await readImageAsDataURL(node.handle)
        openTab({ path: node.path, name: node.name, content: dataUri, language: 'image' })
        return
      }
      const content = await readFileContent(node.handle)
      openTab({ path: node.path, name: node.name, content, language: getLanguage(node.name) })
    } catch {
      addNotification(`Cannot read file: ${node.name}`, 'error')
    }
  }

  // ── Context menu ────────────────────────────────────────────────────────
  function handleContextMenu(e, node) {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ x: e.clientX, y: e.clientY, node })
  }

  // ── Refresh tree ────────────────────────────────────────────────────────
  async function refreshTree() {
    if (!directoryHandle) return
    const tree = await buildTree(directoryHandle)
    setFileTree(tree)
    setFlatFiles(flattenTree(tree))
    setFileRegistry(buildFileRegistry(tree))
    buildImageDataMap(tree).then(setImageDataMap)
  }

  if (!sidebarOpen) return null

  return (
    <aside
      className="flex flex-col shrink-0 relative overflow-hidden"
      style={{
        width: sidebarWidth,
        minWidth: sidebarWidth,
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-color)',
        fontFamily: 'var(--ui-font)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 shrink-0"
        style={{
          height: 36,
          borderBottom: '1px solid var(--border-subtle)',
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--text-secondary)',
        }}
      >
        <span>{openedFolder ? openedFolder.name : 'Explorer'}</span>
        <div className="flex items-center gap-1">
          {directoryHandle && (
            <>
              <IconBtn title="New File" onClick={() => setContextMenu({ x: 0, y: 0, node: null, type: 'new-file' })}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" />
                </svg>
              </IconBtn>
              <IconBtn title="New Folder" onClick={() => setContextMenu({ x: 0, y: 0, node: null, type: 'new-folder' })}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  <line x1="12" y1="11" x2="12" y2="17" /><line x1="9" y1="14" x2="15" y2="14" />
                </svg>
              </IconBtn>
              <IconBtn title="Refresh" onClick={refreshTree}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="23 4 23 10 17 10" />
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
              </IconBtn>
            </>
          )}
        </div>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-1">
        {folderLoading ? (
          <div className="flex flex-col items-center justify-center gap-3" style={{ paddingTop: 48 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" style={{ animation: 'spin 1s linear infinite' }}>
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--ui-font)' }}>Loading project…</span>
          </div>
        ) : fileTree.length === 0 ? (
          <EmptyState />
        ) : (
          <TreeNodes
            nodes={fileTree}
            depth={0}
            expandedDirs={expandedDirs}
            toggleDir={toggleDir}
            openFile={openFile}
            handleContextMenu={handleContextMenu}
            activeTabId={activeTabId}
            renamingNode={renamingNode}
            setRenamingNode={setRenamingNode}
            renameValue={renameValue}
            setRenameValue={setRenameValue}
            refreshTree={refreshTree}
            addNotification={addNotification}
          />
        )}
      </div>

      {/* Resize handle */}
      <div
        ref={resizerRef}
        onMouseDown={startResize}
        className="absolute top-0 right-0 h-full cursor-col-resize"
        style={{ width: 4, zIndex: 10 }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--accent)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      />
    </aside>
  )
}

// ── Tree nodes (recursive) ──────────────────────────────────────────────────
function TreeNodes({ nodes, depth, expandedDirs, toggleDir, openFile, handleContextMenu, activeTabId, renamingNode, setRenamingNode, renameValue, setRenameValue, refreshTree, addNotification }) {
  return (
    <>
      {nodes.map(node => (
        <TreeNode
          key={node.id}
          node={node}
          depth={depth}
          expandedDirs={expandedDirs}
          toggleDir={toggleDir}
          openFile={openFile}
          handleContextMenu={handleContextMenu}
          activeTabId={activeTabId}
          renamingNode={renamingNode}
          setRenamingNode={setRenamingNode}
          renameValue={renameValue}
          setRenameValue={setRenameValue}
          refreshTree={refreshTree}
          addNotification={addNotification}
        />
      ))}
    </>
  )
}

function TreeNode({ node, depth, expandedDirs, toggleDir, openFile, handleContextMenu, activeTabId, renamingNode, setRenamingNode, renameValue, setRenameValue, refreshTree, addNotification }) {
  const isExpanded = expandedDirs.has(node.path)
  const isActive = activeTabId === node.path
  const isRenaming = renamingNode?.path === node.path

  const indent = depth * 12 + 8

  async function commitRename() {
    if (!renameValue.trim() || renameValue === node.name) {
      setRenamingNode(null)
      return
    }
    try {
      // For File System Access API, rename = copy + delete (no direct rename API)
      addNotification('Rename: use OS file manager for now', 'info')
    } catch {
      addNotification('Rename failed', 'error')
    }
    setRenamingNode(null)
  }

  return (
    <div>
      <div
        className="flex items-center gap-1 cursor-pointer select-none"
        style={{
          paddingLeft: indent,
          paddingRight: 8,
          height: 24,
          fontSize: 13,
          background: isActive ? 'var(--bg-active)' : 'transparent',
          color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
          borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
        }}
        onClick={() => node.kind === 'directory' ? toggleDir(node.path) : openFile(node)}
        onContextMenu={(e) => handleContextMenu(e, node)}
        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg-hover)' }}
        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
      >
        {/* Chevron for dirs */}
        {node.kind === 'directory' && (
          <svg
            width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s', flexShrink: 0, color: 'var(--text-muted)' }}
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        )}
        {node.kind === 'file' && <span style={{ width: 10, flexShrink: 0 }} />}

        {/* Icon */}
        <span className="flex items-center shrink-0">
          {node.kind === 'directory'
            ? <FolderIcon name={node.name} expanded={isExpanded} />
            : <FileIcon name={node.name} />
          }
        </span>

        {/* Name or rename input */}
        {isRenaming ? (
          <input
            autoFocus
            value={renameValue}
            onChange={e => setRenameValue(e.target.value)}
            onBlur={commitRename}
            onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setRenamingNode(null) }}
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--accent)',
              color: 'var(--text-primary)',
              fontSize: 12,
              padding: '1px 4px',
              borderRadius: 3,
              outline: 'none',
              width: '100%',
            }}
          />
        ) : (
          <span
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontSize: 13,
              marginLeft: 4,
            }}
          >
            {node.name}
          </span>
        )}
      </div>

      {/* Children */}
      {node.kind === 'directory' && isExpanded && node.children && (
        <TreeNodes
          nodes={node.children}
          depth={depth + 1}
          expandedDirs={expandedDirs}
          toggleDir={toggleDir}
          openFile={openFile}
          handleContextMenu={handleContextMenu}
          activeTabId={activeTabId}
          renamingNode={renamingNode}
          setRenamingNode={setRenamingNode}
          renameValue={renameValue}
          setRenameValue={setRenameValue}
          refreshTree={refreshTree}
          addNotification={addNotification}
        />
      )}
    </div>
  )
}

function EmptyState() {
  const { setOpenedFolder, setFileTree, setFlatFiles, setDirectoryHandle, addNotification, setImageDataMap, setFileRegistry } = useStore()

  async function openFolder() {
    try {
      const dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' })
      const { buildTree, flattenTree, buildImageDataMap, buildFileRegistry } = await import('../utils/fileUtils')
      const tree = await buildTree(dirHandle)
      setDirectoryHandle(dirHandle)
      setFileTree(tree)
      setFlatFiles(flattenTree(tree))
      setOpenedFolder({ name: dirHandle.name, path: dirHandle.name })
      setFileRegistry(buildFileRegistry(tree))
      addNotification(`Opened: ${dirHandle.name}`, 'success')
      buildImageDataMap(tree).then(setImageDataMap)
    } catch (e) {
      if (e.name !== 'AbortError') addNotification('Failed to open folder', 'error')
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 px-4 text-center" style={{ paddingTop: 40 }}>
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.2">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      </svg>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
        No folder open.<br />Open a folder to start editing.
      </p>
      <button
        onClick={openFolder}
        style={{
          background: 'var(--accent)',
          color: '#fff',
          border: 'none',
          borderRadius: 5,
          padding: '6px 14px',
          fontSize: 12,
          cursor: 'pointer',
          fontFamily: 'var(--ui-font)',
        }}
      >
        Open Folder
      </button>
    </div>
  )
}

function IconBtn({ children, onClick, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        background: 'transparent',
        border: 'none',
        color: 'var(--text-muted)',
        cursor: 'pointer',
        padding: '2px',
        borderRadius: 3,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--bg-hover)' }}
      onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent' }}
    >
      {children}
    </button>
  )
}
