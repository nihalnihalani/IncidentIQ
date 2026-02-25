import { TopBar } from '@/components/layout/top-bar'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EsqlBlock } from '@/components/ui/esql-block'
import { DotPattern } from '@/components/ui/dot-pattern'
import { motion } from 'framer-motion'
import { Database, Sparkles, Zap, Search, Bot, Wrench } from 'lucide-react'

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

interface QueryShowcase {
  title: string
  agent: string
  agentColor: string
  tool: string
  query: string
  badge: string
  badgeColor: string
  description: string
  isEsql: boolean
}

const queries: QueryShowcase[] = [
  {
    title: 'Hybrid RAG Search (FORK / FUSE / RRF)',
    agent: 'Triage Agent',
    agentColor: '#00bfb3',
    tool: 'hybrid_rag_search',
    query: `FROM incident-knowledge METADATA _score
| FORK (WHERE MATCH(title, ?query) | SORT _score DESC | LIMIT 30)
       (WHERE MATCH(content, ?query) | SORT _score DESC | LIMIT 30)
| FUSE RRF WITH {"rank_constant": 60}
| LIMIT 5`,
    badge: 'Hidden Gem: FORK/FUSE',
    badgeColor: '#ff8c00',
    description:
      'A single query performs parallel lexical search, then merges results using Reciprocal Rank Fusion. No Python, no LangChain.',
    isEsql: true,
  },
  {
    title: 'Anomaly Detection (significant_terms)',
    agent: 'Investigation Agent',
    agentColor: '#4488ff',
    tool: 'anomaly_detector',
    query: `FROM logs-opsagent
| WHERE @timestamp > NOW() - 1 HOUR AND service.name == ?service
| STATS doc_count = COUNT(*) BY error.type
| SORT doc_count DESC
| LIMIT 10`,
    badge: 'Hidden Gem: significant_terms',
    badgeColor: '#ff8c00',
    description:
      'Finds statistically unusual error types, not just the most common ones. Root cause: connection_pool_exhausted (score: 97.1)',
    isEsql: true,
  },
  {
    title: 'Error Trend Analysis (Pipeline Aggregations)',
    agent: 'Investigation Agent',
    agentColor: '#4488ff',
    tool: 'error_trend_analysis',
    query: `FROM logs-opsagent
| WHERE @timestamp > NOW() - 3 HOURS AND service.name == ?service AND log.level == "ERROR"
| EVAL bucket = DATE_TRUNC(5 MINUTES, @timestamp)
| STATS error_count = COUNT(*) BY bucket
| SORT bucket ASC`,
    badge: 'Hidden Gem: Pipeline Aggs',
    badgeColor: '#ff8c00',
    description:
      'Derivative + cumulative_sum detect acceleration: errors growing at +22%/min. SLA breach predicted in 12 minutes.',
    isEsql: true,
  },
  {
    title: 'Reverse Alert Matching (Percolate)',
    agent: 'Investigation Agent',
    agentColor: '#4488ff',
    tool: 'platform.core.search (percolate)',
    query: `POST /alert-rules/_search
{ "query": { "percolate": { "field": "query", "document": { "service.name": "order-service", "log.level": "ERROR", "error.type": "connection_pool_exhausted" } } } }`,
    badge: 'Hidden Gem: Percolate',
    badgeColor: '#ff8c00',
    description:
      'Alerts search for incidents, not the other way around. 18 stored rules, 3 matched instantly.',
    isEsql: false,
  },
  {
    title: 'Runbook Symptom Search (Full-Text with Scoring)',
    agent: 'Triage + PostMortem',
    agentColor: '#8844ff',
    tool: 'search_runbooks_by_symptom',
    query: `FROM runbooks METADATA _score
| WHERE MATCH(symptoms, ?symptom_text)
| KEEP title, severity, symptoms, root_cause, remediation_steps, prevention, _score
| SORT _score DESC
| LIMIT 5`,
    badge: 'MATCH + METADATA _score',
    badgeColor: '#4488ff',
    description:
      'Full-text search with relevance scoring across symptom descriptions. Finds the right runbook for any observed symptom.',
    isEsql: true,
  },
  {
    title: 'Infrastructure Correlation (Host Metrics)',
    agent: 'Investigation Agent',
    agentColor: '#4488ff',
    tool: 'analyze_host_metrics',
    query: `FROM infra-metrics
| WHERE @timestamp > NOW() - 3 HOURS
| STATS avg_cpu = AVG(system.cpu.total.pct), max_cpu = MAX(system.cpu.total.pct),
        avg_mem = AVG(system.memory.used.pct), max_mem = MAX(system.memory.used.pct),
        avg_disk = AVG(system.disk.used.pct)
  BY host.name, service.name
| SORT avg_cpu DESC`,
    badge: 'STATS + BY',
    badgeColor: '#4488ff',
    description:
      'Aggregates CPU, memory, and disk metrics per host to identify infrastructure bottlenecks.',
    isEsql: true,
  },
  {
    title: 'Host Timeline (5-minute Buckets)',
    agent: 'Investigation Agent',
    agentColor: '#4488ff',
    tool: 'correlate_host_timeline',
    query: `FROM infra-metrics
| WHERE @timestamp > NOW() - 3 HOURS AND host.name == ?host
| EVAL bucket = DATE_TRUNC(5 MINUTES, @timestamp)
| STATS avg_cpu = AVG(system.cpu.total.pct), avg_mem = AVG(system.memory.used.pct)
  BY bucket
| SORT bucket ASC`,
    badge: 'DATE_TRUNC',
    badgeColor: '#4488ff',
    description:
      'Time-series correlation showing exactly when host metrics spiked relative to the incident.',
    isEsql: true,
  },
  {
    title: 'Service Error Breakdown',
    agent: 'Investigation Agent',
    agentColor: '#4488ff',
    tool: 'service_error_breakdown',
    query: `FROM logs-opsagent
| WHERE @timestamp > NOW() - 1 HOUR AND log.level == "ERROR"
| STATS error_count = COUNT(*), services = COUNT_DISTINCT(service.name) BY error.type
| SORT error_count DESC
| LIMIT 10`,
    badge: 'COUNT_DISTINCT',
    badgeColor: '#4488ff',
    description:
      'Breaks down errors by type across all services to identify the blast radius.',
    isEsql: true,
  },
]

const hiddenGemCount = queries.filter((q) => q.badge.startsWith('Hidden Gem')).length

/* ------------------------------------------------------------------ */
/*  Stats hero                                                         */
/* ------------------------------------------------------------------ */

const stats = [
  { label: 'ES|QL Queries', value: `${queries.length}+`, icon: Database, color: '#00bfb3' },
  { label: 'Lines of Python for Search', value: '0', icon: Zap, color: '#4488ff' },
  { label: 'Hidden Gems', value: String(hiddenGemCount), icon: Sparkles, color: '#ff8c00' },
]

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export function EsqlShowcasePage() {
  return (
    <div className="relative min-h-screen">
      <DotPattern className="[mask-image:radial-gradient(ellipse_at_center,white_15%,transparent_70%)] opacity-40" />

      <TopBar title="ES|QL Query Showcase" />

      <div className="relative p-6 space-y-6">
        {/* Hero / Stats */}
        <Card glow beam beamColor="#00bfb3" beamColorTo="#ff8c00">
          <div className="flex items-start gap-4 mb-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-elastic/15">
              <Search className="h-5 w-5 text-elastic" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text">
                Every query the agents use -- zero custom search code
              </h3>
              <p className="text-xs text-text-muted mt-1 leading-relaxed max-w-2xl">
                Our multi-agent system relies entirely on ES|QL and native Elasticsearch features for
                search, analytics, and anomaly detection. No LangChain retrievers, no Python glue --
                just declarative queries the Agent Builder executes directly.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {stats.map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-3 rounded-lg border border-border bg-background p-3"
              >
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${s.color}15` }}
                >
                  <s.icon className="h-4.5 w-4.5" style={{ color: s.color }} />
                </div>
                <div>
                  <p className="text-lg font-bold text-text leading-none">{s.value}</p>
                  <p className="text-[11px] text-text-muted mt-0.5">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Query cards */}
        <div className="space-y-4 stagger-children">
          {queries.map((q, idx) => (
            <motion.div
              key={q.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: idx * 0.06 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2 flex-wrap">
                    <CardTitle>{q.title}</CardTitle>
                    <Badge color={q.badgeColor}>{q.badge}</Badge>
                  </div>
                </CardHeader>

                <CardContent>
                  {/* Meta labels */}
                  <div className="flex items-center gap-3 mb-3">
                    <span className="inline-flex items-center gap-1.5 text-[11px] text-text-muted">
                      <Bot className="h-3 w-3" style={{ color: q.agentColor }} />
                      <span className="font-medium" style={{ color: q.agentColor }}>
                        {q.agent}
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[11px] text-text-dim">
                      <Wrench className="h-3 w-3" />
                      <span className="font-mono">{q.tool}</span>
                    </span>
                  </div>

                  {/* Query */}
                  <EsqlBlock query={q.query} />

                  {/* Description */}
                  <p className="mt-3 text-xs text-text-muted leading-relaxed">{q.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
