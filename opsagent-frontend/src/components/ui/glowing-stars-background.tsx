import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface GlowingStarsProps {
  className?: string
  starCount?: number
}

export function GlowingStarsBackground({ className, starCount = 40 }: GlowingStarsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const stars = Array.from({ length: starCount }, () => ({
      x: Math.random() * rect.width,
      y: Math.random() * rect.height,
      size: Math.random() * 1.5 + 0.5,
      opacity: Math.random() * 0.5 + 0.1,
      speed: Math.random() * 0.005 + 0.002,
      phase: Math.random() * Math.PI * 2,
    }))

    let animationId: number
    let time = 0

    const animate = () => {
      ctx.clearRect(0, 0, rect.width, rect.height)
      time += 0.016

      for (const star of stars) {
        const flicker = Math.sin(time * star.speed * 100 + star.phase) * 0.3 + 0.7
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(0, 191, 179, ${star.opacity * flicker})`
        ctx.fill()

        // Glow
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.size * 3, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(0, 191, 179, ${star.opacity * flicker * 0.15})`
        ctx.fill()
      }

      animationId = requestAnimationFrame(animate)
    }

    animate()
    return () => cancelAnimationFrame(animationId)
  }, [starCount])

  return (
    <canvas
      ref={canvasRef}
      className={cn('absolute inset-0 h-full w-full', className)}
      style={{ width: '100%', height: '100%' }}
    />
  )
}
