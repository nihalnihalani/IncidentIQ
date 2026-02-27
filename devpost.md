# IncidentIQ

### AI-Powered Incident Response — From Alert to Resolution in Under 3 Minutes

> **Submission for the [Elastic Agent Builder Hackathon](https://elasticsearch.devpost.com/) | January – February 2026**

---

## TL;DR for Busy Judges

Three AI agents. Nine Elasticsearch hidden gems. One 3 AM nightmare — solved in 2.5 minutes instead of 47. We built an autonomous SRE team that triages, investigates, writes a blameless post-mortem, notifies Slack, creates a Jira ticket, and logs everything — before the on-call engineer finishes rubbing their eyes. **$528,000 saved per incident. Zero engineers paged. 95% faster resolution.**

Skip to: [The Demo](#demo-the-3-am-incident-in-3-minutes) | [Hidden Gems](#the-9-elasticsearch-hidden-gems) | [Architecture](#architecture) | [Impact](#impact-metrics)

---

## Inspiration

Picture this: It's 3:07 AM. Your phone screams. The order-service is down. Customers can't checkout. Revenue is bleeding at **$12,000 per minute**. You open your laptop, squinting at 5 different tabs — logs, metrics, alerts, Slack, runbooks — trying to figure out what went wrong. Forty-seven minutes later, 4 engineers deep, you finally find the root cause buried under 12,000 noisy log lines.

**That single incident just cost your company $564,000.**

We asked ourselves: what if AI agents could do in 2.5 minutes what takes a human team 47? Not by guessing — by using Elasticsearch's most powerful (and most underused) features to find *statistically unusual* errors, match alert rules via reverse search, and generate a blameless post-mortem before the on-call engineer even finishes their coffee.

That's IncidentIQ.

---

## What it does

IncidentIQ is a **multi-agent incident response system** that turns Elasticsearch into an autonomous SRE team. Three specialized agents work like a relay race, each handing off findings to the next:

**The Triage Agent** is your first responder. It fires up a FORK/FUSE/RRF hybrid search to find 3 similar past incidents in milliseconds, analyzes error trends, and classifies severity. *"This is a P1. Here's what happened last time."*

**The Investigation Agent** is your detective. It runs `significant_terms` and discovers that `connection_pool_exhausted` is appearing **70x above baseline** — that's your root cause, not the noisy `TimeoutException` flooding the logs. It maps the blast radius: order-service → payment-service → cart → 5 services total.

**The PostMortem Agent** is your synthesizer. It takes everything from Triage and Investigation, searches for prevention strategies, and writes a blameless post-mortem with a timeline, action items, and recommendations.

Then the workflow fires: Slack notifies #payments-team. Jira creates ticket OPS-2847. The audit log captures everything. **Total elapsed time: 2 minutes 30 seconds.**

A React 19 dashboard with 9 pages brings it all to life — animated pipeline visualizations, blast radius cascade graphs, live revenue counters, and a guided demo mode that tells the full "3 AM Incident" story.

---

## How we built it

### Architecture

![IncidentIQ Architecture](https://mermaid.ink/img/Z3JhcGggVEQKICAgIEluY2lkZW50WyIzIEFNIEFsZXJ0OiBvcmRlci1zZXJ2aWNlIERPV04iXSAtLT58InRyaWdnZXJzInwgV29ya2Zsb3dbRWxhc3RpYyBXb3JrZmxvdyBFbmdpbmVdCgogICAgc3ViZ3JhcGggIlBoYXNlIDE6IERhdGEgR2F0aGVyaW5nIChwYXJhbGxlbCkiCiAgICAgICAgV29ya2Zsb3cgLS0+fCJyZXZlcnNlIHNlYXJjaCJ8IFBlcmNvbGF0ZVsiUGVyY29sYXRlIFF1ZXJpZXM8YnIvPjE4IHN0b3JlZCBhbGVydCBydWxlcyJdCiAgICAgICAgV29ya2Zsb3cgLS0+fCJFU1FMIHF1ZXJ5InwgRXJyb3JCcmVha1siRXJyb3IgQnJlYWtkb3duPGJyLz5zZXJ2aWNlX2Vycm9yX2JyZWFrZG93biJdCiAgICAgICAgV29ya2Zsb3cgLS0+fCJsb29rdXAifCBPd25lcnNbIlNlcnZpY2UgT3duZXIgTG9va3VwPGJyLz50ZWFtICsgZGVwZW5kZW5jaWVzIl0KICAgIGVuZAoKICAgIHN1YmdyYXBoICJQaGFzZSAyOiBUcmlhZ2UgQWdlbnQiCiAgICAgICAgUGVyY29sYXRlIC0tPiBUcmlhZ2VbVHJpYWdlIEFnZW50XQogICAgICAgIEVycm9yQnJlYWsgLS0+IFRyaWFnZQogICAgICAgIE93bmVycyAtLT4gVHJpYWdlCiAgICAgICAgVHJpYWdlIC0tPnwiRk9SSy9GVVNFL1JSRiJ8IFJBR1siaHlicmlkX3JhZ19zZWFyY2g8YnIvPjMgc2ltaWxhciBwYXN0IGluY2lkZW50cyBmb3VuZCJdCiAgICAgICAgVHJpYWdlIC0tPiBUcmVuZHNbImVycm9yX3RyZW5kX2FuYWx5c2lzPGJyLz5lcnJvcnMgYWNjZWxlcmF0aW5nICsyMiUvbWluIl0KICAgICAgICBUcmlhZ2UgLS0+IFJ1bmJvb2sxWyJzZWFyY2hfcnVuYm9va3M8YnIvPm1hdGNoaW5nIHJlbWVkaWF0aW9uIl0KICAgIGVuZAoKICAgIHN1YmdyYXBoICJQaGFzZSAzOiBJbnZlc3RpZ2F0aW9uIEFnZW50IgogICAgICAgIFJBRyAtLT4gSW52ZXN0W0ludmVzdGlnYXRpb24gQWdlbnRdCiAgICAgICAgVHJlbmRzIC0tPiBJbnZlc3QKICAgICAgICBJbnZlc3QgLS0+fCJhbm9tYWx5IGRldGVjdGlvbiJ8IFNpZ1Rlcm1zWyJzaWduaWZpY2FudF90ZXJtczxici8+Y29ubmVjdGlvbl9wb29sX2V4aGF1c3RlZCA3MHggYWJvdmUgYmFzZWxpbmUiXQogICAgICAgIEludmVzdCAtLT4gUGlwZWxpbmVbInBpcGVsaW5lIGFnZ3JlZ2F0aW9uczxici8+ZGVyaXZhdGl2ZSArIG1vdmluZ19hdmciXQogICAgICAgIEludmVzdCAtLT4gSG9zdENvcnJbImhvc3RfY29ycmVsYXRpb248YnIvPkNQVSA5NCUgb24gZGItcHJpbWFyeS0wMSJdCiAgICAgICAgSW52ZXN0IC0tPiBCbGFzdE1hcFsiQmxhc3QgUmFkaXVzPGJyLz41IHNlcnZpY2VzIGFmZmVjdGVkIl0KICAgIGVuZAoKICAgIHN1YmdyYXBoICJQaGFzZSA0OiBQb3N0TW9ydGVtIEFnZW50IgogICAgICAgIFNpZ1Rlcm1zIC0tPiBQb3N0TW9ydGVtW1Bvc3RNb3J0ZW0gQWdlbnRdCiAgICAgICAgUGlwZWxpbmUgLS0+IFBvc3RNb3J0ZW0KICAgICAgICBCbGFzdE1hcCAtLT4gUG9zdE1vcnRlbQogICAgICAgIFBvc3RNb3J0ZW0gLS0+IFJlcG9ydFsiQmxhbWVsZXNzIFJlcG9ydDxici8+dGltZWxpbmUgKyBhY3Rpb24gaXRlbXMgKyBwcmV2ZW50aW9uIl0KICAgIGVuZAoKICAgIHN1YmdyYXBoICJQaGFzZSA1OiBTaGlwIEl0IgogICAgICAgIFJlcG9ydCAtLT4gU2xhY2tbIlNsYWNrOiAjcGF5bWVudHMtdGVhbSJdCiAgICAgICAgUmVwb3J0IC0tPiBKaXJhWyJKaXJhOiBQMSB0aWNrZXQgT1BTLTI4NDciXQogICAgICAgIFJlcG9ydCAtLT4gQXVkaXRbIkF1ZGl0IExvZzogb3BzYWdlbnQtaW5jaWRlbnQtbG9nIl0KICAgIGVuZAoKICAgIHN1YmdyYXBoICJFbGFzdGljc2VhcmNoIERhdGEgTGF5ZXIiCiAgICAgICAgTG9nc1sibG9ncy1vcHNhZ2VudC0qPGJyLz4xMiwwMDArIGVudHJpZXMiXQogICAgICAgIEtCWyJpbmNpZGVudC1rbm93bGVkZ2U8YnIvPnNlbWFudGljX3RleHQiXQogICAgICAgIEFsZXJ0UnVsZXNbImFsZXJ0LXJ1bGVzPGJyLz5QZXJjb2xhdG9yIGluZGV4Il0KICAgICAgICBTdmNPd25lcnNbInNlcnZpY2Utb3duZXJzIl0KICAgICAgICBIZWFsdGhJZHhbInNlcnZpY2UtaGVhbHRoLXJlYWx0aW1lPGJyLz5UcmFuc2Zvcm1zIl0KICAgICAgICBSdW5ib29rSWR4WyJydW5ib29rcyJdCiAgICAgICAgTWV0cmljc0lkeFsiaW5mcmEtbWV0cmljcyJdCiAgICBlbmQKCiAgICBzdWJncmFwaCAiUmVhY3QgMTkgRGFzaGJvYXJkIgogICAgICAgIERhc2hib2FyZFsiTGl2ZSBPcHMgRGFzaGJvYXJkIl0KICAgICAgICBJbnZlc3RQYWdlWyJJbnZlc3RpZ2F0aW9uIFZpZXciXQogICAgICAgIEJsYXN0UGFnZVsiQmxhc3QgUmFkaXVzIEdyYXBoIl0KICAgICAgICBEZW1vTW9kZVsiMy1taW4gRGVtbyBNb2RlIl0KICAgICAgICBDaGF0UGFnZVsiQWdlbnQgQ2hhdCJdCiAgICBlbmQKCiAgICBSQUcgLS4tPiBLQgogICAgU2lnVGVybXMgLS4tPiBMb2dzCiAgICBQZXJjb2xhdGUgLS4tPiBBbGVydFJ1bGVzCiAgICBIb3N0Q29yciAtLi0+IE1ldHJpY3NJZHgKICAgIFJ1bmJvb2sxIC0uLT4gUnVuYm9va0lkeAogICAgT3duZXJzIC0uLT4gU3ZjT3duZXJzCiAgICBIZWFsdGhJZHggLS4tPnwicmVhbC10aW1lInwgRGFzaGJvYXJkCg==)

### The Agents

**Triage Agent** — *The First Responder*
> Fast, decisive, gets you oriented in 60 seconds. Uses FORK/FUSE/RRF hybrid search to find similar past incidents instantly.
> **Tools:** hybrid_rag_search · error_trend_analysis · service_error_breakdown · search_runbooks

**Investigation Agent** — *The Detective*
> Doesn't accept "TimeoutException" as root cause — digs deeper. significant_terms finds what's *statistically unusual*, not what's *common*.
> **Tools:** anomaly_detector · pipeline_aggregations · percolate_queries · host_correlation

**PostMortem Agent** — *The Synthesizer*
> Turns chaos into a structured blameless report. Combines all findings + prevention strategies from the knowledge base.
> **Tools:** hybrid_rag_search · blameless_report · search_runbooks

**Ops Agent** — *The Fallback*
> Swiss-army knife for when you need one agent to do it all. Access to all 11 tools in a single pass.
> **Tools:** All tools combined

### Tech Stack

**Backend — Elasticsearch:**
- Elasticsearch 9.x (Serverless or self-managed)
- Kibana Agent Builder (GA, Jan 2026) — 4 agents, multi-agent orchestration
- ES&#124;QL — 10+ parameterized tool queries with FORK/FUSE/RRF
- Elastic Workflows — 6-phase YAML automation
- Transforms — Continuous materialized views for real-time dashboards
- Python 3.10+ — 12,000+ engineered log entries with per-service error profiles

**Frontend — React Dashboard:**
- React 19 + TypeScript 5.9 + Vite 7
- Tailwind CSS 4 (dark SRE theme) + Radix UI
- Framer Motion (animations) + Recharts (data viz) + Lucide React (icons)

---

## The 9 Elasticsearch Hidden Gems

We didn't just use Elasticsearch for basic search. We went deep — showcasing **9 advanced features** that most teams don't even know exist:

| # | Hidden Gem | The "Aha!" Moment |
|---|-----------|-------------------|
| 1 | **FORK / FUSE / RRF** | One ES&#124;QL query runs BOTH lexical and semantic search, then fuses results with Reciprocal Rank Fusion. Our Triage Agent finds similar past incidents with incredible relevance — no separate retrieval pipeline needed. |
| 2 | **significant_terms** | This is the killer feature. Instead of finding the most *common* errors (symptoms), it finds the most *unusual* errors (root cause). `connection_pool_exhausted` at 70x above baseline? That's your answer — not the `TimeoutException` that fills every log. |
| 3 | **Percolate Queries** | Normal search: "find documents matching this query." Percolate: "find queries matching this document." We store 18 alert rules, then reverse-search with the incident to determine which rules fire. Scales to thousands of rules. |
| 4 | **Pipeline Aggregations** | `derivative` + `moving_avg` don't just tell you errors are high — they tell you errors are *accelerating* at +22%/min and will breach SLA in 12 minutes. Predictive, not reactive. |
| 5 | **semantic_text** | Zero-config vector search. Add a `semantic_text` field, index your document, search semantically. No ML pipeline, no embedding model config. Just works. |
| 6 | **ES&#124;QL** | 10+ parameterized queries with `?param` placeholders. The LLM decides *which* tool and *what parameters* — but never writes raw queries. Safe from hallucination by design. |
| 7 | **Agent Builder** | 4 agents with distinct tool sets and system prompts. Multi-agent orchestration where each agent has a clear mission. Not one giant prompt trying to do everything. |
| 8 | **Elastic Workflows** | 6-phase YAML that gathers data in parallel, calls agents sequentially with handoffs via `{{ steps.*.output.content }}`, routes notifications by severity, and logs everything. |
| 9 | **Transforms** | `service-health-summary` continuously materializes service health from raw logs. Dashboard loads in <1ms. No query-time aggregation. |

---

## Agent Builder Features We Loved

**1. FORK / FUSE / RRF in ES&#124;QL** — This was the moment we knew Agent Builder was special. Multi-strategy hybrid search in a *single query*? We went from building a custom retrieval pipeline to a one-liner that fuses lexical and semantic results with Reciprocal Rank Fusion. The Triage Agent finds similar past incidents with relevance we couldn't achieve with either strategy alone.

**2. Pre-built ES&#124;QL Tools with `?param` Placeholders** — Our #1 concern was LLM hallucination. Agents love to mix ES&#124;QL and SQL syntax. Agent Builder solved this elegantly: define tools as parameterized queries, let the LLM choose *which* tool and *what parameters*, but never let it write raw queries. Every tool is pre-tested. No hallucinated syntax. Problem solved.

**3. Multi-Agent Orchestration via Workflows** — Chaining 3 agents with clean handoffs using `{{ steps.*.output.content }}` template variables was incredibly powerful. Each agent has a focused role, a distinct tool set, and the workflow passes full context between them. It feels like watching a relay race where each runner is a specialist.

---

## Challenges we ran into

**The "ES&#124;QL vs SQL" Wars** — Our first prototype let agents write dynamic ES&#124;QL. Disaster. The LLM would generate `SELECT * FROM logs WHERE level = 'ERROR'` instead of `FROM logs-opsagent-* | WHERE log.level == "ERROR"`. Solution: lock down every query as a pre-built tool with `?param` placeholders. The agent reasons about *what to search for*, not *how to write the query*.

**Making significant_terms Actually Significant** — The `significant_terms` aggregation is brilliant in theory, but it needs the right data to shine. Random log data produces meaningless results. We spent serious time engineering 12,000+ log entries with distinct per-service error profiles so that the foreground set (incident window) has genuinely different term frequencies than the background set (all historical data). The payoff: `connection_pool_exhausted` lights up at 70x above baseline while `TimeoutException` (which appears in every service) is correctly ignored.

**The Fallback Rabbit Hole** — FORK/FUSE/RRF isn't available on all Elasticsearch tiers. Neither are some ES&#124;QL operators. We ended up building a 3-tier fallback system for every single tool: Tier 1 (full features), Tier 2 (simplified ES&#124;QL), Tier 3 (basic keyword match). Triple the configuration work, but the demo never fails.

**Context Across Agent Handoffs** — The Investigation Agent needs everything the Triage Agent found, and the PostMortem Agent needs everything from both. Dropping even one detail breaks the post-mortem. We learned to structure each agent's output as a complete, self-contained briefing that the next agent can consume without losing nuance.

---

## Accomplishments that we're proud of

- **95% MTTR Reduction** — 47 minutes → 2.5 minutes. Not a typo.
- **$528,000 saved per incident** — Revenue loss drops from $564k to $36k at $12k/min
- **9 Elasticsearch Hidden Gems** in one project — We think this might be a record for a single hackathon submission
- **Zero guessing** — Every agent conclusion cites specific `significant_terms` scores, `derivative` values, and `percolate` matches. Evidence, not vibes.
- **3-tier fallback system** — The demo works on any Elasticsearch tier. No "works on my machine" moments.
- **12,000+ engineered log entries** — Purpose-built data that makes `significant_terms` produce genuinely compelling results
- **The "show this to my CTO" factor** — Multiple people who saw the demo immediately asked "can we use this in production?"

### By the Numbers

| What | How Many |
|------|----------|
| AI Agents | 4 (Triage, Investigation, PostMortem, Ops) |
| Elasticsearch Tools | 11 parameterized queries |
| Workflow Phases | 6 (parallel data gathering → sequential agent chain) |
| ES Hidden Gems Used | 9 |
| Log Entries Generated | 12,000+ across 5 microservices |
| Dashboard Pages | 9 |
| Lines of Agent Config | 800+ (JSON + YAML) |
| Cups of Coffee During Development | We lost count after 30 |

---

## What we learned

**`significant_terms` is the most underrated Elasticsearch feature.** Everyone uses simple counts and top-N aggregations. But finding what's *unusual* matters infinitely more than finding what's *common*. This single insight — "the root cause is the anomaly, not the symptom" — is what makes IncidentIQ actually work.

**Pre-built parameterized queries > dynamic generation.** LLMs are brilliant at reasoning and terrible at syntax. Let them decide *what to search for* but never *how to write the query*. Agent Builder's `?param` placeholders are elegant precisely because they separate reasoning from execution.

**Multi-agent specialization beats single-agent generalization.** Three focused agents with distinct tool sets outperform one mega-agent every time. Each agent has a clear mission, constraints, and expertise. The workflow handles coordination.

**Percolate queries are magic at scale.** Instead of running 18 alert rules against each incident, we store the rules as queries and "reverse search" with the incident document. One query, all rules evaluated. This scales to thousands of rules without breaking a sweat.

---

## What's next for IncidentIQ

We're just getting started. Here's the roadmap:

- **Auto-Remediation** — Agents execute runbook steps automatically: restart services, scale pods, flush connection pools. Not just detect and report — *fix*. The dream is an agent that pages zero humans for P3/P4 incidents.
- **Learning Loop** — Automatically index resolved incidents back into the knowledge base. Every incident makes the next `hybrid_rag_search` smarter. The system literally gets better every time something breaks.
- **Embedded Agent Chat** — Bring Kibana Agent Builder chat directly into the dashboard. Imagine asking "what broke last Tuesday?" and getting an instant answer from your incident history.
- **Cross-Cluster Correlation** — Extend blast radius analysis across multiple Elasticsearch clusters and cloud regions. Because outages don't respect infrastructure boundaries.
- **Predictive Alerting** — Use pipeline aggregation derivatives to trigger alerts *before* error rates cross thresholds. Alert on acceleration, not just magnitude. "Errors are accelerating — you'll breach SLA in 12 minutes" beats "SLA breached 12 minutes ago."
- **Runbook Generation** — PostMortem Agent automatically generates runbooks from resolved incidents and indexes them for future agents. Today's crisis becomes tomorrow's playbook.

---

## What makes IncidentIQ different

Most incident response tools are glorified dashboards — they *show* you the problem and wait for a human to solve it. IncidentIQ is different:

| Traditional Tools | IncidentIQ |
|---|---|
| Shows you 12,000 log lines | Finds the 1 anomalous error buried in those 12,000 lines |
| Tells you errors are high | Tells you errors are *accelerating at +22%/min* and will breach SLA in 12 minutes |
| Requires you to check alert rules manually | Reverse-searches your incident against all stored rules automatically |
| Needs 4 engineers for 47 minutes | Needs 0 engineers for 2.5 minutes |
| Post-mortem? Maybe next Monday | Post-mortem generated instantly, every single time |
| Knowledge lives in people's heads | Knowledge is indexed, searchable, and feeds future investigations |

The secret sauce isn't AI — it's **which Elasticsearch features** the AI uses. `significant_terms` over simple counts. Percolate over manual rule checking. FORK/FUSE/RRF over single-strategy search. The right tool for the right job.

---

## Impact Metrics

| | Before (Manual) | After (IncidentIQ) | Delta |
|---|---|---|---|
| **Time to Resolve** | 47 minutes | 2.5 minutes | **95% faster** |
| **Revenue Loss per Incident** | $564,000 | $36,000 | **$528,000 saved** |
| **Engineers Paged at 3 AM** | 4 | 0 | **Zero disruption** |
| **Tools Needed** | 5+ (logs, metrics, alerts, Slack, Jira) | 1 (IncidentIQ) | **Single pane of glass** |
| **Knowledge Captured** | In people's heads | Indexed + searchable | **Never lost** |
| **Post-Mortem Written** | "We'll do it Monday" | Instant, blameless | **Every time** |

---

## Demo: The "3 AM Incident" in 3 Minutes

| Time | What Happens | Elasticsearch Feature |
|------|-------------|----------------------|
| 0:00 | *"IT teams lose 47 minutes per incident. Revenue bleeds at $12k/min."* | — |
| 0:30 | Dashboard lights up red. Revenue counter ticks at $200/sec. | **Transforms** |
| 1:00 | Triage Agent finds 3 similar past incidents via hybrid search. | **FORK/FUSE/RRF** |
| 1:30 | `connection_pool_exhausted` surfaces at 70x above baseline. Root cause found. | **significant_terms** |
| 2:00 | Blast radius mapped: 5 services cascading. Errors accelerating at +22%/min. | **Pipeline Aggregations** |
| 2:15 | 3 alert rules matched via reverse search. Routing determined automatically. | **Percolate Queries** |
| 2:30 | Slack notified. Jira ticket created. Blameless post-mortem generated. | **Workflows + Agent Builder** |
| 2:45 | Before/After: **47 min / $564k → 2.5 min / $36k. 94% savings.** | — |

---

## Built With

- Elasticsearch 9.x
- Kibana Agent Builder
- ES&#124;QL (FORK/FUSE/RRF)
- Elastic Workflows
- Transforms
- Percolate Queries
- significant_terms Aggregation
- semantic_text Field Type
- Pipeline Aggregations
- React 19
- TypeScript 5.9
- Vite 7
- Tailwind CSS 4
- Radix UI
- Framer Motion
- Recharts
- Python 3.10+

---

## The Fun Stuff (Easter Eggs for Judges)

Things we're unreasonably proud of that didn't fit anywhere else:

- **The revenue counter** on the dashboard ticks at $200/second during an active incident. It's fake money, but the anxiety is very real.
- **The blast radius graph** animates service failures cascading in real-time. It looks like watching dominoes fall — because that's exactly what's happening.
- **Demo Mode** tells a complete story from "3 AM alert" to "incident resolved" with narrated steps. It's the Netflix of incident response demos.
- **The Triage Agent** was originally named "Agent Panic" during development. We changed it. Mostly.
- **Every single Elasticsearch query** in the project is pre-built and parameterized. Zero dynamic query generation. Zero hallucination risk. We're very serious about this.
- **The PostMortem Agent** writes better post-mortems than most humans. We know because we compared. (Sorry, humans.)

---

## Try It Out

| | |
|---|---|
| **Repository** | [github.com/nihalnihalani/IncidentIQ](https://github.com/nihalnihalani/IncidentIQ) |
| **License** | MIT (OSI-approved open source) |
| **Demo Video** | *Coming soon — 3-minute walkthrough* |
| **Social Post** | *Link to be added* |
