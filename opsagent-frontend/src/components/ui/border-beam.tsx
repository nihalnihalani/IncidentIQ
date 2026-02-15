import { cn } from '@/lib/utils'

interface BorderBeamProps {
  className?: string
  size?: number
  duration?: number
  delay?: number
  color?: string
  colorFrom?: string
  colorTo?: string
}

export function BorderBeam({
  className,
  size = 200,
  duration = 12,
  delay = 0,
  colorFrom = '#00bfb3',
  colorTo = '#4488ff',
}: BorderBeamProps) {
  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 rounded-[inherit]',
        className
      )}
      style={{
        overflow: 'hidden',
        WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
        WebkitMaskComposite: 'xor',
        maskComposite: 'exclude',
        padding: '1px',
        borderRadius: 'inherit',
      }}
    >
      <div
        className="absolute inset-0 animate-border-beam"
        style={{
          width: size,
          height: size,
          background: `linear-gradient(to left, ${colorFrom}, ${colorTo}, transparent)`,
          animationDuration: `${duration}s`,
          animationDelay: `${delay}s`,
          offsetPath: `rect(0 auto auto 0 round ${size}px)`,
        }}
      />
    </div>
  )
}
