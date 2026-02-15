import { TopBar } from '@/components/layout/top-bar'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatusDot } from '@/components/ui/status-dot'
import { EsqlBlock } from '@/components/ui/esql-block'
import { agentActivities, agentColors, agentLabels } from '@/data/mock'
import type { AgentType } from '@/data/mock'
import { Bot, ArrowRight, RotateCw } from 'lucide-react'
import { useState } from 'react'

const agentTypes: (AgentType | 'all')[] = ['all', 'opsagent', 'workflow']

export function AgentActivityPage() {
  const [filter, setFilter] = useState<AgentType | 'all'>('all')

  const filtered = filter === 'all'
    ? agentActivities
    : agentActivities.filter(a => a.agent === filter)

  return (
    <div className="min-h-screen">
      <TopBar title="Activity Log" />

      <div className="p-6 space-y-6">
        {/* Agent Architecture */}
        <Card glow>
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-elastic/15">
              <RotateCw className="h-5 w-5 text-elastic" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-bold text-text">OpsAgent + Workflow Engine Loop</h3>
                <Badge color="#00bfb3">Architecture</Badge>
              </div>
              <p className="text-xs text-text-muted leading-relaxed">
                <strong className="text-elastic">OpsAgent</strong> handles interactive triage and investigation
                (FORK/FUSE/RERANK, significant_terms, Graph Explore, pipeline aggregations).
                <strong className="text-agent-purple"> Workflow Engine</strong> handles alerts and actions
                (percolate matching, Slack/Jira notifications, auto-remediation).
              </p>
            </div>
          </div>

          {/* Agent Flow */}
          <div className="mt-4 flex items-center justify-center gap-3">
            <div
              className="flex items-center gap-1.5 rounded-lg border px-4 py-2.5"
              style={{ borderColor: `${agentColors.opsagent}40`, backgroundColor: `${agentColors.opsagent}10` }}
            >
              <Bot className="h-4 w-4" style={{ color: agentColors.opsagent }} />
              <div>
                <span className="text-xs font-bold" style={{ color: agentColors.opsagent }}>OpsAgent</span>
                <p className="text-[9px] text-text-dim">Triage + Investigation</p>
              </div>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <ArrowRight className="h-4 w-4 text-text-dim" />
              <span className="text-[8px] text-text-dim">findings</span>
            </div>
            <div
              className="flex items-center gap-1.5 rounded-lg border px-4 py-2.5"
              style={{ borderColor: `${agentColors.workflow}40`, backgroundColor: `${agentColors.workflow}10` }}
            >
              <Bot className="h-4 w-4" style={{ color: agentColors.workflow }} />
              <div>
                <span className="text-xs font-bold" style={{ color: agentColors.workflow }}>Workflow Engine</span>
                <p className="text-[9px] text-text-dim">Alerts + Actions</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2">
          {agentTypes.map(type => (
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
                  ? { backgroundColor: `${agentColors[type as AgentType]}15`, color: agentColors[type as AgentType], borderColor: `${agentColors[type as AgentType]}30` }
                  : undefined
              }
            >
              {type === 'all' ? 'All Activity' : agentLabels[type as AgentType]}
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
                        borderColor: agentColors[a.agent],
                        backgroundColor: `${agentColors[a.agent]}20`,
                      }}
                    >
                      {a.status === 'running' && (
                        <span
                          className="absolute h-4 w-4 rounded-full animate-ping opacity-30"
                          style={{ backgroundColor: agentColors[a.agent] }}
                        />
                      )}
                    </div>

                    <div className="rounded-lg border border-border bg-surface-2 p-4 transition-colors hover:bg-surface-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge color={agentColors[a.agent]}>{agentLabels[a.agent]}</Badge>
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
