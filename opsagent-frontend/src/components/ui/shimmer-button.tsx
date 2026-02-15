import { cn } from '@/lib/utils'
import type { ReactNode, ButtonHTMLAttributes } from 'react'

interface ShimmerButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  shimmerColor?: string
  shimmerSize?: string
  shimmerDuration?: string
  background?: string
  className?: string
}

export function ShimmerButton({
  children,
  shimmerColor = '#00bfb3',
  shimmerSize = '0.1em',
  shimmerDuration = '2.5s',
  background = 'rgba(0, 191, 179, 0.1)',
  className,
  ...props
}: ShimmerButtonProps) {
  return (
    <button
      className={cn(
        'group relative z-0 flex items-center justify-center overflow-hidden rounded-lg border border-elastic/30 px-6 py-3 font-medium text-elastic transition-all hover:border-elastic/60 hover:scale-[1.02] active:scale-[0.98]',
        className
      )}
      style={{
        background,
      }}
      {...props}
    >
      {/* Shimmer effect */}
      <div
        className="absolute inset-0 overflow-hidden rounded-lg"
        style={{
          mask: 'linear-gradient(-75deg, white calc(var(--x) + 20%), transparent calc(var(--x) + 30%), white calc(var(--x) + 100%))',
          WebkitMask: 'linear-gradient(-75deg, white calc(var(--x) + 20%), transparent calc(var(--x) + 30%), white calc(var(--x) + 100%))',
          animation: `shimmer ${shimmerDuration} infinite`,
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(90deg, transparent, ${shimmerColor}40, transparent)`,
          }}
        />
      </div>

      {/* Glow on hover */}
      <div
        className="absolute inset-0 rounded-lg opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: `radial-gradient(circle at center, ${shimmerColor}20, transparent 70%)`,
        }}
      />

      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  )
}
