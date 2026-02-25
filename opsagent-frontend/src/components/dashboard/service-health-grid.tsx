import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatusDot } from '@/components/ui/status-dot'
import { Sparkline } from '@/components/ui/sparkline'
import { useServices } from '@/hooks/use-services'
import { DataState } from '@/components/ui/data-state'
import { cn } from '@/lib/utils'
import { Zap } from 'lucide-react'

const statusColor: Record<string, string> = {
  healthy: '#44cc44',
  degraded: '#ff8c00',
  down: '#ff4444',
}

export function ServiceHealthGrid() {
  const { data: services, loading, error } = useServices()

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Badge color="#00bfb3"><Zap className="h-3 w-3" /> Powered by ES Transforms</Badge>
      </div>
      <DataState loading={loading} error={error} isEmpty={services.length === 0}>
        <div className="grid grid-cols-4 gap-3">
          {services.map(s => (
            <Card
              key={s.name}
              className={cn(
                'relative overflow-hidden transition-all duration-300',
                s.status === 'down' && 'border-critical/40 glow-border',
                s.status === 'degraded' && 'border-high/30'
              )}
            >
              {s.status !== 'healthy' && (
                <div
                  className="absolute inset-0 opacity-5"
                  style={{
                    background: `radial-gradient(ellipse at top, ${statusColor[s.status]}, transparent 70%)`,
                  }}
                />
              )}
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <StatusDot status={s.status} size="sm" />
                    <span className="text-xs font-medium font-mono text-text truncate">{s.name}</span>
                  </div>
                  <span
                    className="text-[10px] font-medium uppercase tracking-wider"
                    style={{ color: statusColor[s.status] }}
                  >
                    {s.status}
                  </span>
                </div>

                <div className="flex items-end justify-between">
                  <div className="space-y-1">
                    <div>
                      <span className="text-[10px] text-text-dim">Latency </span>
                      <span className={cn('text-xs font-mono font-bold', s.latency > 1000 && 'text-critical')}>
                        {s.latency < 1000 ? `${s.latency}ms` : `${(s.latency / 1000).toFixed(1)}s`}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-text-dim">Errors </span>
                      <span className={cn('text-xs font-mono font-bold', s.errorRate > 5 && 'text-critical')}>
                        {s.errorRate}%
                      </span>
                    </div>
                  </div>
                  <Sparkline data={s.trend} color={statusColor[s.status]} width={60} height={20} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </DataState>
    </div>
  )
}
