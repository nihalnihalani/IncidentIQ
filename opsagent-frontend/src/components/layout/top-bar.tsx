import { useEffect, useState } from 'react'
import { Clock, Wifi } from 'lucide-react'

export function TopBar({ title }: { title: string }) {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <header className="sticky top-0 z-30 flex h-12 items-center justify-between border-b border-border bg-surface/80 backdrop-blur-md px-6">
      <h2 className="text-sm font-semibold text-text">{title}</h2>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-xs text-text-dim">
          <Wifi className="h-3 w-3 text-low" />
          <span className="font-mono">Live</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-text-dim font-mono">
          <Clock className="h-3 w-3" />
          {time.toLocaleTimeString('en-US', { hour12: false })}
        </div>
      </div>
    </header>
  )
}
