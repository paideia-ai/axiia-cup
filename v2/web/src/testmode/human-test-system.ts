/** One result/evidence workflow; product credentials stay in the product. */
export const HUMAN_TEST_SYSTEM_URL = 'https://axiia-human-test-demo.vercel.app'
export function humanTestStepUrl(id: string): string {
  return `${HUMAN_TEST_SYSTEM_URL}/#${encodeURIComponent(id)}`
}
