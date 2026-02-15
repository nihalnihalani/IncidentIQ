import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatusDot } from '@/components/ui/status-dot'
import { incidents, phaseLabels, phaseColors } from '@/data/mock'
import type { Severity } from '@/data/mock'
import { AlertTriangle, Clock, Layers } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function IncidentList() {
  const navigate = useNavigate()

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-critical" />
            Active Incidents
          </div>
        </CardTitle>
        <Badge variant="critical" pulse>{incidents.filter(i => i.status !== 'resolved').length} Active</Badge>
      </CardHeader>

      <div className="space-y-2">
        {incidents.map(inc => (
          <div
            key={inc.id}
            onClick={() => navigate('/incident')}
            className="group flex items-start gap-3 rounded-lg border border-border bg-surface-2 p-3 cursor-pointer transition-all hover:border-border-bright hover:bg-surface-3"
          >
            <StatusDot
              status={inc.status === 'resolved' ? 'completed' : inc.status === 'active' ? 'down' : 'running'}
              size="lg"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text truncate">{inc.title}</p>
                  <div className="mt-1 flex items-center gap-3 text-[11px] text-text-dim">
                    <span className="font-mono">{inc.id}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(inc.startedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Layers className="h-3 w-3" />
                      {inc.affectedServices} services
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <Badge variant={inc.severity as Severity}>{inc.severity}</Badge>
                  <Badge color={phaseColors[inc.phase]}>
                    {phaseLabels[inc.phase]}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
