// ─── Language detection ────────────────────────────────────────────────────
const EXT_MAP = {
  js: 'javascript', jsx: 'javascript', mjs: 'javascript', cjs: 'javascript',
  ts: 'typescript', tsx: 'typescript',
  html: 'html', htm: 'html',
  css: 'css', scss: 'scss', sass: 'sass', less: 'less',
  json: 'json', jsonc: 'json',
  md: 'markdown', mdx: 'markdown',
  py: 'python',
  rs: 'rust',
  go: 'go',
  java: 'java',
  c: 'c', cpp: 'cpp', cc: 'cpp', h: 'c', hpp: 'cpp',
  cs: 'csharp',
  php: 'php',
  rb: 'ruby',
  sh: 'shell', bash: 'shell', zsh: 'shell',
  yaml: 'yaml', yml: 'yaml',
  toml: 'ini',
  xml: 'xml', svg: 'xml',
  sql: 'sql',
  graphql: 'graphql', gql: 'graphql',
  vue: 'html',
  svelte: 'html',
  txt: 'plaintext',
  env: 'plaintext',
  gitignore: 'plaintext',
  dockerfile: 'dockerfile',
}

export function getLanguage(filename) {
  const parts = filename.toLowerCase().split('.')
  if (parts.length === 1) {
    // no extension — check full name
    const name = parts[0]
    if (name === 'dockerfile') return 'dockerfile'
    if (name === 'makefile') return 'plaintext'
    return 'plaintext'
  }
  const ext = parts[parts.length - 1]
  return EXT_MAP[ext] || 'plaintext'
}

// ─── File icon colors ──────────────────────────────────────────────────────
export function getFileIconColor(filename) {
  const lang = getLanguage(filename)
  const colors = {
    javascript: '#f7df1e',
    typescript: '#3178c6',
    html: '#e34c26',
    css: '#264de4',
    scss: '#cc6699',
    json: '#cbcb41',
    markdown: '#519aba',
    python: '#3572A5',
    rust: '#dea584',
    go: '#00add8',
    java: '#b07219',
    cpp: '#f34b7d',
    c: '#555555',
    csharp: '#178600',
    php: '#4F5D95',
    ruby: '#701516',
    shell: '#89e051',
    yaml: '#cb171e',
    xml: '#e37933',
    sql: '#e38c00',
    graphql: '#e10098',
    dockerfile: '#384d54',
    vue: '#41b883',
    svelte: '#ff3e00',
  }
  return colors[lang] || '#8b949e'
}

// ─── Folder icon color ─────────────────────────────────────────────────────
export function getFolderColor(name) {
  const special = {
    src: '#58a6ff', source: '#58a6ff',
    components: '#e8a838', component: '#e8a838',
    pages: '#e8a838', views: '#e8a838',
    hooks: '#c586c0', utils: '#c586c0', helpers: '#c586c0',
    store: '#d19a66', stores: '#d19a66', state: '#d19a66',
    styles: '#264de4', css: '#264de4',
    assets: '#e8a838', images: '#e8a838', img: '#e8a838',
    public: '#89e051',
    node_modules: '#8b949e',
    dist: '#8b949e', build: '#8b949e', out: '#8b949e',
    '.git': '#f14e32',
    api: '#56b6c2', server: '#56b6c2',
    tests: '#a8cc8c', test: '#a8cc8c', __tests__: '#a8cc8c', spec: '#a8cc8c',
    config: '#e5c07b', configs: '#e5c07b',
    docs: '#519aba', documentation: '#519aba',
    scripts: '#f7df1e',
    types: '#3178c6',
  }
  return special[name.toLowerCase()] || '#dcb67a'
}

// ─── Build file tree from FileSystemDirectoryHandle ────────────────────────
const IGNORED = new Set(['.git', '.DS_Store', 'Thumbs.db', 'desktop.ini'])

export async function buildTree(dirHandle, path = '') {
  const children = []
  for await (const [name, handle] of dirHandle.entries()) {
    if (IGNORED.has(name)) continue
    const fullPath = path ? `${path}/${name}` : name
    if (handle.kind === 'directory') {
      const subChildren = await buildTree(handle, fullPath)
      children.push({
        id: fullPath,
        name,
        path: fullPath,
        kind: 'directory',
        handle,
        children: subChildren,
        expanded: false,
      })
    } else {
      children.push({
        id: fullPath,
        name,
        path: fullPath,
        kind: 'file',
        handle,
        language: getLanguage(name),
      })
    }
  }
  // Sort: folders first, then files, both alphabetically
  children.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === 'directory' ? -1 : 1
    return a.name.localeCompare(b.name)
  })
  return children
}

// ─── Flatten tree for search ───────────────────────────────────────────────
export function flattenTree(nodes, result = []) {
  for (const node of nodes) {
    if (node.kind === 'file') result.push(node)
    if (node.kind === 'directory' && node.children) {
      flattenTree(node.children, result)
    }
  }
  return result
}

// ─── Read file content ─────────────────────────────────────────────────────
export async function readFileContent(handle) {
  const file = await handle.getFile()
  return await file.text()
}

// ─── Write file content ────────────────────────────────────────────────────
export async function writeFileContent(handle, content) {
  const writable = await handle.createWritable()
  await writable.write(content)
  await writable.close()
}

// ─── Format bytes ─────────────────────────────────────────────────────────
export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ─── Build flat file registry: path → handle (all files) ─────────────────
export function buildFileRegistry(nodes, reg = {}) {
  for (const node of nodes) {
    if (node.kind === 'file') {
      reg[node.path] = node.handle
      reg[node.name] = node.handle // also index by bare filename
    } else if (node.kind === 'directory' && node.children) {
      buildFileRegistry(node.children, reg)
    }
  }
  return reg
}
const IMAGE_EXTS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'ico', 'bmp', 'avif'])

export function isImageFile(name) {
  const ext = name.split('.').pop().toLowerCase()
  return IMAGE_EXTS.has(ext)
}

// ─── Read image file as base64 data URI ────────────────────────────────────
export async function readImageAsDataURL(handle) {
  const file = await handle.getFile()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// ─── Scan tree and build imageDataMap { path: dataURI, name: dataURI } ─────
export async function buildImageDataMap(nodes, map = {}) {
  for (const node of nodes) {
    if (node.kind === 'file' && isImageFile(node.name)) {
      try {
        const dataUri = await readImageAsDataURL(node.handle)
        map[node.path] = dataUri
        map[node.name] = dataUri // also index by bare filename
      } catch { /* skip unreadable */ }
    } else if (node.kind === 'directory' && node.children) {
      await buildImageDataMap(node.children, map)
    }
  }
  return map
}
