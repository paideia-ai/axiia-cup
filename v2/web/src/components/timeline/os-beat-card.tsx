import type { VerdictDTO } from '../../api/types'
import { parseOsBeat } from '../../lib/verdict'
import type { SpeakerLabels } from './labels'
import { speakerName } from './labels'

// 裁判心声卡（#22①）：the judge's generated aside beat, always visible — never
// behind 调试模式, which only governs model reasoning traces. Indented and dashed
// so it reads as an aside over the shoulder, not as a row of the script.
export function OsBeatCard({
  verdict,
  labels,
}: {
  verdict: VerdictDTO
  labels: SpeakerLabels
}) {
  const beat = parseOsBeat(verdict.output)
  // The judge lane's scenario name when one resolves ('秦孝公' → 秦孝公心声);
  // the raw key falling through means no label exists, so the generic name.
  const judge = speakerName(labels, 'judge')
  const title = judge === 'judge' ? '裁判心声' : `${judge}心声`

  return (
    <div className='mx-2 rounded-xl border border-dashed border-(--border) bg-[rgba(251,191,36,0.05)] px-4 py-3 sm:mx-6'>
      <div className='flex flex-wrap items-center gap-2 text-xs'>
        <span className='font-semibold text-(--warning)'>{title}</span>
        <span className='text-(--foreground-muted)'>{verdict.model}</span>
      </div>
      {beat.os
        ? (
          <p className='mt-2 whitespace-pre-wrap text-sm italic leading-relaxed text-(--foreground)'>
            {beat.os}
          </p>
        )
        : null}
      {beat.fallbackText
        ? (
          <p className='mt-2 whitespace-pre-wrap text-sm italic leading-relaxed text-(--foreground)'>
            {beat.fallbackText}
          </p>
        )
        : null}
      {beat.focus || beat.tendency
        ? (
          <div className='mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-(--foreground-subtle)'>
            {beat.focus ? <span>最挂心：{beat.focus}</span> : null}
            {beat.tendency
              ? <span>当前倾向：{speakerName(labels, beat.tendency)}</span>
              : null}
          </div>
        )
        : null}
    </div>
  )
}
