import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

import { trolleyProblem } from './trolley-problem'

describe('trolley overview images', () => {
  it('reuses the three matching V1 image files byte for byte', async () => {
    const images = Object.values(trolleyProblem.overviewFactImages ?? {})
    expect(images).toHaveLength(3)

    for (const image of images) {
      const fileName = image.src.split('/').at(-1)
      expect(fileName).toBeTruthy()
      const [v1, v2] = await Promise.all([
        readFile(
          new URL(
            `../../../../apps/web/public/scenario-assets/trolley-problem/${fileName}`,
            import.meta.url,
          ),
        ),
        readFile(
          new URL(
            `../../public/scenario-assets/trolley-problem/${fileName}`,
            import.meta.url,
          ),
        ),
      ])
      expect(v2.equals(v1), fileName).toBe(true)
    }
  })
})
