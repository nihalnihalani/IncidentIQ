import { TopBar } from '@/components/layout/top-bar'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatusDot } from '@/components/ui/status-dot'
import { PipelineViz } from '@/components/ui/pipeline-viz'
import { EsqlBlock } from '@/components/ui/esql-block'
import {
  incidents,
  pipelineSteps,
  significantTermsData,
  errorTrendData,
  agentActivities,
  agentColors,
  agentLabels,
} from '@/data/mock'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  ReferenceLine,
} from 'recharts'
import { AlertTriangle, Clock, Layers, TrendingUp, BarChart3, GitBranch } from 'lucide-react'

export function IncidentPage() {
  const incident = incidents[0]

  return (
    <div className="min-h-screen">
      <TopBar title="Incident Investigation" />

      <div className="p-6 space-y-6">
        {/* Incident Header */}
        <Card glow>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Badge variant="critical" pulse>{incident.severity}</Badge>
                <span className="font-mono text-xs text-text-dim">{incident.id}</span>
                <Badge color={agentColors[incident.assignedAgent]}>{agentLabels[incident.assignedAgent]}</Badge>
              </div>
              <h2 className="text-lg font-bold text-text">{incident.title}</h2>
              <p className="mt-1 text-sm text-text-muted">{incident.description}</p>
              <div className="mt-3 flex items-center gap-4 text-xs text-text-dim">
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Started 03:02 AM</span>
                <span className="flex items-center gap-1"><Layers className="h-3 w-3" /> {incident.affectedServices} services affected</span>
                <span className="flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> {incident.errorRate}% error rate</span>
              </div>
            </div>
            <StatusDot status="running" size="lg" />
          </div>
        </Card>

        {/* FORK -> FUSE -> RERANK Pipeline */}
        <Card>
          <CardHeader>
            <CardTitle>
              <div className="flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-elastic" />
                FORK \u2192 FUSE \u2192 RERANK Pipeline
              </div>
            </CardTitle>
            <Badge color="#00bfb3">Hidden Gem: ES|QL RAG</Badge>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-text-muted mb-3">
              A single ES|QL query performs hybrid search, RRF fusion, and semantic reranking -- no Python, no LangChain, just ES|QL.
            </p>
            <PipelineViz steps={pipelineSteps} className="mb-4" />
            <EsqlBlock
              query='FROM incident-knowledge METADATA _score | FORK (WHERE MATCH(title, "orders 500 connection pool") | SORT _score DESC | LIMIT 30) (WHERE MATCH(content, "orders 500 connection pool") | SORT _score DESC | LIMIT 30) | FUSE RRF WITH {"rank_constant": 60} | RERANK "orders 500 connection pool" ON content WITH {"inference_id": ".rerank-v1-elasticsearch"} | LIMIT 5'
              className="mt-3"
            />
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-6">
          {/* Significant Terms */}
          <Card>
            <CardHeader>
              <CardTitle>
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-agent-blue" />
                  significant_terms -- Root Cause
                </div>
              </CardTitle>
              <Badge color="#4488ff">Hidden Gem</Badge>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-text-muted mb-3">
                Not the most COMMON errors -- the most STATISTICALLY UNUSUAL ones. The root cause is <strong className="text-critical font-mono">connection_pool_exhausted</strong> (score: 97.1).
              </p>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={significantTermsData} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
                    <XAxis type="number" tick={{ fill: '#8888a8', fontSize: 10 }} />
                    <YAxis
                      type="category"
                      dataKey="term"
                      tick={{ fill: '#8888a8', fontSize: 9, fontFamily: 'monospace' }}
                      width={180}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#12121a', border: '1px solid #2a2a3e', borderRadius: 8, fontSize: 11 }}
                      labelStyle={{ color: '#e8e8f0' }}
                    />
                    <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                      {significantTermsData.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={entry.significance === 'critical' ? '#ff4444' : entry.significance === 'high' ? '#ff8c00' : '#ffd000'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 space-y-1">
                {significantTermsData.slice(0, 3).map(t => (
                  <div key={t.term} className="flex items-center justify-between text-[11px]">
                    <span className="font-mono text-text">{t.term}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-text-dim">bg: {t.bgCount}</span>
                      <span className="text-text-dim">doc: {t.docCount}</span>
                      <span className="font-bold" style={{ color: t.significance === 'critical' ? '#ff4444' : '#ff8c00' }}>
                        score: {t.score}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Error Trend with Acceleration */}
          <Card>
            <CardHeader>
              <CardTitle>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-critical" />
                  Error Rate -- Acceleration Detected
                </div>
              </CardTitle>
              <Badge variant="critical" pulse>+22%/min acceleration</Badge>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-text-muted mb-3">
                Pipeline aggregations (derivative + cumulative_sum) show exponential growth. <strong className="text-critical">SLA breach predicted in 8 minutes</strong> without intervention.
              </p>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={errorTrendData}>
                    <defs>
                      <linearGradient id="errorGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ff4444" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#ff4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
                    <XAxis dataKey="time" tick={{ fill: '#8888a8', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#8888a8', fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#12121a', border: '1px solid #2a2a3e', borderRadius: 8, fontSize: 11 }}
                    />
                    <ReferenceLine y={50} stroke="#ff8c00" strokeDasharray="4 4" label={{ value: 'SLA Threshold', fill: '#ff8c00', fontSize: 9, position: 'right' }} />
                    <Area
                      type="monotone"
                      dataKey="baseline"
                      stroke="#555570"
                      strokeDasharray="4 4"
                      fill="none"
                      strokeWidth={1}
                    />
                    <Area
                      type="monotone"
                      dataKey="errors"
                      stroke="#ff4444"
                      fill="url(#errorGrad)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              {/* Acceleration indicator */}
              <div className="mt-3 flex items-center gap-4">
                <div className="rounded-lg border border-critical/30 bg-critical-bg px-3 py-1.5">
                  <span className="text-[10px] text-text-dim">Velocity</span>
                  <p className="text-sm font-bold font-mono text-critical">+22%/min</p>
                </div>
                <div className="rounded-lg border border-high/30 bg-high-bg px-3 py-1.5">
                  <span className="text-[10px] text-text-dim">Acceleration</span>
                  <p className="text-sm font-bold font-mono text-high">+4.2%/min\u00B2</p>
                </div>
                <div className="rounded-lg border border-critical/30 bg-critical-bg px-3 py-1.5">
                  <span className="text-[10px] text-text-dim">SLA Breach In</span>
                  <p className="text-sm font-bold font-mono text-critical">~8 min</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Investigation Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Investigation Timeline</CardTitle>
            <span className="text-xs text-text-dim">OpsAgent + Workflow Engine actions</span>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <div className="absolute left-3 top-0 bottom-0 w-px bg-border" />
              <div className="space-y-4">
                {agentActivities.map(a => (
                  <div key={a.id} className="relative pl-8 animate-fade-in-up">
                    <div
                      className="absolute left-1.5 top-1 h-3 w-3 rounded-full border-2"
                      style={{ borderColor: agentColors[a.agent], backgroundColor: `${agentColors[a.agent]}30` }}
                    />
                    <div className="rounded-lg border border-border bg-surface-2 p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge color={agentColors[a.agent]} className="text-[10px]">{agentLabels[a.agent]}</Badge>
                        <span className="text-xs font-medium text-text">{a.action}</span>
                        <StatusDot status={a.status} size="sm" />
                        <span className="ml-auto text-[10px] font-mono text-text-dim">
                          {new Date(a.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                        </span>
                      </div>
                      <p className="text-xs text-text-muted">{a.detail}</p>
                      {a.esqlQuery && <EsqlBlock query={a.esqlQuery} className="mt-2" />}
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
