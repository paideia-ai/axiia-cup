import { ChevronRight, Crown, Flame, ShieldCheck, Swords } from 'lucide-react'
import { type CSSProperties, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { EntryPicker } from './entry-picker'
import {
  chooseRole,
  clearScenarioEntries,
  entrySettingsPath,
  restoreScenarioEntries,
  selectedEntry,
  selectedRole,
  useEntrySelections,
} from './entry-selection'
import { OpponentReveal } from './opponent-reveal'
import { sseUrl } from '../../api/client'
import { RolePortrait } from '../../components/role-portrait'
import { speakerLabels } from '../../components/timeline/labels'
import { sortieArtwork } from './theme'
import { demoOpponents, sortieEntries, sortieScenarios } from './fixtures'
import {
  candidatePool,
  type Entry,
  gamesPlayed,
  pickOpponent,
  type RecordStats,
  winRate,
} from './matchmaking'
import {
  clearDemoResult,
  currentDemoMatch,
  startDemoMatch,
  useDemoMatch,
} from './demo-match-store'
import './sortie.css'

type Phase = 'ready' | 'empty' | 'error'
type Case = 'normal' | 'new' | 'no-entry' | 'locked' | 'empty' | 'error'
const rateLabel = (stats: RecordStats) => {
  const rate = winRate(stats)
  return rate == null ? '—' : `${(rate * 100).toFixed(1)}%`
}

export default function SortiePage() {
  const navigate = useNavigate()
  const { records, match } = useDemoMatch()
  const entrySelections = useEntrySelections()
  const [pickerSide, setPickerSide] = useState<'a' | 'b' | null>(null)
  const loadoutRef = useRef<HTMLElement>(null)
  const [selection, setSelection] = useState<
    { entry: Entry; opponent: Entry; key: string } | null
  >(null)
  const [submitting, setSubmitting] = useState(false)
  const [startError, setStartError] = useState<string | null>(null)
  const inFlight = useRef(false)
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])
  const [scenarioID, setScenarioID] = useState(() =>
    currentDemoMatch()?.entry.scenarioID ?? sortieScenarios[0].id
  )
  const [side, setSide] = useState<'a' | 'b'>(() =>
    currentDemoMatch()?.entry.side ?? 'a'
  )
  const [idlePhase, setPhase] = useState<Phase>('ready')
  const phase = match?.phase ?? idlePhase
  const [demoCase, setDemoCase] = useState<Case>(() =>
    currentDemoMatch()?.fixture ?? 'normal'
  )
  const [nextOutcome, setOutcome] = useState<'win' | 'loss' | 'draw'>('win')
  const outcome = match?.outcome ?? nextOutcome
  const opponent = match?.opponent
  const round = match?.round ?? 0
  const roundRef = useRef<HTMLDivElement>(null)
  const scene = sortieScenarios.find((s) => s.id === scenarioID)!
  const configurable = scenarioID === 'honnoji-decision'
  const configured = selectedEntry(scenarioID, side, entrySelections)
  const hasEntry = configured != null && demoCase !== 'no-entry'
  const original = configured ??
    sortieEntries.find((e) => e.scenarioID === scenarioID && e.side === side)!
  const recordKey = demoCase === 'new' ? -original.agentID : original.agentID
  const entry = {
    ...original,
    ...(!hasEntry || demoCase === 'new'
      ? { wins: 0, losses: 0, draws: 0, streak: 0, bestStreak: 0 }
      : {}),
    ...(hasEntry ? records[recordKey] ?? {} : {}),
  }
  const artwork = sortieArtwork(scenarioID)
  const labels = speakerLabels(scenarioID, {
    a: scene.sideAName,
    b: scene.sideBName,
  })
  const busy = phase === 'watching' || selection != null || pickerSide != null
  const opposingEntry = sortieEntries.find((e) =>
    e.scenarioID === scenarioID && e.side !== side
  )!
  const opponentName = demoOpponents.find((e) =>
    e.versionID === opponent?.versionID
  )?.name
  const ownEntries = sortieEntries.flatMap((base) => {
    const chosen = selectedEntry(base.scenarioID, base.side, entrySelections)
    return chosen ? [chosen] : []
  })
  const scenarioWinRates = [...ownEntries, ...demoOpponents]
    .filter((candidate) =>
      candidate.scenarioID === scenarioID && candidate.active
    )
    .map((candidate) =>
      winRate({ ...candidate, ...(records[candidate.agentID] ?? {}) })
    )
    .filter((rate): rate is number => rate != null)
  const highestWinRate = scenarioWinRates.length
    ? `${(Math.max(...scenarioWinRates) * 100).toFixed(1)}%`
    : '—'

  useEffect(() => {
    if (phase === 'watching') roundRef.current?.focus({ preventScroll: true })
  }, [phase])

  const reset = () => {
    clearDemoResult()
    setSelection(null)
    setStartError(null)
    setPhase('ready')
  }
  const openPicker = (target: 'a' | 'b') => {
    if (busy) return
    reset()
    setPickerSide(target)
  }
  const closePicker = () => {
    const target = pickerSide
    setPickerSide(null)
    requestAnimationFrame(() =>
      loadoutRef.current?.querySelector<HTMLButtonElement>(
        `[data-sortie-change-side="${target}"], [data-sortie-side="${target}"]`,
      )?.focus({ preventScroll: true })
    )
  }
  const start = () => {
    if (busy || !hasEntry || demoCase === 'locked') return
    clearDemoResult()
    if (demoCase === 'error') {
      setPhase('error')
      return
    }
    const candidates = demoCase === 'empty' ? [] : candidatePool(
      entry,
      demoOpponents.map((e) => ({
        ...e,
        ...(records[demoCase === 'new' ? -e.agentID : e.agentID] ?? {}),
      })),
    )
    const found = pickOpponent(candidates)
    if (!found) {
      setPhase('empty')
      return
    }
    setPhase('ready')
    setSelection({
      entry: { ...entry },
      opponent: { ...found },
      key: crypto.randomUUID(),
    })
    setStartError(null)
  }

  const confirmStart = async () => {
    if (!selection || inFlight.current) return
    inFlight.current = true
    setSubmitting(true)
    setStartError(null)
    try {
      const response = await fetch(sseUrl('/demo/ladder/matches'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestID: selection.key,
          versionID: selection.entry.versionID,
          opponentVersionID: selection.opponent.versionID,
          outcome: nextOutcome,
        }),
      })
      if (!response.ok) throw new Error('start_failed')
      const result = await response.json() as {
        matchID: number
        startedAt: number
      }
      startDemoMatch(
        selection.entry,
        selection.opponent,
        nextOutcome,
        result,
        demoCase === 'new' ? 'new' : 'normal',
      )
      if (mounted.current) {
        setSelection(null)
        navigate(`/matches/${result.matchID}`)
      }
    } catch {
      if (mounted.current) {
        setStartError('未能开始对局，请重试。已为你保留这位对手。')
      }
    } finally {
      inFlight.current = false
      if (mounted.current) setSubmitting(false)
    }
  }

  return (
    <div
      className='sortie-page'
      style={{
        '--sortie-accent': scene.accent,
        '--sortie-backdrop': scene.background,
      } as CSSProperties}
    >
      <div className='sortie-heading'>
        <h1>
          <Swords size={20} />天梯
        </h1>
        <span>本地演示 · 模拟战绩</span>
      </div>

      <Link
        className='sortie-stage'
        to={`/scenarios/${scene.id}`}
        aria-label={`${scene.shortTitle}场景介绍`}
      >
        <div className='sortie-art' key={scenarioID}>
          {artwork && <img src={artwork.src} alt={artwork.alt} />}
        </div>
        <div className='sortie-scene-copy'>
          <span className='sortie-mode'>
            <Swords size={14} />天梯匹配
          </span>
          <h2>{scene.shortTitle}</h2>
          <p>{scene.hook}</p>
        </div>
        <div className='sortie-records'>
          <div>
            <span>智能体胜率</span>
            <strong>{rateLabel(entry)}</strong>
            <small>
              {gamesPlayed(entry)
                ? `${entry.wins} 胜 ${entry.losses} 负 ${entry.draws} 平`
                : '还没有天梯对局'}
            </small>
          </div>
          <div>
            <span>
              <Flame size={14} />当前连胜
            </span>
            <strong>
              {hasEntry ? entry.streak : '—'}
              <em>场</em>
            </strong>
            <small>
              {hasEntry
                ? `个人最高 ${entry.bestStreak} 场`
                : '先选择参赛智能体'}
            </small>
          </div>
          <div>
            <span>
              <Crown size={14} />全服最高胜率
            </span>
            <strong>{highestWinRate}</strong>
          </div>
        </div>
      </Link>

      <div
        className='sortie-scenarios'
        role='group'
        aria-label='选择出战场景'
      >
        {sortieScenarios.map((s) => {
          const image = sortieArtwork(s.id)
          return (
            <button
              key={s.id}
              type='button'
              aria-pressed={s.id === scene.id}
              disabled={busy}
              style={{
                '--tile-color': s.accent,
                '--tile-backdrop': s.background,
              } as CSSProperties}
              onClick={() => {
                setScenarioID(s.id)
                setSide('a')
                reset()
              }}
            >
              <span className='sortie-scenario-art'>
                {image && <img src={image.src} alt='' loading='lazy' />}
              </span>
              <span>{s.shortTitle}</span>
            </button>
          )
        })}
      </div>

      <section
        ref={loadoutRef}
        className='sortie-loadout'
        aria-labelledby='sortie-entry-title'
      >
        <div className='sortie-loadout-top'>
          <h3 id='sortie-entry-title'>本次出战</h3>
          <span>
            <ShieldCheck size={14} />自动使用参赛版本
          </span>
        </div>
        {pickerSide != null
          ? (
            <EntryPicker
              key={`${scenarioID}:${pickerSide}`}
              scenarioID={scenarioID}
              side={pickerSide}
              faction={pickerSide === 'a' ? scene.sideAName : scene.sideBName}
              current={selectedRole(scenarioID, pickerSide, entrySelections)
                ?.key ?? null}
              onClose={closePicker}
              onCommit={(roleKey) => {
                if (!chooseRole(scenarioID, pickerSide, roleKey)) {
                  return false
                }
                setSide(pickerSide)
                setDemoCase('normal')
                reset()
                closePicker()
                return true
              }}
            />
          )
          : selection
          ? (
            <OpponentReveal
              entry={selection.entry}
              opponent={selection.opponent}
              labels={labels}
              ownRole={original}
              otherRole={opposingEntry}
              name={demoOpponents.find((e) =>
                e.versionID === selection.opponent.versionID
              )!.name}
              submitting={submitting}
              error={startError}
              onStart={confirmStart}
            />
          )
          : (
            <>
              <div
                className='sortie-roles'
                role='group'
                aria-label='选择出战角色'
              >
                {scenarioID === 'honnoji-decision' && (
                  <>
                    {(['a', 'b'] as const).map((factionSide) => (
                      <div className='sortie-faction-heading' key={factionSide}>
                        <p
                          className='sortie-faction'
                          id={`sortie-faction-${factionSide}`}
                        >
                          {factionSide === 'a'
                            ? scene.sideAName
                            : scene.sideBName}
                        </p>
                        <button
                          className='sortie-change-role'
                          type='button'
                          data-sortie-change-side={factionSide}
                          aria-label={`${
                            factionSide === 'a'
                              ? scene.sideAName
                              : scene.sideBName
                          }：更换角色`}
                          disabled={busy}
                          onClick={() =>
                            openPicker(factionSide)}
                        >
                          更换角色
                        </button>
                      </div>
                    ))}
                  </>
                )}
                {sortieEntries.filter((e) => e.scenarioID === scenarioID).map(
                  (base) => {
                    const role = selectedRole(
                      scenarioID,
                      base.side,
                      entrySelections,
                    )
                    const chosen = configurable ? role != null : true
                    const e = configurable && role
                      ? { ...base, roleKey: role.key, roleName: role.name }
                      : base
                    return (
                      <button
                        key={e.side}
                        type='button'
                        data-sortie-side={e.side}
                        aria-pressed={chosen && side === e.side}
                        aria-label={configurable
                          ? (chosen
                            ? `${e.roleName}，选择此阵营出战`
                            : `${
                              e.side === 'a' ? scene.sideAName : scene.sideBName
                            }，尚未选择角色`)
                          : undefined}
                        aria-describedby={scenarioID === 'honnoji-decision'
                          ? `sortie-faction-${e.side}`
                          : undefined}
                        disabled={busy}
                        onClick={() => {
                          setSide(e.side)
                          reset()
                        }}
                      >
                        {chosen && (
                          <RolePortrait
                            labels={labels}
                            speaker={e.roleKey}
                            size='sm'
                          />
                        )}
                        <span className='sortie-role-label'>
                          <span>{chosen ? e.roleName : '未选择角色'}</span>
                        </span>
                        <span className='sortie-role-check'>
                          {chosen && e.side === side ? '✓' : ''}
                        </span>
                      </button>
                    )
                  },
                )}
              </div>
              <div className='sortie-entry-line'>
                <span>
                  {!hasEntry ? '尚未设置参赛版本' : (
                    <>
                      参赛 v{entry.ordinal}
                      <span className='sortie-entry-id'>
                        · #{entry.versionID}
                      </span>
                    </>
                  )}
                </span>
                {hasEntry && (
                  <Link to={`/agents/${entry.agentID}`}>
                    查看智能体 <ChevronRight size={13} />
                  </Link>
                )}
              </div>

              {['watching', 'result'].includes(phase) && opponent
                ? (
                  <div
                    className='sortie-match'
                    ref={roundRef}
                    tabIndex={-1}
                    aria-label='匹配结果'
                  >
                    <div className='sortie-match-title'>
                      <strong>
                        {phase === 'result'
                          ? outcome === 'win'
                            ? '本局获胜'
                            : outcome === 'loss'
                            ? '本局落败'
                            : '本局平局'
                          : '对局进行中'}
                      </strong>
                      <span>模拟对局</span>
                    </div>
                    <div className='sortie-opponent'>
                      <RolePortrait
                        labels={labels}
                        speaker={opposingEntry.roleKey}
                        size='sm'
                      />
                      <div>
                        <b>{opponentName} · {opposingEntry.roleName}</b>
                        <small>
                          智能体胜率 {rateLabel(opponent)} ·{' '}
                          {gamesPlayed(opponent)} 场
                        </small>
                      </div>
                      <Swords size={22} />
                    </div>
                    {phase === 'watching' && (
                      <div className='sortie-rounds' aria-live='polite'>
                        {['双方陈述立场', '交锋与回应', '裁判评定胜负'].map((
                          text,
                          i,
                        ) => (
                          <span
                            key={text}
                            className={round >= i ? 'is-reached' : ''}
                          >
                            {round > i ? '✓' : '·'} {text}
                          </span>
                        ))}
                        <small>
                          对局已启动，可离开此页，稍后回来查看结果。
                        </small>
                      </div>
                    )}
                    {phase === 'result' && (
                      <p className='sortie-result-copy' role='status'>
                        {outcome === 'win'
                          ? `已达成 ${entry.streak} 连胜。`
                          : outcome === 'draw'
                          ? '双方平局，连胜归零。'
                          : '连胜归零，下一局再来。'} 此智能体战绩已更新。
                      </p>
                    )}
                    {match?.matchID && (
                      <Link
                        className='sortie-battle-link'
                        to={`/matches/${match.matchID}`}
                      >
                        查看对局 <ChevronRight size={14} />
                      </Link>
                    )}
                    {phase === 'result' && (
                      <button
                        type='button'
                        className='sortie-primary'
                        onClick={start}
                      >
                        <Swords size={18} />再来一局
                      </button>
                    )}
                  </div>
                )
                : (
                  <div className='sortie-deploy'>
                    <div className='sortie-match-note' aria-live='polite'>
                      {phase === 'empty'
                        ? (
                          <>
                            <b>该场景对侧暂无可用对手</b>
                            <span>可以稍后重试，或换个场景。</span>
                          </>
                        )
                        : phase === 'error'
                        ? (
                          <>
                            <b>匹配未能完成</b>
                            <span>本次没有创建对局，也没有扣除积分。</span>
                          </>
                        )
                        : !hasEntry
                        ? (
                          <>
                            <b>先选一份策略出战</b>
                            <span>
                              在智能体页把已保存版本设为参赛。
                            </span>
                          </>
                        )
                        : demoCase === 'locked'
                        ? (
                          <>
                            <b>完成练习后解锁玩家匹配</b>
                            <span>两侧各击败 1 名 NPC，当前还差对侧。</span>
                          </>
                        )
                        : null}
                    </div>
                    {!hasEntry || demoCase === 'locked'
                      ? (
                        <Link
                          className='sortie-primary'
                          to={!hasEntry
                            ? entrySettingsPath(
                              scenarioID,
                              side,
                              entrySelections,
                            )
                            : `/agents/${entry.agentID}?version=${entry.versionID}&battle=npc`}
                        >
                          {!hasEntry ? '设置参赛版本' : '去练习'}
                          <ChevronRight size={18} />
                        </Link>
                      )
                      : (
                        <button
                          type='button'
                          className='sortie-primary'
                          onClick={start}
                        >
                          <Swords size={20} />
                          {phase === 'empty' || phase === 'error'
                            ? '重新匹配'
                            : '随机匹配'}
                        </button>
                      )}
                  </div>
                )}
            </>
          )}
      </section>
      <details className='sortie-demo-controls'>
        <summary>演示选项</summary>
        <div>
          <label>
            页面状态<select
              disabled={busy}
              value={demoCase}
              onChange={(e) => {
                const next = e.target.value as Case
                if (configurable && next === 'no-entry') {clearScenarioEntries(
                    scenarioID,
                  )}
                if (
                  configurable && next === 'normal' && demoCase === 'no-entry'
                ) restoreScenarioEntries(scenarioID)
                setDemoCase(next)
                reset()
              }}
            >
              <option value='normal'>已有参赛版本</option>
              <option value='new'>新智能体定位</option>
              <option value='no-entry'>
                {configurable ? '未选择参赛角色' : '未设置参赛版本'}
              </option>
              <option value='locked'>尚未解锁</option>
              <option value='empty'>对侧无可用对手</option>
              <option value='error'>匹配失败</option>
            </select>
          </label>
          <label>
            下局演示结果<select
              disabled={busy}
              value={nextOutcome}
              onChange={(e) => setOutcome(e.target.value as typeof outcome)}
            >
              <option value='win'>获胜</option>
              <option value='loss'>落败</option>
              <option value='draw'>平局</option>
            </select>
          </label>
          <p>
            本地模拟，不扣积分、不调用模型。离开页面后模拟对局继续，整页刷新后重置。
          </p>
        </div>
      </details>
    </div>
  )
}
