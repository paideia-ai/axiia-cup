import { useLayoutEffect } from 'react'
import type { RefObject } from 'react'

export function useAlignedJudgeNotes(
  root: RefObject<HTMLDivElement | null>,
  enabled: boolean,
  revision: unknown,
) {
  useLayoutEffect(() => {
    if (!enabled) return
    const grid = root.current?.querySelector<HTMLElement>(
      '.judge-transcript-aligned-grid',
    )
    if (!grid) return
    const dialogue = grid.querySelector<HTMLElement>(
      '.judge-transcript-dialogue-column',
    )!
    const notes = [...grid.querySelectorAll<HTMLElement>('[data-os-after]')]
    let active = true
    const align = () => {
      if (!active) return
      const top = grid.getBoundingClientRect().top
      let bottom = dialogue.getBoundingClientRect().bottom - top
      const chart = grid.querySelector<HTMLElement>('.judge-sidebar-trend')
      let previousBottom = chart
        ? chart.getBoundingClientRect().bottom - top + 20
        : 0
      for (const note of notes) {
        const speech = dialogue.querySelector<HTMLElement>(
          `[data-dialogue-seq="${Number(note.dataset.osAfter) - 1}"]`,
        )
        const card = note.querySelector<HTMLElement>(
          '[data-tm="FA.aside-card"]',
        )
        if (!card) continue
        const rect = speech?.getBoundingClientRect()
        const captionHeight = card.getBoundingClientRect().top -
          note.getBoundingClientRect().top
        // Preserve midpoint alignment whenever it fits. Long/debug text and
        // legacy missing anchors must never obscure the chart or another note.
        const midpoint = rect
          ? rect.top + rect.height / 2 - top - captionHeight
          : previousBottom
        const offset = Math.max(midpoint, previousBottom)
        note.style.top = `${offset}px`
        previousBottom = offset + note.getBoundingClientRect().height + 20
        bottom = Math.max(bottom, previousBottom)
      }
      grid.style.minHeight = `${Math.ceil(bottom)}px`
    }
    align()
    const observer = new ResizeObserver(align)
    observer.observe(dialogue)
    for (const note of notes) observer.observe(note)
    void document.fonts.ready.then(align)
    return () => {
      active = false
      observer.disconnect()
      grid.style.minHeight = ''
      for (const note of notes) note.style.top = ''
    }
  }, [root, enabled, revision])
}
