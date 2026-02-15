import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface NumberTickerProps {
  value: number
  direction?: 'up' | 'down'
  delay?: number
  decimals?: number
  className?: string
  prefix?: string
  suffix?: string
}

export function NumberTicker({
  value,
  direction = 'up',
  delay = 0,
  decimals = 0,
  className,
  prefix = '',
  suffix = '',
}: NumberTickerProps) {
  const [displayValue, setDisplayValue] = useState(direction === 'up' ? 0 : value)
  const startRef = useRef(direction === 'up' ? 0 : value)
  const startTimeRef = useRef<number | null>(null)
  const rafRef = useRef<number>()
  const duration = 1200

  useEffect(() => {
    const timeout = setTimeout(() => {
      const start = startRef.current
      const end = value

      const animate = (timestamp: number) => {
        if (!startTimeRef.current) startTimeRef.current = timestamp
        const elapsed = timestamp - startTimeRef.current
        const progress = Math.min(elapsed / duration, 1)

        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3)
        const current = start + (end - start) * eased

        setDisplayValue(current)

        if (progress < 1) {
          rafRef.current = requestAnimationFrame(animate)
        } else {
          startRef.current = value
          startTimeRef.current = null
        }
      }

      rafRef.current = requestAnimationFrame(animate)
    }, delay)

    return () => {
      clearTimeout(timeout)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [value, delay, direction])

  return (
    <span className={cn('tabular-nums tracking-tight', className)}>
      {prefix}{displayValue.toFixed(decimals)}{suffix}
    </span>
  )
}
