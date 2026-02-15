import { cn } from '@/lib/utils'
import type { PipelineStep } from '@/data/mock'
import { StatusDot } from './status-dot'

interface PipelineVizProps {
  steps: PipelineStep[]
  className?: string
}

export function PipelineViz({ steps, className }: PipelineVizProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {steps.map((step, i) => (
        <div key={step.name} className="flex items-center gap-2">
          <div
            className={cn(
              'relative flex flex-col items-center gap-1 rounded-lg border px-3 py-2 transition-all duration-500',
              step.status === 'completed' && 'border-low/40 bg-low-bg',
              step.status === 'running' && 'border-agent-blue/40 bg-agent-blue/10 glow-border',
              step.status === 'pending' && 'border-border bg-surface-2 opacity-50'
            )}
          >
            <div className="flex items-center gap-1.5">
              <StatusDot status={step.status} size="sm" />
              <span className="text-xs font-bold font-mono tracking-wider">{step.label}</span>
            </div>
            <span className="text-[10px] text-text-dim text-center max-w-[100px]">{step.description}</span>
            {step.duration !== undefined && (
              <span className="text-[10px] font-mono text-text-muted">{step.duration}ms</span>
            )}
            {step.resultCount !== undefined && (
              <span className="text-[10px] text-elastic">{step.resultCount} results</span>
            )}
          </div>
          {i < steps.length - 1 && (
            <div className="flex items-center">
              <div
                className={cn(
                  'h-px w-6 transition-colors duration-500',
                  step.status === 'completed' ? 'bg-low/60' : 'bg-border'
                )}
              />
              <svg width="8" height="12" viewBox="0 0 8 12" className="text-border-bright">
                <path d="M1 1L6 6L1 11" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              </svg>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
