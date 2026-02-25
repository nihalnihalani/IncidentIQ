export type Severity = 'critical' | 'high' | 'medium' | 'low'
export type IncidentStatus = 'active' | 'investigating' | 'mitigating' | 'resolved'
export type AgentPhase = 'triage' | 'investigation' | 'alert' | 'action'
export type AgentName = 'triage-agent' | 'investigation-agent' | 'postmortem-agent'

export interface Incident {
  id: string
  title: string
  severity: Severity
  status: IncidentStatus
  service: string
  startedAt: string
  phase: AgentPhase
  affectedServices: number
  errorRate: number
  description: string
}

export interface ServiceHealth {
  name: string
  status: 'healthy' | 'degraded' | 'down'
  latency: number
  errorRate: number
  requests: number
  trend: number[]
}

export interface AgentActivity {
  id: string
  phase: AgentPhase
  agent: AgentName
  action: string
  target: string
  timestamp: string
  status: 'running' | 'completed' | 'failed'
  detail: string
  toolUsed?: string
  esqlQuery?: string
}

export interface AlertRule {
  id: string
  name: string
  description: string
  condition: string
  severity: Severity
  active: boolean
  matchCount: number
  lastTriggered: string
  createdBy: string
  percolateQuery: string
  workflowAction?: string
}

export interface BlastRadiusNode {
  id: string
  name: string
  type: 'service' | 'database' | 'queue' | 'cache' | 'gateway'
  status: 'healthy' | 'degraded' | 'down'
  x: number
  y: number
}

export interface BlastRadiusEdge {
  source: string
  target: string
  weight: number
  latency: number
}

export interface PipelineStep {
  name: string
  label: string
  description: string
  status: 'pending' | 'running' | 'completed'
  duration?: number
  resultCount?: number
}

// --- Story: "It's 3 AM. The order-service is failing." ---

export const incidents: Incident[] = [
  {
    id: 'INC-4091',
    title: 'Order Service Down -- 500s spike, checkout completely broken',
    severity: 'critical',
    status: 'investigating',
    service: 'order-service',
    startedAt: '2026-02-15T03:07:00Z',
    phase: 'investigation',
    affectedServices: 5,
    errorRate: 34.7,
    description: 'order-service returning 500s on all POST /orders endpoints. Customers cannot complete checkout. Revenue impact estimated at $12k/minute.'
  },
  {
    id: 'INC-4090',
    title: 'Payment Service Timeouts -- upstream from orders failure',
    severity: 'high',
    status: 'mitigating',
    service: 'payment-service',
    startedAt: '2026-02-15T03:08:00Z',
    phase: 'action',
    affectedServices: 3,
    errorRate: 18.2,
    description: 'payment-service timing out waiting for order-service responses. Connection pool at 97% utilization.'
  },
  {
    id: 'INC-4089',
    title: 'Cart Service Degraded -- stale inventory data',
    severity: 'medium',
    status: 'active',
    service: 'cart-service',
    startedAt: '2026-02-15T03:09:00Z',
    phase: 'triage',
    affectedServices: 1,
    errorRate: 4.1,
    description: 'Cart service serving stale inventory counts due to order-service being unavailable.'
  },
]

export const services: ServiceHealth[] = [
  { name: 'api-gateway', status: 'degraded', latency: 1200, errorRate: 8.3, requests: 15420, trend: [12, 14, 13, 15, 22, 34, 45] },
  { name: 'order-service', status: 'down', latency: 9800, errorRate: 34.7, requests: 890, trend: [5, 6, 8, 18, 42, 68, 89] },
  { name: 'payment-service', status: 'degraded', latency: 4500, errorRate: 18.2, requests: 1200, trend: [3, 3, 4, 8, 15, 28, 35] },
  { name: 'cart-service', status: 'degraded', latency: 780, errorRate: 4.1, requests: 3400, trend: [4, 5, 4, 5, 7, 9, 12] },
  { name: 'user-service', status: 'healthy', latency: 45, errorRate: 0.2, requests: 6700, trend: [4, 5, 4, 5, 4, 5, 4] },
  { name: 'inventory-service', status: 'healthy', latency: 120, errorRate: 0.8, requests: 4100, trend: [3, 3, 3, 4, 3, 4, 3] },
  { name: 'notification-service', status: 'healthy', latency: 78, errorRate: 0.1, requests: 11200, trend: [6, 7, 6, 7, 6, 7, 6] },
  { name: 'search-service', status: 'healthy', latency: 230, errorRate: 0.5, requests: 9800, trend: [8, 9, 8, 9, 8, 9, 8] },
]

export const agentActivities: AgentActivity[] = [
  {
    id: '1',
    phase: 'triage',
    agent: 'triage-agent',
    action: 'FORK → FUSE RRF hybrid search',
    target: 'order-service incident knowledge',
    timestamp: '2026-02-15T03:07:30Z',
    status: 'completed',
    detail: 'Hybrid search across incident-knowledge: parallel lexical + semantic branches fused via Reciprocal Rank Fusion (RRF). Found 3 similar past incidents involving connection pool exhaustion. Zero-code RAG in pure ES|QL.',
    toolUsed: 'hybrid_rag_search',
    esqlQuery: 'FROM incident-knowledge METADATA _score | FORK (WHERE MATCH(title, "orders 500 connection pool") | SORT _score DESC | LIMIT 30) (WHERE MATCH(content, "orders 500 connection pool") | SORT _score DESC | LIMIT 30) | FUSE RRF | RERANK "orders 500 connection pool" ON content | LIMIT 5'
  },
  {
    id: '2',
    phase: 'investigation',
    agent: 'investigation-agent',
    action: 'significant_terms -- root cause discovery',
    target: 'order-service error logs',
    timestamp: '2026-02-15T03:08:00Z',
    status: 'completed',
    detail: 'Found statistically unusual term: "connection_pool_exhausted" (bg_count: 8, doc_count: 1,247, score: 97.1). This is NOT the most common error -- it is the most SURPRISING one. Root cause: PostgreSQL connection pool maxed at 20 connections.',
    toolUsed: 'anomaly_detector'
  },
  {
    id: '3',
    phase: 'investigation',
    agent: 'investigation-agent',
    action: 'Blast radius mapping -- downstream impact',
    target: 'order-service dependencies',
    timestamp: '2026-02-15T03:08:30Z',
    status: 'completed',
    detail: 'Checked downstream services for cascading failures. Found 5 affected services: payment-service (degraded), cart-service (stale data), notification-service (queue backup), inventory-service (timeout errors). Critical path: payment-service -> order-service -> checkout.',
    toolUsed: 'service_error_breakdown'
  },
  {
    id: '4',
    phase: 'investigation',
    agent: 'investigation-agent',
    action: 'Error trend prediction -- pipeline aggregations',
    target: 'order-service error rate',
    timestamp: '2026-02-15T03:09:00Z',
    status: 'completed',
    detail: 'Pipeline aggregations (derivative + cumulative_sum) show error rate accelerating at +22%/min. Prediction: complete service failure in 12 minutes. SLA breach imminent.',
    toolUsed: 'error_trend_analysis',
    esqlQuery: 'FROM logs-* | WHERE @timestamp > NOW() - 30 MINUTES AND service.name == "order-service" AND log.level == "ERROR" | EVAL bucket = DATE_TRUNC(5 MINUTES, @timestamp) | STATS error_count = COUNT(*) BY bucket | SORT bucket ASC'
  },
  {
    id: '5',
    phase: 'alert',
    agent: 'investigation-agent',
    action: 'Percolate -- reverse search match',
    target: 'INC-4091 against alert rules',
    timestamp: '2026-02-15T03:09:00Z',
    status: 'completed',
    detail: 'Incident document percolated against 18 stored alert rules. 3 matches: "orders-critical-500s", "cascading-failure-detector", "error-pattern-detector". Triggering notification workflows.',
    toolUsed: 'platform.core.search'
  },
  {
    id: '6',
    phase: 'action',
    agent: 'postmortem-agent',
    action: 'Slack alert -- #incidents-critical',
    target: 'SRE on-call team',
    timestamp: '2026-02-15T03:09:15Z',
    status: 'completed',
    detail: 'Sent Slack alert to #incidents-critical: "CRITICAL: order-service down, 34.7% error rate, 5 services affected. Root cause: connection_pool_exhausted (significant_terms score: 97.1)."',
    toolUsed: 'slack_notify'
  },
  {
    id: '7',
    phase: 'action',
    agent: 'postmortem-agent',
    action: 'Jira ticket created -- OPS-2847',
    target: 'SRE Board',
    timestamp: '2026-02-15T03:09:30Z',
    status: 'completed',
    detail: 'Created Jira ticket OPS-2847: "order-service connection pool exhaustion" with full blast radius, significant_terms analysis, and recommended remediation steps attached.',
    toolUsed: 'jira_create'
  },
  {
    id: '8',
    phase: 'action',
    agent: 'postmortem-agent',
    action: 'Post-mortem generated + audit log recorded',
    target: 'incident-audit index',
    timestamp: '2026-02-15T03:09:30Z',
    status: 'completed',
    detail: 'Full incident response audit logged: root cause (connection_pool_exhausted, score 97.1), blast radius (5 services), actions taken (Slack alert, Jira OPS-2847), time to resolution (2m 30s). SRE has full context before touching a keyboard.',
    toolUsed: 'elasticsearch.index'
  },
]

export const alertRules: AlertRule[] = [
  {
    id: '1',
    name: 'Orders Critical 500s',
    description: 'Triggers when order-service returns high volume of 500 errors',
    condition: 'service.name:"order-service" AND http.response.status_code:500',
    severity: 'critical',
    active: true,
    matchCount: 47,
    lastTriggered: '2026-02-15T03:07:00Z',
    createdBy: 'SRE Team',
    percolateQuery: '{"bool":{"must":[{"match":{"service.name":"order-service"}},{"match":{"http.response.status_code":"500"}}]}}',
    workflowAction: 'Slack #incidents-critical + Page on-call'
  },
  {
    id: '2',
    name: 'Cascading Failure Detector',
    description: 'Detects when multiple services report errors with the same root cause',
    condition: 'log.level:"ERROR" AND error.type:"connection_pool_exhausted"',
    severity: 'critical',
    active: true,
    matchCount: 12,
    lastTriggered: '2026-02-15T03:09:00Z',
    createdBy: 'AI-Generated',
    percolateQuery: '{"bool":{"must":[{"match":{"log.level":"ERROR"}},{"match":{"error.type":"connection_pool_exhausted"}}]}}',
    workflowAction: 'Slack + Jira P1 ticket'
  },
  {
    id: '3',
    name: 'High Error Rate',
    description: 'Alert when service error messages contain critical patterns',
    condition: 'log.level:"ERROR" AND message:"connection" AND message:"exhausted"',
    severity: 'critical',
    active: true,
    matchCount: 5,
    lastTriggered: '2026-02-15T03:07:30Z',
    createdBy: 'SRE Team',
    percolateQuery: '{"bool":{"must":[{"match":{"log.level":"ERROR"}},{"match":{"message":"connection pool exhausted"}}]}}',
    workflowAction: 'Slack #revenue-alerts + VP Engineering page'
  },
  {
    id: '4',
    name: 'Database Connection Errors',
    description: 'Detects database connection-related error patterns in logs',
    condition: 'error.type:"connection_pool_exhausted" AND service.name:"order-service"',
    severity: 'high',
    active: true,
    matchCount: 89,
    lastTriggered: '2026-02-15T03:08:00Z',
    createdBy: 'DBA Team',
    percolateQuery: '{"bool":{"must":[{"match":{"error.type":"connection_pool_exhausted"}},{"match":{"service.name":"order-service"}}]}}',
    workflowAction: 'Slack #dba + investigation ticket'
  },
  {
    id: '5',
    name: 'Unusual Error Pattern',
    description: 'AI-generated: detects statistically unusual error patterns via significant_terms',
    condition: 'log.level:"ERROR" AND error.type EXISTS',
    severity: 'medium',
    active: true,
    matchCount: 3,
    lastTriggered: '2026-02-15T03:08:00Z',
    createdBy: 'OpsAgent AI',
    percolateQuery: '{"bool":{"must":[{"match":{"log.level":"ERROR"}},{"exists":{"field":"error.type"}}]}}',
    workflowAction: 'Jira investigation ticket'
  },
]

export const blastRadiusNodes: BlastRadiusNode[] = [
  { id: 'api-gw', name: 'API Gateway', type: 'gateway', status: 'degraded', x: 400, y: 50 },
  { id: 'orders', name: 'Order Service', type: 'service', status: 'down', x: 250, y: 180 },
  { id: 'payment', name: 'Payment Service', type: 'service', status: 'degraded', x: 550, y: 180 },
  { id: 'cart', name: 'Cart Service', type: 'service', status: 'degraded', x: 150, y: 310 },
  { id: 'user', name: 'User Service', type: 'service', status: 'healthy', x: 650, y: 310 },
  { id: 'inventory', name: 'Inventory', type: 'service', status: 'healthy', x: 350, y: 310 },
  { id: 'notify', name: 'Notifications', type: 'service', status: 'healthy', x: 550, y: 310 },
  { id: 'pg-main', name: 'PostgreSQL', type: 'database', status: 'degraded', x: 250, y: 440 },
  { id: 'redis', name: 'Redis', type: 'cache', status: 'healthy', x: 450, y: 440 },
  { id: 'kafka', name: 'Kafka', type: 'queue', status: 'healthy', x: 650, y: 440 },
]

export const blastRadiusEdges: BlastRadiusEdge[] = [
  { source: 'api-gw', target: 'orders', weight: 0.95, latency: 9800 },
  { source: 'api-gw', target: 'payment', weight: 0.8, latency: 4500 },
  { source: 'api-gw', target: 'user', weight: 0.2, latency: 45 },
  { source: 'orders', target: 'pg-main', weight: 0.95, latency: 8200 },
  { source: 'orders', target: 'cart', weight: 0.7, latency: 780 },
  { source: 'orders', target: 'inventory', weight: 0.5, latency: 120 },
  { source: 'payment', target: 'orders', weight: 0.9, latency: 4500 },
  { source: 'payment', target: 'redis', weight: 0.4, latency: 35 },
  { source: 'cart', target: 'redis', weight: 0.3, latency: 20 },
  { source: 'notify', target: 'kafka', weight: 0.3, latency: 15 },
  { source: 'orders', target: 'notify', weight: 0.4, latency: 78 },
]

export const pipelineSteps: PipelineStep[] = [
  { name: 'fork', label: 'FORK', description: 'Parallel lexical + semantic search branches', status: 'completed', duration: 45, resultCount: 60 },
  { name: 'fuse', label: 'FUSE RRF', description: 'Reciprocal Rank Fusion merges results', status: 'completed', duration: 12, resultCount: 30 },
  { name: 'result', label: 'RESULT', description: 'Top results by RRF score returned', status: 'completed', duration: 89, resultCount: 5 },
]

export const errorTrendData = [
  { time: '02:30', errors: 3, baseline: 5 },
  { time: '02:35', errors: 4, baseline: 5 },
  { time: '02:40', errors: 5, baseline: 5 },
  { time: '02:45', errors: 7, baseline: 5 },
  { time: '02:50', errors: 12, baseline: 5 },
  { time: '02:55', errors: 22, baseline: 5 },
  { time: '03:00', errors: 48, baseline: 5 },
  { time: '03:05', errors: 89, baseline: 5 },
]

export const significantTermsData = [
  { term: 'connection_pool_exhausted', score: 97.1, bgCount: 8, docCount: 1247, significance: 'critical' as const },
  { term: 'pg_conn_timeout_30s', score: 82.4, bgCount: 23, docCount: 891, significance: 'high' as const },
  { term: 'max_pool_size_reached', score: 71.8, bgCount: 45, docCount: 634, significance: 'high' as const },
  { term: 'transaction_rollback', score: 58.2, bgCount: 112, docCount: 423, significance: 'medium' as const },
  { term: 'checkout_failed_500', score: 44.6, bgCount: 189, docCount: 287, significance: 'medium' as const },
]

export const phaseColors: Record<AgentPhase, string> = {
  triage: '#00bfb3',
  investigation: '#4488ff',
  alert: '#ffaa00',
  action: '#8844ff',
}

export const phaseLabels: Record<AgentPhase, string> = {
  triage: 'Triage Phase',
  investigation: 'Investigation Phase',
  alert: 'Alert Phase',
  action: 'Action Phase',
}

export const severityColors: Record<Severity, string> = {
  critical: '#ff4444',
  high: '#ff8c00',
  medium: '#ffd000',
  low: '#44cc44',
}

export const agentColors: Record<AgentName, string> = {
  'triage-agent': '#00bfb3',
  'investigation-agent': '#4488ff',
  'postmortem-agent': '#8844ff',
}

export const agentLabels: Record<AgentName, string> = {
  'triage-agent': 'Triage Agent',
  'investigation-agent': 'Investigation Agent',
  'postmortem-agent': 'PostMortem Agent',
}

// --- Infrastructure Metrics ---

export interface InfraHost {
  hostName: string
  avgCpu: number
  maxCpu: number
  avgMem: number
  maxMem: number
  avgDisk: number
  serviceName: string
}

export interface InfraTimelinePoint {
  time: string
  cpu: number
  mem: number
}

// Generate 36 data points (5-min buckets over 3 hours) showing incident ramp-up
// Timeline: 00:07 -> 03:07 AM, incident begins ~02:30, spikes at 03:00+
function generateTimeline(baseCpu: number, baseMem: number, spikeMultiplier: number): InfraTimelinePoint[] {
  const points: InfraTimelinePoint[] = []
  for (let i = 0; i < 36; i++) {
    const hour = Math.floor(i * 5 / 60)
    const min = (i * 5) % 60
    const time = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`

    // Ramp-up: first 30 points are stable, then exponential growth in last 6
    let cpuFactor = 1
    let memFactor = 1
    if (i >= 30) {
      const rampIdx = i - 30
      cpuFactor = 1 + (spikeMultiplier - 1) * (rampIdx / 5) ** 1.5
      memFactor = 1 + (spikeMultiplier * 0.9 - 1) * (rampIdx / 5) ** 1.5
    } else if (i >= 27) {
      const warmIdx = i - 27
      cpuFactor = 1 + (spikeMultiplier - 1) * 0.05 * warmIdx
      memFactor = 1 + (spikeMultiplier * 0.9 - 1) * 0.04 * warmIdx
    }

    // Add small jitter
    const jitter = () => (Math.random() - 0.5) * 4
    points.push({
      time,
      cpu: Math.min(100, Math.round(baseCpu * cpuFactor + jitter())),
      mem: Math.min(100, Math.round(baseMem * memFactor + jitter())),
    })
  }
  return points
}

export const infraHosts: InfraHost[] = [
  { hostName: 'db-primary-01', avgCpu: 94, maxCpu: 99, avgMem: 96, maxMem: 99, avgDisk: 62, serviceName: 'order-service' },
  { hostName: 'db-replica-01', avgCpu: 70, maxCpu: 82, avgMem: 65, maxMem: 74, avgDisk: 48, serviceName: 'order-service' },
  { hostName: 'app-01', avgCpu: 85, maxCpu: 93, avgMem: 88, maxMem: 95, avgDisk: 34, serviceName: 'order-service' },
  { hostName: 'app-02', avgCpu: 85, maxCpu: 91, avgMem: 88, maxMem: 94, avgDisk: 35, serviceName: 'payment-service' },
  { hostName: 'web-01', avgCpu: 55, maxCpu: 68, avgMem: 70, maxMem: 78, avgDisk: 22, serviceName: 'api-gateway' },
  { hostName: 'web-02', avgCpu: 55, maxCpu: 65, avgMem: 70, maxMem: 76, avgDisk: 21, serviceName: 'api-gateway' },
]

export const infraTimelines: Record<string, InfraTimelinePoint[]> = {
  'db-primary-01': generateTimeline(35, 40, 2.7),
  'db-replica-01': generateTimeline(30, 35, 2.3),
  'app-01': generateTimeline(32, 38, 2.6),
  'app-02': generateTimeline(32, 38, 2.6),
  'web-01': generateTimeline(28, 35, 2.0),
  'web-02': generateTimeline(28, 35, 1.9),
}

// --- Chat Quick Actions ---

export interface QuickAction {
  icon: string
  label: string
  prompt: string
}

export const quickActions: QuickAction[] = [
  { icon: 'Search', label: 'Investigate Recent Errors', prompt: 'Investigate -- we\'re seeing customer complaints about failed transactions. Check for any errors across our services in the last few hours.' },
  { icon: 'Activity', label: 'System Health Check', prompt: 'Run a health check. Show me CPU, memory, and disk usage across all our hosts. Flag anything concerning.' },
  { icon: 'GitBranch', label: 'Correlate Logs & Metrics', prompt: 'Correlate the error logs with infrastructure metrics. Which host is showing the most stress, and does it line up with the application errors?' },
  { icon: 'BookOpen', label: 'Find Remediation Runbook', prompt: 'Search the runbooks for remediation procedures related to database connection issues.' },
  { icon: 'AlertTriangle', label: 'Full Incident Analysis', prompt: 'Run a full incident investigation. We\'re getting HTTP 500 errors on our order service. Follow your complete investigation protocol.' },
  { icon: 'FileText', label: 'Create Incident Record', prompt: 'Based on your investigation, create a formal incident record documenting the root cause, affected services, and remediation steps.' },
]

// --- Runbooks / Knowledge Base ---

export type RunbookSeverity = 'P1' | 'P2' | 'P3'
export type RunbookCategory = 'database' | 'microservices' | 'application' | 'infrastructure' | 'security'

export interface Runbook {
  title: string
  category: RunbookCategory
  severity: RunbookSeverity
  symptoms: string
  rootCause: string
  remediationSteps: string
  prevention: string
  tags: string[]
}

export const runbooks: Runbook[] = [
  {
    title: 'Database Connection Pool Exhaustion',
    category: 'database',
    severity: 'P1',
    symptoms: 'Connection timeout errors in application logs, increasing response latency above 5 seconds, HTTP 503 from dependent services, connection pool metrics showing 100% utilization',
    rootCause: 'Connection pool maximum size reached due to slow queries holding connections, connection leaks in application code, or sudden traffic spike exceeding pool capacity',
    remediationSteps: '1. Check active connections with pg_stat_activity or equivalent. 2. Identify and kill long-running transactions holding connections. 3. Temporarily increase connection pool max size in application config. 4. Restart affected application pods/instances to release leaked connections. 5. Monitor connection pool metrics to verify recovery. 6. If caused by slow queries, identify them and add missing indexes.',
    prevention: 'Set connection pool idle timeout to 30s, implement circuit breakers on database calls, add connection pool utilization alerts at 80% threshold, regular query performance reviews, connection leak detection in CI/CD pipeline',
    tags: ['database', 'connection-pool', 'timeout', 'postgresql', 'mysql'],
  },
  {
    title: 'High CPU Usage on Database Server',
    category: 'database',
    severity: 'P2',
    symptoms: 'CPU usage consistently above 85%, slow query response times exceeding SLA, increased IO wait percentage, replication lag increasing on replicas',
    rootCause: 'Unoptimized queries performing full table scans, missing indexes on frequently queried columns, excessive concurrent connections causing context switching, runaway background processes like vacuum or reindex',
    remediationSteps: '1. Check pg_stat_activity or processlist for expensive queries. 2. Review recent deployment changes that may have introduced new queries. 3. Use EXPLAIN ANALYZE on slow queries to identify missing indexes. 4. Add missing indexes to resolve full table scans. 5. Scale read traffic to replicas if needed. 6. Kill any runaway background processes.',
    prevention: 'Regular slow query log review, automated query plan analysis in staging, mandatory EXPLAIN checks for new queries, index usage monitoring, CPU alert at 80% threshold',
    tags: ['database', 'cpu', 'performance', 'indexing', 'queries'],
  },
  {
    title: 'Cascading Service Failures',
    category: 'microservices',
    severity: 'P1',
    symptoms: 'Multiple services returning HTTP 5xx errors simultaneously, circuit breakers tripped across service mesh, health checks failing on multiple services, error rates climbing service by service over time',
    rootCause: 'Single critical dependency failure propagating through the service dependency chain, missing or misconfigured circuit breakers allowing failure propagation, synchronous call chains without timeouts creating bottlenecks',
    remediationSteps: '1. Identify the ROOT failing service by examining error timestamps - the earliest errors point to the origin. 2. Check the dependency graph to understand the failure propagation path. 3. Isolate the failing service from the mesh if possible. 4. Restart or scale the root cause service. 5. Reset circuit breakers on dependent services once root cause is resolved. 6. Monitor recovery across all affected services.',
    prevention: 'Implement bulkhead pattern to isolate failure domains, configure proper timeout chains (downstream timeouts < upstream timeouts), use async communication where possible, implement circuit breakers with proper thresholds on all service-to-service calls',
    tags: ['microservices', 'cascade', 'circuit-breaker', 'dependency', 'timeout'],
  },
  {
    title: 'Memory Pressure and GC Pauses',
    category: 'application',
    severity: 'P2',
    symptoms: 'Long garbage collection pauses exceeding 5 seconds, out-of-memory errors or OOMKilled pods, steadily increasing memory usage over time, increased application response latency',
    rootCause: 'Memory leaks in application code retaining object references, undersized JVM heap relative to workload, large object allocations from unbounded collections, improper caching without eviction policies',
    remediationSteps: '1. Capture heap dump from affected instance (jmap -dump:format=b). 2. Analyze dump with Eclipse MAT or VisualVM to find retention chains. 3. Restart affected pods as immediate fix to restore service. 4. Tune JVM flags: increase Xmx, adjust GC algorithm. 5. Identify and fix the memory leak in application code. 6. Add bounded caches with eviction.',
    prevention: 'Set container memory limits with appropriate headroom, enable GC logging for all services, add memory usage alerts at 80% of limit, automated heap dump collection on OOM, regular memory profiling in staging',
    tags: ['memory', 'gc', 'jvm', 'oomkilled', 'heap', 'leak'],
  },
  {
    title: 'Disk Space Exhaustion',
    category: 'infrastructure',
    severity: 'P1',
    symptoms: 'Disk usage above 95%, write operations failing, database unable to write WAL or temporary files, application logs failing to write, container evictions due to disk pressure',
    rootCause: 'Log files growing unbounded without rotation, database temporary files or WAL accumulation, large data imports filling disk, missing disk usage monitoring and alerting',
    remediationSteps: '1. Identify the largest directories consuming disk: du -sh /* | sort -rh. 2. Remove old log files and temporary files safely. 3. If database WAL, run a checkpoint to reclaim space. 4. Implement or fix log rotation configuration. 5. Add monitoring for disk usage at 80% and 90% thresholds. 6. Consider expanding disk if structurally undersized.',
    prevention: 'Implement log rotation with max file size and count, monitor disk usage with alerts at 80%, set database WAL size limits, use separate volumes for data and logs, regular capacity planning reviews',
    tags: ['disk', 'storage', 'logs', 'wal', 'capacity'],
  },
  {
    title: 'Network Connectivity Issues',
    category: 'infrastructure',
    severity: 'P1',
    symptoms: 'Connection refused or connection timeout errors between services, DNS resolution failures, intermittent packet loss, services unable to reach external APIs or databases',
    rootCause: 'Security group or firewall rule changes blocking traffic, DNS service disruption, network partition or cloud provider networking issue, exhausted ephemeral ports or file descriptors',
    remediationSteps: '1. Verify DNS resolution from affected hosts: nslookup/dig. 2. Check security groups and network ACLs for recent changes. 3. Test connectivity with telnet/nc to specific ports. 4. Check for exhausted file descriptors: lsof | wc -l. 5. Review cloud provider status page for known issues. 6. Rollback recent network configuration changes if identified.',
    prevention: 'Infrastructure as code for network config with change review, network connectivity monitoring between critical services, file descriptor and port exhaustion alerts, maintain network topology documentation',
    tags: ['network', 'dns', 'firewall', 'connectivity', 'timeout'],
  },
  {
    title: 'SSL/TLS Certificate Expiration',
    category: 'security',
    severity: 'P1',
    symptoms: 'HTTPS connection failures with certificate errors, browser security warnings, service-to-service mTLS authentication failures, automated API clients receiving SSL errors',
    rootCause: 'Certificate expired without renewal, auto-renewal process failed silently, certificate was manually provisioned without automated renewal, certificate authority or intermediate cert expired',
    remediationSteps: '1. Identify which certificate expired: openssl s_client -connect host:443. 2. Check certificate management system for renewal status. 3. Issue new certificate or trigger manual renewal. 4. Deploy new certificate to all affected endpoints. 5. Restart services to pick up new certificates. 6. Verify certificate chain is complete.',
    prevention: 'Implement automated certificate renewal (cert-manager, Let\'s Encrypt), add certificate expiry monitoring with 30-day warning alerts, maintain certificate inventory, use short-lived certificates where possible',
    tags: ['ssl', 'tls', 'certificate', 'https', 'security'],
  },
  {
    title: 'API Rate Limiting / Throttling',
    category: 'application',
    severity: 'P3',
    symptoms: 'HTTP 429 Too Many Requests responses, increasing response latency, request queuing, third-party API calls failing with rate limit errors',
    rootCause: 'Traffic spike exceeding configured rate limits, misconfigured retry logic causing amplification, batch job sending burst of API calls, external API provider reducing rate limits',
    remediationSteps: '1. Identify which API or endpoint is being rate limited. 2. Check if traffic spike is legitimate or from a misbehaving client. 3. Implement or adjust exponential backoff in retry logic. 4. Temporarily increase rate limits if traffic is legitimate. 5. Queue and throttle batch operations. 6. Contact external provider if their limits changed.',
    prevention: 'Implement client-side rate limiting with backoff, use request queuing for batch operations, monitor rate limit headers, set up alerts for 429 response rates, maintain rate limit documentation for all external APIs',
    tags: ['rate-limit', 'throttling', '429', 'api', 'backoff'],
  },
]
