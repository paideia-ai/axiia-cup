import { describe, expect, it } from 'vitest'
import { NavigationType } from 'react-router-dom'
import { recordVisit, returnDestination } from './navigation-memory'

const empty = () => ({ visits: [], index: -1 })

describe('navigation history boundaries', () => {
  it('keeps separate positions for repeated URLs and traverses known entries', () => {
    const first = { key: 'a', url: '/matches', position: { y: 800 } }
    let memory = recordVisit(empty(), first, NavigationType.Pop)
    memory = recordVisit(
      memory,
      { key: 'b', url: '/matches/1' },
      NavigationType.Push,
    )
    memory = recordVisit(memory, {
      key: 'c',
      url: '/matches',
      position: { y: 200 },
    }, NavigationType.Push)
    memory = recordVisit(
      memory,
      { key: 'a', url: '/matches' },
      NavigationType.Pop,
    )
    expect(memory.index).toBe(0)
    expect(memory.visits.map((visit) => visit.position?.y)).toEqual([
      800,
      undefined,
      200,
    ])
  })

  it('discards the forward branch after a new navigation', () => {
    let memory = recordVisit(
      empty(),
      { key: 'a', url: '/matches' },
      NavigationType.Pop,
    )
    memory = recordVisit(
      memory,
      { key: 'b', url: '/matches/1' },
      NavigationType.Push,
    )
    memory = recordVisit(
      memory,
      { key: 'a', url: '/matches' },
      NavigationType.Pop,
    )
    memory = recordVisit(
      memory,
      { key: 'c', url: '/matches/2' },
      NavigationType.Push,
    )
    expect(memory.visits.map((visit) => visit.key)).toEqual(['a', 'c'])
  })

  it('does not invent predecessors for a direct navigation with a reused default key', () => {
    let memory = recordVisit(
      empty(),
      { key: 'default', url: '/matches/1' },
      NavigationType.Pop,
    )
    memory = recordVisit(
      memory,
      { key: 'default', url: '/matches' },
      NavigationType.Pop,
    )
    expect(memory.visits).toEqual([{ key: 'default', url: '/matches' }])
    expect(returnDestination(memory, '/my-agents', '我的智能体').delta)
      .toBeNull()
  })

  it('preserves a source across resolver redirects and query replacements', () => {
    let memory = recordVisit(
      empty(),
      { key: 'a', url: '/tournaments/42' },
      NavigationType.Pop,
    )
    memory = recordVisit(
      memory,
      { key: 'b', url: '/versions/12' },
      NavigationType.Push,
    )
    memory = recordVisit(
      memory,
      { key: 'c', url: '/agents/9' },
      NavigationType.Replace,
    )
    expect(returnDestination(memory, '/my-agents', '我的智能体')).toEqual({
      to: '/tournaments/42',
      label: '积分榜',
      delta: -1,
    })
  })

  it('uses a safe destination when the only predecessor is a login page', () => {
    let memory = recordVisit(
      empty(),
      { key: 'a', url: '/login' },
      NavigationType.Pop,
    )
    memory = recordVisit(
      memory,
      { key: 'b', url: '/agents/9' },
      NavigationType.Push,
    )
    expect(returnDestination(memory, '/my-agents', '我的智能体')).toEqual({
      to: '/my-agents',
      label: '我的智能体',
      delta: null,
    })
  })
})
