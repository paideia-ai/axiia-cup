/* 清单：这一页的规格行有没有部件对上（「无部件」就是缺口，放最前面）、哪些旅程步骤落在这一页、这一页有哪些部件。 */
import { useEffect, useMemo, useRef, useState } from 'react'

import {
  clausesForPages,
  JOURNEYS,
  MAPPED_BY,
  pagesOfPath,
  panelPages,
  routeMatches,
  type Step,
} from './data'
import type { MarkerRect } from './dom'
import type { GuidedTarget } from './guided'
import { describeMarker } from './markers'
import { STEP_HINTS } from './registry/index'
import { PAGE_LABELS } from './types'
import { ClauseRow, ImplChip } from './ui'

export function stepRoute(step: Step): string | null {
  return STEP_HINTS[step.id]?.route ?? step.route
}

export function Panel(
  { pathname, rects, onFocusMarker, onOpenGuided, onClose }: {
    pathname: string
    rects: MarkerRect[]
    onFocusMarker: (id: string) => void
    onOpenGuided: (t: GuidedTarget) => void
    onClose: () => void
  },
) {
  const titlePages = useMemo(() => pagesOfPath(pathname), [pathname])
  const pages = useMemo(() => panelPages(pathname), [pathname])
  const clauses = useMemo(() => clausesForPages(pages), [pages])
  const gapCount = clauses.filter((c) => !MAPPED_BY.has(c.id)).length
  const mapped = clauses.length - gapCount
  // 有缺口就先看缺口——那是 Yihan 要看的东西
  const [filter, setFilter] = useState<'all' | 'gap'>(() =>
    gapCount > 0 ? 'gap' : 'all'
  )
  useEffect(() => {
    setFilter(gapCount > 0 ? 'gap' : 'all')
  }, [pathname, gapCount])
  const clauseSec = useRef<HTMLDivElement>(null)

  // 部件按页面顺序（rects 就是文档序），未映射的挪到最后
  const markers = useMemo(() => {
    const m = new Map<string, { n: number; inView: boolean }>()
    for (const r of rects) {
      const cur = m.get(r.id) ?? { n: 0, inView: false }
      m.set(r.id, { n: cur.n + 1, inView: cur.inView || r.inView })
    }
    const rows = [...m.entries()].map(([id, x]) => ({
      id,
      ...x,
      d: describeMarker(id),
    }))
    return [
      ...rows.filter((r) => r.d.kind !== 'gap'),
      ...rows.filter((r) => r.d.kind === 'gap'),
    ]
  }, [rects])
  const outOfView = markers.filter((r) => !r.inView).length

  const journeysHere = useMemo(() =>
    JOURNEYS.map((j) => ({
      j,
      steps: j.steps.filter((s) => {
        const r = stepRoute(s)
        return r ? routeMatches(r, pathname) : false
      }),
    })).filter((x) => x.steps.length > 0), [pathname])

  const shown = filter === 'gap'
    ? clauses.filter((c) => !MAPPED_BY.has(c.id))
    : clauses
  const title = titlePages.length
    ? titlePages.map((p) => `${p} · ${PAGE_LABELS[p]}`).join(' + ')
    : '这个路由不在页面表里'

  return (
    <div className='tm-surface tm-drawer' role='dialog' aria-label='清单'>
      <div className='tm-h'>
        <div className='tm-h-title'>
          <div>{title}</div>
          <div className='tm-counts'>
            <span>
              条款 <b>{clauses.length}</b>
            </span>
            <span>
              已对应 <b>{mapped}</b>
            </span>
            <button
              type='button'
              className='tm-counts-gap'
              title='没有部件对应的条款——规格与产品的缺口'
              onClick={() => {
                setFilter('gap')
                clauseSec.current?.scrollIntoView({ block: 'start' })
              }}
            >
              缺 <b>{gapCount}</b>
            </button>
            <span>
              旅程 <b>{journeysHere.length}</b>
            </span>
            <span>
              部件 <b>{markers.length}</b>
            </span>
          </div>
        </div>
        <button
          type='button'
          className='tm-x'
          aria-label='关闭清单'
          onClick={onClose}
        >
          ×
        </button>
      </div>
      <div className='tm-body'>
        <div className='tm-sec' ref={clauseSec}>
          <span className='tm-eyebrow'>本页规格行</span>
          <span className='tm-sec-n'>{shown.length}</span>
          <div
            className='tm-filter tm-seg'
            role='group'
            aria-label='筛选规格行'
          >
            <button
              type='button'
              aria-pressed={filter === 'all'}
              onClick={() => setFilter('all')}
            >
              全部 {clauses.length}
            </button>
            <button
              type='button'
              aria-pressed={filter === 'gap'}
              onClick={() => setFilter('gap')}
            >
              无部件对应 {gapCount}
            </button>
          </div>
        </div>
        {shown.length === 0
          ? (
            <div className='tm-gapnote'>
              {clauses.length === 0
                ? '规格索引里没有归到这一页的条款。'
                : '这一页的条款都有部件对应了。'}
            </div>
          )
          : (
            <div className='tm-rows'>
              {shown.map((c) => {
                const by = MAPPED_BY.get(c.id)
                return (
                  <div key={c.id} className={by ? '' : 'tm-clause--no'}>
                    <ClauseRow
                      id={c.id}
                      lead={by
                        ? (
                          <span
                            className='tm-tick tm-tick--ok'
                            title={`有部件对应：${by.join('、')}`}
                            aria-label={`有部件对应：${by.join('、')}`}
                          >
                            ✓
                          </span>
                        )
                        : (
                          <span
                            className='tm-tick tm-tick--no'
                            title='没有任何部件对应这条规格'
                          >
                            无部件
                          </span>
                        )}
                    />
                    {by
                      ? (
                        <div
                          className='tm-chips'
                          style={{ padding: '0 6px 4px 34px' }}
                        >
                          {by.map((id) => (
                            <button
                              key={id}
                              type='button'
                              className='tm-chip'
                              title='滚到这个部件'
                              onClick={() => onFocusMarker(id)}
                            >
                              {id}
                            </button>
                          ))}
                        </div>
                      )
                      : null}
                  </div>
                )
              })}
            </div>
          )}

        <div className='tm-sec'>
          <span className='tm-eyebrow'>落在本页的旅程</span>
          <span className='tm-sec-n'>{journeysHere.length}</span>
        </div>
        {journeysHere.length === 0
          ? (
            <div className='tm-gapnote'>
              还没有旅程步骤标到这一页（在 registry 的 STEPS_* 里给步骤填 route
              就会出现）。
            </div>
          )
          : (
            <div className='tm-jlist'>
              {journeysHere.map(({ j, steps }) => (
                <button
                  key={j.id}
                  type='button'
                  className='tm-jrow'
                  onClick={() =>
                    onOpenGuided({ journeyId: j.id, stepId: steps[0].id })}
                  title='在导测里打开这条旅程'
                >
                  <span className='tm-jrow-n'>{j.n}</span>
                  <span className='tm-jrow-t'>{j.title}</span>
                  <span className='tm-jrow-p'>{steps.length} 步在本页</span>
                </button>
              ))}
            </div>
          )}

        <details className='tm-details'>
          <summary>
            <span className='tm-eyebrow'>本页部件</span>
            <span className='tm-sec-n'>
              {markers.length}
              {outOfView ? ` · 视野外 ${outOfView}` : ''}
            </span>
          </summary>
          {markers.length === 0
            ? <div className='tm-gapnote'>这一页还没有任何标记。</div>
            : (
              <div className='tm-rows'>
                {markers.map((m) => (
                  <button
                    key={m.id}
                    type='button'
                    className={`tm-marker-row${
                      m.d.kind === 'gap' ? ' tm-marker-row--gap' : ''
                    }${
                      m.d.kind === 'unknown' ? ' tm-marker-row--unknown' : ''
                    }`}
                    title={m.inView
                      ? '滚到这个部件并高亮'
                      : '不在视野里：滚过去并高亮'}
                    onClick={() => onFocusMarker(m.id)}
                  >
                    <span className='tm-mono'>{m.id}</span>
                    <span style={{ flex: 1, minWidth: 0 }}>{m.d.label}</span>
                    {m.inView
                      ? null
                      : <span className='tm-chip tm-chip--out'>视野外</span>}
                    <span className='tm-chip'>
                      {m.d.count}
                      {m.n > 1 ? ` ×${m.n}` : ''}
                    </span>
                  </button>
                ))}
              </div>
            )}
        </details>
        <p className='tm-dimt' style={{ margin: '14px 0 0', fontSize: 11.5 }}>
          实现状态来自 spec v4 审计（<ImplChip impl='match' />{' '}
          等）；点条款号去看板那一行。共享部件（版本卡、出战面板）在 EA / DA
          页上仍以 E. / OS. 开头。
        </p>
      </div>
    </div>
  )
}
