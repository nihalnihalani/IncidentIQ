import { cn } from '@/lib/utils'
import { useRef, useState } from 'react'
import type { ReactNode, MouseEvent } from 'react'
import { BorderBeam } from './border-beam'

interface CardProps {
  children: ReactNode
  className?: string
  glow?: boolean
  spotlight?: boolean
  beam?: boolean
  beamColor?: string
  beamColorTo?: string
  onClick?: () => void
}

export function Card({ children, className, glow, spotlight = true, beam, beamColor, beamColorTo, onClick }: CardProps) {
  const divRef = useRef<HTMLDivElement>(null)
  const [spotlightPos, setSpotlightPos] = useState({ x: 0, y: 0 })
  const [spotlightOpacity, setSpotlightOpacity] = useState(0)

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!spotlight || !divRef.current) return
    const rect = divRef.current.getBoundingClientRect()
    setSpotlightPos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }

  return (
    <div
      ref={divRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => spotlight && setSpotlightOpacity(1)}
      onMouseLeave={() => spotlight && setSpotlightOpacity(0)}
      className={cn(
        'relative overflow-hidden rounded-lg border border-border bg-surface p-4 transition-all duration-200 card-hover',
        glow && 'glow-elastic',
        onClick && 'cursor-pointer hover:border-border-bright hover:bg-surface-2',
        className
      )}
    >
      {/* Spotlight effect */}
      {spotlight && (
        <div
          className="pointer-events-none absolute -inset-px rounded-lg transition-opacity duration-300"
          style={{
            opacity: spotlightOpacity,
            background: `radial-gradient(600px circle at ${spotlightPos.x}px ${spotlightPos.y}px, rgba(0, 191, 179, 0.06), transparent 40%)`,
          }}
        />
      )}

      {/* Border beam */}
      {beam && <BorderBeam colorFrom={beamColor || '#00bfb3'} colorTo={beamColorTo || '#4488ff'} size={180} duration={10} />}

      <div className="relative">{children}</div>
    </div>
  )
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mb-3 flex items-center justify-between', className)}>{children}</div>
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h3 className={cn('text-sm font-semibold text-text', className)}>{children}</h3>
}

export function CardContent({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('', className)}>{children}</div>
}
