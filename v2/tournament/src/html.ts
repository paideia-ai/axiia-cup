// Standalone HTML: the viz template with the report data embedded, so the
// file opens from file:// with no build step and no fetch.

import type { ScenarioReport } from './report.ts'

const PLACEHOLDER = '/*REPORT_DATA*/null'

export async function renderHTML(reports: ScenarioReport[]): Promise<string> {
  const template = await Deno.readTextFile(
    new URL('../viz/index.html', import.meta.url),
  )
  if (!template.includes(PLACEHOLDER)) {
    throw new Error('viz/index.html lost its data placeholder')
  }
  // `<` escaped so no string in the data can close the script element.
  const json = JSON.stringify(reports).replaceAll('<', '\\u003c')
  return template.replace(PLACEHOLDER, () => json)
}
