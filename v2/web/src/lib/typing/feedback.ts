import { type Stroke, TypingAudio } from './audio'

export type Preferences = { enabled: boolean; volume: number }

export function attachFeedback(
  editor: HTMLTextAreaElement,
  audio: TypingAudio,
  preferences: () => Preferences,
) {
  const parent = editor.parentElement!
  const workspace = editor.closest('fieldset')
  parent.classList.add('typing-preview-editor')
  workspace?.classList.add('typing-preview-workspace')
  editor.classList.add('typing-preview-textarea')
  const mirror = document.createElement('div')
  mirror.className = 'typing-caret-mirror'
  mirror.setAttribute('aria-hidden', 'true')
  const overlay = document.createElement('div')
  overlay.className = 'typing-caret-overlay'
  overlay.setAttribute('aria-hidden', 'true')
  const caret = document.createElement('div')
  caret.className = 'fancy-caret'
  caret.hidden = true
  caret.append(document.createElement('span'))
  overlay.append(caret)
  parent.append(mirror, overlay)
  let composing = false
  let compositionValue = ''
  let previousValue = editor.value
  let frame = 0
  let pulse: Animation | undefined
  let positioned = false
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')

  // Keep the real textarea for selection, undo, keyboard navigation and IME.
  // This hidden mirror measures only the decorative caret; it never renders user HTML.
  function position() {
    const selected = editor.selectionStart !== editor.selectionEnd
    const custom = !composing
    editor.classList.toggle('custom-caret', custom)
    const visible = document.activeElement === editor && !selected &&
      custom && !document.hidden
    if (!visible) {
      caret.hidden = true
      positioned = false
      return
    }
    const style = getComputedStyle(editor)
    for (
      const property of [
        'fontFamily',
        'fontSize',
        'fontWeight',
        'fontStyle',
        'lineHeight',
        'letterSpacing',
        'wordSpacing',
        'textIndent',
        'textTransform',
        'paddingTop',
        'paddingRight',
        'paddingBottom',
        'paddingLeft',
        'tabSize',
        'wordBreak',
        'overflowWrap',
        'direction',
      ] as const
    ) mirror.style[property] = style[property]
    mirror.style.width = `${editor.clientWidth}px`
    const marker = document.createElement('span')
    marker.textContent = '\u200b'
    mirror.replaceChildren(
      document.createTextNode(editor.value.slice(0, editor.selectionStart)),
      marker,
      document.createTextNode(
        editor.value.slice(editor.selectionStart) || '\u200b',
      ),
    )
    const rect = marker.getBoundingClientRect()
    const base = mirror.getBoundingClientRect()
    const x = rect.left - base.left - editor.scrollLeft
    const y = rect.top - base.top - editor.scrollTop
    const height = 3
    // Native scrolling keeps the glyph visible, not the decoration below it.
    // Clamp the underline inside the viewport when the final glyph touches its edge.
    const top = Math.min(y + rect.height - 1, editor.clientHeight - height)
    caret.hidden = top < 0 || y >= editor.clientHeight || x < 0 ||
      x > editor.clientWidth
    caret.style.transition = !positioned || reducedMotion.matches ? 'none' : ''
    overlay.style.left = `${editor.offsetLeft + editor.clientLeft}px`
    overlay.style.top = `${editor.offsetTop + editor.clientTop}px`
    overlay.style.width = `${editor.clientWidth}px`
    overlay.style.height = `${editor.clientHeight}px`
    caret.style.transform = `translate3d(${x}px, ${top}px, 0)`
    caret.style.height = `${height}px`
    positioned = true
  }
  function schedule() {
    cancelAnimationFrame(frame)
    frame = requestAnimationFrame(position)
  }
  function feedback(stroke: Stroke) {
    audio.play(stroke)
    if (!reducedMotion.matches) {
      pulse?.cancel()
      const ink = caret.firstElementChild!
      pulse = ink.animate([
        {
          filter: 'brightness(1.8)',
          scale: '1.4 1',
        },
        { filter: 'brightness(1)', scale: '1 1' },
      ], { duration: 180, easing: 'ease-out' })
    }
  }
  function input(event: Event) {
    const e = event as InputEvent
    const changed = editor.value !== previousValue
    previousValue = editor.value
    if (changed && !composing && !e.isComposing) {
      const type = e.inputType ?? ''
      if (!type.startsWith('history')) {
        feedback(
          type.startsWith('delete')
            ? 'delete'
            : type === 'insertLineBreak'
            ? 'enter'
            : /Paste|Drop|Replacement/.test(type) || (e.data?.length ?? 0) > 2
            ? 'paste'
            : 'type',
        )
      }
    }
    schedule()
  }
  function compositionStart() {
    composing = true
    compositionValue = editor.value
    position()
  }
  function compositionEnd(e: Event) {
    composing = false
    if ((e as CompositionEvent).data && editor.value !== compositionValue) {
      feedback('type')
    }
    previousValue = editor.value
    schedule()
  }
  function wake() {
    if (preferences().enabled) void audio.unlock(preferences().volume)
  }
  function focus() {
    schedule()
  }
  function blur() {
    caret.hidden = true
    positioned = false
  }
  function visibility() {
    if (document.hidden) audio.stop()
    schedule()
  }
  const listeners: [string, EventListener][] = [
    ['input', input],
    ['compositionstart', compositionStart],
    ['compositionend', compositionEnd],
    ['pointerdown', wake],
    ['keydown', wake],
    ['focus', focus],
    ['blur', blur],
    ['keyup', schedule],
    ['click', schedule],
    ['scroll', schedule],
    ['select', schedule],
  ]
  for (const [event, listener] of listeners) {
    editor.addEventListener(event, listener)
  }
  document.addEventListener('selectionchange', schedule)
  document.addEventListener('visibilitychange', visibility)
  const observer = new ResizeObserver(schedule)
  observer.observe(editor)
  void document.fonts.ready.then(schedule)
  schedule()
  return () => {
    for (const [event, listener] of listeners) {
      editor.removeEventListener(event, listener)
    }
    document.removeEventListener('selectionchange', schedule)
    document.removeEventListener('visibilitychange', visibility)
    observer.disconnect()
    cancelAnimationFrame(frame)
    pulse?.cancel()
    mirror.remove()
    overlay.remove()
    editor.classList.remove('typing-preview-textarea', 'custom-caret')
    parent.classList.remove('typing-preview-editor')
    workspace?.classList.remove('typing-preview-workspace')
  }
}
