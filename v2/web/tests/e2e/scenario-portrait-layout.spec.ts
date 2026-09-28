import { expect, test } from '@playwright/test'
import { agentPreviewScenarios } from '../../src/testing/scenario-agent-fixtures'

const portraitCounts: Record<string, number> = {
  'shangyang-court': 3,
  'honnoji-decision': 5,
  'trolley-problem': 3,
  'fengyiting-real': 3,
  'legal-harbor-murder-jury': 11,
}

// Include the two-column card, three-column jury and portrait breakpoints.
for (
  const width of [320, 375, 390, 430, 640, 768, 899, 900, 1024, 1280, 1440]
) {
  test(`${width}px: all five introductions keep portraits and text inside their cards`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.route('**/v1/**', (route) => {
      const path = new URL(route.request().url()).pathname
      if (path === '/v1/auth/me') {
        return route.fulfill({ status: 401, json: { error: 'unauthorized' } })
      }
      const scenario = agentPreviewScenarios.find((item) =>
        path === `/v1/scenarios/${item.summary.id}`
      )
      return route.fulfill({ json: scenario ?? {} })
    })

    for (const scenario of agentPreviewScenarios) {
      const id = scenario.summary.id
      await test.step(id, async () => {
        await page.goto(`/scenarios/${id}`)
        const portraits = page.locator('[data-role-portrait]')
        await expect(portraits).toHaveCount(portraitCounts[id])
        for (const portrait of await portraits.all()) {
          await portrait.scrollIntoViewIfNeeded()
          await expect.poll(() =>
            portrait.evaluate((img: HTMLImageElement) =>
              img.complete && img.naturalWidth > 0
            )
          ).toBe(true)
          await expect(portrait).toHaveAttribute('alt', '')
          await expect(portrait).toHaveAttribute('src', /-neutral-.*\.webp$/)
        }

        const problems = await page.evaluate((width) => {
          const problems: string[] = []
          const root = document.querySelector('[data-tm="DA.page"]')!
          if (document.documentElement.scrollWidth > innerWidth) {
            problems.push('Page overflows horizontally')
          }
          for (
            const img of root.querySelectorAll<HTMLImageElement>(
              '[data-role-portrait]',
            )
          ) {
            const header = img.parentElement!
            const text = img.nextElementSibling as HTMLElement
            const primary = header.dataset.scenarioPortrait === 'primary'
            const expectedSize = width >= 900 ? 80 : primary ? 72 : 48
            const imageBox = img.getBoundingClientRect()
            const textBox = text.getBoundingClientRect()
            const headerBox = header.getBoundingClientRect()
            const name = img.dataset.rolePortrait
            if (
              imageBox.width !== expectedSize ||
              imageBox.height !== expectedSize
            ) {
              problems.push(`${name}: expected ${expectedSize}px portrait`)
            }
            if (
              imageBox.right > textBox.left ||
              textBox.right > headerBox.right + 1
            ) {
              problems.push(
                `${name}: portrait overlaps or squeezes text outside header`,
              )
            }
            // Names and short identity labels must not acquire an extra line
            // because the portrait takes width. Long juror professions may wrap.
            for (const child of text.children) {
              if (!primary && !/^H[1-6]$/.test(child.tagName)) continue
              const withPortrait = child.getBoundingClientRect().height
              img.style.display = 'none'
              const withoutPortrait = child.getBoundingClientRect().height
              img.style.removeProperty('display')
              if (withPortrait > withoutPortrait + 1) {
                problems.push(
                  `${name}: added line in “${child.textContent?.trim()}”`,
                )
              }
            }
          }
          // Check rendered text, including wrapped descriptions, against its
          // own container rather than just checking the document's scrollWidth.
          for (
            const el of root.querySelectorAll<HTMLElement>('h1,h2,h3,h4,p,li')
          ) {
            if (!el.getClientRects().length) continue
            if (el.scrollWidth > el.clientWidth + 1) {
              problems.push(
                `Text container overflow: ${
                  el.textContent?.trim().slice(0, 50)
                }`,
              )
            }
            const box = el.getBoundingClientRect()
            const range = document.createRange()
            range.selectNodeContents(el)
            if (
              [...range.getClientRects()].some((rect) =>
                rect.left < box.left - 1 || rect.right > box.right + 1
              )
            ) {
              problems.push(
                `Text escapes its container: ${
                  el.textContent?.trim().slice(0, 50)
                }`,
              )
            }
          }
          return problems
        }, width)
        expect(problems, `${id} at ${width}px`).toEqual([])
        expect(errors).toEqual([])
      })
    }
  })
}
