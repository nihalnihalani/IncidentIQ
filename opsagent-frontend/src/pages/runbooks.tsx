import { TopBar } from '@/components/layout/top-bar'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DataState } from '@/components/ui/data-state'
import { DotPattern } from '@/components/ui/dot-pattern'
import { useRunbooks } from '@/hooks/use-runbooks'
import type { Runbook, RunbookCategory } from '@/data/mock'
import { BookOpen, Search, ChevronDown, ChevronUp, Tag, ShieldAlert, Wrench, Eye, ShieldCheck } from 'lucide-react'
import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const categories: { value: RunbookCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'database', label: 'Database' },
  { value: 'microservices', label: 'Microservices' },
  { value: 'application', label: 'Application' },
  { value: 'infrastructure', label: 'Infrastructure' },
  { value: 'security', label: 'Security' },
]

const severityConfig: Record<string, { color: string; variant: 'critical' | 'high' | 'medium' }> = {
  P1: { color: '#ff4444', variant: 'critical' },
  P2: { color: '#ff8c00', variant: 'high' },
  P3: { color: '#4488ff', variant: 'medium' },
}

function parseSteps(raw: string): string[] {
  return raw.split(/\d+\.\s+/).filter(Boolean).map((s) => s.trim().replace(/\.$/, ''))
}

export function RunbooksPage() {
  const [activeCategory, setActiveCategory] = useState<RunbookCategory | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0)

  const { data: runbooks, loading, error } = useRunbooks()

  const filtered = useMemo(() => {
    let list: Runbook[] = runbooks
    if (activeCategory !== 'all') {
      list = list.filter((r) => r.category === activeCategory)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.symptoms.toLowerCase().includes(q) ||
          r.tags.some((t) => t.toLowerCase().includes(q))
      )
    }
    return list
  }, [runbooks, activeCategory, searchQuery])

  return (
    <div className="relative min-h-screen">
      <DotPattern className="[mask-image:radial-gradient(ellipse_at_center,white_15%,transparent_70%)] opacity-40" />

      <TopBar title="Runbooks & Knowledge Base" />

      <div className="relative p-6 space-y-6">
        {/* Header card */}
        <Card glow>
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-agent-purple/15">
              <BookOpen className="h-5 w-5 text-agent-purple" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-bold text-text">Operational Runbooks</h3>
                <Badge color="#8844ff">{runbooks.length} Runbooks</Badge>
              </div>
              <p className="text-xs text-text-muted leading-relaxed">
                Standard operating procedures for diagnosing and remediating common infrastructure incidents.
                Each runbook contains symptoms, root cause analysis, step-by-step remediation, and prevention measures.
              </p>
            </div>
          </div>
        </Card>

        {/* Search + Category Filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-dim" />
            <input
              type="text"
              placeholder="Search runbooks by title, symptom, or tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface pl-10 pr-4 py-2 text-sm text-text placeholder:text-text-dim focus:border-elastic focus:outline-none focus:ring-1 focus:ring-elastic/30"
            />
          </div>

          <div className="flex gap-1.5 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(cat.value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  activeCategory === cat.value
                    ? 'bg-elastic/15 text-elastic border border-elastic/30'
                    : 'bg-surface-2 text-text-muted border border-border hover:border-border-bright hover:text-text'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Runbook Cards */}
        <DataState loading={loading} error={error} isEmpty={filtered.length === 0}>
          <div className="space-y-3">
            {filtered.map((runbook, idx) => {
              const expanded = expandedIndex === idx
              const sev = severityConfig[runbook.severity] ?? severityConfig.P3
              const steps = parseSteps(runbook.remediationSteps)

              return (
                <Card
                  key={runbook.title}
                  onClick={() => setExpandedIndex(expanded ? null : idx)}
                  className="cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div
                        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                        style={{ backgroundColor: `${sev.color}15`, color: sev.color }}
                      >
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <h4 className="text-sm font-semibold text-text">{runbook.title}</h4>
                          <Badge variant={sev.variant}>{runbook.severity}</Badge>
                          <Badge color="#8844ff">{runbook.category}</Badge>
                        </div>
                        <p className="text-xs text-text-muted line-clamp-2">{runbook.symptoms}</p>

                        <AnimatePresence>
                          {expanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-4 space-y-4">
                                {/* Symptoms */}
                                <div>
                                  <div className="flex items-center gap-1.5 mb-1.5">
                                    <Eye className="h-3 w-3 text-agent-amber" />
                                    <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider">Symptoms</p>
                                  </div>
                                  <p className="text-xs text-text-muted leading-relaxed">{runbook.symptoms}</p>
                                </div>

                                {/* Root Cause */}
                                <div>
                                  <div className="flex items-center gap-1.5 mb-1.5">
                                    <ShieldAlert className="h-3 w-3 text-critical" />
                                    <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider">Root Cause</p>
                                  </div>
                                  <p className="text-xs text-text-muted leading-relaxed">{runbook.rootCause}</p>
                                </div>

                                {/* Remediation Steps */}
                                <div>
                                  <div className="flex items-center gap-1.5 mb-1.5">
                                    <Wrench className="h-3 w-3 text-elastic" />
                                    <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider">Remediation Steps</p>
                                  </div>
                                  <ol className="space-y-1.5 ml-1">
                                    {steps.map((step, i) => (
                                      <li key={i} className="flex gap-2 text-xs text-text-muted">
                                        <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded bg-elastic/10 text-[10px] font-bold text-elastic">
                                          {i + 1}
                                        </span>
                                        <span className="leading-relaxed pt-0.5">{step}</span>
                                      </li>
                                    ))}
                                  </ol>
                                </div>

                                {/* Prevention */}
                                <div>
                                  <div className="flex items-center gap-1.5 mb-1.5">
                                    <ShieldCheck className="h-3 w-3 text-low" />
                                    <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider">Prevention</p>
                                  </div>
                                  <p className="text-xs text-text-muted leading-relaxed">{runbook.prevention}</p>
                                </div>

                                {/* Tags */}
                                <div>
                                  <div className="flex items-center gap-1.5 mb-1.5">
                                    <Tag className="h-3 w-3 text-text-dim" />
                                    <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider">Tags</p>
                                  </div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {runbook.tags.map((tag) => (
                                      <span
                                        key={tag}
                                        className="rounded-md bg-surface-3 px-2 py-0.5 text-[10px] font-mono text-text-dim"
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                    <div className="shrink-0 ml-3">
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
        </DataState>
      </div>
    </div>
  )
}
