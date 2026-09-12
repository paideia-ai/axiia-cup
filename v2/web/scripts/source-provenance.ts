import { execFileSync } from 'node:child_process'
import { dirname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

// A historical capture revision is not the commit containing today's guide.
// Claim a current source commit only when its tracked bytes match clean HEAD.
export function verifiedSourceCommit(
  sourcePath: string | URL,
  sourceBytes: Uint8Array,
): string {
  const path = sourcePath instanceof URL
    ? fileURLToPath(sourcePath)
    : sourcePath
  const git = (cwd: string, args: string[]) =>
    execFileSync('git', ['-C', cwd, ...args], {
      stdio: ['ignore', 'pipe', 'pipe'],
    })
  let root: string
  try {
    root = git(dirname(path), ['rev-parse', '--show-toplevel']).toString()
      .trim()
    const name = relative(root, path)
    git(root, ['ls-files', '--error-unmatch', '--', name])
    if (git(root, ['status', '--porcelain=v1', '--', name]).length) {
      throw new Error('source has uncommitted changes')
    }
    const commit = git(root, ['rev-parse', '--verify', 'HEAD']).toString()
      .trim()
    if (!/^[0-9a-f]{40}$/.test(commit)) throw new Error('invalid source commit')
    const committedBytes = git(root, ['show', `${commit}:${name}`])
    if (!committedBytes.equals(sourceBytes)) {
      throw new Error('source bytes differ from commit')
    }
    return commit
  } catch {
    throw new Error(
      'Cannot verify sourceCommit: use a clean tracked source whose bytes match its Git HEAD; commit the guide before syncing.',
    )
  }
}
