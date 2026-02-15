# Full Project Verification & Production-Readiness Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Verify the entire SHII project works top-to-bottom with zero bugs, then add a production-grade data layer so the frontend connects to real Elasticsearch data.

**Architecture:** Bottom-up layered audit. Validate backend JSON/scripts first, then verify the frontend builds and runs, then add an ES API client with React hooks that fetch real data and fall back to mock. Every page gets loading/error/empty states.

**Tech Stack:** Elasticsearch REST API (fetch), React hooks, Vite env vars + proxy, TypeScript

---

## Phase 1: Backend Validation

### Task 1: Validate all backend JSON files

**Files:**
- Check: `opsagent-backend/agents/*.json` (4 files)
- Check: `opsagent-backend/tools/*.json` (9 files)
- Check: `opsagent-backend/setup/mappings/*.json` (5 files)
- Check: `opsagent-backend/transforms/service-health-summary.json`

**Step 1: Run JSON syntax validation**

Run: `cd /Users/nihalnihalani/Desktop/Github/elasticsearch && find opsagent-backend -name "*.json" -exec python3 -c "import json,sys; json.load(open(sys.argv[1])); print('OK:', sys.argv[1])" {} \;`
Expected: All files print "OK"

**Step 2: Verify agent→tool cross-references**

For each agent JSON, verify every tool name in `configuration.tools[]` has a matching file in `tools/`. Check:
- `triage-agent.json` references: `hybrid_rag_search`, `error_trend_analysis`, `service_error_breakdown`
- `investigation-agent.json` references: `anomaly_detector`, `platform.core.search`, `platform.core.list_indices`, `platform.core.get_index_mapping`
- `postmortem-agent.json` references: `hybrid_rag_search`, `platform.core.search`
- `ops-agent.json` references: all of the above

The `platform.core.*` tools are built-in Kibana tools, not custom files. Only custom tools need files: `hybrid_rag_search`, `error_trend_analysis`, `service_error_breakdown`, `anomaly_detector`.

Expected: All custom tools have matching `.json` files in `tools/`

**Step 3: Verify tool→index cross-references**

Check that every index name used in tool queries has a matching mapping file:
- `hybrid_rag_search.json` → `incident-knowledge` → `setup/mappings/incident-knowledge.json` ✓
- `error_trend_analysis.json` → `logs-opsagent-*` → `setup/mappings/logs-template.json` ✓
- `service_error_breakdown.json` → `logs-opsagent-*` → `setup/mappings/logs-template.json` ✓
- `anomaly_detector.json` → `logs-opsagent-*` → `setup/mappings/logs-template.json` ✓

Expected: All index references resolve

**Step 4: Commit if any fixes were needed**

```bash
git add -A && git commit -m "fix: backend JSON validation fixes"
```

---

### Task 2: Validate workflow YAML

**Files:**
- Check: `opsagent-backend/workflows/incident-response.yaml`

**Step 1: Run YAML syntax validation**

Run: `python3 -c "import yaml; yaml.safe_load(open('opsagent-backend/workflows/incident-response.yaml')); print('YAML OK')"`
Expected: "YAML OK"

**Step 2: Verify step references**

Check that all `{{ steps.X.output }}` template variables reference actual step names defined in the workflow:
- `{{ steps.check_alert_rules.output.hits.total.value }}` → step `check_alert_rules` exists
- `{{ steps.triage_analysis.output.content }}` → step `triage_analysis` exists
- `{{ steps.investigation_analysis.output.content }}` → step `investigation_analysis` exists
- `{{ steps.postmortem_report.output.content }}` → step `postmortem_report` exists
- `{{ steps.extract_severity.output.content }}` → step `extract_severity` exists
- `{{ steps.get_service_owner.output.hits.hits.0._source }}` → step `get_service_owner` exists

Expected: All template variable references resolve to defined steps

---

### Task 3: Validate Python and Bash scripts

**Files:**
- Check: `opsagent-backend/scripts/generate-demo-data.py`
- Check: `opsagent-backend/setup.sh`

**Step 1: Python syntax check**

Run: `python3 -m py_compile opsagent-backend/scripts/generate-demo-data.py && echo "Python OK"`
Expected: "Python OK"

**Step 2: Bash syntax check**

Run: `bash -n opsagent-backend/setup.sh && echo "Bash OK"`
Expected: "Bash OK"

**Step 3: Verify Python imports resolve**

Run: `python3 -c "import json, os, random, datetime, hashlib, sys; print('Imports OK')"`
Expected: "Imports OK" (these are the imports used in generate-demo-data.py - all stdlib)

---

## Phase 2: Frontend Build Verification

### Task 4: Install dependencies and build

**Files:**
- Check: `opsagent-frontend/package.json`

**Step 1: Install dependencies**

Run: `cd /Users/nihalnihalani/Desktop/Github/elasticsearch/opsagent-frontend && npm install`
Expected: No errors, no peer dependency conflicts

**Step 2: Run TypeScript + Vite build**

Run: `cd /Users/nihalnihalani/Desktop/Github/elasticsearch/opsagent-frontend && npm run build`
Expected: Build succeeds with zero errors

**Step 3: Fix any build errors found**

If there are TypeScript errors, fix them. Common issues:
- Missing type imports
- Incorrect prop types
- Unused imports causing errors in strict mode

**Step 4: Commit if any fixes were needed**

```bash
git add -A && git commit -m "fix: resolve frontend build errors"
```

---

### Task 5: Verify dev server and all pages render

**Files:**
- Check: All 6 pages in `opsagent-frontend/src/pages/`

**Step 1: Start dev server**

Run: `cd /Users/nihalnihalani/Desktop/Github/elasticsearch/opsagent-frontend && npm run dev`
Expected: Vite starts on localhost:5173

**Step 2: Visit each page route and check for errors**

Navigate to each route and check browser console for errors:
- `http://localhost:5173/` → Dashboard
- `http://localhost:5173/incident` → Incident
- `http://localhost:5173/alerts` → Alerts
- `http://localhost:5173/blast-radius` → Blast Radius
- `http://localhost:5173/agent-activity` → Agent Activity
- `http://localhost:5173/demo` → Demo

Expected: All 6 pages render, zero console errors

**Step 3: Test sidebar navigation**

Click each sidebar link and verify it navigates to the correct page.

Expected: All navigation works

---

## Phase 3: Cross-Layer Consistency

### Task 6: Align service names between frontend and backend

**Files:**
- Check: `opsagent-frontend/src/data/mock.ts` (services array)
- Check: `opsagent-backend/scripts/generate-demo-data.py` (SERVICES dict)

**Step 1: Compare service names**

Frontend mock `services[]` has 8 services:
- `api-gateway`, `orders-service`, `payment-gateway`, `cart-service`, `user-service`, `inventory-service`, `notification-service`, `search-service`

Backend `generate-demo-data.py` has 10 services:
- `api-gateway`, `auth-service`, `payment-service`, `order-service`, `inventory-service`, `notification-service`, `search-service`, `user-service`, `analytics-pipeline`, `cdn-edge`

**Mismatches to fix:**
- Frontend says `orders-service`, backend says `order-service` (missing 's')
- Frontend says `payment-gateway`, backend says `payment-service` (different suffix)
- Frontend says `cart-service`, backend has no `cart-service`
- Backend has `auth-service`, `analytics-pipeline`, `cdn-edge` that frontend doesn't show

**Step 2: Align frontend mock to match backend exactly**

Edit `opsagent-frontend/src/data/mock.ts` to use backend service names. The primary incident services should be:
- `order-service` (not `orders-service`)
- `payment-service` (not `payment-gateway`)

Keep `cart-service` in frontend mock since it illustrates cascading failure, even if backend doesn't have it. But update the primary services to match.

Also update all references in mock data (incidents, blast radius nodes) that reference the old names.

**Step 3: Run build to verify no type errors from renaming**

Run: `cd /Users/nihalnihalani/Desktop/Github/elasticsearch/opsagent-frontend && npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add opsagent-frontend/src/data/mock.ts
git commit -m "fix: align frontend service names with backend data generator"
```

---

### Task 7: Verify mock data shapes match backend output

**Files:**
- Check: `opsagent-frontend/src/data/mock.ts` (interfaces)
- Reference: `opsagent-backend/setup/mappings/*.json` (field definitions)

**Step 1: Compare ServiceHealth interface vs service-health-realtime mapping**

Frontend `ServiceHealth`:
```typescript
{ name, status, latency, errorRate, requests, trend }
```

Backend `service-health-realtime` mapping fields:
```
service.name, time_bucket, total_requests, error_count, error_rate, avg_duration_ms, p95_duration_ms, p99_duration_ms, status_2xx, status_4xx, status_5xx, unique_errors
```

The frontend `status` (healthy/degraded/down) is derived, not stored. The `trend` is an array of historical values. These are computed from the raw data. This is fine - the frontend will transform ES data into its own shape.

**Step 2: Compare AlertRule interface vs alert-rules mapping**

Frontend `AlertRule`:
```typescript
{ id, name, description, condition, severity, active, matchCount, lastTriggered, createdBy, percolateQuery, workflowAction }
```

Backend `alert-rules` mapping fields:
```
query (percolator), rule_name, rule_description, severity, category, owner_team, notification_channel, enabled, cooldown_minutes, last_triggered, created_at, created_by
```

Frontend field mapping to backend:
- `name` ↔ `rule_name`
- `description` ↔ `rule_description`
- `active` ↔ `enabled`
- `lastTriggered` ↔ `last_triggered`
- `createdBy` ↔ `created_by`
- `percolateQuery` ↔ `query` (the percolator field)
- `condition` → frontend-only display string (derived from percolate query)
- `matchCount` → needs runtime aggregation
- `workflowAction` → frontend-only display (derived from notification_channel)

Document these mappings in the ES client transform functions. No structural changes needed to mock.ts.

**Step 3: Document findings**

No code changes needed. The transform logic will go in the data hooks (Phase 4).

---

## Phase 4: Environment & API Infrastructure

### Task 8: Add environment configuration

**Files:**
- Create: `opsagent-frontend/.env.example`
- Create: `opsagent-frontend/.env`
- Modify: `opsagent-frontend/vite.config.ts`

**Step 1: Create .env.example**

```env
# Elasticsearch connection (leave empty for mock-only mode)
VITE_ES_URL=
VITE_ES_API_KEY=

# Set to "true" to force mock data even when ES is configured
VITE_FORCE_MOCK=false
```

**Step 2: Create .env with mock defaults**

```env
VITE_ES_URL=
VITE_ES_API_KEY=
VITE_FORCE_MOCK=false
```

**Step 3: Add Vite proxy for Elasticsearch**

Edit `opsagent-frontend/vite.config.ts`:

```typescript
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      proxy: env.VITE_ES_URL
        ? {
            '/es': {
              target: env.VITE_ES_URL,
              changeOrigin: true,
              rewrite: (path) => path.replace(/^\/es/, ''),
              headers: {
                Authorization: `ApiKey ${env.VITE_ES_API_KEY}`,
              },
            },
          }
        : undefined,
    },
  }
})
```

**Step 4: Add .env to .gitignore**

```bash
echo ".env" >> opsagent-frontend/.gitignore
```

**Step 5: Run build to verify config changes**

Run: `cd /Users/nihalnihalani/Desktop/Github/elasticsearch/opsagent-frontend && npm run build`
Expected: Build succeeds

**Step 6: Commit**

```bash
git add opsagent-frontend/.env.example opsagent-frontend/.gitignore opsagent-frontend/vite.config.ts
git commit -m "feat: add environment config and Vite proxy for Elasticsearch"
```

---

### Task 9: Create Elasticsearch API client

**Files:**
- Create: `opsagent-frontend/src/lib/es-client.ts`

**Step 1: Write the ES client**

```typescript
const ES_BASE = '/es'

interface EsSearchParams {
  index: string
  body: Record<string, unknown>
}

interface EsEsqlParams {
  query: string
  params?: Record<string, unknown>
}

function getConfig() {
  const url = import.meta.env.VITE_ES_URL
  const forceMock = import.meta.env.VITE_FORCE_MOCK === 'true'
  return { isLive: !!url && !forceMock }
}

export function isLiveMode(): boolean {
  return getConfig().isLive
}

export async function esSearch<T = unknown>({ index, body }: EsSearchParams): Promise<{
  hits: { total: { value: number }; hits: Array<{ _id: string; _source: T }> }
}> {
  const res = await fetch(`${ES_BASE}/${index}/_search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`ES search failed: ${res.status} ${res.statusText}`)
  return res.json()
}

export async function esEsql<T = Record<string, unknown>>({ query, params }: EsEsqlParams): Promise<{
  columns: Array<{ name: string; type: string }>
  values: unknown[][]
}> {
  const res = await fetch(`${ES_BASE}/_query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, ...(params ? { params } : {}) }),
  })
  if (!res.ok) throw new Error(`ES|QL query failed: ${res.status} ${res.statusText}`)
  return res.json()
}

export async function esAggregate<T = unknown>(index: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${ES_BASE}/${index}/_search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ size: 0, ...body }),
  })
  if (!res.ok) throw new Error(`ES aggregation failed: ${res.status} ${res.statusText}`)
  return res.json()
}
```

**Step 2: Run build**

Run: `cd /Users/nihalnihalani/Desktop/Github/elasticsearch/opsagent-frontend && npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add opsagent-frontend/src/lib/es-client.ts
git commit -m "feat: add Elasticsearch API client with search, ES|QL, and aggregation"
```

---

### Task 10: Create generic data hook and loading/error/empty components

**Files:**
- Create: `opsagent-frontend/src/hooks/use-es-data.ts`
- Create: `opsagent-frontend/src/components/ui/data-state.tsx`

**Step 1: Write the generic hook**

```typescript
import { useState, useEffect, useCallback } from 'react'
import { isLiveMode } from '@/lib/es-client'

interface UseEsDataOptions<T> {
  fetchFn: () => Promise<T>
  mockData: T
  refreshInterval?: number // ms, 0 = no refresh
}

interface UseEsDataResult<T> {
  data: T
  loading: boolean
  error: string | null
  isLive: boolean
  refresh: () => void
}

export function useEsData<T>({ fetchFn, mockData, refreshInterval = 0 }: UseEsDataOptions<T>): UseEsDataResult<T> {
  const live = isLiveMode()
  const [data, setData] = useState<T>(mockData)
  const [loading, setLoading] = useState(live)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!live) return
    try {
      setLoading(true)
      setError(null)
      const result = await fetchFn()
      setData(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch data')
      // Keep showing last good data (or mock) on error
    } finally {
      setLoading(false)
    }
  }, [live, fetchFn])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (!live || !refreshInterval) return
    const interval = setInterval(fetchData, refreshInterval)
    return () => clearInterval(interval)
  }, [live, refreshInterval, fetchData])

  return { data, loading, error, isLive: live, refresh: fetchData }
}
```

**Step 2: Write the DataState component**

```tsx
import { Loader2, AlertCircle, Inbox } from 'lucide-react'

interface DataStateProps {
  loading: boolean
  error: string | null
  isEmpty?: boolean
  children: React.ReactNode
}

export function DataState({ loading, error, isEmpty, children }: DataStateProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 text-elastic animate-spin" />
          <p className="text-xs text-text-muted">Loading from Elasticsearch...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <AlertCircle className="h-6 w-6 text-critical" />
          <p className="text-xs text-critical">{error}</p>
          <p className="text-[10px] text-text-dim">Showing cached data</p>
        </div>
      </div>
    )
  }

  if (isEmpty) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <Inbox className="h-6 w-6 text-text-dim" />
          <p className="text-xs text-text-muted">No data available</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
```

**Step 3: Run build**

Run: `cd /Users/nihalnihalani/Desktop/Github/elasticsearch/opsagent-frontend && npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add opsagent-frontend/src/hooks/use-es-data.ts opsagent-frontend/src/components/ui/data-state.tsx
git commit -m "feat: add generic useEsData hook and DataState loading/error/empty component"
```

---

## Phase 5: Domain-Specific Data Hooks

### Task 11: Create service health hook

**Files:**
- Create: `opsagent-frontend/src/hooks/use-services.ts`

**Step 1: Write the hook**

```typescript
import { useEsData } from './use-es-data'
import { esSearch } from '@/lib/es-client'
import { services as mockServices } from '@/data/mock'
import type { ServiceHealth } from '@/data/mock'

async function fetchServices(): Promise<ServiceHealth[]> {
  // Query the service-health-realtime index (populated by transform)
  // Get latest time_bucket per service
  const res = await esSearch<{
    'service.name': string
    error_rate: number
    avg_duration_ms: number
    total_requests: number
    status_5xx: number
  }>({
    index: 'service-health-realtime',
    body: {
      size: 0,
      aggs: {
        by_service: {
          terms: { field: 'service.name', size: 20 },
          aggs: {
            latest: {
              top_hits: {
                size: 7,
                sort: [{ time_bucket: { order: 'desc' } }],
                _source: ['service.name', 'error_rate', 'avg_duration_ms', 'total_requests', 'status_5xx'],
              },
            },
          },
        },
      },
    },
  })

  const buckets = (res as any).aggregations?.by_service?.buckets ?? []
  return buckets.map((bucket: any) => {
    const hits = bucket.latest.hits.hits
    const latest = hits[0]?._source ?? {}
    const trend = hits.map((h: any) => h._source.error_rate ?? 0).reverse()

    const errorRate = latest.error_rate ?? 0
    let status: 'healthy' | 'degraded' | 'down' = 'healthy'
    if (errorRate > 25) status = 'down'
    else if (errorRate > 5) status = 'degraded'

    return {
      name: bucket.key,
      status,
      latency: Math.round(latest.avg_duration_ms ?? 0),
      errorRate: Math.round((errorRate + Number.EPSILON) * 10) / 10,
      requests: latest.total_requests ?? 0,
      trend,
    }
  })
}

export function useServices() {
  return useEsData<ServiceHealth[]>({
    fetchFn: fetchServices,
    mockData: mockServices,
    refreshInterval: 30000, // refresh every 30s
  })
}
```

**Step 2: Run build**

Run: `cd /Users/nihalnihalani/Desktop/Github/elasticsearch/opsagent-frontend && npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add opsagent-frontend/src/hooks/use-services.ts
git commit -m "feat: add useServices hook with ES service-health-realtime query"
```

---

### Task 12: Create alert rules hook

**Files:**
- Create: `opsagent-frontend/src/hooks/use-alerts.ts`

**Step 1: Write the hook**

```typescript
import { useEsData } from './use-es-data'
import { esSearch } from '@/lib/es-client'
import { alertRules as mockAlerts } from '@/data/mock'
import type { AlertRule } from '@/data/mock'

async function fetchAlertRules(): Promise<AlertRule[]> {
  const res = await esSearch<{
    rule_name: string
    rule_description: string
    severity: string
    enabled: boolean
    last_triggered: string
    created_by: string
    category: string
    notification_channel: string
    query: Record<string, unknown>
  }>({
    index: 'alert-rules',
    body: {
      size: 50,
      sort: [{ severity: 'asc' }, { last_triggered: 'desc' }],
    },
  })

  return res.hits.hits.map((hit) => {
    const s = hit._source
    return {
      id: hit._id,
      name: s.rule_name,
      description: s.rule_description ?? '',
      condition: formatCondition(s.query),
      severity: s.severity as AlertRule['severity'],
      active: s.enabled,
      matchCount: 0, // Would need separate count query
      lastTriggered: s.last_triggered,
      createdBy: s.created_by,
      percolateQuery: JSON.stringify(s.query, null, 2),
      workflowAction: s.notification_channel ? `${s.notification_channel} notification` : undefined,
    }
  })
}

function formatCondition(query: Record<string, unknown>): string {
  // Simple condition string from percolate query for display
  try {
    return JSON.stringify(query).slice(0, 80) + '...'
  } catch {
    return 'Complex query'
  }
}

export function useAlertRules() {
  return useEsData<AlertRule[]>({
    fetchFn: fetchAlertRules,
    mockData: mockAlerts,
  })
}
```

**Step 2: Run build**

Run: `cd /Users/nihalnihalani/Desktop/Github/elasticsearch/opsagent-frontend && npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add opsagent-frontend/src/hooks/use-alerts.ts
git commit -m "feat: add useAlertRules hook with ES alert-rules percolator query"
```

---

### Task 13: Create error trends and significant terms hooks

**Files:**
- Create: `opsagent-frontend/src/hooks/use-error-trends.ts`

**Step 1: Write the hook**

```typescript
import { useEsData } from './use-es-data'
import { esAggregate } from '@/lib/es-client'
import { errorTrendData as mockTrends, significantTermsData as mockTerms } from '@/data/mock'

interface ErrorTrendPoint {
  time: string
  errors: number
  baseline: number
}

interface SignificantTerm {
  term: string
  score: number
  bgCount: number
  docCount: number
  significance: 'critical' | 'high' | 'medium'
}

async function fetchErrorTrends(service: string): Promise<ErrorTrendPoint[]> {
  const res: any = await esAggregate('logs-opsagent-*', {
    query: {
      bool: {
        filter: [
          { term: { 'service.name': service } },
          { range: { '@timestamp': { gte: 'now-1h' } } },
        ],
      },
    },
    aggs: {
      over_time: {
        date_histogram: {
          field: '@timestamp',
          fixed_interval: '5m',
        },
        aggs: {
          error_count: {
            filter: { terms: { 'log.level': ['ERROR', 'FATAL'] } },
          },
        },
      },
    },
  })

  const buckets = res.aggregations?.over_time?.buckets ?? []
  return buckets.map((b: any) => ({
    time: new Date(b.key_as_string).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
    errors: b.error_count.doc_count,
    baseline: 5,
  }))
}

async function fetchSignificantTerms(service: string): Promise<SignificantTerm[]> {
  const res: any = await esAggregate('logs-opsagent-*', {
    query: {
      bool: {
        filter: [
          { term: { 'service.name': service } },
          { terms: { 'log.level': ['ERROR', 'FATAL'] } },
          { range: { '@timestamp': { gte: 'now-1h' } } },
        ],
      },
    },
    aggs: {
      unusual_errors: {
        significant_terms: {
          field: 'error.type',
          size: 10,
        },
      },
    },
  })

  const buckets = res.aggregations?.unusual_errors?.buckets ?? []
  return buckets.map((b: any) => {
    const score = Math.round((b.score ?? 0) * 10) / 10
    return {
      term: b.key,
      score,
      bgCount: b.bg_count ?? 0,
      docCount: b.doc_count ?? 0,
      significance: score > 80 ? 'critical' as const : score > 50 ? 'high' as const : 'medium' as const,
    }
  })
}

export function useErrorTrends(service: string = 'order-service') {
  return useEsData<ErrorTrendPoint[]>({
    fetchFn: () => fetchErrorTrends(service),
    mockData: mockTrends,
    refreshInterval: 15000,
  })
}

export function useSignificantTerms(service: string = 'order-service') {
  return useEsData<SignificantTerm[]>({
    fetchFn: () => fetchSignificantTerms(service),
    mockData: mockTerms,
  })
}
```

**Step 2: Run build**

Run: `cd /Users/nihalnihalani/Desktop/Github/elasticsearch/opsagent-frontend && npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add opsagent-frontend/src/hooks/use-error-trends.ts
git commit -m "feat: add useErrorTrends and useSignificantTerms hooks with ES aggregations"
```

---

### Task 14: Create blast radius hook

**Files:**
- Create: `opsagent-frontend/src/hooks/use-blast-radius.ts`

**Step 1: Write the hook**

```typescript
import { useEsData } from './use-es-data'
import { esSearch } from '@/lib/es-client'
import {
  blastRadiusNodes as mockNodes,
  blastRadiusEdges as mockEdges,
} from '@/data/mock'
import type { BlastRadiusNode, BlastRadiusEdge } from '@/data/mock'

interface BlastRadiusData {
  nodes: BlastRadiusNode[]
  edges: BlastRadiusEdge[]
}

async function fetchBlastRadius(): Promise<BlastRadiusData> {
  // Get service owners (which contain dependencies)
  const res = await esSearch<{
    service_name: string
    dependencies: string[]
    tier: string
  }>({
    index: 'service-owners',
    body: { size: 50 },
  })

  // Get current health status per service from service-health-realtime
  const healthRes: any = await esSearch({
    index: 'service-health-realtime',
    body: {
      size: 0,
      aggs: {
        by_service: {
          terms: { field: 'service.name', size: 20 },
          aggs: {
            latest: {
              top_hits: {
                size: 1,
                sort: [{ time_bucket: { order: 'desc' } }],
                _source: ['error_rate', 'avg_duration_ms'],
              },
            },
          },
        },
      },
    },
  })

  const healthMap = new Map<string, { errorRate: number; latency: number }>()
  const healthBuckets = healthRes.aggregations?.by_service?.buckets ?? []
  for (const b of healthBuckets) {
    const src = b.latest.hits.hits[0]?._source
    if (src) healthMap.set(b.key, { errorRate: src.error_rate ?? 0, latency: src.avg_duration_ms ?? 0 })
  }

  // Build graph from service-owners
  const serviceHits = res.hits.hits
  const nodePositions = calculatePositions(serviceHits.length)

  const nodes: BlastRadiusNode[] = serviceHits.map((hit, i) => {
    const s = hit._source
    const health = healthMap.get(s.service_name)
    const errorRate = health?.errorRate ?? 0
    let status: 'healthy' | 'degraded' | 'down' = 'healthy'
    if (errorRate > 25) status = 'down'
    else if (errorRate > 5) status = 'degraded'

    return {
      id: s.service_name,
      name: s.service_name,
      type: 'service',
      status,
      x: nodePositions[i].x,
      y: nodePositions[i].y,
    }
  })

  const edges: BlastRadiusEdge[] = []
  for (const hit of serviceHits) {
    const s = hit._source
    if (s.dependencies) {
      for (const dep of s.dependencies) {
        const targetHealth = healthMap.get(dep)
        edges.push({
          source: s.service_name,
          target: dep,
          weight: 0.5,
          latency: targetHealth?.latency ?? 0,
        })
      }
    }
  }

  return { nodes, edges }
}

function calculatePositions(count: number): Array<{ x: number; y: number }> {
  // Simple circular layout
  const cx = 400, cy = 260, r = 200
  return Array.from({ length: count }, (_, i) => ({
    x: Math.round(cx + r * Math.cos((2 * Math.PI * i) / count - Math.PI / 2)),
    y: Math.round(cy + r * Math.sin((2 * Math.PI * i) / count - Math.PI / 2)),
  }))
}

export function useBlastRadius() {
  return useEsData<BlastRadiusData>({
    fetchFn: fetchBlastRadius,
    mockData: { nodes: mockNodes, edges: mockEdges },
    refreshInterval: 30000,
  })
}
```

**Step 2: Run build**

Run: `cd /Users/nihalnihalani/Desktop/Github/elasticsearch/opsagent-frontend && npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add opsagent-frontend/src/hooks/use-blast-radius.ts
git commit -m "feat: add useBlastRadius hook with service-owners + health data"
```

---

## Phase 6: Wire Pages to Hooks

### Task 15: Wire ServiceHealthGrid to useServices hook

**Files:**
- Modify: `opsagent-frontend/src/components/dashboard/service-health-grid.tsx`

**Step 1: Replace direct mock import with hook**

Change:
```typescript
import { services } from '@/data/mock'
```

To:
```typescript
import { useServices } from '@/hooks/use-services'
import { DataState } from '@/components/ui/data-state'
```

Update the component to use the hook:
```typescript
export function ServiceHealthGrid() {
  const { data: services, loading, error } = useServices()

  return (
    <DataState loading={loading} error={error} isEmpty={services.length === 0}>
      <div className="grid grid-cols-4 gap-3">
        {services.map(s => (
          // ... existing JSX unchanged
        ))}
      </div>
    </DataState>
  )
}
```

**Step 2: Run build**

Run: `cd /Users/nihalnihalani/Desktop/Github/elasticsearch/opsagent-frontend && npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add opsagent-frontend/src/components/dashboard/service-health-grid.tsx
git commit -m "feat: wire ServiceHealthGrid to useServices hook with loading states"
```

---

### Task 16: Wire Alerts page to useAlertRules hook

**Files:**
- Modify: `opsagent-frontend/src/pages/alerts.tsx`

**Step 1: Replace direct mock import with hook**

Change:
```typescript
import { alertRules, severityColors } from '@/data/mock'
```

To:
```typescript
import { severityColors } from '@/data/mock'
import { useAlertRules } from '@/hooks/use-alerts'
import { DataState } from '@/components/ui/data-state'
```

Add the hook call at the top of the component:
```typescript
export function AlertsPage() {
  const [expandedRule, setExpandedRule] = useState<string | null>('1')
  const { data: alertRules, loading, error } = useAlertRules()
```

Wrap the alert rules list in `<DataState>`:
```tsx
<DataState loading={loading} error={error} isEmpty={alertRules.length === 0}>
  <div className="space-y-3">
    {alertRules.map(rule => {
      // ... existing JSX
    })}
  </div>
</DataState>
```

**Step 2: Run build**

Run: `cd /Users/nihalnihalani/Desktop/Github/elasticsearch/opsagent-frontend && npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add opsagent-frontend/src/pages/alerts.tsx
git commit -m "feat: wire Alerts page to useAlertRules hook with loading states"
```

---

### Task 17: Wire Incident page to error trends and significant terms hooks

**Files:**
- Modify: `opsagent-frontend/src/pages/incident.tsx`

**Step 1: Add hook imports**

Add:
```typescript
import { useErrorTrends, useSignificantTerms } from '@/hooks/use-error-trends'
import { DataState } from '@/components/ui/data-state'
```

Remove `errorTrendData` and `significantTermsData` from the mock import.

**Step 2: Use hooks in component**

```typescript
export function IncidentPage() {
  const incident = incidents[0]
  const { data: errorTrendData, loading: trendsLoading, error: trendsError } = useErrorTrends(incident.service)
  const { data: significantTermsData, loading: termsLoading, error: termsError } = useSignificantTerms(incident.service)
```

Wrap the chart sections in `<DataState>` components.

**Step 3: Run build**

Run: `cd /Users/nihalnihalani/Desktop/Github/elasticsearch/opsagent-frontend && npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add opsagent-frontend/src/pages/incident.tsx
git commit -m "feat: wire Incident page to error trends and significant terms hooks"
```

---

### Task 18: Wire Blast Radius page to useBlastRadius hook

**Files:**
- Modify: `opsagent-frontend/src/pages/blast-radius.tsx`

**Step 1: Replace direct mock import with hook**

Change:
```typescript
import { blastRadiusNodes, blastRadiusEdges } from '@/data/mock'
```

To:
```typescript
import { useBlastRadius } from '@/hooks/use-blast-radius'
import { DataState } from '@/components/ui/data-state'
```

Update component:
```typescript
export function BlastRadiusPage() {
  const { data: { nodes: blastRadiusNodes, edges: blastRadiusEdges }, loading, error } = useBlastRadius()
```

The rest of the component remains unchanged since it already uses `blastRadiusNodes` and `blastRadiusEdges` variable names.

**Step 2: Run build**

Run: `cd /Users/nihalnihalani/Desktop/Github/elasticsearch/opsagent-frontend && npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add opsagent-frontend/src/pages/blast-radius.tsx
git commit -m "feat: wire Blast Radius page to useBlastRadius hook"
```

---

### Task 19: Add live mode indicator to sidebar

**Files:**
- Modify: `opsagent-frontend/src/components/layout/sidebar.tsx`

**Step 1: Add connection status indicator**

Import `isLiveMode` and show a small badge in the sidebar footer:

```typescript
import { isLiveMode } from '@/lib/es-client'
```

Add at the bottom of the sidebar:
```tsx
<div className="mt-auto p-3 border-t border-border">
  <div className="flex items-center gap-2">
    <span className={`h-2 w-2 rounded-full ${isLiveMode() ? 'bg-low animate-pulse' : 'bg-text-dim'}`} />
    <span className="text-[10px] text-text-dim font-mono">
      {isLiveMode() ? 'Live: Elasticsearch' : 'Mock Data Mode'}
    </span>
  </div>
</div>
```

**Step 2: Run build**

Run: `cd /Users/nihalnihalani/Desktop/Github/elasticsearch/opsagent-frontend && npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add opsagent-frontend/src/components/layout/sidebar.tsx
git commit -m "feat: add live/mock mode indicator to sidebar"
```

---

## Phase 7: Demo & Visual Verification

### Task 20: Verify demo page works end-to-end

**Files:**
- Check: `opsagent-frontend/src/pages/demo.tsx`

**Step 1: Start dev server**

Run: `cd /Users/nihalnihalani/Desktop/Github/elasticsearch/opsagent-frontend && npm run dev`

**Step 2: Open demo page and verify all 6 beats**

Navigate to `http://localhost:5173/demo` and verify:
1. Play button starts the demo
2. All 6 story beats progress automatically
3. Progress bar advances correctly
4. Pipeline visualization animates (pending → running → completed)
5. Navigation buttons work
6. Before/after impact card renders
7. Timer displays correctly
8. Hidden gems badges appear

**Step 3: Fix any issues found**

If demo has stuck states, broken animations, or visual glitches, fix them.

---

### Task 21: Visual check on all pages

**Files:**
- Check: All 6 pages

**Step 1: Check each page for visual issues**

Walk through each page and verify:
- Dashboard: revenue ticker counts up, service health grid renders, metric cards display
- Incident: pipeline viz animates, charts render, timeline shows handoffs
- Alerts: percolate explainer renders, expandable rules work
- Blast Radius: cascade animation plays, replay button works
- Agent Activity: filter tabs work, timeline renders
- Demo: full flow works

**Step 2: Check timeline coherence**

Verify "3:07 AM" timestamp appears consistently:
- Dashboard banner: "It's 3:07 AM"
- Incident header: "Started 03:07 AM"
- Mock data timestamps: all start at `2026-02-15T03:07:00Z`
- Agent activities: timestamps progress from 03:07:30 → 03:09:30

**Step 3: Fix any issues and commit**

```bash
git add -A && git commit -m "fix: visual and demo flow fixes"
```

---

### Task 22: Final build and verification

**Step 1: Full production build**

Run: `cd /Users/nihalnihalani/Desktop/Github/elasticsearch/opsagent-frontend && npm run build`
Expected: Build succeeds with zero errors

**Step 2: Preview production build**

Run: `cd /Users/nihalnihalani/Desktop/Github/elasticsearch/opsagent-frontend && npm run preview`

Navigate to the preview URL and verify all pages still work in production mode.

**Step 3: Final commit**

```bash
git add -A && git commit -m "chore: final verification - production build clean"
```
