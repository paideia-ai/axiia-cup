import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

import { trolleyProblem } from './trolley-problem'

describe('trolley overview images', () => {
  it('ships every referenced image file', async () => {
    const images = Object.values(trolleyProblem.overviewFactImages ?? {})
    expect(images).toHaveLength(3)

    for (const image of images) {
      const fileName = image.src.split('/').at(-1)
      expect(fileName).toBeTruthy()
      const bytes = await readFile(
        new URL(
          `../../public/scenario-assets/trolley-problem/${fileName}`,
          import.meta.url,
        ),
      )
      expect(bytes.byteLength, fileName).toBeGreaterThan(0)
    }
  })
})
