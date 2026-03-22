import { getLanguage, getFileIconColor, getFolderColor } from '../utils/fileUtils'

// File icon SVG paths by language
function FileIconSVG({ lang, color }) {
  const icons = {
    javascript: (
      <svg width="14" height="14" viewBox="0 0 24 24">
        <rect width="24" height="24" rx="3" fill={color} opacity="0.15" />
        <text x="4" y="17" fontSize="11" fontWeight="bold" fill={color} fontFamily="monospace">JS</text>
      </svg>
    ),
    typescript: (
      <svg width="14" height="14" viewBox="0 0 24 24">
        <rect width="24" height="24" rx="3" fill={color} opacity="0.15" />
        <text x="4" y="17" fontSize="11" fontWeight="bold" fill={color} fontFamily="monospace">TS</text>
      </svg>
    ),
    html: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M4 3l1.5 16.5L12 21l6.5-1.5L20 3H4z" fill={color} opacity="0.2" />
        <path d="M4 3l1.5 16.5L12 21l6.5-1.5L20 3H4z" stroke={color} strokeWidth="1.5" fill="none" />
        <path d="M8 7h8M7.5 11h9M9 15l3 1 3-1" stroke={color} strokeWidth="1.2" />
      </svg>
    ),
    css: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M4 3l1.5 16.5L12 21l6.5-1.5L20 3H4z" fill={color} opacity="0.2" />
        <path d="M4 3l1.5 16.5L12 21l6.5-1.5L20 3H4z" stroke={color} strokeWidth="1.5" fill="none" />
        <path d="M8 7h8M7.5 11h9M9 15l3 1 3-1" stroke={color} strokeWidth="1.2" />
      </svg>
    ),
    json: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="18" height="18" rx="2" stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.1" />
        <path d="M8 8c-1 0-2 .5-2 2v4c0 1.5 1 2 2 2M16 8c1 0 2 .5 2 2v4c0 1.5-1 2-2 2" stroke={color} strokeWidth="1.2" />
      </svg>
    ),
    markdown: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="4" width="20" height="16" rx="2" stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.1" />
        <path d="M6 15V9l3 3 3-3v6M18 15l-3-3M15 15l3-3" stroke={color} strokeWidth="1.5" />
      </svg>
    ),
    python: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M12 2C8 2 6 4 6 7v2h6v1H5c-2 0-3 1.5-3 4s1 4 3 4h2v-2c0-2 1-3 5-3s5 1 5 3v2h2c2 0 3-1.5 3-4s-1-4-3-4h-6V9h6V7c0-3-2-5-7-5z" fill={color} opacity="0.8" />
      </svg>
    ),
    default: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.1" />
        <polyline points="14 2 14 8 20 8" stroke={color} strokeWidth="1.5" />
      </svg>
    ),
  }
  return icons[lang] || icons.default
}

export function FileIcon({ name, size = 14 }) {
  const lang = getLanguage(name)
  const color = getFileIconColor(name)
  return <FileIconSVG lang={lang} color={color} size={size} />
}

export function FolderIcon({ name, expanded }) {
  const color = getFolderColor(name)
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      {expanded ? (
        <>
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
            fill={color} fillOpacity="0.25" stroke={color} strokeWidth="1.5" />
          <path d="M2 10h20" stroke={color} strokeWidth="1.2" />
        </>
      ) : (
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
          fill={color} fillOpacity="0.2" stroke={color} strokeWidth="1.5" />
      )}
    </svg>
  )
}
