import { describe, expect, it } from 'vitest'

import type { AgentVersionDTO } from '../api/types'
import { versions } from '../testing/v34-fixtures'
import { nextVersionCopy, versionLabel, versionTag } from './version-label'

describe('E2/E3 #82 版本号', () => {
  it('取 ordinal，不取 snapshotSeq', () => {
    expect(versions.map((version) => versionTag(version, versions)))
      .toEqual(['v1', 'v2'])
    expect(versions.map((version) => version.snapshotSeq)).toEqual([0, 4])
    expect(versionLabel(versions[1], versions)).toBe('v2 ★ · fixture-model')
  })

  it('服务端还没带 ordinal 时按 id 次序补出同一个序号', () => {
    const legacy: AgentVersionDTO[] = versions.map(({ ordinal: _, ...rest }) =>
      rest
    )

    expect(legacy.map((version) => versionTag(version, legacy)))
      .toEqual(['v1', 'v2'])
    // 没有同伴表可依（独立 DTO、老服务端）时不编号——退到 v1，绝不显示水位。
    expect(versionTag(legacy[1])).toBe('v1')
  })

  it('保存后将成为 v(N+1)', () => {
    expect(nextVersionCopy(0)).toBe('保存后将成为 v1')
    expect(nextVersionCopy(2)).toBe('保存后将成为 v3')
  })
})
