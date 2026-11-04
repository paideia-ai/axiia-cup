// Shared plumbing for the scripts in bin/.

import type { Backend } from './backend/backend.ts'
import { HttpBackend } from './backend/http.ts'
import { MockBackend } from './backend/mock.ts'

// --mock <file> selects the mock server; otherwise AXIIA_BASE_URL (+
// AXIIA_TOKEN or GitHub OIDC) selects the real one.
export async function openBackend(
  mock: string | undefined,
  opts: { create?: boolean; tick?: boolean; maxInFlight?: number } = {},
): Promise<Backend> {
  return mock ? await MockBackend.open(mock, opts) : HttpBackend.fromEnv(opts.maxInFlight)
}

export function die(message: string): never {
  console.error(message)
  Deno.exit(2)
}

export async function writeJSON(path: string, value: unknown) {
  await Deno.writeTextFile(path, JSON.stringify(value, null, 2) + '\n')
}

export async function readJSON<T>(path: string, fallback?: T): Promise<T> {
  try {
    return JSON.parse(await Deno.readTextFile(path)) as T
  } catch (error) {
    if (fallback !== undefined && error instanceof Deno.errors.NotFound) {
      return fallback
    }
    throw error
  }
}
