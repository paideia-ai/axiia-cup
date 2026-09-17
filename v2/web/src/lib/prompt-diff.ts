export type PromptChange = {
  kind: 'same' | 'removed' | 'added'
  text: string
}

// Compare graphemes so Chinese text, emoji, and combining marks stay intact.
// Strip shared ends first; cap the LCS matrix for unusually large pasted drafts.
export function promptDiff(before: string, after: string): PromptChange[] {
  if (before === after) return before ? [{ kind: 'same', text: before }] : []
  const segmenter = new Intl.Segmenter('zh', { granularity: 'grapheme' })
  const a = Array.from(segmenter.segment(before), (part) => part.segment)
  const b = Array.from(segmenter.segment(after), (part) => part.segment)
  const changes: PromptChange[] = []
  function append(kind: PromptChange['kind'], text: string) {
    if (!text) return
    const last = changes.at(-1)
    if (last?.kind === kind) last.text += text
    else changes.push({ kind, text })
  }
  let start = 0
  while (start < a.length && start < b.length && a[start] === b[start]) start++
  let endA = a.length
  let endB = b.length
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) {
    endA--
    endB--
  }
  append('same', a.slice(0, start).join(''))
  const rows = endA - start
  const cols = endB - start
  if (!rows || !cols || rows * cols > 1_000_000) {
    append('removed', a.slice(start, endA).join(''))
    append('added', b.slice(start, endB).join(''))
  } else {
    const stride = cols + 1
    const matrix = new Uint32Array((rows + 1) * stride)
    for (let i = rows - 1; i >= 0; i--) {
      for (let j = cols - 1; j >= 0; j--) {
        matrix[i * stride + j] = a[start + i] === b[start + j]
          ? 1 + matrix[(i + 1) * stride + j + 1]
          : Math.max(matrix[(i + 1) * stride + j], matrix[i * stride + j + 1])
      }
    }
    let i = 0
    let j = 0
    while (i < rows || j < cols) {
      if (i < rows && j < cols && a[start + i] === b[start + j]) {
        append('same', a[start + i++])
        j++
      } else if (
        i < rows &&
        (j === cols ||
          matrix[(i + 1) * stride + j] >= matrix[i * stride + j + 1])
      ) {
        append('removed', a[start + i++])
      } else {
        append('added', b[start + j++])
      }
    }
  }
  append('same', a.slice(endA).join(''))
  return changes
}
