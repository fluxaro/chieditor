import { useEffect, useRef, useState, useCallback } from 'react'
import useStore from '../store/useStore'
import { useBreakpoint } from '../hooks/useBreakpoint'

// ─── Binary file extensions that need blob URLs ────────────────────────────
const BINARY_EXTS = new Set(['png','jpg','jpeg','gif','webp','ico','bmp','avif','pdf','mp4','webm','ogg','mp3','wav','woff','woff2','ttf','otf','eot'])
const IMAGE_EXTS  = new Set(['png','jpg','jpeg','gif','webp','ico','bmp','avif','svg'])

function getExt(src) {
  return (src.split('.').pop().split('?')[0] || '').toLowerCase()
}

// ─── Read a file handle as text ────────────────────────────────────────────
async function readText(handle) {
  const file = await handle.getFile()
  return file.text()
}

// ─── Read a file handle as a blob URL ─────────────────────────────────────
async function readBlobURL(handle) {
  const file = await handle.getFile()
  return URL.createObjectURL(file)
}

// ─── Read a file handle as base64 data URI ────────────────────────────────
async function readDataURI(handle) {
  const file = await handle.getFile()
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(r.result)
    r.onerror = rej
    r.readAsDataURL(file)
  })
}

// ─── Resolve a src string against the HTML file's directory ───────────────
function resolvePath(src, htmlPath) {
  if (!src || src.startsWith('http') || src.startsWith('data:') || src.startsWith('blob:') || src.startsWith('//')) return null
  src = src.replace(/^\.\//, '')
  const dir = htmlPath.includes('/') ? htmlPath.split('/').slice(0, -1).join('/') : ''
  if (src.startsWith('../')) {
    const parts = dir.split('/').filter(Boolean)
    let s = src
    while (s.startsWith('../')) { parts.pop(); s = s.slice(3) }
    return [...parts, s].join('/')
  }
  return dir ? `${dir}/${src}` : src
}

// ─── Build the full virtual document ──────────────────────────────────────
async function buildVirtualDoc(tab, fileRegistry, imageDataMap) {
  if (!tab) return ''
  let html = tab.content
  const htmlPath = tab.path || tab.name || ''
  const blobsToRevoke = []

  // Helper: resolve src → data URI or blob URL from registry
  async function resolveAsset(src) {
    if (!src || src.startsWith('http') || src.startsWith('data:') || src.startsWith('blob:') || src.startsWith('//')) return null
    const ext = getExt(src)
    const resolved = resolvePath(src, htmlPath)
    const bare = src.split('/').pop()

    // Try registry by resolved path, then bare name, then imageDataMap fallback
    const handle = (resolved && fileRegistry[resolved]) || fileRegistry[bare] || fileRegistry[src]

    if (handle) {
      if (BINARY_EXTS.has(ext)) {
        if (IMAGE_EXTS.has(ext) || ext === 'svg') {
          return await readDataURI(handle)
        }
        const burl = await readBlobURL(handle)
        blobsToRevoke.push(burl)
        return burl
      }
      // text asset — return content as data URI
      const text = await readText(handle)
      const mime = ext === 'css' ? 'text/css' : ext === 'js' ? 'application/javascript' : 'text/plain'
      return `data:${mime};charset=utf-8,${encodeURIComponent(text)}`
    }

    // fallback: imageDataMap
    if (IMAGE_EXTS.has(ext) || ext === 'svg') {
      return imageDataMap[resolved] || imageDataMap[bare] || imageDataMap[src] || null
    }
    return null
  }

  // ── Inline <link rel="stylesheet" href="..."> ──────────────────────────
  const linkRe = /<link([^>]*)\shref=(["'])([^"']+\.css)\2([^>]*)>/gi
  const linkMatches = [...html.matchAll(linkRe)]
  for (const m of linkMatches) {
    const handle = fileRegistry[resolvePath(m[3], htmlPath)] || fileRegistry[m[3].split('/').pop()]
    if (handle) {
      const css = await readText(handle)
      html = html.replace(m[0], `<style>${css}</style>`)
    }
  }

  // ── Inline <script src="..."> (local only) ─────────────────────────────
  const scriptRe = /<script([^>]*)\ssrc=(["'])([^"']+)\2([^>]*)><\/script>/gi
  const scriptMatches = [...html.matchAll(scriptRe)]
  for (const m of scriptMatches) {
    const src = m[3]
    if (src.startsWith('http') || src.startsWith('//')) continue
    const resolved = resolvePath(src, htmlPath)
    const handle = fileRegistry[resolved] || fileRegistry[src.split('/').pop()]
    if (handle) {
      const js = await readText(handle)
      const attrs = (m[1] + m[4]).replace(/\ssrc=(["'])[^"']*\1/gi, '').trim()
      html = html.replace(m[0], `<script ${attrs}>${js}<\/script>`)
    }
  }

  // ── Rewrite src= attributes (img, video, audio, source, embed, iframe) ─
  html = await replaceAsync(html, /\bsrc=(["'])([^"'#][^"']*)\1/gi, async (match, q, src) => {
    const uri = await resolveAsset(src)
    return uri ? `src=${q}${uri}${q}` : match
  })

  // ── Rewrite CSS url() ──────────────────────────────────────────────────
  html = await replaceAsync(html, /url\((["']?)([^"')]+)\1\)/gi, async (match, q, src) => {
    const uri = await resolveAsset(src)
    return uri ? `url(${q}${uri}${q})` : match
  })

  // ── Rewrite <a href="...pdf"> and similar ─────────────────────────────
  html = await replaceAsync(html, /\bhref=(["'])([^"'#][^"']*\.pdf)\1/gi, async (match, q, src) => {
    const uri = await resolveAsset(src)
    return uri ? `href=${q}${uri}${q}` : match
  })

  // ── Inject Tailwind if not present ────────────────────────────────────
  if (!html.includes('tailwindcss.com') && !html.includes('tailwind')) {
    html = html.includes('</head>')
      ? html.replace('</head>', '  <script src="https://cdn.tailwindcss.com"><\/script>\n</head>')
      : '<script src="https://cdn.tailwindcss.com"><\/script>\n' + html
  }

  // ── Inject console bridge + local link interceptor ───────────────────
  const consoleBridge = `<script>(function(){
    const _l=console.log.bind(console),_w=console.warn.bind(console),_e=console.error.bind(console);
    function s(t,a){try{window.parent.postMessage({type:'console',level:t,msg:a.map(x=>{try{return typeof x==='object'?JSON.stringify(x):String(x)}catch(e){return String(x)}}).join(' ')},'*')}catch(e){}}
    console.log=(...a)=>{_l(...a);s('log',a)};
    console.warn=(...a)=>{_w(...a);s('warn',a)};
    console.error=(...a)=>{_e(...a);s('error',a)};
    window.onerror=(m,_,l)=>{s('error',[m+' (line '+l+')'])};
    // Intercept local HTML link clicks
    document.addEventListener('click',function(e){
      const a=e.target.closest('a[href]');
      if(!a)return;
      const href=a.getAttribute('href');
      if(!href||href.startsWith('http')||href.startsWith('//')||href.startsWith('#')||href.startsWith('mailto:'))return;
      if(/\\.html?($|\\?)/.test(href)){
        e.preventDefault();
        window.parent.postMessage({type:'navigate',href:href},'*');
      }
    },true);
  })();<\/script>`
  html = html.includes('<head>') ? html.replace('<head>', '<head>' + consoleBridge) : consoleBridge + html

  return { html, blobsToRevoke }
}

// ─── Async replace helper ──────────────────────────────────────────────────
async function replaceAsync(str, re, asyncFn) {
  const matches = []
  str.replace(re, (match, ...args) => { matches.push({ match, args }) })
  const results = await Promise.all(matches.map(({ match, args }) => asyncFn(match, ...args)))
  let i = 0
  return str.replace(re, () => results[i++])
}

// ══════════════════════════════════════════════════════════════════════════════

export default function Preview() {
  const { previewOpen, tabs, activeTabId, setPreviewOpen, imageDataMap, fileRegistry, flatFiles } = useStore()
  const { isMobile } = useBreakpoint()
  const iframeRef = useRef(null)
  const [pinnedTabId, setPinnedTabId] = useState(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [consoleOpen, setConsoleOpen] = useState(false)
  const [consoleLogs, setConsoleLogs] = useState([])
  const [width, setWidth] = useState(420)
  const [building, setBuilding] = useState(false)
  const isResizing = useRef(false)
  const prevBlobsRef = useRef([])

  const htmlTabs = tabs.filter(t => t.language === 'html')

  // ── Always prefer index.html; never follow the active editor tab ──────
  const indexTab = tabs.find(t => t.name.toLowerCase() === 'index.html')
  const currentPreviewTab = pinnedTabId
    ? tabs.find(t => t.id === pinnedTabId)
    : (indexTab || htmlTabs[0])

  // ── Resize ────────────────────────────────────────────────────────────
  const startResize = useCallback((e) => {
    isResizing.current = true
    const startX = e.clientX
    const startW = width
    const onMove = (ev) => {
      if (!isResizing.current) return
      setWidth(Math.max(240, Math.min(900, startW + (startX - ev.clientX))))
    }
    const onUp = () => {
      isResizing.current = false
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [width])

  // ── Refresh ───────────────────────────────────────────────────────────
  const refresh = useCallback(async (tabOverride) => {
    if (!iframeRef.current) return
    const tab = tabOverride || currentPreviewTab
    if (!tab) return
    setBuilding(true)
    try {
      prevBlobsRef.current.forEach(u => URL.revokeObjectURL(u))
      const { html, blobsToRevoke } = await buildVirtualDoc(tab, fileRegistry || {}, imageDataMap || {})
      prevBlobsRef.current = blobsToRevoke
      iframeRef.current.srcdoc = html
    } finally {
      setBuilding(false)
    }
  }, [currentPreviewTab, fileRegistry, imageDataMap])

  // ── Handle local link navigation from inside the iframe ───────────────
  useEffect(() => {
    async function handleMessage(e) {
      if (e.data?.type === 'console') {
        setConsoleLogs(prev => [...prev.slice(-99), { level: e.data.level, msg: e.data.msg, time: new Date().toLocaleTimeString() }])
      }
      // Local page navigation: find the target HTML in fileRegistry and render it
      if (e.data?.type === 'navigate' && e.data.href) {
        const href = e.data.href
        const bare = href.split('/').pop()
        const handle = (fileRegistry || {})[href] || (fileRegistry || {})[bare]
        if (handle) {
          const content = await handle.getFile().then(f => f.text())
          const fakeTab = { path: href, name: bare, content, language: 'html' }
          setBuilding(true)
          try {
            prevBlobsRef.current.forEach(u => URL.revokeObjectURL(u))
            const { html, blobsToRevoke } = await buildVirtualDoc(fakeTab, fileRegistry || {}, imageDataMap || {})
            prevBlobsRef.current = blobsToRevoke
            iframeRef.current.srcdoc = html
          } finally {
            setBuilding(false)
          }
        }
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [fileRegistry, imageDataMap])

  useEffect(() => {
    if (autoRefresh && previewOpen) refresh()
  }, [currentPreviewTab?.content, autoRefresh, previewOpen, refresh])

  useEffect(() => {
    if (autoRefresh && previewOpen && currentPreviewTab) refresh()
  }, [fileRegistry, imageDataMap])

  if (!previewOpen) return null

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', flexShrink: 0,
      width: isMobile ? '100%' : width,
      minWidth: isMobile ? 0 : 240,
      height: '100%',
      borderLeft: isMobile ? 'none' : '1px solid var(--border-color)',
      background: 'var(--bg-secondary)',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Resize handle — desktop only */}
      {!isMobile && (
        <div onMouseDown={startResize} style={{ position: 'absolute', left: 0, top: 0, width: 4, height: '100%', cursor: 'col-resize', zIndex: 10 }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--accent)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'} />
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', height: 36, flexShrink: 0, borderBottom: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2">
            <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
          </svg>
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-secondary)', fontFamily: 'var(--ui-font)' }}>Preview</span>
          {!isMobile && <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--ui-font)' }}>{width}px</span>}
          {building && <span style={{ fontSize: 10, color: 'var(--accent)', fontFamily: 'var(--ui-font)' }}>building…</span>}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {htmlTabs.length > 1 && (
            <select value={pinnedTabId || ''} onChange={e => setPinnedTabId(e.target.value || null)}
              style={{ background: 'var(--bg-active)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: 11, padding: '2px 4px', borderRadius: 3, cursor: 'pointer', outline: 'none', maxWidth: 100, fontFamily: 'var(--ui-font)' }}>
              <option value="">index.html</option>
              {htmlTabs.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          )}
          <PreviewBtn title={autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'} active={autoRefresh} onClick={() => setAutoRefresh(v => !v)}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>
          </PreviewBtn>
          <PreviewBtn title="Refresh" onClick={refresh}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16" /></svg>
          </PreviewBtn>
          <PreviewBtn title="Open in new tab" onClick={async () => {
            if (!currentPreviewTab) return
            const { html } = await buildVirtualDoc(currentPreviewTab, fileRegistry || {}, imageDataMap || {})
            const blob = new Blob([html], { type: 'text/html' })
            window.open(URL.createObjectURL(blob), '_blank')
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
          </PreviewBtn>
          <PreviewBtn title="Console" active={consoleOpen} onClick={() => setConsoleOpen(v => !v)}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" /></svg>
          </PreviewBtn>
          <PreviewBtn title="Close Preview" onClick={() => setPreviewOpen(false)}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </PreviewBtn>
        </div>
      </div>

      {/* iframe */}
      <div style={{ flex: 1, overflow: 'hidden', background: '#fff' }}>
        {currentPreviewTab ? (
          <iframe ref={iframeRef} title="Preview"
            sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
            style={{ width: '100%', height: '100%', border: 'none', display: 'block' }} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, background: 'var(--bg-primary)' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.2">
              <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
            </svg>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--ui-font)' }}>Open an HTML file to preview</p>
          </div>
        )}
      </div>

      {/* Console */}
      {consoleOpen && (
        <div style={{ height: 140, borderTop: '1px solid var(--border-color)', background: 'var(--bg-primary)', overflow: 'auto', fontFamily: 'var(--editor-font)', fontSize: 11 }}>
          <div style={{ padding: '4px 8px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--ui-font)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Console</span>
            <button onClick={() => setConsoleLogs([])} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 10, fontFamily: 'var(--ui-font)' }}>Clear</button>
          </div>
          {consoleLogs.length === 0
            ? <p style={{ padding: 8, color: 'var(--text-muted)', fontSize: 11 }}>No output</p>
            : consoleLogs.map((log, i) => (
              <div key={i} style={{ padding: '2px 8px', color: log.level === 'error' ? 'var(--color-error)' : log.level === 'warn' ? 'var(--color-warning)' : 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: 8 }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>{log.time}</span>
                <span>{log.msg}</span>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}

function PreviewBtn({ children, onClick, title, active }) {
  return (
    <button onClick={onClick} title={title}
      style={{ background: active ? 'var(--bg-active)' : 'transparent', border: 'none', color: active ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer', padding: 4, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)' }}
      onMouseLeave={e => { e.currentTarget.style.background = active ? 'var(--bg-active)' : 'transparent'; e.currentTarget.style.color = active ? 'var(--accent)' : 'var(--text-muted)' }}>
      {children}
    </button>
  )
}
