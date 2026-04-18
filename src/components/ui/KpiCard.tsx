import { cn, trendColor, trendArrow } from '@/lib/utils'

interface KpiCardProps {
  label: string
  value: string
  change?: number
  changeLabel?: string
  sub?: string
  accent?: boolean
  large?: boolean
}

export default function KpiCard({
  label,
  value,
  change,
  changeLabel,
  sub,
  accent,
  large,
}: KpiCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border p-5 flex flex-col gap-3 transition-all',
        accent
          ? 'bg-pulse-blue/10 border-pulse-blue/20'
          : 'bg-graphite-800 border-white/5 hover:border-white/10'
      )}
    >
      <p className="text-white/40 text-xs font-mono uppercase tracking-widest">{label}</p>
      <p
        className={cn(
          'font-bold text-white leading-none',
          large ? 'text-3xl' : 'text-2xl'
        )}
      >
        {value}
      </p>
      {(change !== undefined || sub) && (
        <div className="flex items-center gap-2 flex-wrap">
          {change !== undefined && (
            <span className={cn('text-xs font-mono font-medium', trendColor(change))}>
              {trendArrow(change)} {Math.abs(change).toFixed(1)}%{' '}
              {changeLabel || 'vs prev period'}
            </span>
          )}
          {sub && <span className="text-white/25 text-xs">{sub}</span>}
        </div>
      )}
    </div>
  )
}
