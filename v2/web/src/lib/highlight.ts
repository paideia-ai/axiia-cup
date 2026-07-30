// A scenario script is the operator's primary artifact, so the admin viewer reads
// it as code rather than as a wall of text. That is worth a ~120 line scanner and
// not worth a syntax-highlighting dependency: the grammar we must survive is the
// one the scripts are written in — no JSX, no types, no modules.

export type TokenKind =
  | 'plain'
  | 'comment'
  | 'string'
  | 'number'
  | 'keyword'
  | 'punct'

export interface Token {
  text: string
  kind: TokenKind
}

const KEYWORDS = new Set([
  'async',
  'await',
  'break',
  'case',
  'catch',
  'class',
  'const',
  'continue',
  'default',
  'delete',
  'do',
  'else',
  'export',
  'extends',
  'false',
  'finally',
  'for',
  'function',
  'if',
  'import',
  'in',
  'instanceof',
  'let',
  'new',
  'null',
  'of',
  'return',
  'super',
  'switch',
  'this',
  'throw',
  'true',
  'try',
  'typeof',
  'undefined',
  'var',
  'void',
  'while',
  'yield',
])

const IDENT_START = /[A-Za-z_$]/
const IDENT_PART = /[A-Za-z0-9_$]/
const REGEX_PRECEDERS = new Set('(,=:[!&|?{};+-*%~^<>')

function quoted(source: string, start: number): number {
  const quote = source[start]
  let index = start + 1
  while (index < source.length) {
    const char = source[index]
    if (char === '\\') {
      index += 2
      continue
    }
    index += 1
    if (char === quote) break
  }
  return index
}

export function tokenize(source: string): Token[] {
  const tokens: Token[] = []
  const push = (text: string, kind: TokenKind) => {
    if (text) tokens.push({ text, kind })
  }
  let index = 0
  let lastSignificant = ''

  while (index < source.length) {
    const char = source[index]
    const next = source[index + 1]

    if (char === '/' && next === '/') {
      const end = source.indexOf('\n', index)
      const stop = end === -1 ? source.length : end
      push(source.slice(index, stop), 'comment')
      index = stop
      continue
    }
    if (char === '/' && next === '*') {
      const end = source.indexOf('*/', index + 2)
      const stop = end === -1 ? source.length : end + 2
      push(source.slice(index, stop), 'comment')
      index = stop
      continue
    }
    if (char === '"' || char === "'" || char === '`') {
      const stop = quoted(source, index)
      push(source.slice(index, stop), 'string')
      index = stop
      lastSignificant = char
      continue
    }
    // `/` is a regex literal only where a value may start; anywhere else it is
    // division. The preceding significant character decides, as it does in the
    // real grammar's lexer.
    if (char === '/' && REGEX_PRECEDERS.has(lastSignificant)) {
      let scan = index + 1
      let inClass = false
      while (scan < source.length) {
        const inner = source[scan]
        if (inner === '\\') {
          scan += 2
          continue
        }
        if (inner === '\n') break
        if (inner === '[') inClass = true
        else if (inner === ']') inClass = false
        else if (inner === '/' && !inClass) {
          scan += 1
          while (scan < source.length && IDENT_PART.test(source[scan])) {
            scan += 1
          }
          break
        }
        scan += 1
      }
      push(source.slice(index, scan), 'string')
      index = scan
      lastSignificant = '/'
      continue
    }
    if (/[0-9]/.test(char)) {
      let scan = index
      while (scan < source.length && /[0-9a-fA-FxX._]/.test(source[scan])) {
        scan += 1
      }
      push(source.slice(index, scan), 'number')
      index = scan
      lastSignificant = '0'
      continue
    }
    if (IDENT_START.test(char)) {
      let scan = index
      while (scan < source.length && IDENT_PART.test(source[scan])) scan += 1
      const word = source.slice(index, scan)
      push(word, KEYWORDS.has(word) ? 'keyword' : 'plain')
      index = scan
      lastSignificant = KEYWORDS.has(word) && word !== 'this' ? '=' : 'x'
      continue
    }

    push(char, /\s/.test(char) ? 'plain' : 'punct')
    index += 1
    if (!/\s/.test(char)) lastSignificant = char
  }

  return tokens
}

// Tokens span newlines (block comments, template literals), so the viewer folds
// them back into physical lines before rendering.
export function tokenizeLines(source: string): Token[][] {
  const lines: Token[][] = [[]]
  for (const token of tokenize(source)) {
    const parts = token.text.split('\n')
    parts.forEach((part, position) => {
      if (position > 0) lines.push([])
      if (part) lines[lines.length - 1].push({ text: part, kind: token.kind })
    })
  }
  return lines
}
