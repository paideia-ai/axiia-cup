import { cn } from '../../lib/cn'
import { tm } from '../../testmode/mark'

type IcpRecordProps = {
  className?: string
}

export function IcpRecord({ className }: IcpRecordProps) {
  return (
    <div
      {...tm('NAV.icp-record')}
      className={cn(
        'flex items-center justify-center text-center text-xs text-(--foreground-muted)',
        className,
      )}
    >
      <a
        {...tm('NAV.icp-link')}
        href='https://beian.miit.gov.cn/'
        target='_blank'
        rel='noreferrer'
        className='transition hover:text-(--foreground-subtle)'
      >
        备案号：浙ICP备2025153799号-1
      </a>
    </div>
  )
}
