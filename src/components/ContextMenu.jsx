import { useEffect, useRef } from 'react'
import useStore, { getHandle } from '../store/useStore'
import { buildTree, flattenTree, readFileContent, getLanguage } from '../utils/fileUtils'

export default function ContextMenu() {
  const { contextMenu, setContextMenu, directoryHandle, setFileTree, setFlatFiles, openTab, addNotification } = useStore()
  const ref = useRef(null)

  useEffect(() => {
    if (!contextMenu) return
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setContextMenu(null)
    }
    window.addEventListener('mousedown', handleClick)
    return () => window.removeEventListener('mousedown', handleClick)
  }, [contextMenu, setContextMenu])

  if (!contextMenu) return null

  const { x, y, node } = contextMenu

  // Position clamping
  const menuW = 180
  const menuH = 200
  const left = Math.min(x, window.innerWidth - menuW - 8)
  const top = Math.min(y, window.innerHeight - menuH - 8)

  async function refreshTree() {
    if (!directoryHandle) return
    const tree = await buildTree(directoryHandle)
    setFileTree(tree)
    setFlatFiles(flattenTree(tree))
  }

  async function handleNewFile() {
    setContextMenu(null)
    const name = prompt('File name:')
    if (!name?.trim()) return
    try {
      let targetDir = directoryHandle
      if (node?.kind === 'directory') {
        targetDir = node.handle
      } else if (node?.kind === 'file') {
        // get parent — for simplicity use root
        targetDir = directoryHandle
      }
      const fh = await targetDir.getFileHandle(name.trim(), { create: true })
      const writable = await fh.createWritable()
      await writable.write('')
      await writable.close()
      await refreshTree()
      // open the new file
      openTab({ path: name.trim(), name: name.trim(), content: '', language: getLanguage(name.trim()) })
      addNotification(`Created: ${name}`, 'success')
    } catch (e) {
      addNotification(`Failed to create file: ${e.message}`, 'error')
    }
  }

  async function handleNewFolder() {
    setContextMenu(null)
    const name = prompt('Folder name:')
    if (!name?.trim()) return
    try {
      let targetDir = directoryHandle
      if (node?.kind === 'directory') targetDir = node.handle
      await targetDir.getDirectoryHandle(name.trim(), { create: true })
      await refreshTree()
      addNotification(`Created folder: ${name}`, 'success')
    } catch (e) {
      addNotification(`Failed to create folder: ${e.message}`, 'error')
    }
  }

  async function handleDelete() {
    setContextMenu(null)
    if (!node) return
    const confirmed = window.confirm(`Delete "${node.name}"?`)
    if (!confirmed) return
    try {
      // Find parent handle — walk tree
      const parentPath = node.path.includes('/')
        ? node.path.substring(0, node.path.lastIndexOf('/'))
        : null

      let parentHandle = directoryHandle
      if (parentPath) {
        const parts = parentPath.split('/')
        for (const part of parts) {
          parentHandle = await parentHandle.getDirectoryHandle(part)
        }
      }
      await parentHandle.removeEntry(node.name, { recursive: true })
      await refreshTree()
      addNotification(`Deleted: ${node.name}`, 'success')
    } catch (e) {
      addNotification(`Delete failed: ${e.message}`, 'error')
    }
  }

  async function handleOpenFile() {
    setContextMenu(null)
    if (!node || node.kind !== 'file') return
    try {
      const content = await readFileContent(node.handle)
      openTab({ path: node.path, name: node.name, content, language: getLanguage(node.name) })
    } catch (e) {
      addNotification('Cannot open file', 'error')
    }
  }

  const items = [
    node?.kind === 'file' && { label: 'Open File', icon: '📄', action: handleOpenFile },
    { label: 'New File', icon: '📄', action: handleNewFile },
    { label: 'New Folder', icon: '📁', action: handleNewFolder },
    node && { label: 'Delete', icon: '🗑', action: handleDelete, danger: true },
  ].filter(Boolean)

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        left,
        top,
        zIndex: 9999,
        background: 'var(--bg-tertiary)',
        border: '1px solid var(--border-color)',
        borderRadius: 6,
        padding: '4px 0',
        minWidth: menuW,
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        fontFamily: 'var(--ui-font)',
      }}
    >
      {node && (
        <div style={{ padding: '4px 12px 6px', fontSize: 11, color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)', marginBottom: 4 }}>
          {node.name}
        </div>
      )}
      {items.map((item, i) => (
        <button
          key={i}
          onClick={item.action}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            width: '100%',
            padding: '5px 12px',
            background: 'transparent',
            border: 'none',
            color: item.danger ? 'var(--color-error)' : 'var(--text-primary)',
            fontSize: 13,
            cursor: 'pointer',
            textAlign: 'left',
            fontFamily: 'var(--ui-font)',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <span style={{ fontSize: 12 }}>{item.icon}</span>
          {item.label}
        </button>
      ))}
    </div>
  )
}
