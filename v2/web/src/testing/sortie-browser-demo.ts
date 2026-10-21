import { http } from 'msw'
import { setupWorker } from 'msw/browser'
import { sortieDemoAPI } from './sortie-demo-api'

export async function installSortieDemo() {
  const worker = setupWorker(
    http.all(
      '/v1/*',
      ({ request }) =>
        sortieDemoAPI(request, new URL(request.url).pathname.slice(3)),
    ),
  )
  await worker.start({ quiet: true, onUnhandledRequest: 'bypass' })
}
