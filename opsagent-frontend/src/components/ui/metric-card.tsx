import { cn } from '@/lib/utils'
import { Card } from './card'
import type { ReactNode } from 'react'

interface MetricCardProps {
  label: string
  value: string | number
  subtitle?: string
  icon?: ReactNode
  trend?: 'up' | 'down' | 'flat'
  trendValue?: string
  color?: string
  className?: string
  live?: boolean
}

export function MetricCard({ label, value, subtitle, icon, trend, trendValue, color, className, live }: MetricCardProps) {
  const isCritical = color === '#ff4444'

  return (
    <Card
      className={cn('relative', isCritical && 'glow-critical', className)}
      beam={live}
      beamColor={color || '#00bfb3'}
      beamColorTo={color || '#4488ff'}
    >
      {color && (
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{ background: `radial-gradient(ellipse at top right, ${color}, transparent 70%)` }}
        />
      )}
      <div className="relative flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-medium text-text-muted uppercase tracking-wider">{label}</p>
            {live && (
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ backgroundColor: color || '#ff8c00' }} />
                <span className="relative inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: color || '#ff8c00' }} />
              </span>
            )}
          </div>
          <p className={cn('mt-1 text-2xl font-bold tabular-nums', live && 'font-mono')} style={color ? { color } : undefined}>
            {value}
          </p>
          {subtitle && <p className="mt-0.5 text-xs text-text-dim">{subtitle}</p>}
          {trend && trendValue && (
            <p className={cn(
              'mt-1 text-xs font-medium',
              trend === 'up' ? 'text-critical' : trend === 'down' ? 'text-low' : 'text-text-muted'
            )}>
              {trend === 'up' ? '\u2191' : trend === 'down' ? '\u2193' : '\u2192'} {trendValue}
            </p>
          )}
        </div>
        {icon && (
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg"
            style={{ backgroundColor: color ? `${color}15` : undefined, color: color || undefined }}
          >
            {icon}
          </div>
        )}
      </div>
    </Card>
  )
}
