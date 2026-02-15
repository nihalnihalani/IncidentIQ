import { cn } from '@/lib/utils'
import type { PipelineStep } from '@/data/mock'
import { StatusDot } from './status-dot'
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface PipelineVizProps {
  steps: PipelineStep[]
  className?: string
  animate?: boolean
  /** delay in ms before animation starts */
  delay?: number
}

export function PipelineViz({ steps, className, animate = false, delay = 0 }: PipelineVizProps) {
  const [animStates, setAnimStates] = useState<Array<'pending' | 'running' | 'completed'>>(
    animate ? steps.map(() => 'pending') : steps.map(s => s.status)
  )
  const [dataFlowIndex, setDataFlowIndex] = useState(-1)

  const runAnimation = useCallback(() => {
    steps.forEach((step, i) => {
      // Each step: pending → running (after stagger) → completed (after duration)
      const stagger = i * 1200
      setTimeout(() => {
        setAnimStates(prev => { const n = [...prev]; n[i] = 'running'; return n })
        setDataFlowIndex(i)
      }, stagger)
      setTimeout(() => {
        setAnimStates(prev => { const n = [...prev]; n[i] = 'completed'; return n })
        // Animate connector after completion
        if (i < steps.length - 1) {
          setTimeout(() => setDataFlowIndex(i + 0.5), 100)
        }
      }, stagger + 800)
    })
  }, [steps])

  useEffect(() => {
    if (!animate) return
    const timer = setTimeout(runAnimation, delay)
    return () => clearTimeout(timer)
  }, [animate, delay, runAnimation])

  const resetAndPlay = useCallback(() => {
    setAnimStates(steps.map(() => 'pending'))
    setDataFlowIndex(-1)
    setTimeout(runAnimation, 300)
  }, [steps, runAnimation])

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-center gap-2">
        {steps.map((step, i) => {
          const status = animStates[i]
          return (
            <div key={step.name} className="flex items-center gap-2">
              <motion.div
                initial={animate ? { opacity: 0, scale: 0.8 } : false}
                animate={{
                  opacity: 1,
                  scale: 1,
                  ...(status === 'running' ? { boxShadow: '0 0 20px rgba(0, 191, 179, 0.3)' } : { boxShadow: '0 0 0px transparent' }),
                }}
                transition={{ duration: 0.4, delay: animate ? i * 0.15 : 0 }}
                className={cn(
                  'relative flex flex-col items-center gap-1 rounded-lg border px-3 py-2 transition-colors duration-300',
                  status === 'completed' && 'border-low/40 bg-low-bg',
                  status === 'running' && 'border-elastic/40 bg-elastic/10',
                  status === 'pending' && 'border-border bg-surface-2 opacity-50'
                )}
              >
                <div className="flex items-center gap-1.5">
                  <StatusDot status={status === 'running' ? 'running' : status === 'completed' ? 'completed' : 'pending'} size="sm" />
                  <span className="text-xs font-bold font-mono tracking-wider">{step.label}</span>
                </div>
                <span className="text-[10px] text-text-dim text-center max-w-[100px]">{step.description}</span>

                {/* Duration - animate in */}
                <AnimatePresence>
                  {status !== 'pending' && step.duration !== undefined && (
                    <motion.span
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-[10px] font-mono text-text-muted"
                    >
                      {status === 'running' ? (
                        <span className="text-elastic animate-pulse-glow">{step.duration}ms</span>
                      ) : (
                        <span>{step.duration}ms</span>
                      )}
                    </motion.span>
                  )}
                </AnimatePresence>

                {/* Result count - only on completed */}
                <AnimatePresence>
                  {status === 'completed' && step.resultCount !== undefined && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      className="text-[10px] font-bold text-elastic"
                    >
                      {step.resultCount} results
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Connector arrow with data flow animation */}
              {i < steps.length - 1 && (
                <div className="flex items-center relative">
                  <div
                    className={cn(
                      'h-px w-6 transition-colors duration-500',
                      status === 'completed' ? 'bg-low/60' : 'bg-border'
                    )}
                  />
                  {/* Animated data particle */}
                  {status === 'completed' && animStates[i + 1] === 'running' && (
                    <motion.div
                      className="absolute left-0 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-elastic"
                      initial={{ x: 0, opacity: 1 }}
                      animate={{ x: 28, opacity: [1, 1, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 0.3 }}
                    />
                  )}
                  <svg width="8" height="12" viewBox="0 0 8 12" className={cn(
                    'transition-colors duration-500',
                    status === 'completed' ? 'text-low/60' : 'text-border-bright'
                  )}>
                    <path d="M1 1L6 6L1 11" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                  </svg>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Replay button */}
      {animate && animStates.every(s => s === 'completed') && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={resetAndPlay}
          className="self-center text-[10px] text-elastic hover:underline"
        >
          Replay animation
        </motion.button>
      )}
    </div>
  )
}
