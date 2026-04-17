import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const REPO_ROOT = path.resolve(import.meta.dir, '../../../..')

export function getRepoRootPath(...segments: string[]) {
  return path.join(REPO_ROOT, ...segments)
}

function normalizeRepoRelativeEnvPath(name: string) {
  const value = process.env[name]

  if (!value || path.isAbsolute(value)) {
    return
  }

  process.env[name] = getRepoRootPath(value)
}

export function loadRepoEnv() {
  const envPath = getRepoRootPath('.env')

  if (!existsSync(envPath)) {
    return
  }

  const content = readFileSync(envPath, 'utf8')

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) {
      continue
    }

    const separatorIndex = trimmed.indexOf('=')
    if (separatorIndex === -1) {
      continue
    }

    const key = trimmed.slice(0, separatorIndex).trim()
    if (!key || process.env[key] != null) {
      continue
    }

    process.env[key] = trimmed.slice(separatorIndex + 1)
  }

  normalizeRepoRelativeEnvPath('AXIIA_DB_PATH')
}
