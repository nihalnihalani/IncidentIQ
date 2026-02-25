import { TopBar } from '@/components/layout/top-bar'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatusDot } from '@/components/ui/status-dot'
import { EsqlBlock } from '@/components/ui/esql-block'
import { DotPattern } from '@/components/ui/dot-pattern'
import { agentActivities, phaseColors, phaseLabels, agentColors, agentLabels } from '@/data/mock'
import type { AgentPhase, AgentName } from '@/data/mock'
import { Bot, ArrowRight, ArrowDownRight } from 'lucide-react'
import { useState } from 'react'

type FilterType = 'all' | AgentName
const filterTypes: FilterType[] = ['all', 'triage-agent', 'investigation-agent', 'postmortem-agent']

export function AgentActivityPage() {
  const [filter, setFilter] = useState<FilterType>('all')

  const filtered = filter === 'all'
    ? agentActivities
    : agentActivities.filter(a => a.agent === filter)

  return (
    <div className="relative min-h-screen">
      <DotPattern className="[mask-image:radial-gradient(ellipse_at_center,white_15%,transparent_70%)] opacity-40" />

      <TopBar title="Activity Log" />

      <div className="relative p-6 space-y-6">
        {/* Multi-Agent Architecture */}
        <Card glow>
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-elastic/15">
              <Bot className="h-5 w-5 text-elastic" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-bold text-text">Multi-Agent Incident Response</h3>
                <Badge color="#00bfb3">3 Agents</Badge>
              </div>
              <p className="text-xs text-text-muted leading-relaxed">
                Three specialized agents orchestrated by an Elastic Workflow:
                <strong className="text-elastic"> Triage Agent</strong> (FORK/FUSE/RRF search, severity classification),
                <strong className="text-agent-blue"> Investigation Agent</strong> (significant_terms, pipeline aggs, percolate, blast radius),
                <strong className="text-agent-purple"> PostMortem Agent</strong> (blameless post-mortem, Slack/Jira, audit).
                Each agent has its own tool set and hands off findings to the next.
              </p>
            </div>
          </div>

          {/* Agent Flow with handoff arrows */}
          <div className="mt-4 flex items-center justify-center gap-3">
            {(['triage-agent', 'investigation-agent', 'postmortem-agent'] as AgentName[]).map((agent, i) => (
              <div key={agent} className="flex items-center gap-3">
                <div
                  className="flex items-center gap-2 rounded-lg border px-4 py-2.5"
                  style={{ borderColor: `${agentColors[agent]}40`, backgroundColor: `${agentColors[agent]}10` }}
                >
                  <Bot className="h-4 w-4" style={{ color: agentColors[agent] }} />
                  <div>
                    <span className="text-[11px] font-bold block" style={{ color: agentColors[agent] }}>
                      {agentLabels[agent]}
                    </span>
                    <span className="text-[9px] text-text-dim">
                      {agent === 'triage-agent' && 'hybrid_rag_search, error_trends'}
                      {agent === 'investigation-agent' && 'significant_terms, percolate'}
                      {agent === 'postmortem-agent' && 'report, slack, jira'}
                    </span>
                  </div>
                </div>
                {i < 2 && (
                  <div className="flex flex-col items-center">
                    <ArrowRight className="h-4 w-4 text-text-dim" />
                    <span className="text-[8px] text-text-dim font-mono">handoff</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Filter Tabs by Agent */}
        <div className="flex items-center gap-2">
          {filterTypes.map(type => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              aria-label={`Filter by ${type === 'all' ? 'all activity' : agentLabels[type as AgentName]}`}
              aria-pressed={filter === type}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                filter === type
                  ? 'bg-elastic/15 text-elastic border border-elastic/30'
                  : 'text-text-muted hover:bg-surface-2 border border-transparent'
              }`}
              style={
                type !== 'all' && filter === type
                  ? { backgroundColor: `${agentColors[type as AgentName]}15`, color: agentColors[type as AgentName], borderColor: `${agentColors[type as AgentName]}30` }
                  : undefined
              }
            >
              {type === 'all' ? 'All Activity' : agentLabels[type as AgentName]}
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
                {filtered.map((a, idx) => {
                  // Detect agent handoff
                  const prevAgent = idx > 0 ? filtered[idx - 1].agent : null
                  const isHandoff = prevAgent !== null && prevAgent !== a.agent

                  return (
                    <div key={a.id}>
                      {/* Handoff indicator */}
                      {isHandoff && (
                        <div className="relative pl-10 mb-4">
                          <div className="absolute left-2 top-1 h-4 w-4 flex items-center justify-center">
                            <ArrowDownRight className="h-3.5 w-3.5 text-elastic" />
                          </div>
                          <div className="flex items-center gap-2 rounded-lg border border-elastic/20 bg-elastic-bg px-3 py-1.5">
                            <span className="text-[10px] font-mono text-elastic">HANDOFF</span>
                            <span className="text-[10px] text-text-dim">
                              {agentLabels[prevAgent!]} {"\u2192"} {agentLabels[a.agent]}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="relative pl-10 animate-fade-in-up">
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
                              <Badge color={phaseColors[a.phase]} className="text-[9px]">{phaseLabels[a.phase]}</Badge>
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
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
