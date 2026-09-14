import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, it } from 'vitest'
import { verifiedSourceCommit } from '../../scripts/source-provenance'

it('source provenance verifies actual committed bytes and rejects dirty, untracked or mismatched input', () => {
  const directory = mkdtempSync(join(tmpdir(), 'axiia-guide-provenance-'))
  const git = (...args: string[]) =>
    execFileSync('git', ['-C', directory, ...args], {
      stdio: ['ignore', 'pipe', 'pipe'],
    }).toString().trim()
  try {
    git('init', '--quiet')
    const source = join(directory, 'guide.json')
    const original =
      '{"instruction":"保存后再开始","sourceRevision":"historical"}\n'
    writeFileSync(source, original)
    git('add', 'guide.json')
    git(
      '-c',
      'user.name=Fixture test',
      '-c',
      'user.email=fixture@example.invalid',
      '-c',
      'core.hooksPath=/dev/null',
      '-c',
      'commit.gpgSign=false',
      'commit',
      '--quiet',
      '-m',
      'Fixture guide',
    )
    expect(verifiedSourceCommit(source, readFileSync(source))).toBe(
      git('rev-parse', 'HEAD'),
    )
    expect(() => verifiedSourceCommit(source, new TextEncoder().encode('{}')))
      .toThrow(/Cannot verify sourceCommit/)

    writeFileSync(source, original + ' ')
    expect(() => verifiedSourceCommit(source, readFileSync(source)))
      .toThrow(/Cannot verify sourceCommit/)
    git('add', 'guide.json')
    expect(() => verifiedSourceCommit(source, readFileSync(source)))
      .toThrow(/Cannot verify sourceCommit/)

    const untracked = join(directory, 'untracked.json')
    writeFileSync(untracked, original)
    expect(() => verifiedSourceCommit(untracked, readFileSync(untracked)))
      .toThrow(/Cannot verify sourceCommit/)
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})
