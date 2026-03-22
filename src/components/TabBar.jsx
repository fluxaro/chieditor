import { useRef } from 'react'
import useStore from '../store/useStore'
import { FileIcon } from './FileIcon'

export default function TabBar() {
  const { tabs, activeTabId, setActiveTab, closeTab } = useStore()
  const scrollRef = useRef(null)

  if (tabs.length === 0) return null

  function handleWheel(e) {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft += e.deltaY
    }
  }

  return (
    <div
      ref={scrollRef}
      onWheel={handleWheel}
      className="flex items-end overflow-x-auto shrink-0"
      style={{
        height: 'var(--tab-height)',
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-color)',
        scrollbarWidth: 'none',
      }}
    >
      {tabs.map(tab => (
        <Tab key={tab.id} tab={tab} isActive={tab.id === activeTabId} setActiveTab={setActiveTab} closeTab={closeTab} />
      ))}
    </div>
  )
}

function Tab({ tab, isActive, setActiveTab, closeTab }) {
  function handleClose(e) {
    e.stopPropagation()
    closeTab(tab.id)
  }

  function handleMiddleClick(e) {
    if (e.button === 1) closeTab(tab.id)
  }

  return (
    <div
      onClick={() => setActiveTab(tab.id)}
      onMouseDown={handleMiddleClick}
      className="flex items-center gap-1.5 px-3 shrink-0 cursor-pointer select-none group"
      style={{
        height: '100%',
        maxWidth: 180,
        minWidth: 80,
        background: isActive ? 'var(--tab-active-bg)' : 'var(--tab-inactive-bg)',
        borderRight: '1px solid var(--border-color)',
        borderTop: isActive ? `2px solid var(--tab-border)` : '2px solid transparent',
        color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
        fontSize: 12,
        fontFamily: 'var(--ui-font)',
        position: 'relative',
      }}
      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg-hover)' }}
      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'var(--tab-inactive-bg)' }}
    >
      <span className="shrink-0 flex items-center">
        <FileIcon name={tab.name} />
      </span>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
        {tab.name}
      </span>
      {/* Unsaved dot */}
      {tab.unsaved && (
        <span
          style={{
            width: 7, height: 7,
            borderRadius: '50%',
            background: 'var(--color-warning)',
            flexShrink: 0,
          }}
          title="Unsaved changes"
        />
      )}
      {/* Close button */}
      <button
        onClick={handleClose}
        className="flex items-center justify-center rounded shrink-0"
        style={{
          width: 16, height: 16,
          background: 'transparent',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          opacity: 0,
          transition: 'opacity 0.1s',
          padding: 0,
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-active)'; e.currentTarget.style.color = 'var(--text-primary)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' }}
        ref={el => {
          if (el) {
            el.closest('[class*="group"]')?.addEventListener('mouseenter', () => el.style.opacity = '1')
            el.closest('[class*="group"]')?.addEventListener('mouseleave', () => el.style.opacity = '0')
          }
        }}
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  )
}
