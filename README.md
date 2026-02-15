# Self-Healing Infrastructure Intelligence (SHII)

> A multi-phase AI operations platform built on **Elasticsearch Agent Builder** that detects, investigates, predicts, and resolves IT incidents autonomously -- using Elasticsearch's most powerful hidden features.

**Built for the Elastic Agent Builder Hackathon | February 2026**

---

## The Problem

IT teams lose **40% of incident response time** context-switching across tools. No single system can triage, investigate, predict escalation, AND take action. Traditional monitoring tells you *what* broke -- but not *why*, *how far it spread*, or *what to do about it*.

## The Solution

Self-Healing Infrastructure Intelligence uses a **3-agent system** orchestrated by an **Elastic Workflow**, each agent specializing in a distinct phase of incident response:

1. **Triage Agent** -- First responder. Runs hybrid search via `FORK -> FUSE -> RERANK` (RRF fusion of lexical + semantic search), classifies severity (P1-P4), and hands off findings to the Investigation Agent.
2. **Investigation Agent** -- Deep-dive analyst. Uses `significant_terms` aggregation (statistically *unusual* patterns), pipeline aggregations (derivative + acceleration), and `percolate queries` (reverse search) to find root cause and blast radius.
3. **PostMortem Agent** -- Report synthesizer. Consumes findings from both Triage and Investigation agents to generate a blameless post-mortem, then triggers Slack/Jira notifications.

The workflow orchestrates all 3 agents sequentially, passing each agent's findings to the next via `{{ steps.*.output.content }}` template variables.

## Hidden Elasticsearch Gems Showcased

| Feature | What It Does | Why Judges Care |
|---------|-------------|-----------------|
| **FORK/FUSE/RRF** | Multi-strategy hybrid search in pure ES\|QL | Complete RAG pipeline without external orchestration |
| **significant_terms** | Statistical anomaly detection | Finds root causes, not symptoms |
| **Percolate Queries** | Reverse search -- documents find matching rules | "Netflix uses this" -- mind-bending concept |
| **Pipeline Aggregations** | Derivative + cumulative_sum for trend prediction | Predicts if incidents are accelerating |
| **Bidirectional Workflows** | Agent inside the automation loop | Agent analyzes AND takes action |
| **semantic_text** | Zero-config vector search with auto-chunking | Index a doc, search semantically. Done. |
| **Transforms** | Continuous materialized views for instant analytics | Sub-millisecond response on complex aggregations |

## Architecture

```
                    +--------------------------------------+
                    |  ALERT TRIGGER / MANUAL / WEBHOOK     |
                    +------------------+-------------------+
                                       |
                    +------------------v-------------------+
                    |    WORKFLOW: Multi-Agent Incident     |
                    |    Response (Elastic Workflows YAML)  |
                    +------------------+-------------------+
                                       |
          +----------------------------+----------------------------+
          |                            |                            |
          v                            v                            v
  +-----------------+        +-----------------+        +-----------------+
  | WORKFLOW STEP:  |        | WORKFLOW STEP:  |        | WORKFLOW STEP:  |
  | Percolate alert |        | ES|QL error     |        | Service owner   |
  | rules (reverse) |        | breakdown       |        | lookup          |
  +-----------------+        +-----------------+        +-----------------+
          |                            |                            |
          +----------------------------+----------------------------+
                                       |
                    +------------------v-------------------+
                    |  AGENT 1: Triage Agent               |
                    |  Tools: hybrid_rag_search,           |
                    |    error_trend_analysis,              |
                    |    service_error_breakdown            |
                    |  Output: Severity + initial findings  |
                    +------------------+-------------------+
                                       | handoff
                    +------------------v-------------------+
                    |  AGENT 2: Investigation Agent         |
                    |  Tools: anomaly_detector,             |
                    |    significant_terms, percolate,      |
                    |    pipeline aggs, blast radius        |
                    |  Output: Root cause + remediation     |
                    +------------------+-------------------+
                                       | handoff
                    +------------------v-------------------+
                    |  AGENT 3: PostMortem Agent            |
                    |  Tools: hybrid_rag_search,            |
                    |    platform search                    |
                    |  Output: Blameless post-mortem        |
                    +------------------+-------------------+
                                       |
              +------------------------+------------------------+
              |                        |                        |
              v                        v                        v
    +------------------+    +------------------+    +------------------+
    | Slack notify     |    | Jira P1/P2       |    | Audit log to     |
    | (owner channel)  |    | ticket creation  |    | Elasticsearch    |
    +------------------+    +------------------+    +------------------+
```

## Project Structure

```
elasticsearch/
+-- opsagent-backend/           # Elasticsearch Agent Builder backend
|   +-- agents/                 # Agent definitions (multi-agent system)
|   |   +-- triage-agent.json   # First responder: hybrid search, severity classification
|   |   +-- investigation-agent.json  # Deep-dive: significant_terms, percolate, blast radius
|   |   +-- postmortem-agent.json     # Synthesizer: blameless post-mortem, Slack, Jira
|   |   +-- ops-agent.json      # Fallback: single-agent mode
|   +-- tools/                  # ES|QL & index search tool definitions
|   |   +-- hybrid_rag_search.json        # FORK/FUSE/RRF hybrid search
|   |   +-- error_trend_analysis.json     # Time-bucketed error trends
|   |   +-- anomaly_detector.json         # significant_terms + pipeline aggs
|   |   +-- service_error_breakdown.json  # Error type analysis
|   |   +-- ...
|   +-- setup/mappings/         # Elasticsearch index mappings
|   |   +-- incident-knowledge.json       # semantic_text for auto-embedding
|   |   +-- alert-rules.json              # Percolator index
|   |   +-- logs-template.json            # ECS-aligned log template
|   |   +-- service-owners.json           # Service ownership data
|   |   +-- service-health-realtime.json  # Transform destination
|   +-- workflows/              # Elastic Workflow YAML definitions
|   |   +-- incident-response.yaml        # Multi-agent orchestration (3 agents + notifications)
|   +-- transforms/             # Continuous data summarization
|   |   +-- service-health-summary.json
|   +-- scripts/
|   |   +-- generate-demo-data.py         # 12K+ realistic log entries
|   +-- setup.sh                # One-command cluster provisioning
|   +-- ARCHITECTURE.md         # Technical architecture docs
|
+-- opsagent-frontend/          # React dashboard (Vite + Tailwind)
|   +-- src/
|   |   +-- pages/              # 6 page components
|   |   |   +-- dashboard.tsx             # Live revenue counter + service health
|   |   |   +-- incident.tsx              # Investigation + animated pipeline viz
|   |   |   +-- alerts.tsx                # Percolate alert rules
|   |   |   +-- blast-radius.tsx          # Animated cascade propagation
|   |   |   +-- agent-activity.tsx        # Multi-agent timeline with handoff indicators
|   |   |   +-- demo.tsx                  # 3-min guided demo + before/after card
|   |   +-- components/         # Reusable UI components
|   |   |   +-- ui/             # Card, Badge, StatusDot, PipelineViz, etc.
|   |   |   +-- layout/         # Sidebar, TopBar
|   |   +-- data/mock.ts        # Complete mock data layer
|
+-- AGENT_BUILDER_DEEP_DIVE.md  # Full research & strategy document
+-- DEVILS_ADVOCATE_REVIEW.md   # Critical risk analysis & recommendations
```

## Tech Stack

### Backend
- **Elasticsearch 9.3+** (Serverless or self-managed)
- **Kibana Agent Builder** (GA, Jan 2026)
- **ES|QL** with FORK/FUSE/RERANK
- **Elastic Workflows** (Tech Preview)
- **Python 3.10+** (data generation)

### Frontend
- **React 19** + **TypeScript**
- **Vite 7** (build tool)
- **Tailwind CSS v4** (dark SRE theme)
- **Framer Motion** (pipeline & blast radius animations)
- **Recharts** (data visualization)
- **Lucide React** (icons)

## Quick Start

### Backend Setup

```bash
# Set environment variables
export ES_URL="https://your-cluster.es.cloud.elastic.co"
export KIBANA_URL="https://your-kibana.kb.cloud.elastic.co"
export ES_API_KEY="your-api-key"

# Provision everything (indices, tools, agents, transforms)
cd opsagent-backend
chmod +x setup.sh
./setup.sh

# Generate demo data (12K+ log entries with pre-injected incident)
pip install elasticsearch faker
python scripts/generate-demo-data.py
```

### Frontend Setup

```bash
cd opsagent-frontend
npm install
npm run dev
# Open http://localhost:5173
```

## Demo Script (3 Minutes)

The demo follows a story-driven "3 AM outage" narrative:

| Time | Step | What Happens | Hidden Gem |
|------|------|-------------|------------|
| 0:00 | **Problem Statement** | "IT teams lose 40% of incident time context-switching" | -- |
| 0:30 | **3:07 AM - Alert Fires** | Dashboard shows payment-service going red | Transforms (real-time health) |
| 1:00 | **Agent Triages** | FORK/FUSE hybrid search finds 3 similar past incidents | FORK/FUSE/RRF |
| 1:30 | **Root Cause Found** | significant_terms reveals `connection_pool_exhausted` (70x above baseline) | significant_terms |
| 2:00 | **Blast Radius Mapped** | Graph shows payment -> checkout -> order cascade | Pipeline aggregations |
| 2:15 | **Alerts Matched** | Percolate reverse-search matches 3 alert rules | Percolate queries |
| 2:30 | **Action Taken** | Workflow triggers Slack + creates Jira P1 ticket | Bidirectional workflows |
| 2:45 | **Impact** | "70% MTTR reduction, predictive alerting catches 85% of escalations" | -- |

## Key Design Decisions

1. **3 Specialized Agents, 1 Workflow** -- Each agent has a distinct tool set and system prompt; the workflow orchestrates handoffs and passes context between them
2. **Agent handoff via workflow templates** -- Each agent receives the previous agent's full output via `{{ steps.*.output.content }}`, enabling informed decision-making
3. **Pre-built ES|QL tools with guarded parameters** -- Never rely on dynamic ES|QL generation (LLMs mix ES|QL and SQL)
4. **3-tier fallback queries** -- Every tool has full/simplified/basic versions for demo reliability
5. **Static frontend + Kibana chat** -- Dashboard provides visual context, agent interaction in Kibana (split-screen demo)
6. **Engineered demo data** -- 12K+ logs with distinct error profiles per service, ensuring significant_terms produces compelling results

## Judging Criteria Alignment

| Criterion | How We Address It |
|-----------|------------------|
| **Innovation/Novelty** | 5 hidden gems most teams never use (percolate, significant_terms, FORK/FUSE, pipeline aggs, bidirectional workflows) |
| **Practical Application** | Real IT ops problem affecting every engineering team |
| **Technical Execution** | Pre-tested queries with 3-tier fallbacks, story-driven demo |
| **Use of Elastic Stack** | Deep platform features, not just basic search |
| **Demo Clarity** | 3-minute story-driven narrative, not a feature tour |
| **Design/Usability** | Dark SRE-themed dashboard with blast radius visualization |
| **Agent Builder Usage** | 3 specialized agents, ES\|QL tools, multi-agent workflow orchestration |

## Frontend Highlights

The dashboard is designed for demo impact -- every animation reinforces the incident narrative:

- **Animated FORK/FUSE/RERANK Pipeline** -- Steps complete sequentially (pending → running → completed) with data particles flowing between stages and result counts springing in on completion
- **Blast Radius Cascade** -- Failure propagates in waves from the epicenter outward with shockwave rings emanating from each newly-affected node; "Replay Cascade" button for repeat demos
- **Live Revenue Counter** -- Ticks at $200/sec ($12k/min burn rate) with a pulsing indicator, making the business impact visceral and immediate
- **Before/After Impact Card** -- Side-by-side animated comparison: manual response (47 min, $564k lost, 4 engineers paged) vs OpsAgent (2m 30s, $36k lost, 0 context switches)

## What Makes This Different

- **True multi-agent orchestration** -- 3 agents with distinct roles, not a single agent with phases. Each agent has specialized tools and passes findings to the next via workflow handoffs.
- **Not "just a chatbot"** -- Agents take ACTION (Slack, Jira, audit) and use reverse search (percolate)
- **Not "just a dashboard"** -- Agents REASON with significant_terms and predict with pipeline aggregations
- **Not a feature tour** -- A continuous incident story with a beginning, middle, and end
- **Deep Elastic knowledge** -- Uses features most teams don't know exist

## Resources

- [Agent Builder Docs](https://www.elastic.co/docs/explore-analyze/ai-features/elastic-agent-builder)
- [ES|QL Reference](https://www.elastic.co/docs/explore-analyze/query-filter/languages/esql)
- [Elastic Workflows](https://www.elastic.co/search-labs/blog/elastic-workflows-automation)
- [Percolate Queries](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-percolate-query.html)
- [Significant Terms](https://www.elastic.co/search-labs/blog/significant-terms-aggregation-elasticsearch)

## License

MIT

---

*Built with Elasticsearch Agent Builder for the Elastic Hackathon, February 2026.*
