# Self-Healing Infrastructure Intelligence - Architecture

## System Overview

A focused IT operations platform built on Elasticsearch Agent Builder. One primary agent handles the full incident lifecycle (triage + investigation), while a single bidirectional workflow handles alerting, data gathering, agent analysis, and notification routing via Slack and Jira.

**Design principle**: Fewer features, deeper execution.

```
                        +-------------------+
                        |   Kibana Chat UI  |
                        |   / MCP / A2A     |
                        +--------+----------+
                                 |
                    +------------+------------+
                    |    Agent Builder Engine  |
                    +--------+----------------+
                             |
                    +--------+--------+
                    |    OpsAgent     |
                    | (triage + inv.) |
                    +--+--+--+--+----+
                       |  |  |  |
    +------------------+--+--+--+-----------------------+
    |              Custom Tools (4)                      |
    |                                                    |
    | hybrid_rag   | error_trend  | service_error | ano- |
    | _search      | _analysis    | _breakdown    | maly |
    | (FORK/FUSE)  | (ES|QL)      | (ES|QL)       | _det |
    |              |              |               | ector|
    +------+-------+------+------+-------+-------+-+----+
           |              |              |          |
    +------+--------------+--------------+----------+---+
    |                Elasticsearch Indices               |
    | incident-knowledge | logs-opsagent-* | alert-rules |
    |  (semantic_text)   |  (12K+ docs)   | (percolator)|
    | service-owners     | service-health-realtime       |
    +----------------------------------------------------+
           ^                                  |
           |          +--------------------+  |
           +----------| Workflow Engine    |--+
                      | (incident-response)|
                      | Percolate -> Agent |
                      | -> Slack + Jira    |
                      +--------------------+
```

## Component Inventory

| Category | Count | Items | Status |
|----------|-------|-------|--------|
| Agents | 1 | ops-agent (triage + investigation) | MUST HAVE |
| ES|QL Tools | 3 | hybrid_rag_search, error_trend_analysis, service_error_breakdown | MUST HAVE |
| ES|QL Fallbacks | 3 | *_fallback.json for each MUST HAVE tool | MUST HAVE |
| Index Search Tools | 1 | anomaly_detector (significant_terms, pipeline aggs) | MUST HAVE |
| ES|QL Tools (optional) | 2 | discover_log_patterns (CATEGORIZE), service_owner_lookup (LOOKUP JOIN) | OPTIONAL |
| Workflows | 1 | incident-response (bidirectional, 8 steps) | MUST HAVE |
| Index Mappings | 5 | incident-knowledge, logs-template, alert-rules, service-owners, service-health-realtime | MUST HAVE |
| Transforms | 1 | service-health-summary | MUST HAVE |

### OPTIONAL Tools - Risk Notes

- **discover_log_patterns** (`_STATUS: OPTIONAL`): Uses CATEGORIZE, which may require Platinum license. Do NOT include in MVP demo unless confirmed available.
- **service_owner_lookup** (`_STATUS: OPTIONAL`): Uses LOOKUP JOIN, which is tech preview and reported buggy on Serverless. Use `platform.core.search` on service-owners index instead.

## The Agent: ops-agent

Single agent handling the full lifecycle:

**Triage phase:**
1. `hybrid_rag_search` (FORK/FUSE/RRF) to find similar past incidents
2. `error_trend_analysis` to assess whether errors are rising/falling
3. `service_error_breakdown` to identify which error types dominate
4. Severity classification (P1-P4)

**Investigation phase** (P1/P2 only):
1. `anomaly_detector` via `platform.core.search` with significant_terms
2. Pipeline aggregations (derivative + moving_avg) for trend prediction
3. Cross-service dependency correlation
4. Root cause hypothesis with confidence level

## Tools with Fallbacks

Every ES|QL tool has 3 tiers documented:

| Tier | Description | When to Use |
|------|-------------|-------------|
| Tier 1 (Full) | FORK/FUSE or complex query | Default, best results |
| Tier 2 (Simplified) | Simpler ES|QL without advanced features | FORK/FUSE unavailable |
| Tier 3 (Keyword) | Basic keyword match | Maximum compatibility |

The `_fallbacks` field in each tool JSON documents the alternative queries.

## Workflow: incident-response

Single bidirectional workflow with 4 phases:

```
Phase 1: DATA GATHERING (parallel)
  |-- Percolate against alert-rules (reverse search)
  |-- ES|QL error breakdown for affected service
  |-- Service owner lookup
  |
  v
Phase 2: AGENT ANALYSIS (bidirectional)
  |-- OpsAgent receives all gathered data
  |-- Agent uses its tools for deeper analysis
  |-- Returns severity + root cause + recommendations
  |
  v
Phase 3: NOTIFICATION ROUTING
  |-- Extract severity from agent analysis
  |-- Slack notification to service owner channel
  |-- Jira ticket creation (P1/P2 only)
  |
  v
Phase 4: AUDIT LOGGING
  |-- Index full incident response to audit log
```

## Data Flow: Incident Response

```
Alert / User report
        |
        v
[Workflow triggers]
        |
        +---> [Percolate: match against stored alert rules]
        +---> [ES|QL: recent error breakdown]
        +---> [Search: service owner info]
        |
        v (all data passed to agent)
[OpsAgent Analysis]
        |-- hybrid_rag_search: "payment connection timeout"
        |     -> Finds: "Payment service DB pool exhaustion" (P1, 23min MTTR)
        |-- error_trend_analysis: payment-service, 6h, 15min buckets
        |     -> Shows: 5x-10x spike in last 45 minutes
        |-- service_error_breakdown: payment-service, 1h
        |     -> Shows: DatabaseConnectionError (35%), ConnectionTimeout (30%)
        |-- anomaly_detector (significant_terms)
        |     -> Surfaces: CircuitBreakerOpen unusually high vs baseline
        |
        v
[Severity: P1] --> Slack + Jira
[Severity: P3] --> Slack only
```

## Percolate Alert Flow

```
New incident description arrives
        |
        v
[Percolate against alert-rules index]
  "which stored alert RULES match this document?"
        |
        v
[Matched rules:]
  +-- payment-service-errors (critical, pagerduty)
  +-- database-connection-issues (high, slack)
  +-- 5xx-error-responses (high, slack)
        |
        v
[Route via workflow: Slack / Jira based on severity]
```

## Key Technical Features

| Feature | Where Used | Why It Impresses |
|---------|-----------|-----------------|
| `semantic_text` | incident-knowledge | Zero-config vector search |
| FORK/FUSE/RRF | hybrid_rag_search | Three-way hybrid retrieval in one ES|QL query |
| `significant_terms` | anomaly_detector | Statistically unusual errors, not just common ones |
| Pipeline aggregations | anomaly_detector | derivative + moving_avg for trend prediction |
| Percolate queries | alert-rules index | Reverse search: "which rules match this?" |
| Transforms | service-health-summary | Continuous materialized view |
| Guarded parameters | All ES|QL tools | Safe LLM parameter injection |
| Bidirectional workflow | incident-response | Workflow gathers data -> calls agent -> routes notifications |

## Index Architecture

| Index | Type | Purpose |
|-------|------|---------|
| `incident-knowledge` | Standard | Past incident KB with semantic_text fields |
| `logs-opsagent-*` | Data stream (template) | 12K+ application log entries |
| `alert-rules` | Percolator | 8 stored alert queries for reverse search |
| `service-owners` | Standard | 10 services with team/dependency data |
| `service-health-realtime` | Transform dest | Aggregated service health metrics |

## Demo Data Design

The data generator creates **engineered patterns** for the demo:

| Service | Pattern | Timing | What Agent Discovers |
|---------|---------|--------|---------------------|
| payment-service | Error spike 5x-10x | Last 45 min (ACTIVE) | DatabaseConnectionError + CircuitBreakerOpen |
| order-service | Cascading errors 3x-5x | Last 30 min | GRPCDeadlineExceeded to payment-service |
| auth-service | Resolved spike 4x | 6-8 hours ago | Visible in trend as past incident |
| notification-service | Secondary cascade 2.5x | Last 25 min | Downstream from payment cascade |

Each service has a **distinct error profile** so that `significant_terms` can differentiate what is unusual from what is normal.

## Deployment

```bash
# 1. Configure environment
export ES_URL="https://your-es.elastic.cloud:443"
export KIBANA_URL="https://your-kibana.kb.elastic.cloud"
export ES_API_KEY="your-api-key"

# 2. Run setup (creates indices, tools, agent, transform)
./setup.sh

# 3. Load demo data (12K+ log entries)
python3 scripts/generate-demo-data.py

# 4. Open Kibana > Agents > Chat with "Self-Healing Infrastructure Intelligence"
# Prompt: "Payment service errors are spiking. What is happening?"
```
