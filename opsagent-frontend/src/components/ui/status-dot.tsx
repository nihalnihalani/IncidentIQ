import { cn } from '@/lib/utils'

interface StatusDotProps {
  status: 'healthy' | 'degraded' | 'down' | 'running' | 'completed' | 'failed' | 'pending'
  size?: 'sm' | 'md' | 'lg'
  pulse?: boolean
  className?: string
}

const statusColorMap: Record<string, string> = {
  healthy: 'bg-low',
  completed: 'bg-low',
  degraded: 'bg-high',
  running: 'bg-agent-blue',
  pending: 'bg-text-dim',
  down: 'bg-critical',
  failed: 'bg-critical',
}

const sizeMap = {
  sm: 'h-2 w-2',
  md: 'h-2.5 w-2.5',
  lg: 'h-3 w-3',
}

export function StatusDot({ status, size = 'md', pulse, className }: StatusDotProps) {
  const shouldPulse = pulse ?? (status === 'running' || status === 'down' || status === 'degraded')

  return (
    <span className={cn('relative inline-flex', sizeMap[size], className)}>
      {shouldPulse && (
        <span
          className={cn(
            'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
            statusColorMap[status]
          )}
        />
      )}
      <span className={cn('relative inline-flex rounded-full', sizeMap[size], statusColorMap[status])} />
    </span>
  )
}
