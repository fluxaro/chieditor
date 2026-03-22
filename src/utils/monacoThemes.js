// Monaco editor theme definitions matching our app themes

export const MONACO_THEMES = {
  dark: 'chiditor-dark',
  light: 'chiditor-light',
  dracula: 'chiditor-dracula',
  monokai: 'chiditor-monokai',
  nord: 'chiditor-nord',
  solarized: 'chiditor-solarized',
}

export function defineMonacoThemes(monaco) {
  // Dark (GitHub Dark)
  monaco.editor.defineTheme('chiditor-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '8b949e', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'ff7b72' },
      { token: 'string', foreground: 'a5d6ff' },
      { token: 'number', foreground: '79c0ff' },
      { token: 'type', foreground: 'ffa657' },
      { token: 'function', foreground: 'd2a8ff' },
      { token: 'variable', foreground: 'e6edf3' },
      { token: 'operator', foreground: 'ff7b72' },
      { token: 'tag', foreground: '7ee787' },
      { token: 'attribute.name', foreground: 'ffa657' },
      { token: 'attribute.value', foreground: 'a5d6ff' },
    ],
    colors: {
      'editor.background': '#0f1117',
      'editor.foreground': '#e6edf3',
      'editor.lineHighlightBackground': '#161b22',
      'editor.selectionBackground': '#1f3a5f',
      'editor.inactiveSelectionBackground': '#1f3a5f80',
      'editorLineNumber.foreground': '#484f58',
      'editorLineNumber.activeForeground': '#8b949e',
      'editorCursor.foreground': '#58a6ff',
      'editorWhitespace.foreground': '#21262d',
      'editorIndentGuide.background': '#21262d',
      'editorIndentGuide.activeBackground': '#30363d',
      'editor.findMatchBackground': '#1f3a5f',
      'editor.findMatchHighlightBackground': '#1f3a5f80',
      'editorBracketMatch.background': '#1f3a5f',
      'editorBracketMatch.border': '#58a6ff',
      'scrollbarSlider.background': '#30363d80',
      'scrollbarSlider.hoverBackground': '#484f58',
      'scrollbarSlider.activeBackground': '#58a6ff',
    },
  })

  // Light (GitHub Light)
  monaco.editor.defineTheme('chiditor-light', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6e7781', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'cf222e' },
      { token: 'string', foreground: '0a3069' },
      { token: 'number', foreground: '0550ae' },
      { token: 'type', foreground: '953800' },
      { token: 'function', foreground: '8250df' },
      { token: 'variable', foreground: '1f2328' },
      { token: 'operator', foreground: 'cf222e' },
      { token: 'tag', foreground: '116329' },
      { token: 'attribute.name', foreground: '953800' },
      { token: 'attribute.value', foreground: '0a3069' },
    ],
    colors: {
      'editor.background': '#ffffff',
      'editor.foreground': '#1f2328',
      'editor.lineHighlightBackground': '#f6f8fa',
      'editor.selectionBackground': '#ddf4ff',
      'editorLineNumber.foreground': '#9198a1',
      'editorLineNumber.activeForeground': '#656d76',
      'editorCursor.foreground': '#0969da',
      'scrollbarSlider.background': '#d0d7de80',
    },
  })

  // Dracula
  monaco.editor.defineTheme('chiditor-dracula', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6272a4', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'ff79c6' },
      { token: 'string', foreground: 'f1fa8c' },
      { token: 'number', foreground: 'bd93f9' },
      { token: 'type', foreground: '8be9fd' },
      { token: 'function', foreground: '50fa7b' },
      { token: 'variable', foreground: 'f8f8f2' },
      { token: 'operator', foreground: 'ff79c6' },
      { token: 'tag', foreground: 'ff79c6' },
    ],
    colors: {
      'editor.background': '#282a36',
      'editor.foreground': '#f8f8f2',
      'editor.lineHighlightBackground': '#44475a40',
      'editor.selectionBackground': '#44475a',
      'editorLineNumber.foreground': '#6272a4',
      'editorCursor.foreground': '#f8f8f2',
      'scrollbarSlider.background': '#44475a80',
    },
  })

  // Monokai
  monaco.editor.defineTheme('chiditor-monokai', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '75715e', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'f92672' },
      { token: 'string', foreground: 'e6db74' },
      { token: 'number', foreground: 'ae81ff' },
      { token: 'type', foreground: '66d9e8' },
      { token: 'function', foreground: 'a6e22e' },
      { token: 'variable', foreground: 'f8f8f2' },
      { token: 'operator', foreground: 'f92672' },
      { token: 'tag', foreground: 'f92672' },
    ],
    colors: {
      'editor.background': '#272822',
      'editor.foreground': '#f8f8f2',
      'editor.lineHighlightBackground': '#3e3d3240',
      'editor.selectionBackground': '#49483e',
      'editorLineNumber.foreground': '#75715e',
      'editorCursor.foreground': '#f8f8f0',
      'scrollbarSlider.background': '#49483e80',
    },
  })

  // Nord
  monaco.editor.defineTheme('chiditor-nord', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '4c566a', fontStyle: 'italic' },
      { token: 'keyword', foreground: '81a1c1' },
      { token: 'string', foreground: 'a3be8c' },
      { token: 'number', foreground: 'b48ead' },
      { token: 'type', foreground: '8fbcbb' },
      { token: 'function', foreground: '88c0d0' },
      { token: 'variable', foreground: 'eceff4' },
      { token: 'operator', foreground: '81a1c1' },
      { token: 'tag', foreground: 'bf616a' },
    ],
    colors: {
      'editor.background': '#2e3440',
      'editor.foreground': '#eceff4',
      'editor.lineHighlightBackground': '#3b425240',
      'editor.selectionBackground': '#434c5e',
      'editorLineNumber.foreground': '#4c566a',
      'editorCursor.foreground': '#88c0d0',
      'scrollbarSlider.background': '#3b425280',
    },
  })

  // Solarized Dark
  monaco.editor.defineTheme('chiditor-solarized', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '586e75', fontStyle: 'italic' },
      { token: 'keyword', foreground: '859900' },
      { token: 'string', foreground: '2aa198' },
      { token: 'number', foreground: 'd33682' },
      { token: 'type', foreground: 'b58900' },
      { token: 'function', foreground: '268bd2' },
      { token: 'variable', foreground: '839496' },
      { token: 'operator', foreground: '859900' },
      { token: 'tag', foreground: '268bd2' },
    ],
    colors: {
      'editor.background': '#002b36',
      'editor.foreground': '#839496',
      'editor.lineHighlightBackground': '#07364240',
      'editor.selectionBackground': '#094555',
      'editorLineNumber.foreground': '#586e75',
      'editorCursor.foreground': '#839496',
      'scrollbarSlider.background': '#09455580',
    },
  })
}
