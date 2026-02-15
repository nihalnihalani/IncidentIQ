import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatusDot } from '@/components/ui/status-dot'
import { agentActivities, phaseColors, phaseLabels } from '@/data/mock'
import { Bot, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function AgentFeed() {
  const navigate = useNavigate()
  const recent = agentActivities.slice(0, 5)

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-elastic" />
            OpsAgent Activity Feed
          </div>
        </CardTitle>
        <button
          onClick={() => navigate('/agent-activity')}
          className="flex items-center gap-1 text-xs text-elastic hover:underline"
        >
          View all <ChevronRight className="h-3 w-3" />
        </button>
      </CardHeader>

      <div className="space-y-2">
        {recent.map(a => (
          <div
            key={a.id}
            className="flex items-start gap-2.5 rounded-lg border border-border bg-surface-2 p-2.5 transition-colors hover:bg-surface-3"
          >
            <div className="mt-0.5">
              <StatusDot status={a.status} size="sm" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <Badge color={phaseColors[a.phase]} className="text-[10px]">
                  {phaseLabels[a.phase]}
                </Badge>
                <span className="text-[10px] font-mono text-text-dim">
                  {new Date(a.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                </span>
              </div>
              <p className="text-xs font-medium text-text">{a.action}</p>
              <p className="text-[11px] text-text-dim mt-0.5 line-clamp-2">{a.detail}</p>
              {a.toolUsed && (
                <span className="mt-1 inline-block text-[10px] font-mono text-elastic bg-elastic-bg rounded px-1.5 py-0.5">
                  {a.toolUsed}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
