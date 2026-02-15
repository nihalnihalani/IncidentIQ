import { TopBar } from '@/components/layout/top-bar'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EsqlBlock } from '@/components/ui/esql-block'
import { alertRules, severityColors } from '@/data/mock'
import type { Severity } from '@/data/mock'
import { Bell, ArrowRightLeft, Zap, Clock, Hash, ChevronDown, ChevronUp, MessageSquare, Ticket } from 'lucide-react'
import { DotPattern } from '@/components/ui/dot-pattern'
import { useState } from 'react'

export function AlertsPage() {
  const [expandedRule, setExpandedRule] = useState<string | null>('1')

  return (
    <div className="relative min-h-screen">
      <DotPattern className="[mask-image:radial-gradient(ellipse_at_center,white_15%,transparent_70%)] opacity-40" />

      <TopBar title="Alert Rules (Percolate)" />

      <div className="relative p-6 space-y-6">
        {/* Percolate Explainer */}
        <Card glow>
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-agent-amber/15">
              <ArrowRightLeft className="h-5 w-5 text-agent-amber" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-bold text-text">Reverse Search with Percolate Queries</h3>
                <Badge color="#ffaa00">Hidden Gem</Badge>
              </div>
              <p className="text-xs text-text-muted leading-relaxed">
                Traditional search: find <strong>documents</strong> matching a query.
                Percolate: find <strong>queries</strong> matching a document.
                When orders-service went down at 3 AM, the incident document was percolated against all stored rules -- <strong className="text-agent-amber">3 rules matched instantly</strong>, triggering Slack, Jira, and audit logging.
              </p>
              <div className="mt-3 flex items-center gap-6 text-xs">
                <div className="flex items-center gap-1.5 text-text-dim">
                  <Hash className="h-3 w-3" />
                  <span className="font-mono">{alertRules.length} rules registered</span>
                </div>
                <div className="flex items-center gap-1.5 text-text-dim">
                  <Zap className="h-3 w-3" />
                  <span className="font-mono">{alertRules.reduce((s, r) => s + r.matchCount, 0)} total matches</span>
                </div>
              </div>

              {/* Percolate flow diagram */}
              <div className="mt-4 flex items-center gap-3">
                <div className="rounded-lg border border-critical/30 bg-critical-bg px-3 py-2 text-center">
                  <p className="text-[10px] text-text-dim">Incident Doc</p>
                  <p className="text-xs font-mono text-critical">INC-4091</p>
                </div>
                <div className="text-text-dim text-xs">\u2192 percolated against \u2192</div>
                <div className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-center">
                  <p className="text-[10px] text-text-dim">Stored Rules</p>
                  <p className="text-xs font-mono text-text">18 queries</p>
                </div>
                <div className="text-text-dim text-xs">\u2192 matched \u2192</div>
                <div className="flex items-center gap-2">
                  <div className="rounded-lg border border-agent-amber/30 bg-agent-amber/10 px-2 py-1.5 flex items-center gap-1">
                    <MessageSquare className="h-3 w-3 text-agent-amber" />
                    <span className="text-[9px] text-agent-amber">Slack</span>
                  </div>
                  <div className="rounded-lg border border-agent-purple/30 bg-agent-purple/10 px-2 py-1.5 flex items-center gap-1">
                    <Ticket className="h-3 w-3 text-agent-purple" />
                    <span className="text-[9px] text-agent-purple">Jira</span>
                  </div>
                  <div className="rounded-lg border border-elastic/30 bg-elastic-bg px-2 py-1.5 flex items-center gap-1">
                    <Zap className="h-3 w-3 text-elastic" />
                    <span className="text-[9px] text-elastic">Auto-fix</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Alert Rules */}
        <div className="space-y-3">
          {alertRules.map(rule => {
            const expanded = expandedRule === rule.id
            return (
              <Card
                key={rule.id}
                onClick={() => setExpandedRule(expanded ? null : rule.id)}
                className="cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div
                      className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                      style={{
                        backgroundColor: `${severityColors[rule.severity]}15`,
                        color: severityColors[rule.severity],
                      }}
                    >
                      <Bell className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="text-sm font-semibold text-text">{rule.name}</h4>
                        <Badge variant={rule.severity as Severity}>{rule.severity}</Badge>
                        {(rule.createdBy === 'AI-Generated' || rule.createdBy === 'OpsAgent AI') && (
                          <Badge color="#00bfb3">AI-Generated</Badge>
                        )}
                      </div>
                      <p className="text-xs text-text-muted">{rule.description}</p>

                      <div className="mt-2 flex items-center gap-4 text-[11px] text-text-dim">
                        <span className="flex items-center gap-1">
                          <Hash className="h-3 w-3" />
                          {rule.matchCount} matches
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Last: {new Date(rule.lastTriggered).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                        </span>
                        <span className="text-text-dim">by {rule.createdBy}</span>
                      </div>

                      {/* Workflow action */}
                      {rule.workflowAction && (
                        <div className="mt-2 flex items-center gap-1.5">
                          <Zap className="h-3 w-3 text-agent-amber" />
                          <span className="text-[10px] font-mono text-agent-amber">Action: {rule.workflowAction}</span>
                        </div>
                      )}

                      {expanded && (
                        <div className="mt-3 space-y-3 animate-fade-in-up">
                          <div>
                            <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider mb-1">Condition</p>
                            <code className="text-xs font-mono text-elastic bg-elastic-bg rounded px-2 py-1">
                              {rule.condition}
                            </code>
                          </div>
                          <div>
                            <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider mb-1">Percolate Query (stored in Elasticsearch)</p>
                            <EsqlBlock query={rule.percolateQuery} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <div
                      className={`h-2 w-6 rounded-full ${rule.active ? 'bg-low' : 'bg-text-dim'}`}
                    />
                    {expanded ? (
                      <ChevronUp className="h-4 w-4 text-text-dim" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-text-dim" />
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
