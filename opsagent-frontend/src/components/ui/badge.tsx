import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface BadgeProps {
  children: ReactNode
  variant?: 'default' | 'critical' | 'high' | 'medium' | 'low' | 'outline' | 'agent'
  color?: string
  className?: string
  pulse?: boolean
}

const variantStyles: Record<string, string> = {
  default: 'bg-surface-3 text-text-muted',
  critical: 'bg-critical-bg text-critical border border-critical/30',
  high: 'bg-high-bg text-high border border-high/30',
  medium: 'bg-medium-bg text-medium border border-medium/30',
  low: 'bg-low-bg text-low border border-low/30',
  outline: 'border border-border text-text-muted',
  agent: 'border text-text',
}

export function Badge({ children, variant = 'default', color, className, pulse }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium',
        variantStyles[variant],
        className
      )}
      style={color ? { borderColor: `${color}40`, backgroundColor: `${color}15`, color } : undefined}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span
            className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
            style={{ backgroundColor: color || 'currentColor' }}
          />
          <span
            className="relative inline-flex h-2 w-2 rounded-full"
            style={{ backgroundColor: color || 'currentColor' }}
          />
        </span>
      )}
      {children}
    </span>
  )
}
