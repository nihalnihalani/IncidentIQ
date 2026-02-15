import { TopBar } from '@/components/layout/top-bar'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PipelineViz } from '@/components/ui/pipeline-viz'
import { EsqlBlock } from '@/components/ui/esql-block'
import { pipelineSteps } from '@/data/mock'
import {
  Play,
  Pause,
  ChevronRight,
  AlertTriangle,
  GitBranch,
  BarChart3,
  ArrowRightLeft,
  TrendingUp,
  MessageSquare,
  Ticket,
  Zap,
  CheckCircle,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

interface StoryBeat {
  id: number
  time: string
  title: string
  narrator: string
  icon: React.ReactNode
  route: string
  hiddenGem?: string
  content: React.ReactNode
}

export function DemoPage() {
  const navigate = useNavigate()
  const [activeStep, setActiveStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [elapsed, setElapsed] = useState(0)

  const story: StoryBeat[] = [
    {
      id: 0,
      time: '3:00 AM',
      title: 'The Incident Begins',
      narrator: 'It\'s 3 AM. Your phone hasn\'t rung yet. But the orders-service just started returning 500s. Customers can\'t checkout. Revenue is bleeding at $12,000 per minute. Nobody knows yet.',
      icon: <AlertTriangle className="h-5 w-5" />,
      route: '/',
      content: (
        <div className="space-y-4">
          <div className="rounded-lg border border-critical/30 bg-critical-bg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-critical animate-pulse-glow" />
              <span className="text-sm font-bold text-critical">orders-service: DOWN</span>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-3">
              <div className="text-center">
                <p className="text-2xl font-bold font-mono text-critical">34.7%</p>
                <p className="text-[10px] text-text-dim">Error Rate</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold font-mono text-high">$12k</p>
                <p className="text-[10px] text-text-dim">Revenue/min Lost</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold font-mono text-text">5</p>
                <p className="text-[10px] text-text-dim">Services Affected</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-text-dim italic">
            But our system is already awake. The OpsAgent detected the anomaly 30 seconds ago and is already investigating...
          </p>
        </div>
      ),
    },
    {
      id: 1,
      time: '3:02 AM',
      title: 'OpsAgent Searches Past Incidents',
      narrator: 'The OpsAgent runs a FORK/FUSE/RERANK pipeline -- a single ES|QL query that does hybrid search, RRF fusion, and ML reranking. No Python. No LangChain. Just ES|QL.',
      icon: <GitBranch className="h-5 w-5" />,
      route: '/incident',
      hiddenGem: 'FORK/FUSE/RERANK',
      content: (
        <div className="space-y-4">
          <PipelineViz steps={pipelineSteps} />
          <EsqlBlock query='FROM incident-knowledge METADATA _score | FORK (WHERE MATCH(title, "orders 500 connection pool") | SORT _score DESC | LIMIT 30) (WHERE MATCH(content, "orders 500 connection pool") | SORT _score DESC | LIMIT 30) | FUSE RRF | RERANK "orders 500 connection pool" ON content | LIMIT 5' />
          <p className="text-xs text-elastic">
            Result: Found 3 similar past incidents. All involved connection pool exhaustion.
          </p>
        </div>
      ),
    },
    {
      id: 2,
      time: '3:03 AM',
      title: 'Root Cause: The Surprising Error',
      narrator: 'The agent doesn\'t look for the most COMMON error. It uses significant_terms to find the most STATISTICALLY UNUSUAL one. The root cause isn\'t "timeout_error" (2,341 occurrences) -- it\'s "connection_pool_exhausted" (score: 97.1).',
      icon: <BarChart3 className="h-5 w-5" />,
      route: '/incident',
      hiddenGem: 'significant_terms',
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border bg-surface-2 p-3">
              <p className="text-[10px] text-text-dim uppercase tracking-wider mb-2">Regular terms aggregation</p>
              <p className="text-xs font-mono text-text-muted">timeout_error: 2,341</p>
              <p className="text-xs font-mono text-text-muted">null_pointer: 1,892</p>
              <p className="text-xs font-mono text-text-muted">connection_reset: 1,456</p>
              <p className="text-[10px] text-text-dim mt-2 italic">Most common, but not the cause.</p>
            </div>
            <div className="rounded-lg border border-agent-blue/30 bg-agent-blue/5 p-3 glow-border">
              <p className="text-[10px] text-agent-blue uppercase tracking-wider mb-2">significant_terms</p>
              <p className="text-xs font-mono text-text font-bold">connection_pool_exhausted</p>
              <p className="text-xs font-mono text-text-dim">bg: 8 | doc: 1,247 | score: <strong className="text-critical">97.1</strong></p>
              <p className="text-[10px] text-elastic mt-2">Root cause found in 45 seconds.</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 3,
      time: '3:04 AM',
      title: 'Alerts Search for the Incident',
      narrator: 'We don\'t search FOR alerts -- alerts search for INCIDENTS. The incident document is percolated against 18 stored rules. 3 match instantly. Workflows fire.',
      icon: <ArrowRightLeft className="h-5 w-5" />,
      route: '/alerts',
      hiddenGem: 'Percolate Queries',
      content: (
        <div className="space-y-4">
          <div className="flex items-center gap-3 justify-center">
            <div className="rounded-lg border border-critical/30 bg-critical-bg px-4 py-3 text-center">
              <p className="text-[10px] text-text-dim">Incident</p>
              <p className="text-sm font-mono text-critical font-bold">INC-4091</p>
            </div>
            <div className="text-text-dim">\u2192 percolated \u2192</div>
            <div className="rounded-lg border border-border bg-surface-2 px-4 py-3 text-center">
              <p className="text-[10px] text-text-dim">18 stored rules</p>
              <p className="text-sm font-mono text-agent-amber font-bold">3 matches</p>
            </div>
            <div className="text-text-dim">\u2192 triggers \u2192</div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 rounded border border-agent-amber/30 bg-agent-amber/10 px-2 py-1">
                <MessageSquare className="h-3 w-3 text-agent-amber" />
                <span className="text-[10px] text-agent-amber">Slack #incidents</span>
              </div>
              <div className="flex items-center gap-1.5 rounded border border-agent-purple/30 bg-agent-purple/10 px-2 py-1">
                <Ticket className="h-3 w-3 text-agent-purple" />
                <span className="text-[10px] text-agent-purple">Jira OPS-2847</span>
              </div>
              <div className="flex items-center gap-1.5 rounded border border-elastic/30 bg-elastic-bg px-2 py-1">
                <Zap className="h-3 w-3 text-elastic" />
                <span className="text-[10px] text-elastic">Auto-remediation</span>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 4,
      time: '3:04 AM',
      title: 'Error Rate Accelerating',
      narrator: 'Pipeline aggregations (derivative + cumulative_sum) show the error rate isn\'t just rising -- it\'s accelerating at +22%/min. Without intervention: total failure in 8 minutes.',
      icon: <TrendingUp className="h-5 w-5" />,
      route: '/incident',
      hiddenGem: 'Pipeline Aggregations',
      content: (
        <div className="space-y-4">
          <div className="flex items-center gap-4 justify-center">
            <div className="rounded-lg border border-critical/30 bg-critical-bg px-4 py-3 text-center">
              <span className="text-[10px] text-text-dim">Velocity</span>
              <p className="text-xl font-bold font-mono text-critical">+22%/min</p>
            </div>
            <div className="rounded-lg border border-high/30 bg-high-bg px-4 py-3 text-center">
              <span className="text-[10px] text-text-dim">Acceleration</span>
              <p className="text-xl font-bold font-mono text-high">+4.2%/min\u00B2</p>
            </div>
            <div className="rounded-lg border border-critical/30 bg-critical-bg px-4 py-3 text-center">
              <span className="text-[10px] text-text-dim">SLA Breach</span>
              <p className="text-xl font-bold font-mono text-critical">~8 min</p>
            </div>
          </div>
          <EsqlBlock query='FROM logs-* | WHERE @timestamp > NOW() - 30 MINUTES AND service.name == "orders-service" AND log.level == "ERROR" | EVAL bucket = DATE_TRUNC(5 MINUTES, @timestamp) | STATS error_count = COUNT(*) BY bucket | SORT bucket ASC' />
        </div>
      ),
    },
    {
      id: 5,
      time: '3:05 AM',
      title: 'Self-Healing Activated',
      narrator: 'The Workflow Engine doesn\'t just alert -- it acts. Connection pool scaled from 20 to 50. Service pods restarting. The on-call SRE wakes up to a Slack message saying the fix is already deployed.',
      icon: <CheckCircle className="h-5 w-5" />,
      route: '/agent-activity',
      content: (
        <div className="space-y-4">
          <div className="rounded-lg border border-elastic/30 bg-elastic-bg p-4">
            <p className="text-sm font-bold text-elastic mb-3">Autonomous Resolution</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle className="h-3.5 w-3.5 text-low" />
                <span className="text-text">Root cause identified: <span className="font-mono text-elastic">connection_pool_exhausted</span></span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle className="h-3.5 w-3.5 text-low" />
                <span className="text-text">Slack alert sent to <span className="font-mono text-agent-amber">#incidents-critical</span></span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle className="h-3.5 w-3.5 text-low" />
                <span className="text-text">Jira ticket created: <span className="font-mono text-agent-purple">OPS-2847</span></span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle className="h-3.5 w-3.5 text-low" />
                <span className="text-text">Connection pool scaled: <span className="font-mono">20 \u2192 50</span></span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Zap className="h-3.5 w-3.5 text-elastic animate-pulse-glow" />
                <span className="text-text font-medium">Service recovering... ETA 90 seconds</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-elastic/30 bg-surface-2 p-3 text-center">
              <p className="text-2xl font-bold text-elastic">3m 12s</p>
              <p className="text-[10px] text-text-dim">Time to Resolution</p>
              <p className="text-[9px] text-text-dim">vs. 47m manual</p>
            </div>
            <div className="rounded-lg border border-border bg-surface-2 p-3 text-center">
              <p className="text-2xl font-bold text-agent-blue">$36k</p>
              <p className="text-[10px] text-text-dim">Revenue Saved</p>
              <p className="text-[9px] text-text-dim">vs. $564k if manual</p>
            </div>
            <div className="rounded-lg border border-border bg-surface-2 p-3 text-center">
              <p className="text-2xl font-bold text-agent-purple">0</p>
              <p className="text-[10px] text-text-dim">Humans Woken Up</p>
              <p className="text-[9px] text-text-dim">SRE slept through it</p>
            </div>
          </div>
        </div>
      ),
    },
  ]

  useEffect(() => {
    if (!isPlaying) return
    const interval = setInterval(() => {
      setElapsed(prev => {
        const next = prev + 1
        if (next >= 180) {
          setIsPlaying(false)
          return 180
        }
        const newStep = Math.min(Math.floor(next / 30), story.length - 1)
        if (newStep !== activeStep) setActiveStep(newStep)
        return next
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [isPlaying, activeStep, story.length])

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`

  return (
    <div className="min-h-screen">
      <TopBar title="Demo Mode -- The 3 AM Incident" />

      <div className="p-6 space-y-6">
        {/* Timer + Controls */}
        <Card glow>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (!isPlaying && elapsed >= 180) { setElapsed(0); setActiveStep(0) }
                  setIsPlaying(!isPlaying)
                }}
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-elastic/15 text-elastic hover:bg-elastic/25 transition-colors"
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </button>
              <div>
                <p className="text-lg font-bold font-mono text-text tabular-nums">{formatTime(elapsed)} / 3:00</p>
                <p className="text-[10px] text-text-dim">{isPlaying ? 'Telling the story...' : 'Click play to begin the incident narrative'}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-critical font-mono">{story[activeStep].time}</p>
              <p className="text-xs text-text-dim">Step {activeStep + 1} of {story.length}</p>
            </div>
          </div>

          {/* Progress */}
          <div className="relative h-2 rounded-full bg-surface-3 overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-elastic transition-all duration-1000"
              style={{ width: `${(elapsed / 180) * 100}%` }}
            />
            {story.map((_, i) => (
              <div
                key={i}
                className="absolute top-0 bottom-0 w-px bg-border-bright"
                style={{ left: `${(i / story.length) * 100}%` }}
              />
            ))}
          </div>
        </Card>

        {/* Story Step Navigation */}
        <div className="grid grid-cols-6 gap-2">
          {story.map((beat, i) => (
            <button
              key={beat.id}
              onClick={() => { setActiveStep(i); setElapsed(i * 30) }}
              className={`rounded-lg border p-3 text-left transition-all ${
                i === activeStep
                  ? 'border-elastic/40 bg-elastic/10'
                  : i < activeStep
                  ? 'border-low/30 bg-low/5'
                  : 'border-border bg-surface-2 hover:bg-surface-3'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className={`${i === activeStep ? 'text-elastic' : i < activeStep ? 'text-low' : 'text-text-dim'}`}>
                  {beat.icon}
                </span>
                <span className={`text-[10px] font-mono ${i === activeStep ? 'text-critical' : 'text-text-dim'}`}>{beat.time}</span>
              </div>
              <p className={`text-[11px] font-medium leading-tight ${i === activeStep ? 'text-text' : 'text-text-muted'}`}>
                {beat.title}
              </p>
              {beat.hiddenGem && (
                <Badge color="#00bfb3" className="mt-1 text-[8px]">{beat.hiddenGem}</Badge>
              )}
            </button>
          ))}
        </div>

        {/* Active Story Beat */}
        <Card className="animate-fade-in-up" key={activeStep}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-bold font-mono text-critical">{story[activeStep].time}</span>
                <h3 className="text-lg font-bold text-text">{story[activeStep].title}</h3>
                {story[activeStep].hiddenGem && (
                  <Badge color="#00bfb3">{story[activeStep].hiddenGem}</Badge>
                )}
              </div>
            </div>
            <button
              onClick={() => navigate(story[activeStep].route)}
              className="flex items-center gap-1 rounded-lg border border-elastic/30 bg-elastic/10 px-3 py-1.5 text-xs font-medium text-elastic hover:bg-elastic/20 transition-colors"
            >
              Open Live View <ChevronRight className="h-3 w-3" />
            </button>
          </div>

          {/* Narrator text */}
          <div className="mb-4 rounded-lg border border-surface-3 bg-surface-2 p-4">
            <p className="text-sm text-text leading-relaxed italic">
              "{story[activeStep].narrator}"
            </p>
          </div>

          {story[activeStep].content}

          {/* Navigation */}
          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={() => { setActiveStep(Math.max(0, activeStep - 1)); setElapsed(Math.max(0, activeStep - 1) * 30) }}
              disabled={activeStep === 0}
              className="text-xs text-text-muted hover:text-text disabled:opacity-30 transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => { setActiveStep(Math.min(story.length - 1, activeStep + 1)); setElapsed(Math.min(story.length - 1, activeStep + 1) * 30) }}
              disabled={activeStep === story.length - 1}
              className="flex items-center gap-1 rounded-lg bg-elastic/15 px-4 py-2 text-xs font-medium text-elastic hover:bg-elastic/25 disabled:opacity-30 transition-colors"
            >
              Next <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </Card>
      </div>
    </div>
  )
}
