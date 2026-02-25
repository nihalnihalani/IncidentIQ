import { TopBar } from '@/components/layout/top-bar'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PipelineViz } from '@/components/ui/pipeline-viz'
import { EsqlBlock } from '@/components/ui/esql-block'
import { ShimmerButton } from '@/components/ui/shimmer-button'
import { DotPattern } from '@/components/ui/dot-pattern'
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
  Share2,
  MessageSquare,
  Ticket,
  CheckCircle,
  Zap,
  Clock,
  Users,
  Gem,
  Layers,
  Search,
  Activity,
  FileText,
  Database,
  Cpu,
  Bot,
  Workflow,
  ArrowRight,
  ChevronDown,
  BookOpen,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
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
      time: '3:07 AM',
      title: 'Alert Fires on Order-Service',
      narrator: 'It\'s 3:07 AM. The order-service just started returning 500s. Customers can\'t checkout. Revenue is bleeding at $12,000 per minute. The multi-agent workflow triggers -- Triage Agent wakes up first.',
      icon: <AlertTriangle className="h-5 w-5" />,
      route: '/',
      content: (
        <div className="space-y-4">
          <div className="rounded-lg border border-critical/30 bg-critical-bg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-critical animate-pulse-glow" />
              <span className="text-sm font-bold text-critical">order-service: DOWN</span>
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
            Multi-agent workflow triggered. Triage Agent is first on the scene...
          </p>
        </div>
      ),
    },
    {
      id: 1,
      time: '3:07:30 AM',
      title: 'Triage Agent: FORK/FUSE Search',
      narrator: 'The Triage Agent runs a FORK/FUSE/RRF pipeline -- a single ES|QL query that does hybrid search and RRF fusion. No Python. No LangChain. Just ES|QL. It finds 3 similar past incidents and hands off to the Investigation Agent.',
      icon: <GitBranch className="h-5 w-5" />,
      route: '/incident',
      hiddenGem: 'FORK/FUSE/RRF',
      content: (
        <div className="space-y-4">
          <PipelineViz steps={pipelineSteps} animate delay={500} />
          <EsqlBlock query='FROM incident-knowledge METADATA _score | FORK (WHERE MATCH(title, "orders 500 connection pool") | SORT _score DESC | LIMIT 30) (WHERE MATCH(content, "orders 500 connection pool") | SORT _score DESC | LIMIT 30) | FUSE RRF | RERANK "orders 500 connection pool" ON content | LIMIT 5' />
          <p className="text-xs text-elastic">
            Result: Found 3 similar past incidents. All involved connection pool exhaustion.
          </p>
        </div>
      ),
    },
    {
      id: 2,
      time: '3:08 AM',
      title: 'Investigation Agent: Root Cause Found',
      narrator: 'The Investigation Agent receives the Triage handoff and uses significant_terms to find the most STATISTICALLY UNUSUAL error. The root cause isn\'t "timeout_error" (2,341 occurrences) -- it\'s "connection_pool_exhausted" (score: 97.1).',
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
      time: '3:08:30 AM',
      title: 'Investigation Agent: Blast Radius',
      narrator: 'The Investigation Agent maps the cascading failure across 5 services. The critical path: api-gateway -> order-service -> payment-service. PostgreSQL connection pool is the epicenter.',
      icon: <Share2 className="h-5 w-5" />,
      route: '/blast-radius',
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-5 gap-2">
            {[
              { name: 'order-service', status: 'DOWN', color: '#ff4444' },
              { name: 'payment-service', status: 'DEGRADED', color: '#ff8c00' },
              { name: 'cart-service', status: 'DEGRADED', color: '#ff8c00' },
              { name: 'api-gateway', status: 'DEGRADED', color: '#ffd000' },
              { name: 'PostgreSQL', status: 'SATURATED', color: '#ff4444' },
            ].map(s => (
              <div key={s.name} className="rounded-lg border p-2 text-center" style={{ borderColor: `${s.color}40`, backgroundColor: `${s.color}10` }}>
                <p className="text-[10px] font-mono font-bold" style={{ color: s.color }}>{s.status}</p>
                <p className="text-[9px] text-text-dim mt-0.5">{s.name}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-text-muted">
            <strong className="text-critical">5 services affected</strong>. Root cause: PostgreSQL connection pool maxed at 20 connections. Cascading through order-service to payment-service and cart-service.
          </p>
        </div>
      ),
    },
    {
      id: 4,
      time: '3:09 AM',
      title: '3 Alert Rules Matched',
      narrator: 'We don\'t search FOR alerts -- alerts search for INCIDENTS. The incident document is percolated against 18 stored rules. 3 match instantly. The team gets notified.',
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
            <div className="text-text-dim">{"\u2192"} percolated {"\u2192"}</div>
            <div className="rounded-lg border border-border bg-surface-2 px-4 py-3 text-center">
              <p className="text-[10px] text-text-dim">18 stored rules</p>
              <p className="text-sm font-mono text-agent-amber font-bold">3 matches</p>
            </div>
            <div className="text-text-dim">{"\u2192"} notified {"\u2192"}</div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 rounded border border-agent-amber/30 bg-agent-amber/10 px-2 py-1">
                <MessageSquare className="h-3 w-3 text-agent-amber" />
                <span className="text-[10px] text-agent-amber">Slack #incidents</span>
              </div>
              <div className="flex items-center gap-1.5 rounded border border-agent-purple/30 bg-agent-purple/10 px-2 py-1">
                <Ticket className="h-3 w-3 text-agent-purple" />
                <span className="text-[10px] text-agent-purple">Jira OPS-2847</span>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 5,
      time: '3:09:30 AM',
      title: 'PostMortem Agent: Report + Notify',
      narrator: 'The PostMortem Agent synthesizes findings from both Triage and Investigation agents into a blameless post-mortem. Pipeline aggregations show error acceleration at +22%/min. The SRE wakes up to a Slack message with full multi-agent analysis.',
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
              <p className="text-xl font-bold font-mono text-high">+4.2%/min{"\u00B2"}</p>
            </div>
            <div className="rounded-lg border border-critical/30 bg-critical-bg px-4 py-3 text-center">
              <span className="text-[10px] text-text-dim">Full Outage</span>
              <p className="text-xl font-bold font-mono text-critical">~12 min</p>
            </div>
          </div>

          <div className="rounded-lg border border-elastic/30 bg-elastic-bg p-4">
            <p className="text-sm font-bold text-elastic mb-3">Multi-Agent Incident Response Complete</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle className="h-3.5 w-3.5 text-low" />
                <span className="text-text">Root cause: <span className="font-mono text-elastic">connection_pool_exhausted</span></span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle className="h-3.5 w-3.5 text-low" />
                <span className="text-text">Slack alert sent to <span className="font-mono text-agent-amber">#incidents-critical</span></span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle className="h-3.5 w-3.5 text-low" />
                <span className="text-text">Jira ticket: <span className="font-mono text-agent-purple">OPS-2847</span></span>
              </div>
            </div>
          </div>

          {/* Before/After Impact Comparison */}
          <div className="grid grid-cols-2 gap-4">
            {/* BEFORE: Manual Response */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-lg border border-critical/20 bg-critical-bg p-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-4 w-4 text-critical" />
                <span className="text-xs font-bold text-critical uppercase tracking-wider">Without Multi-Agent</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-text-dim" />
                    <span className="text-xs text-text-muted">Time to Response</span>
                  </div>
                  <span className="text-sm font-bold font-mono text-critical">47 min</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-3.5 w-3.5 text-text-dim" />
                    <span className="text-xs text-text-muted">Revenue Lost</span>
                  </div>
                  <span className="text-sm font-bold font-mono text-critical">$564k</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 text-text-dim" />
                    <span className="text-xs text-text-muted">Engineers Paged</span>
                  </div>
                  <span className="text-sm font-bold font-mono text-critical">4</span>
                </div>
              </div>
            </motion.div>

            {/* AFTER: OpsAgent Response */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="rounded-lg border border-elastic/30 bg-elastic-bg p-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-4 w-4 text-elastic" />
                <span className="text-xs font-bold text-elastic uppercase tracking-wider">With 3-Agent System</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-text-dim" />
                    <span className="text-xs text-text-muted">Time to Response</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold font-mono text-elastic">2m 30s</span>
                    <span className="text-[10px] font-bold text-low">-95%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-3.5 w-3.5 text-text-dim" />
                    <span className="text-xs text-text-muted">Revenue Lost</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold font-mono text-elastic">$36k</span>
                    <span className="text-[10px] font-bold text-low">-94%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 text-text-dim" />
                    <span className="text-xs text-text-muted">Engineers Paged</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold font-mono text-elastic">0</span>
                    <span className="text-[10px] font-bold text-low">Full context delivered</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      ),
    },
    {
      id: 6,
      time: '3:09:45 AM',
      title: 'Runbook Auto-Lookup',
      narrator: 'The PostMortem Agent doesn\'t just document the incident -- it searches the runbooks for matching remediation procedures. The symptom "connection pool exhausted" matches the Database Connection Pool Exhaustion runbook with exact remediation steps.',
      icon: <BookOpen className="h-5 w-5" />,
      route: '/runbooks',
      hiddenGem: 'Full-Text Search',
      content: (
        <div className="space-y-4">
          <EsqlBlock query='FROM runbooks METADATA _score | WHERE MATCH(symptoms, "connection pool exhausted timeout") | KEEP title, severity, symptoms, remediation_steps, _score | SORT _score DESC | LIMIT 3' />
          <div className="rounded-lg border border-agent-purple/30 bg-agent-purple/5 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-agent-purple" />
                <span className="text-sm font-bold text-text">Database Connection Pool Exhaustion</span>
                <Badge color="#ff4444" className="text-[10px]">P1</Badge>
              </div>
              <span className="rounded-full border border-low/40 bg-low/10 px-2 py-0.5 text-[10px] font-bold text-low">Matched!</span>
            </div>
            <div className="rounded border border-border bg-surface-2 p-3">
              <p className="text-[10px] text-text-dim uppercase tracking-wider mb-2">Remediation Steps</p>
              <div className="space-y-1.5">
                <p className="text-xs font-mono text-text"><span className="text-agent-purple">1.</span> Check active connections <span className="text-text-dim">-- identify long-running queries</span></p>
                <p className="text-xs font-mono text-text"><span className="text-agent-purple">2.</span> Kill long-running transactions <span className="text-text-dim">-- free pool capacity</span></p>
                <p className="text-xs font-mono text-text"><span className="text-agent-purple">3.</span> Increase pool size <span className="text-text-dim">-- scale from 20 to 50</span></p>
                <p className="text-xs font-mono text-text"><span className="text-agent-purple">4.</span> Restart affected pods <span className="text-text-dim">-- rolling restart order-service</span></p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 7,
      time: '3:10 AM',
      title: 'Resolution: Full Incident Package Delivered',
      narrator: 'In 3 minutes flat, the multi-agent system has: identified the root cause, mapped the blast radius, matched 3 alert rules, looked up remediation runbooks, sent Slack alerts, created a Jira ticket, and generated a blameless post-mortem. The on-call SRE wakes up to a complete incident package.',
      icon: <CheckCircle className="h-5 w-5" />,
      route: '/',
      content: (
        <div className="space-y-4">
          {/* Total response time */}
          <div className="flex items-center justify-center">
            <div className="rounded-xl border border-elastic/30 bg-elastic-bg px-8 py-4 text-center">
              <p className="text-[10px] text-text-dim uppercase tracking-wider mb-1">Total Response Time</p>
              <p className="text-4xl font-bold font-mono text-elastic">2m 53s</p>
              <p className="text-xs text-text-muted mt-1">From alert to full incident package</p>
            </div>
          </div>

          {/* Checklist of actions completed */}
          <div className="rounded-lg border border-elastic/30 bg-elastic-bg p-4">
            <p className="text-sm font-bold text-elastic mb-3">Complete Incident Package</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                'Root cause identified: connection_pool_exhausted',
                'Blast radius mapped: 5 services',
                '3 alert rules matched via percolate',
                'Remediation runbook found & attached',
                'Slack alert sent to #incidents-critical',
                'Jira ticket created: OPS-2847',
                'Blameless post-mortem generated',
                'On-call SRE notified with full context',
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <CheckCircle className="h-3.5 w-3.5 text-low shrink-0 mt-0.5" />
                  <span className="text-text">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Simplified Before vs After */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-critical/20 bg-critical-bg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-4 w-4 text-critical" />
                <span className="text-xs font-bold text-critical uppercase tracking-wider">Without Multi-Agent</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted">Response Time</span>
                  <span className="text-sm font-bold font-mono text-critical">47 min</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted">Revenue Lost</span>
                  <span className="text-sm font-bold font-mono text-critical">$564k</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted">Engineers Paged</span>
                  <span className="text-sm font-bold font-mono text-critical">4</span>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-elastic/30 bg-elastic-bg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-4 w-4 text-elastic" />
                <span className="text-xs font-bold text-elastic uppercase tracking-wider">With 3-Agent System</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted">Response Time</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold font-mono text-elastic">2m 53s</span>
                    <span className="text-[10px] font-bold text-low">-94%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted">Revenue Lost</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold font-mono text-elastic">$36k</span>
                    <span className="text-[10px] font-bold text-low">-94%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted">Engineers Paged</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold font-mono text-elastic">0</span>
                    <span className="text-[10px] font-bold text-low">Autonomous</span>
                  </div>
                </div>
              </div>
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
        if (next >= 240) {
          setIsPlaying(false)
          return 240
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
    <div className="relative min-h-screen">
      <DotPattern className="[mask-image:radial-gradient(ellipse_at_top,white_30%,transparent_70%)] opacity-40" />

      <TopBar title="Demo Mode -- The 3 AM Incident" />

      <div className="relative p-6 space-y-6">
        {/* Timer + Controls */}
        <Card glow beam beamColor="#00bfb3" beamColorTo="#8844ff">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <ShimmerButton
                onClick={() => {
                  if (!isPlaying && elapsed >= 240) { setElapsed(0); setActiveStep(0) }
                  setIsPlaying(!isPlaying)
                }}
                className="h-10 w-10 !px-0 !py-0 rounded-lg"
                aria-label={isPlaying ? 'Pause incident narrative' : 'Play incident narrative'}
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </ShimmerButton>
              <div>
                <p className="text-lg font-bold font-mono text-text tabular-nums">{formatTime(elapsed)} / 4:00</p>
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
              style={{ width: `${(elapsed / 240) * 100}%` }}
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
        <div className="grid grid-cols-4 gap-2">
          {story.map((beat, i) => (
            <button
              key={beat.id}
              onClick={() => { setActiveStep(i); setElapsed(i * 30) }}
              aria-label={`Go to step ${i + 1}: ${beat.title}`}
              aria-current={i === activeStep ? 'step' : undefined}
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
              aria-label={`Open live view for ${story[activeStep].title}`}
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
              aria-label="Previous story beat"
            >
              Previous
            </button>
            <button
              onClick={() => { setActiveStep(Math.min(story.length - 1, activeStep + 1)); setElapsed(Math.min(story.length - 1, activeStep + 1) * 30) }}
              disabled={activeStep === story.length - 1}
              className="flex items-center gap-1 rounded-lg bg-elastic/15 px-4 py-2 text-xs font-medium text-elastic hover:bg-elastic/25 disabled:opacity-30 transition-colors"
              aria-label="Next story beat"
            >
              Next <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </Card>

        {/* Hidden Gems Scorecard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Gem className="h-5 w-5 text-elastic" />
                <CardTitle className="text-lg">Elasticsearch Hidden Gems Used</CardTitle>
              </div>
              <Badge color="#00bfb3">9 Features</Badge>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {([
                  {
                    icon: <GitBranch className="h-4 w-4 text-elastic" />,
                    name: 'FORK/FUSE/RRF',
                    description: 'Parallel hybrid search with Reciprocal Rank Fusion in a single ES|QL query',
                  },
                  {
                    icon: <Activity className="h-4 w-4 text-elastic" />,
                    name: 'significant_terms',
                    description: 'Statistical anomaly detection finds the most UNUSUAL errors, not just common ones',
                  },
                  {
                    icon: <ArrowRightLeft className="h-4 w-4 text-elastic" />,
                    name: 'Percolate Queries',
                    description: 'Reverse search: alerts search for incidents, not the other way around',
                  },
                  {
                    icon: <TrendingUp className="h-4 w-4 text-elastic" />,
                    name: 'Pipeline Aggregations',
                    description: 'Derivative + cumulative_sum detect error rate acceleration (+22%/min)',
                  },
                  {
                    icon: <Search className="h-4 w-4 text-elastic" />,
                    name: 'semantic_text',
                    description: 'Vector search with built-in embedding, no external ML pipeline needed',
                  },
                  {
                    icon: <FileText className="h-4 w-4 text-elastic" />,
                    name: 'ES|QL',
                    description: '10+ parameterized queries power all agent tools, no application code needed',
                  },
                  {
                    icon: <Layers className="h-4 w-4 text-elastic" />,
                    name: 'Transforms',
                    description: 'Materialized views continuously aggregate service health summaries',
                  },
                  {
                    icon: <Bot className="h-4 w-4 text-elastic" />,
                    name: 'Multi-Agent System',
                    description: '3 specialized agents (Triage \u2192 Investigation \u2192 PostMortem) with handoff protocol',
                  },
                  {
                    icon: <Workflow className="h-4 w-4 text-elastic" />,
                    name: 'Elastic Workflows',
                    description: 'YAML-defined orchestration chains agents with conditional routing',
                  },
                ] as const).map((gem) => (
                  <motion.div
                    key={gem.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.05 }}
                    className="rounded-lg border border-border bg-surface-2 p-3"
                    style={{ borderLeftWidth: 3, borderLeftColor: '#00bfb3' }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {gem.icon}
                      <span className="text-sm font-bold text-text">{gem.name}</span>
                    </div>
                    <p className="text-xs text-text-muted leading-relaxed">{gem.description}</p>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Architecture Diagram */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Cpu className="h-5 w-5 text-elastic" />
                <CardTitle className="text-lg">Multi-Agent Architecture</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Orchestration Layer */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  className="rounded-lg border border-elastic/30 bg-elastic/10 p-3 text-center"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Workflow className="h-4 w-4 text-elastic" />
                    <span className="text-sm font-bold text-elastic">Elastic Workflow</span>
                    <span className="text-xs text-text-dim ml-2">YAML-defined orchestration with conditional routing</span>
                  </div>
                </motion.div>

                {/* Arrow from orchestration to agents */}
                <div className="flex justify-center">
                  <ChevronDown className="h-5 w-5 text-text-dim" />
                </div>

                {/* Agent Boxes */}
                <div className="grid grid-cols-3 gap-4 items-start">
                  {/* Triage Agent */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 }}
                    className="space-y-2"
                  >
                    <div
                      className="rounded-lg border-2 p-4 text-center"
                      style={{ borderColor: '#00bfb3', backgroundColor: 'rgba(0, 191, 179, 0.08)' }}
                    >
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Bot className="h-5 w-5" style={{ color: '#00bfb3' }} />
                        <span className="text-sm font-bold" style={{ color: '#00bfb3' }}>Triage Agent</span>
                      </div>
                      <p className="text-[10px] text-text-dim">First responder. Classifies severity and finds similar past incidents.</p>
                    </div>
                    <div className="rounded border border-border bg-surface-2 p-2">
                      <p className="text-[10px] text-text-dim uppercase tracking-wider mb-1.5">Tools</p>
                      <div className="space-y-1">
                        <p className="text-[11px] font-mono text-text-muted">hybrid_rag_search</p>
                        <p className="text-[11px] font-mono text-text-muted">error_trend_analysis</p>
                        <p className="text-[11px] font-mono text-text-muted">search_runbooks</p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Investigation Agent */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.5 }}
                    className="space-y-2"
                  >
                    <div
                      className="rounded-lg border-2 p-4 text-center"
                      style={{ borderColor: '#4488ff', backgroundColor: 'rgba(68, 136, 255, 0.08)' }}
                    >
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Bot className="h-5 w-5" style={{ color: '#4488ff' }} />
                        <span className="text-sm font-bold" style={{ color: '#4488ff' }}>Investigation Agent</span>
                      </div>
                      <p className="text-[10px] text-text-dim">Deep analysis. Finds root cause and maps blast radius.</p>
                    </div>
                    <div className="rounded border border-border bg-surface-2 p-2">
                      <p className="text-[10px] text-text-dim uppercase tracking-wider mb-1.5">Tools</p>
                      <div className="space-y-1">
                        <p className="text-[11px] font-mono text-text-muted">anomaly_detector</p>
                        <p className="text-[11px] font-mono text-text-muted">service_error_breakdown</p>
                        <p className="text-[11px] font-mono text-text-muted">correlate_host_timeline</p>
                        <p className="text-[11px] font-mono text-text-muted">analyze_host_metrics</p>
                      </div>
                    </div>
                  </motion.div>

                  {/* PostMortem Agent */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.6 }}
                    className="space-y-2"
                  >
                    <div
                      className="rounded-lg border-2 p-4 text-center"
                      style={{ borderColor: '#8844ff', backgroundColor: 'rgba(136, 68, 255, 0.08)' }}
                    >
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Bot className="h-5 w-5" style={{ color: '#8844ff' }} />
                        <span className="text-sm font-bold" style={{ color: '#8844ff' }}>PostMortem Agent</span>
                      </div>
                      <p className="text-[10px] text-text-dim">Synthesizes findings into blameless post-mortem reports.</p>
                    </div>
                    <div className="rounded border border-border bg-surface-2 p-2">
                      <p className="text-[10px] text-text-dim uppercase tracking-wider mb-1.5">Tools</p>
                      <div className="space-y-1">
                        <p className="text-[11px] font-mono text-text-muted">search_runbooks</p>
                        <p className="text-[11px] font-mono text-text-muted">search_runbooks_by_symptom</p>
                        <p className="text-[11px] font-mono text-text-dim italic">(generates reports)</p>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Handoff Arrows */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center justify-end pr-2">
                    <div className="flex items-center gap-1 text-text-dim">
                      <span className="text-[10px]">handoff</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </div>
                  <div className="flex items-center justify-end pr-2">
                    <div className="flex items-center gap-1 text-text-dim">
                      <span className="text-[10px]">handoff</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </div>
                  <div />
                </div>

                {/* Arrow from agents to data sources */}
                <div className="flex justify-center">
                  <ChevronDown className="h-5 w-5 text-text-dim" />
                </div>

                {/* Data Sources */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.7 }}
                  className="rounded-lg border border-border bg-surface-2 p-4"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Database className="h-4 w-4 text-text-dim" />
                    <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Elasticsearch Indices</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {['logs-opsagent', 'infra-metrics', 'incident-knowledge', 'runbooks', 'alert-rules'].map((idx) => (
                      <span
                        key={idx}
                        className="rounded-md border border-elastic/20 bg-elastic/5 px-2.5 py-1 text-xs font-mono text-elastic"
                      >
                        {idx}
                      </span>
                    ))}
                  </div>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
