import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import { scenarioModule } from './index'
import { scenarioIntroCopies, sourceStrings } from './intro-copy'

const html = readFileSync(
  new URL('../../../../docs/competition/scenario-intro.html', import.meta.url),
  'utf8',
)

function normalize(value: string): string {
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

describe('scenario intro copy', () => {
  const starts = scenarioIntroCopies.map((copy) =>
    html.lastIndexOf(
      '<section',
      html.indexOf(`data-scenario="${copy.htmlID}"`),
    )
  )

  for (const [index, copy] of scenarioIntroCopies.entries()) {
    it(`${copy.htmlID}: preserves every visible HTML string verbatim`, () => {
      const end = index + 1 < starts.length
        ? starts[index + 1]
        : html.indexOf('</main>', starts[index])
      const panelText = normalize(html.slice(starts[index], end))
      const sourceText = normalize(sourceStrings(copy).join(' '))
      expect(sourceText).toBe(panelText)
    })
  }

  it('registers an intro for all five shipped scenarios', () => {
    for (
      const slotID of [
        'shangyang-court',
        'honnoji-decision',
        'trolley-problem',
        'fengyiting-real',
        'legal-harbor-murder-jury',
      ]
    ) {
      expect(scenarioModule(slotID)?.intro, slotID).toBeDefined()
    }
  })
})
