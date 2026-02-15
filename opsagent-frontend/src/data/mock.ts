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
    action: 'FORK -> FUSE -> RERANK pipeline',
    target: 'order-service incident knowledge',
    timestamp: '2026-02-15T03:07:30Z',
    status: 'completed',
    detail: 'Hybrid search across incident-knowledge: lexical + semantic results fused via RRF, reranked with .rerank-v1-elasticsearch. Found 3 similar past incidents involving connection pool exhaustion.',
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
  { name: 'rerank', label: 'RERANK', description: 'ML model re-scores by relevance', status: 'completed', duration: 89, resultCount: 5 },
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
