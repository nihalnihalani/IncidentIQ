import { useState, useCallback, useRef, useEffect } from 'react'
import type { AgentName } from '@/data/mock'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'tool'
  content: string
  timestamp: string
  agent?: AgentName
  toolName?: string
  toolQuery?: string
}

export type IncidentStatus = 'monitoring' | 'investigating' | 'critical'

interface UseChatReturn {
  messages: ChatMessage[]
  isLoading: boolean
  activeAgent: AgentName | null
  incidentStatus: IncidentStatus
  sendMessage: (text: string) => void
}

let msgId = 0
function nextId() {
  return `msg-${++msgId}-${Date.now()}`
}

function now() {
  return new Date().toISOString()
}

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: `**OpsAgent Online** -- Multi-Agent Incident Response System

I'm your AI incident response agent. I investigate infrastructure issues by analyzing logs, metrics, and runbooks using a 3-agent pipeline:

**Triage Agent** -- hybrid RAG search (FORK/FUSE/RRF)
**Investigation Agent** -- significant_terms, pipeline aggs, percolate
**PostMortem Agent** -- blameless post-mortem, Slack/Jira, audit

Use the quick actions on the right, or describe your incident below.`,
  timestamp: now(),
  agent: 'triage-agent',
}

function getDemoResponse(input: string): ChatMessage[] {
  const lower = input.toLowerCase()
  const messages: ChatMessage[] = []

  if (lower.includes('investigate') || lower.includes('error') || lower.includes('complaint') || lower.includes('500') || lower.includes('incident analysis')) {
    messages.push({
      id: nextId(), role: 'tool', content: 'Searching incident knowledge base with hybrid RAG...', timestamp: now(),
      agent: 'triage-agent', toolName: 'hybrid_rag_search',
      toolQuery: 'FROM incident-knowledge METADATA _score\n| FORK\n  (WHERE MATCH(title, "orders 500 connection pool") | SORT _score DESC | LIMIT 30)\n  (WHERE MATCH(content, "orders 500 connection pool") | SORT _score DESC | LIMIT 30)\n| FUSE RRF WITH {"rank_constant": 60}\n| RERANK "orders 500 connection pool" ON content WITH {"inference_id": ".rerank-v1-elasticsearch"}\n| LIMIT 5',
    })
    messages.push({
      id: nextId(), role: 'assistant', timestamp: now(), agent: 'triage-agent',
      content: `## Triage Complete -- 3 similar past incidents found

FORK/FUSE/RRF pipeline returned 5 results. Top match: **INC-3847 "order-service connection pool exhaustion"** (relevance: 0.94).

**Severity Classification:** CRITICAL
- Error rate: 34.7% (threshold: 5%)
- Affected services: 5
- Revenue impact: ~$12k/minute

Handing off to Investigation Agent for root cause analysis...`,
    })
    messages.push({
      id: nextId(), role: 'tool', content: 'Running significant_terms aggregation on error logs...', timestamp: now(),
      agent: 'investigation-agent', toolName: 'anomaly_detector',
      toolQuery: 'FROM logs-*\n| WHERE @timestamp > NOW() - 30 MINUTES\n  AND service.name == "order-service"\n  AND log.level == "ERROR"\n| STATS count = COUNT(*) BY error.type\n| SORT count DESC\n| LIMIT 10',
    })
    messages.push({
      id: nextId(), role: 'tool', content: 'Analyzing error rate acceleration with pipeline aggregations...', timestamp: now(),
      agent: 'investigation-agent', toolName: 'error_trend_analysis',
      toolQuery: 'FROM logs-*\n| WHERE @timestamp > NOW() - 30 MINUTES\n  AND service.name == "order-service"\n  AND log.level == "ERROR"\n| EVAL bucket = DATE_TRUNC(5 MINUTES, @timestamp)\n| STATS error_count = COUNT(*) BY bucket\n| SORT bucket ASC',
    })
    messages.push({
      id: nextId(), role: 'assistant', timestamp: now(), agent: 'investigation-agent',
      content: `## Root Cause: connection_pool_exhausted

**significant_terms analysis** found the most statistically unusual term: \`connection_pool_exhausted\` (score: 97.1). This is not the most COMMON error -- it is the most SURPRISING one.

**Evidence:**
- bg_count: 8 (normal occurrence)
- doc_count: 1,247 (during incident)
- PostgreSQL connection pool maxed at 20 connections

**Error Acceleration:**
- Velocity: +22%/min
- Acceleration: +4.2%/min squared
- SLA breach predicted in 12 minutes without intervention

**Blast Radius:** 5 services affected
- payment-service (degraded) -- connection timeouts
- cart-service (stale data) -- cannot reach order-service
- notification-service (queue backup)
- inventory-service (timeout errors)
- api-gateway (elevated latency: 1200ms)

Handing off to PostMortem Agent...`,
    })
    messages.push({
      id: nextId(), role: 'tool', content: 'Generating blameless post-mortem and creating Jira ticket...', timestamp: now(),
      agent: 'postmortem-agent', toolName: 'elasticsearch.index',
      toolQuery: 'FROM incident-audit\n| WHERE incident_id == "INC-4091"\n| KEEP timestamp, agent, action, finding\n| SORT timestamp ASC',
    })
    messages.push({
      id: nextId(), role: 'assistant', timestamp: now(), agent: 'postmortem-agent',
      content: `## Post-Mortem Generated

**Incident INC-4091 -- order-service connection pool exhaustion**

**Actions Taken:**
- Slack alert sent to #incidents-critical
- Jira ticket OPS-2847 created with full blast radius analysis
- Remediation runbook attached: "Database Connection Pool Exhaustion"

**Recommended Remediation:**
1. Check active connections with \`pg_stat_activity\`
2. Kill long-running transactions holding connections
3. Increase pool max size from 20 to 50
4. Restart affected application pods
5. Monitor connection pool metrics to verify recovery

**Time to Resolution:** 2m 30s (automated triage + investigation)
SRE has full context before touching a keyboard.`,
    })
    return messages
  }

  if (lower.includes('health') || lower.includes('metrics') || lower.includes('cpu')) {
    messages.push({
      id: nextId(), role: 'tool', content: 'Querying infrastructure metrics...', timestamp: now(),
      agent: 'triage-agent', toolName: 'error_trend_analysis',
      toolQuery: 'FROM metrics-*\n| WHERE @timestamp > NOW() - 1 HOUR\n| STATS avg_cpu = AVG(system.cpu.total.norm.pct), max_cpu = MAX(system.cpu.total.norm.pct),\n  avg_mem = AVG(system.memory.actual.used.pct), max_mem = MAX(system.memory.actual.used.pct)\n  BY host.name\n| SORT max_cpu DESC',
    })
    messages.push({
      id: nextId(), role: 'assistant', timestamp: now(), agent: 'triage-agent',
      content: `## System Health Report

**db-primary-01** -- CRITICAL
- CPU: 94.2% (baseline: 25%)
- Memory: 91.8% (climbing)
- Disk I/O: 89% utilization

**app-01** -- WARNING
- CPU: 62.4% (threads blocked on DB connections)
- Memory: 71.3%

**app-02** -- WARNING
- CPU: 58.7%
- Memory: 68.9%

**web-01, web-02** -- HEALTHY
- CPU: 25-28%, Memory: 45-48%

db-primary-01 is the bottleneck. CPU spike began ~5 minutes before application errors, confirming infrastructure as root cause.`,
    })
    return messages
  }

  if (lower.includes('correlate')) {
    messages.push({
      id: nextId(), role: 'tool', content: 'Correlating logs with infrastructure metrics...', timestamp: now(),
      agent: 'investigation-agent', toolName: 'error_trend_analysis',
      toolQuery: 'FROM logs-*, metrics-*\n| WHERE @timestamp > NOW() - 1 HOUR\n  AND (service.name == "order-service" OR host.name == "db-primary-01")\n| EVAL bucket = DATE_TRUNC(5 MINUTES, @timestamp)\n| STATS error_count = COUNT(CASE WHEN log.level == "ERROR" THEN 1 END),\n  avg_cpu = AVG(system.cpu.total.norm.pct)\n  BY bucket\n| SORT bucket ASC',
    })
    messages.push({
      id: nextId(), role: 'assistant', timestamp: now(), agent: 'investigation-agent',
      content: `## Log-Metric Correlation

**Timeline of Events:**

\`02:02 AM\` -- db-primary-01 CPU begins climbing (25% to 40%)
\`02:09 AM\` -- payment-service: "connection pool nearing capacity - 45/50"
\`02:12 AM\` -- First ConnectionTimeoutException in payment-service
\`02:15 AM\` -- db-primary-01 CPU hits 70%, memory at 78%
\`02:19 AM\` -- Circuit breaker OPEN in order-service
\`02:27 AM\` -- Cascading errors in inventory-service, api-gateway
\`02:37 AM\` -- db-primary-01 CPU at 94%, customer error rate >50%

**Key Finding:** Infrastructure stress on db-primary-01 **preceded** application errors by ~7 minutes. This confirms the database is the **root cause**, not a symptom.

Cascade path: \`db-primary-01 -> payment-service -> order-service -> inventory-service\``,
    })
    return messages
  }

  if (lower.includes('runbook') || lower.includes('remediation')) {
    messages.push({
      id: nextId(), role: 'tool', content: 'Searching runbooks index...', timestamp: now(),
      agent: 'triage-agent', toolName: 'hybrid_rag_search',
      toolQuery: 'FROM runbooks METADATA _score\n| WHERE MATCH(content, "connection pool database")\n| SORT _score DESC\n| LIMIT 5',
    })
    messages.push({
      id: nextId(), role: 'assistant', timestamp: now(), agent: 'triage-agent',
      content: `## Matching Runbooks

**1. Database Connection Pool Exhaustion** (P1)
Symptoms: Connection timeout errors, increasing latency, HTTP 503s
Steps: Check pg_stat_activity, kill long-running transactions, increase pool size, restart pods, monitor

**2. High CPU Usage on Database Server** (P2)
Symptoms: CPU >85%, slow queries, increased IO wait
Steps: Check processlist, review recent deploys, add missing indexes, scale read replicas

**3. Cascading Service Failure** (P1)
Symptoms: Multiple services degraded, circuit breakers open
Steps: Identify root service, isolate failure domain, restart in dependency order`,
    })
    return messages
  }

  if (lower.includes('incident record') || lower.includes('create') || lower.includes('document')) {
    messages.push({
      id: nextId(), role: 'tool', content: 'Creating incident record in audit index...', timestamp: now(),
      agent: 'postmortem-agent', toolName: 'elasticsearch.index',
      toolQuery: 'POST incident-audit/_doc\n{\n  "incident_id": "INC-4091",\n  "title": "order-service connection pool exhaustion",\n  "severity": "P1",\n  "root_cause": "connection_pool_exhausted",\n  "affected_services": 5,\n  "created_at": "2026-02-15T03:09:30Z"\n}',
    })
    messages.push({
      id: nextId(), role: 'assistant', timestamp: now(), agent: 'postmortem-agent',
      content: `## Incident Record Created

**ID:** INC-4091
**Title:** order-service connection pool exhaustion
**Severity:** P1
**Status:** Open

The incident has been documented in the incident-audit index with full root cause analysis, blast radius mapping, and remediation steps.

All three agents' findings are linked to this record for full audit trail.`,
    })
    return messages
  }

  // Default response
  messages.push({
    id: nextId(), role: 'assistant', timestamp: now(), agent: 'triage-agent',
    content: `I can help investigate that. Here are my capabilities:

- **Investigate errors** -- FORK/FUSE/RRF hybrid search across incident knowledge
- **Health check** -- infrastructure metrics analysis across all hosts
- **Correlate** -- cross-reference logs with metrics using ES|QL
- **Search runbooks** -- find remediation procedures
- **Create incident** -- document findings with full audit trail

What would you like me to look into?`,
  })
  return messages
}

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE])
  const [isLoading, setIsLoading] = useState(false)
  const [activeAgent, setActiveAgent] = useState<AgentName | null>(null)
  const [incidentStatus, setIncidentStatus] = useState<IncidentStatus>('monitoring')
  const timeoutRef = useRef<ReturnType<typeof setTimeout>[]>([])

  // Clean up pending timeouts on unmount to prevent state updates after unmount
  useEffect(() => {
    return () => {
      timeoutRef.current.forEach(clearTimeout)
    }
  }, [])

  const sendMessage = useCallback((text: string) => {
    if (!text.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: nextId(),
      role: 'user',
      content: text,
      timestamp: now(),
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)
    setIncidentStatus('investigating')

    const responses = getDemoResponse(text)

    // Simulate progressive agent responses
    let delay = 600
    const timeouts: ReturnType<typeof setTimeout>[] = []

    responses.forEach((msg, i) => {
      const t = setTimeout(() => {
        if (msg.agent) {
          setActiveAgent(msg.agent)
        }
        setMessages(prev => [...prev, msg])

        // If it's the last message, stop loading
        if (i === responses.length - 1) {
          setIsLoading(false)
          setActiveAgent(null)
          // Set critical status if investigation-type query
          const lower = text.toLowerCase()
          if (lower.includes('investigate') || lower.includes('incident') || lower.includes('500')) {
            setIncidentStatus('critical')
          }
        }
      }, delay)
      timeouts.push(t)
      delay += msg.role === 'tool' ? 400 : 800
    })

    timeoutRef.current = timeouts
  }, [isLoading])

  return { messages, isLoading, activeAgent, incidentStatus, sendMessage }
}
