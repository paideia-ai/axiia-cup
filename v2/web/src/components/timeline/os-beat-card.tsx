import { OutputBody, OutputBoundary, OutputText } from '../emotion-playback'
import type { VerdictDTO } from '../../api/types'
import { cn } from '../../lib/cn'
import { parseOsBeat } from '../../lib/verdict'
import type { SpeakerLabels } from './labels'
import { speakerName } from './labels'
import { ReasoningFold } from './reasoning-fold'
import { RolePortrait } from '../role-portrait'
import { tm } from '../../testmode/mark'

// 裁判心声卡（#22①）：the judge's generated aside beat, always visible — never
// behind 调试模式, which only governs model reasoning traces. Indented and dashed
// so it reads as an aside over the shoulder, not as a row of the script.
//
// 回放的教学锚点态（#24 U9）：倾向变化的节拍让回放自动停在这里——accent 实线
// 加环、最挂心一行放大，卡内给「继续」。

// os 节拍固定走 'judge-aside' 通道（商鞅/凤仪亭等脚本同一约定）：心声标题先
// 按通道 id、再按 judge lane 解析显示名（feishu 审计 #10）。
const OS_VOICE_LANES = ['judge-aside', 'judge'] as const

// 心声的「说话人」未必是 judge lane（feishu 审计 #10）：凤仪亭的 os 节拍由
// 场上人物貂蝉在 'judge-aside' 通道亲声，judge lane 无标签，旧逻辑只会落到
// 通用「裁判心声」。按 OS_VOICE_LANES 依次解析显示名——module laneLabels
// 优先（作者随时可修），其次对局自带的 speakerLabels（'秦孝公' → 秦孝公
// 心声的旧路径原样保留在 'judge' 键上）；都解析不出才用通名。
function osTitle(labels: SpeakerLabels): string {
  const voice = OS_VOICE_LANES
    .map((lane) => labels.module?.laneLabels[lane] ?? labels.lanes[lane])
    .find((name) => name != null)
  return voice ? `${voice}心声` : '裁判心声'
}

function osPortraitSpeaker(labels: SpeakerLabels): string {
  return labels.module?.laneLabels['judge-aside'] ? 'judge-aside' : 'judge'
}

// 心声还在生成（act 流式中）：先在侧栏占住它将落下的位置，落笔后由 OsBeatCard
// 接替——不在对话栏里冒出一条旁白发言，再跳进侧栏。调试开时带流式内心。
export function OsPendingCard({
  labels,
  reasoning,
  showTrace = false,
}: {
  labels: SpeakerLabels
  reasoning: string
  showTrace?: boolean
}) {
  return (
    <div
      {...tm('FA.aside-pending')}
      className='mx-2 rounded-xl border border-dashed border-(--border) bg-[rgba(251,191,36,0.05)] px-4 py-3 sm:mx-6'
    >
      <div className='portrait-os-header flex items-center gap-2 text-xs'>
        <RolePortrait
          labels={labels}
          speaker={osPortraitSpeaker(labels)}
          generating
        />
        <div className='flex flex-wrap items-center gap-2'>
          <span className='font-semibold text-(--warning)'>
            {osTitle(labels)}
          </span>
          <span className='inline-flex items-center gap-1 text-(--foreground-muted)'>
            <span className='h-1.5 w-1.5 animate-pulse rounded-full bg-(--accent)' />
            {reasoning ? '正在斟酌措辞…' : '正在思考…'}
          </span>
        </div>
      </div>
      {showTrace ? <ReasoningFold text={reasoning} streaming /> : null}
    </div>
  )
}

export function OsBeatCard({
  verdict,
  labels,
  highlight = false,
  onResume,
  trace,
  showTrace = false,
}: {
  verdict: VerdictDTO
  labels: SpeakerLabels
  highlight?: boolean
  // 锚点停留时卡内的「继续」；不在回放锚点上时不渲染。
  onResume?: () => void
  // 裁判 OS ②（#22②）：这一拍生成时模型的真实推演轨迹——原本挂在被吸收的
  // act 行上，行不再渲染后随卡走。调试模式之外不出现。
  trace?: string | null
  showTrace?: boolean
}) {
  const beat = parseOsBeat(verdict.output)
  const title = osTitle(labels)

  return (
    <OutputBoundary
      outputRef={verdict.outputRef}
      labels={labels}
      speaker={osPortraitSpeaker(labels)}
    >
      <div
        {...tm('FA.aside-card')}
        id={`beat-${verdict.key}`}
        className={cn(
          'mx-2 rounded-xl border border-dashed border-(--border) bg-[rgba(251,191,36,0.05)] px-4 py-3 sm:mx-6',
          highlight &&
            'border-solid border-(--accent) ring-2 ring-(--accent) bg-[rgba(224,74,47,0.06)]',
        )}
      >
        <div className='portrait-os-header flex items-center gap-2 text-xs'>
          <RolePortrait
            labels={labels}
            speaker={osPortraitSpeaker(labels)}
          />
          <div className='flex flex-wrap items-center gap-2'>
            <span
              {...tm('FA.aside-title')}
              className='font-semibold text-(--warning)'
            >
              {title}
            </span>
            <span
              {...tm('FA.aside-model')}
              className='text-(--foreground-muted)'
            >
              {verdict.model}
            </span>
            {highlight
              ? (
                <span
                  {...tm('FA.aside-anchor-badge')}
                  className='rounded-full bg-[rgba(224,74,47,0.14)] px-2 py-0.5 text-[11px] font-semibold text-(--accent)'
                >
                  倾向变化
                </span>
              )
              : null}
          </div>
        </div>
        <OutputBody>
          {beat.os
            ? (
              <p
                {...tm('FA.aside-text')}
                className='mt-2 whitespace-pre-wrap text-sm italic leading-relaxed text-(--foreground)'
              >
                <OutputText text={beat.os} />
              </p>
            )
            : null}
          {beat.fallbackText
            ? (
              <p
                {...tm('FA.aside-text')}
                className='mt-2 whitespace-pre-wrap text-sm italic leading-relaxed text-(--foreground)'
              >
                <OutputText text={beat.fallbackText} />
              </p>
            )
            : null}
          {beat.attention || beat.favor
            ? (
              <div
                {...tm('FA.aside-tendency')}
                className={cn(
                  'mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-(--foreground-subtle)',
                  highlight && 'items-baseline',
                )}
              >
                {beat.attention
                  ? (
                    <span
                      className={cn(
                        highlight &&
                          'text-sm font-semibold text-(--foreground)',
                      )}
                    >
                      最挂心：<OutputText text={beat.attention} />
                    </span>
                  )
                  : null}
                {beat.favor
                  ? (
                    <span>
                      当前倾向：<OutputText
                        text={speakerName(labels, beat.favor)}
                        source={beat.favor}
                      />
                      {beat.strength
                        ? (
                          <OutputText
                            text={`（${beat.strength}）`}
                            source={beat.strength}
                          />
                        )
                        : ''}
                    </span>
                  )
                  : null}
              </div>
            )
            : null}
        </OutputBody>
        {showTrace && trace?.trim() ? <ReasoningFold text={trace} /> : null}
        {highlight && onResume
          ? (
            <div className='mt-3'>
              <button
                {...tm('FA.aside-resume-button')}
                type='button'
                onClick={onResume}
                className='inline-flex cursor-pointer items-center rounded-full bg-(--accent) px-3.5 py-1.5 text-xs font-semibold text-white transition hover:opacity-90'
              >
                继续
              </button>
            </div>
          )
          : null}
      </div>
    </OutputBoundary>
  )
}
