'use client'

import {
  ComposedChart,
  Bar,
  Line,
  LineChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

interface BarConfig {
  key: string
  color: string
}

interface LineConfig {
  key: string
  color: string
  dashed?: boolean
}

interface DualTrendChartProps {
  title: string
  type: 'bar-line' | 'line-only'
  weeklyData: Record<string, number | string>[]
  monthlyData: Record<string, number | string>[]
  bars?: BarConfig[]
  lines?: LineConfig[]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-graphite-700 border border-white/10 rounded-lg p-3 text-xs font-mono">
      <p className="text-white/50 mb-2">{label}</p>
      {payload.map((p: { name: string; value: number; color: string }) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {typeof p.value === 'number' && p.value < 100 ? p.value.toFixed(2) : String(Math.round(p.value))}
        </p>
      ))}
    </div>
  )
}

function Panel({
  data,
  xKey,
  label,
  type,
  bars = [],
  lines = [],
}: {
  data: Record<string, number | string>[]
  xKey: string
  label: string
  type: 'bar-line' | 'line-only'
  bars?: BarConfig[]
  lines?: LineConfig[]
}) {
  return (
    <div className="bg-graphite-800 border border-white/5 rounded-xl p-4">
      <p className="text-white/40 text-xs font-mono uppercase tracking-widest mb-3">{label}</p>
      <ResponsiveContainer width="100%" height={160}>
        {type === 'bar-line' ? (
          <ComposedChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis
              dataKey={xKey}
              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'IBM Plex Mono' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'IBM Plex Mono' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            {bars.map((b) => (
              <Bar key={b.key} dataKey={b.key} fill={b.color} radius={[2, 2, 0, 0]} />
            ))}
            {lines.map((l) => (
              <Line
                key={l.key}
                type="monotone"
                dataKey={l.key}
                stroke={l.color}
                strokeWidth={2}
                dot={false}
                strokeDasharray={l.dashed ? '4 2' : undefined}
              />
            ))}
          </ComposedChart>
        ) : (
          <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis
              dataKey={xKey}
              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'IBM Plex Mono' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'IBM Plex Mono' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            {lines.map((l) => (
              <Line
                key={l.key}
                type="monotone"
                dataKey={l.key}
                stroke={l.color}
                strokeWidth={2}
                dot={false}
                strokeDasharray={l.dashed ? '4 2' : undefined}
              />
            ))}
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}

export default function DualTrendChart({
  title,
  type,
  weeklyData,
  monthlyData,
  bars = [],
  lines = [],
}: DualTrendChartProps) {
  return (
    <div>
      <p className="text-white/40 text-xs font-mono uppercase tracking-widest mb-3">{title}</p>
      <div className="grid grid-cols-2 gap-4">
        <Panel
          data={weeklyData}
          xKey="week"
          label="Weekly"
          type={type}
          bars={bars}
          lines={lines}
        />
        <Panel
          data={monthlyData}
          xKey="month"
          label="Monthly"
          type={type}
          bars={bars}
          lines={lines}
        />
      </div>
    </div>
  )
}
