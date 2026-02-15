import { TopBar } from '@/components/layout/top-bar'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatusDot } from '@/components/ui/status-dot'
import { EsqlBlock } from '@/components/ui/esql-block'
import { agentActivities, phaseColors, phaseLabels } from '@/data/mock'
import type { AgentPhase } from '@/data/mock'
import { Bot, ArrowRight, RotateCw } from 'lucide-react'
import { useState } from 'react'

const phaseTypes: (AgentPhase | 'all')[] = ['all', 'triage', 'investigation', 'alert', 'action']

export function AgentActivityPage() {
  const [filter, setFilter] = useState<AgentPhase | 'all'>('all')

  const filtered = filter === 'all'
    ? agentActivities
    : agentActivities.filter(a => a.phase === filter)

  return (
    <div className="min-h-screen">
      <TopBar title="Activity Log" />

      <div className="p-6 space-y-6">
        {/* OpsAgent Architecture */}
        <Card glow>
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-elastic/15">
              <RotateCw className="h-5 w-5 text-elastic" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-bold text-text">OpsAgent Phase Pipeline</h3>
                <Badge color="#00bfb3">Architecture</Badge>
              </div>
              <p className="text-xs text-text-muted leading-relaxed">
                A single <strong className="text-elastic">OpsAgent</strong> progresses through 4 phases:
                <strong className="text-elastic"> Triage</strong> (FORK/FUSE/RERANK search),
                <strong className="text-agent-blue"> Investigation</strong> (significant_terms, blast radius, pipeline aggs),
                <strong className="text-agent-amber"> Alert</strong> (percolate matching),
                <strong className="text-agent-purple"> Action</strong> (Slack/Jira/audit).
              </p>
            </div>
          </div>

          {/* Phase Flow */}
          <div className="mt-4 flex items-center justify-center gap-2">
            {(['triage', 'investigation', 'alert', 'action'] as AgentPhase[]).map((phase, i) => (
              <div key={phase} className="flex items-center gap-2">
                <div
                  className="flex items-center gap-1.5 rounded-lg border px-3 py-2"
                  style={{ borderColor: `${phaseColors[phase]}40`, backgroundColor: `${phaseColors[phase]}10` }}
                >
                  <Bot className="h-3.5 w-3.5" style={{ color: phaseColors[phase] }} />
                  <span className="text-[10px] font-bold" style={{ color: phaseColors[phase] }}>{phaseLabels[phase].replace(' Phase', '')}</span>
                </div>
                {i < 3 && (
                  <ArrowRight className="h-3.5 w-3.5 text-text-dim" />
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2">
          {phaseTypes.map(type => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                filter === type
                  ? 'bg-elastic/15 text-elastic border border-elastic/30'
                  : 'text-text-muted hover:bg-surface-2 border border-transparent'
              }`}
              style={
                type !== 'all' && filter === type
                  ? { backgroundColor: `${phaseColors[type as AgentPhase]}15`, color: phaseColors[type as AgentPhase], borderColor: `${phaseColors[type as AgentPhase]}30` }
                  : undefined
              }
            >
              {type === 'all' ? 'All Activity' : phaseLabels[type as AgentPhase]}
            </button>
          ))}
        </div>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-elastic" />
                Incident Response Timeline
              </div>
            </CardTitle>
            <span className="text-xs text-text-dim font-mono">{filtered.length} events</span>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
              <div className="space-y-4">
                {filtered.map(a => (
                  <div key={a.id} className="relative pl-10 animate-fade-in-up">
                    <div
                      className="absolute left-2 top-2 h-4 w-4 rounded-full border-2 flex items-center justify-center"
                      style={{
                        borderColor: phaseColors[a.phase],
                        backgroundColor: `${phaseColors[a.phase]}20`,
                      }}
                    >
                      {a.status === 'running' && (
                        <span
                          className="absolute h-4 w-4 rounded-full animate-ping opacity-30"
                          style={{ backgroundColor: phaseColors[a.phase] }}
                        />
                      )}
                    </div>

                    <div className="rounded-lg border border-border bg-surface-2 p-4 transition-colors hover:bg-surface-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge color={phaseColors[a.phase]}>{phaseLabels[a.phase]}</Badge>
                          <StatusDot status={a.status} size="sm" />
                          <span className="text-xs font-medium text-text">{a.action}</span>
                        </div>
                        <span className="text-[10px] font-mono text-text-dim">
                          {new Date(a.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                        </span>
                      </div>

                      <p className="text-xs text-text-muted leading-relaxed">{a.detail}</p>

                      <div className="mt-2 flex items-center gap-3">
                        {a.toolUsed && (
                          <span className="text-[10px] font-mono text-elastic bg-elastic-bg rounded px-1.5 py-0.5">
                            tool: {a.toolUsed}
                          </span>
                        )}
                        <span className="text-[10px] font-mono text-text-dim">
                          target: {a.target}
                        </span>
                      </div>

                      {a.esqlQuery && <EsqlBlock query={a.esqlQuery} className="mt-3" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
