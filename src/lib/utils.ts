import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(n: number | null | undefined): string {
  if (n == null) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString()
}

export function formatCurrency(n: number | null | undefined): string {
  if (n == null) return '—'
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`
  return `$${n.toLocaleString()}`
}

export function formatPercent(n: number | null | undefined, decimals = 1): string {
  if (n == null) return '—'
  return `${n.toFixed(decimals)}%`
}

export function trendColor(change: number): string {
  if (change > 0) return 'text-accent-green'
  if (change < 0) return 'text-accent-red'
  return 'text-white/50'
}

export function trendArrow(change: number): string {
  if (change > 0) return '↑'
  if (change < 0) return '↓'
  return '→'
}

export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  EXECUTIVE: 'Executive',
  NURTURE_OPS: 'Nurture Ops',
  SALES_LEADERSHIP: 'Sales Leadership',
}

export const LIFECYCLE_STAGES = [
  'Lead',
  'MQL',
  'SQL',
  'Discovery Call',
  'Opportunity',
  'Won',
]

export const CONTACT_BUCKETS = ['hot', 'warm', 'cold', 'inactive']

export const BENCHMARK_DEFAULTS = [
  { metric: 'open_rate', warningThreshold: 20, criticalThreshold: 15 },
  { metric: 'bounce_rate', warningThreshold: 3, criticalThreshold: 5 },
  { metric: 'spam_rate', warningThreshold: 0.1, criticalThreshold: 0.3 },
  { metric: 'unsubscribe_rate', warningThreshold: 0.5, criticalThreshold: 1 },
  { metric: 'click_rate', warningThreshold: 2, criticalThreshold: 1 },
]
