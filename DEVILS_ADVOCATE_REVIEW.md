# Devil's Advocate Review: OpsAgent Hackathon Project

> **Reviewer Role**: Ruthless critic. Every assumption challenged. Every weakness exposed. Then: concrete improvements.
> **Date**: February 15, 2026

---

## 1. Executive Summary

OpsAgent is an ambitious multi-agent IT operations platform that attempts to showcase 12+ Elasticsearch features in a 36-hour hackathon, which is roughly 3x more scope than any winning hackathon project has ever attempted. The core concept -- agents that detect, investigate, predict, and remediate incidents -- is genuinely compelling and well-aligned with what Elastic judges want to see, but the current plan has a fatal flaw: it prioritizes breadth of features over depth of execution, meaning the most likely outcome is a partially-working demo that impresses nobody. **If the team ruthlessly cuts scope to 4-5 features and pre-builds every ES|QL query with tested fallbacks, this project wins; if they try to build everything in the spec, they lose to a team with a simpler idea that actually works.**

---

## 2. Risk Matrix

| # | Feature | Risk Level | Likely Failure Mode | Mitigation | Priority |
|---|---------|-----------|-------------------|------------|----------|
| 1 | **FORK/FUSE** | MEDIUM | ES|QL syntax errors in multi-branch queries; LLM generates invalid FORK syntax if not using guarded params | Pre-build and manually test the exact query. Never rely on dynamic generation. | P0 - Core |
| 2 | **RERANK** | MEDIUM-HIGH | Requires a deployed rerank inference endpoint; if `.rerank-v1-elasticsearch` isn't available on the cluster, the entire pipeline breaks silently | Verify endpoint exists BEFORE building the tool. Have a fallback query without RERANK. | P1 - Important |
| 3 | **COMPLETION** | HIGH | Requires a deployed LLM inference endpoint in ES; adds latency (2-5s per call); token limits on output; undocumented edge cases; relatively new command | Test on actual cluster first. COMPLETION is the most fragile link -- if it fails, fall back to having the Agent Builder LLM do summarization instead (it already does this). | P2 - Nice to have |
| 4 | **CATEGORIZE** | HIGH | **Requires Platinum license**. If the hackathon cluster is on a lower tier, this feature is completely unavailable. The DRAIN algorithm can produce unhelpful categories on short log messages. | Verify license tier on day 1 hour 1. Have pre-categorized sample data as fallback. If unavailable, cut entirely. | P2 - Verify first |
| 5 | **Percolate** | MEDIUM | Percolate queries use Query DSL, not ES|QL -- cannot be wrapped in an ES|QL tool directly. Must use `platform.core.search` or a Workflow step. Performance degrades with many stored queries. | Use Workflow step `elasticsearch.search` with percolate query. Limit stored rules to <50 for demo. | P1 - Important |
| 6 | **Significant Terms** | LOW-MEDIUM | This is an aggregation, not ES|QL -- must use Query DSL via `platform.core.search` or Workflow. Results are only meaningful with sufficient data volume (need 1000+ docs minimum). | Pre-load enough data. Use `platform.core.search` tool. Test with actual data volumes. | P0 - Core |
| 7 | **Graph API** | MEDIUM | REST API only, not available in ES|QL. Results are raw JSON vertices/connections that need visualization to be impressive. Without visualization, it's just JSON blobs. | Build a simple D3.js or Mermaid visualization. If no time for viz, cut this feature. | P2 - Nice to have |
| 8 | **Pipeline Aggregations** | MEDIUM | Derivative/cumulative_sum are Query DSL aggregations, not ES|QL. The "prediction" claim is a stretch -- derivatives show trend direction, not true prediction. | Be honest in the demo: "trend detection" not "prediction". Use Workflow step for execution. | P1 - Important |
| 9 | **Transforms** | LOW | Well-established feature. Main risk: setup time for continuous transforms + waiting for data to flow through. | Set up transforms in advance. Pre-populate the destination index with sample data. | P2 - Nice to have |
| 10 | **LOOKUP JOIN** | HIGH | **Tech preview**. Requires lookup-mode index (single shard). Cal Hacks teams reported unhelpful error messages on Serverless. Join field names must match exactly. | Test on actual cluster immediately. Have the owner data pre-enriched in the incidents index as fallback. | P3 - Cut candidate |
| 11 | **Augmented Infrastructure** | VERY HIGH | Custom implementation required. Shell command execution is a security nightmare. Requires a separate runner process. Polling introduces latency. Runner must be running during demo. Error handling is non-trivial. | If attempted: sandbox the runner, whitelist commands, pre-record a backup video. Consider faking it with pre-staged results. | P3 - Cut candidate |
| 12 | **Bidirectional Workflows** | HIGH | Workflows are **Tech Preview**. The `ai.agent` step type may have undocumented limitations. The `condition` syntax for `if` steps is poorly documented. Liquid templating has quirks. | Test the exact YAML on the cluster before committing to this. Have a "manual trigger" fallback where you invoke each step separately. | P1 - Important |

---

## 3. Feature Triage

### MUST HAVE (Core to demo, reliable, high wow)

| Feature | Justification |
|---------|--------------|
| **FORK/FUSE (hybrid search)** | GA, well-documented, visually impressive, shows deep ES|QL knowledge. This is the centerpiece. |
| **Significant Terms** | Low difficulty, high judge reaction, genuinely differentiating. Shows "unknown unknowns" discovery. |
| **Pre-built ES|QL tools (3-4 tools)** | The foundation of everything. Guarded parameters, tested queries, reliable execution. |
| **Custom agents (2-3 agents)** | Triage Agent + Investigation Agent at minimum. Clear system prompts, well-scoped tool assignments. |
| **Pipeline Aggregations (trend analysis)** | Medium difficulty, shows predictive capability, impressive when visualized. |

### NICE TO HAVE (Adds value but can be cut if time runs short)

| Feature | Justification |
|---------|--------------|
| **Percolate (reverse search alerts)** | High wow factor but requires Query DSL (not ES|QL), adds complexity. Worth it if time allows. |
| **RERANK** | Adds to the FORK/FUSE pipeline impressively, but the pipeline works without it. Test early, include if stable. |
| **Bidirectional Workflow <-> Agent** | The "holy grail" demo moment, but Workflows are Tech Preview. Build a simple version first. |
| **Transforms** | Low effort to set up, shows "materialized views" concept, but doesn't create a wow moment on its own. |
| **Graph API** | Only worth it if you have visualization. Raw JSON output is unimpressive. |

### CUT IT (Too risky, too complex, or not worth the time)

| Feature | Justification |
|---------|--------------|
| **COMPLETION (in-ES|QL LLM generation)** | The Agent Builder LLM already summarizes results. COMPLETION adds latency, fragility, and a dependency on a separate inference endpoint for marginal benefit. The wow of "LLM in ES|QL" is undermined if it's slow or fails. |
| **CATEGORIZE** | License dependency is a showstopper risk. If you don't have Platinum, you've wasted hours building around it. The DRAIN algorithm output is hard to explain in 3 minutes. |
| **LOOKUP JOIN** | Tech preview, known issues on Serverless, Cal Hacks teams struggled with it. Pre-enrich your data instead. |
| **Augmented Infrastructure (shell runner)** | This is a separate project unto itself. The security implications alone require careful sandboxing. The polling architecture adds latency that kills demo flow. If you absolutely must show "agent takes action", fake it with a pre-staged Workflow that calls an HTTP endpoint. |

---

## 4. Demo Failure Scenarios

### Scenario 1: ES|QL Query Fails

**What happens**: The FORK/FUSE query returns a parsing error. The agent shows an ugly error message to the user. Judges see a broken demo.

**Root causes**: Syntax error in guarded params, field name mismatch, index doesn't exist, semantic_text field not properly configured.

**Fallback plan**:
- Have 3 backup queries of decreasing complexity: (1) FORK/FUSE, (2) simple MATCH with boost, (3) basic keyword search
- Pre-test every query at least 10 times with varied inputs
- Include error handling in the agent's system prompt: "If a tool returns an error, explain what happened and try a simpler approach"

**Pre-recorded backup**: Record a flawless run of the query. If it fails live, say "Let me show the recording of this working earlier" -- honest, and judges appreciate transparency.

**Graceful degradation**: Agent falls back to `platform.core.search` (built-in, always works) and explains it's using a simpler search method.

### Scenario 2: LLM Picks Wrong Tool

**What happens**: User asks "What's causing the outage?" and the LLM calls `platform.core.list_indices` instead of the incident investigation tool. Or it calls the right tool with wrong parameters.

**Root causes**: Ambiguous tool descriptions, too many tools assigned to one agent, vague system prompt.

**Fallback plan**:
- Limit each agent to 3-4 tools maximum (fewer tools = better selection)
- Make tool descriptions extremely specific and non-overlapping
- Use the system prompt to say: "When the user asks about incidents, ALWAYS use the hybrid_rag_pipeline tool first"
- Pre-test the exact demo questions you'll ask and verify the agent picks the right tool every time

**Pre-recorded backup**: Script the demo. Ask the exact same questions in the exact same order every time. Never improvise.

**Graceful degradation**: If the agent picks wrong, say "Let me rephrase that" and use a more specific query that forces the right tool selection.

### Scenario 3: Context Window Exceeded

**What happens**: A tool returns too much data, the context window fills up, and subsequent tool calls fail or produce garbage. The agent may say "I cannot process this request."

**Root causes**: ES|QL query returns 10,000 rows, `platform.core.search` returns massive documents, multi-turn conversation accumulates too much context.

**Fallback plan**:
- LIMIT every ES|QL query to 5-10 results maximum
- Use KEEP to select only the fields you need (never return full documents)
- Start a fresh conversation for each demo segment (don't accumulate context)
- Monitor token usage in the conversation response

**Pre-recorded backup**: Record each demo segment separately so context never accumulates.

**Graceful degradation**: Agent says "Let me narrow my search" and re-runs with tighter filters and smaller LIMIT.

### Scenario 4: Workflow Step Times Out

**What happens**: A Workflow step (especially `ai.agent` or `http`) takes too long. The workflow hangs. The audience waits. Awkward silence.

**Root causes**: LLM inference latency, external API timeout, Elasticsearch under load, Workflow engine bug (Tech Preview!).

**Fallback plan**:
- Set timeouts on every HTTP step (10 seconds max)
- For `ai.agent` steps: use the simplest possible prompt, limit expected output length
- Have a "manual demo mode" where you trigger each step individually instead of running the full workflow
- Test the workflow 10+ times for timing

**Pre-recorded backup**: Record the full workflow execution. Show it as "here's what happens when we trigger this workflow."

**Graceful degradation**: Skip the workflow demo entirely and show the agent doing the same thing interactively. "The workflow automates what I'm about to show you manually."

---

## 5. "Just a Chatbot" Test

### Feature Differentiation Scores

| Feature | Differentiation Score (1-10) | Why |
|---------|------------------------------|-----|
| FORK/FUSE hybrid search | **8/10** | Most chatbots use simple RAG. Multi-strategy retrieval with RRF fusion is genuinely advanced. |
| RERANK | **6/10** | Reranking is common in production RAG. Doing it in ES|QL is novel, but the concept isn't new. |
| COMPLETION | **5/10** | "LLM generates text" is literally what every chatbot does. Doing it in ES|QL is a novelty, not differentiation. |
| CATEGORIZE | **7/10** | Auto-discovering log patterns without rules IS different from chatbot behavior. But hard to explain quickly. |
| Percolate | **9/10** | Reverse search is conceptually mind-bending. Nobody expects "the document searches for matching rules." |
| Significant Terms | **9/10** | Finding statistically unusual patterns, not just common ones, is genuine intelligence. Not chatbot behavior. |
| Graph API | **7/10** | Discovering relationships is cool. But without visualization, judges won't appreciate it. |
| Pipeline Aggs | **7/10** | Trend detection is useful but "show me a chart of error rates" is standard dashboarding. The "acceleration" angle is the differentiator. |
| Transforms | **3/10** | This is infrastructure, not user-facing. Judges won't notice or care unless you explain it. |
| LOOKUP JOIN | **4/10** | "Join two tables" is database 101. The ES|QL angle is mildly interesting but not wow-inducing. |
| Augmented Infrastructure | **10/10** | "The agent actually deployed a fix" is the ultimate chatbot differentiator. IF it works. |
| Bidirectional Workflow | **8/10** | "Agent inside the automation loop" is genuinely different from "chatbot answers questions." |

### What Would Make a Judge Say "This is Just Another Chatbot"

1. If the demo is: User types question -> Agent returns text answer. That's it. That's a chatbot.
2. If you spend the whole demo asking the agent questions and reading its text responses.
3. If the agent never DOES anything -- never triggers an action, never creates an alert, never visualizes a graph.
4. If the output is always plain text with no structured data, charts, or actionable artifacts.
5. If you could replicate the demo by pasting the same questions into ChatGPT with some logs attached.

### What Specifically Prevents the "Just a Chatbot" Label

1. **Visible multi-step reasoning**: Show the agent calling multiple tools in sequence, with each step visible (the execution trace from the Converse API).
2. **Agent takes ACTION**: The workflow triggers a Slack message, creates a ticket, or (if you're brave) runs a command on infrastructure.
3. **Reverse search demo**: Show a new incident being percolated against stored rules. This is not chatbot behavior -- it's event-driven intelligence.
4. **Statistical discovery**: Show significant_terms finding something the human didn't ask about. The agent says "I also noticed something unusual: X."
5. **Predictive capability**: Show pipeline aggregations with "the error rate is accelerating -- predicted degradation in 15 minutes."
6. **Visual output**: A graph visualization, a trend chart, a blast radius map. Anything that isn't just text.

---

## 6. Counter-Proposals

### Counter-Proposal 1: ADD -- A "Live Dashboard" View

**What's missing**: The entire demo as described is chat-based. User types, agent responds. Even with workflows and actions, the primary interface is a chat window.

**What to add**: A simple web dashboard (React or even just an HTML page) that shows:
- Real-time service health status (from the transforms-powered summary index)
- A live feed of agent actions (from the conversation history)
- A blast radius visualization (from Graph API output, rendered with D3.js or vis.js)
- Alert rule matches (from percolate results)

**Why**: Visual dashboards are dramatically more impressive in a 3-minute demo than watching someone type in a chat window. Judges can SEE the system working. This is the difference between "cool concept" and "I want to use this."

**Implementation cost**: 2-3 hours with a simple React app or Streamlit dashboard that polls the Elasticsearch indices and Converse API.

**Risk**: Adds scope. But a simple dashboard that shows 4 panels is more impressive than 4 additional ES|QL features nobody can see.

### Counter-Proposal 2: REMOVE -- Cut to 2 Agents, Not 4

**What to remove**: The 4-agent architecture (Triage, Investigation, Alert, Action) is over-engineered for a hackathon.

**Replace with**:
- **OpsAgent** (primary): Handles triage + investigation. Has access to FORK/FUSE search, significant_terms, pipeline aggs, and trend analysis tools. This is the interactive agent.
- **Workflow Engine** (not an agent): Handles alerts + actions. Percolate queries run in a workflow, actions are workflow steps. No need for a separate "Alert Agent" or "Action Agent."

**Why**:
- Fewer agents = less tool confusion (the LLM doesn't need to decide WHICH agent to route to)
- Fewer agents = faster demo (no inter-agent communication overhead)
- Fewer agents = less to build and test
- The "4 specialized agents" story sounds good in a description but adds zero demo value if judges can't see the difference

**Risk**: Less impressive on paper. But "one agent that works flawlessly" beats "four agents where two of them are buggy."

### Counter-Proposal 3: CHANGE -- Make the Demo Tell a Story, Not Show Features

**Current approach**: "Watch this feature, now watch this feature, now watch this feature." Feature tour.

**Change to**: A single continuous incident narrative:

> "It's 3 AM. The orders service starts failing. Watch what happens."
>
> 1. Alert fires -> Workflow triggers -> Agent is invoked (10 seconds)
> 2. Agent runs FORK/FUSE search to find similar past incidents (15 seconds)
> 3. Agent runs significant_terms: "The unusual pattern is connection_pool_timeout from region us-east-1a" (15 seconds)
> 4. Agent runs pipeline aggs: "Error rate is accelerating. Predicted full outage in 12 minutes." (10 seconds)
> 5. Percolate matches this incident to 3 alert rules -> Slack notification sent (10 seconds)
> 6. Agent recommends action + Workflow creates Jira ticket (10 seconds)

Total: ~70 seconds of continuous, story-driven demo. The remaining 110 seconds are for problem statement, architecture, and impact.

**Why**: Story-driven demos are 3x more memorable than feature tours. Judges remember "the one that handled the 3 AM outage" not "the one that used significant_terms."

---

## 7. The 80/20 Analysis

### Which 20% of Features Deliver 80% of the Wow?

1. **FORK/FUSE hybrid search** (the "technical depth" moment)
2. **Significant Terms** (the "genuine intelligence" moment)
3. **Percolate reverse search** (the "mind-bending concept" moment)
4. **Bidirectional Workflow trigger** (the "it takes action" moment)

These 4 features, well-executed, create all 4 types of wow that judges care about:
- Technical depth (FORK/FUSE)
- Creative API usage (significant_terms, percolate)
- Practical utility (workflow actions)

Everything else is supporting infrastructure that doesn't independently create wow.

### Optimal "Minimum Viable Demo" Feature Set

| Feature | Role in Demo | Build Time |
|---------|-------------|-----------|
| 1 custom agent with clear system prompt | Primary interface | 30 min |
| FORK/FUSE ES|QL search tool | Hybrid search capability | 1 hour |
| Significant terms via `platform.core.search` | Root cause discovery | 1 hour |
| Pipeline aggregations via Workflow step | Trend detection | 1.5 hours |
| 1 simple Workflow (alert -> gather data -> notify Slack) | Action capability | 2 hours |
| Percolate query in Workflow | Reverse search alerting | 1.5 hours |
| Sample data (pre-loaded incidents, logs, service owners) | Demo foundation | 2 hours |
| Demo script (tested 10+ times) | Reliability guarantee | 1 hour |
| **TOTAL** | | **~10.5 hours** |

This leaves 25+ hours for: testing, fixing bugs, building a simple dashboard, polishing the demo, eating, sleeping, and handling the inevitable "nothing works on the first try" debugging sessions.

### Time Allocation Recommendation (36-hour hackathon)

| Phase | Hours | Activities |
|-------|-------|-----------|
| **Setup & Data** (Hours 0-4) | 4h | Create Elasticsearch cluster, define index mappings, load sample data, verify semantic_text works, test basic agent |
| **Core Build** (Hours 4-16) | 12h | Build ES|QL tools (FORK/FUSE, trend analysis), set up significant_terms, create custom agent, test all queries |
| **Workflow & Percolate** (Hours 16-22) | 6h | Build the incident response workflow, set up percolate index and rules, test the full workflow end-to-end |
| **Dashboard / Viz** (Hours 22-26) | 4h | Build simple dashboard showing service health, agent actions, blast radius (if using Graph API) |
| **Demo Polish** (Hours 26-32) | 6h | Script the demo, test 10+ times, record backup video, prepare fallback queries, practice the pitch |
| **Buffer** (Hours 32-36) | 4h | Fix bugs, sleep, handle surprises, final rehearsal |

**Critical rule**: If any feature isn't working by hour 24, CUT IT. Do not debug for 12 hours. Replace with a simpler alternative.

---

## 8. Security Concerns

### 8.1 Augmented Infrastructure Runner: Shell Command Execution

**The problem**: The runner in the spec executes `subprocess.run(tool_call["command"], capture_output=True, shell=True)`. This is arbitrary shell command execution triggered by an LLM. This is as dangerous as it sounds.

**Attack vectors**:
- LLM prompt injection: A crafted log message could cause the agent to generate a malicious command
- Command injection via tool parameters: If `tool_call["command"]` is constructed from user input, classic injection applies
- Privilege escalation: The runner runs with whatever permissions its process has
- Data exfiltration: Commands could pipe data to external endpoints

**Mitigations (if you must implement this)**:
1. **Whitelist commands**: Only allow a pre-defined set of commands (e.g., `kubectl get pods`, `systemctl status nginx`). Reject everything else.
2. **Never use `shell=True`**: Use `subprocess.run(["kubectl", "get", "pods"], shell=False)` with explicit argument lists.
3. **Read-only first**: For the demo, only allow read commands (get, describe, status). Never allow create, delete, or modify.
4. **Sandboxing**: Run the runner in a Docker container with minimal permissions and no network access beyond Elasticsearch.
5. **Approval gate**: Before executing any command, write it to a "pending-approval" index. Require human confirmation in the UI before the runner executes.

**Recommendation for hackathon**: Do NOT implement real shell execution. Instead, have the runner return pre-staged responses for a whitelist of 5-6 commands. The demo shows the pattern without the risk.

### 8.2 API Key Management

**The problem**: The demo will have API keys for Elasticsearch, possibly Slack, possibly Linear/Jira, possibly an LLM provider. These keys will be in:
- Workflow YAML (as `consts`)
- Runner Python code (as config)
- MCP client config (as env vars)
- Dashboard frontend (if calling APIs directly)

**Mitigations**:
1. Use environment variables, never hardcode keys in code or YAML
2. Create scoped, minimal-permission API keys for each component
3. For the demo, create keys that expire after 48 hours
4. Never commit keys to Git (use `.gitignore` properly)
5. If using a public GitHub repo for the hackathon submission, use GitHub Secrets or a `.env` file

### 8.3 Malicious ES|QL Injection

**The problem**: If the agent uses the built-in `.execute_esql` tool (which converts natural language to ES|QL), a user could potentially craft a prompt that generates destructive ES|QL. However, ES|QL is read-only (no DELETE, no UPDATE, no CREATE), so the blast radius is limited to data exfiltration.

**Real risk**: A user could ask "Show me all documents in the api-keys index" and the agent might comply, exposing sensitive data.

**Mitigations**:
1. Use **guarded parameter ES|QL tools** (not dynamic generation) -- this is already in the plan
2. Scope the agent's API key to only read specific indices (e.g., `logs-*`, `incidents-*`)
3. Do NOT give the agent access to system indices, `.security-*`, or any index containing credentials
4. Add instructions in the system prompt: "Never query indices that start with a dot (.) or contain 'security', 'keys', or 'credentials'"
5. Use Kibana Spaces to isolate the agent's accessible data

### 8.4 Additional Security Concern: Workflow Webhook Exposure

**The problem**: If a Workflow has a `webhook` trigger, anyone who knows the URL can trigger it. In a hackathon setting, this is unlikely to be an issue, but in a real deployment it's a concern.

**Mitigation**: Use `manual` triggers for the demo, not `webhook`. Trigger workflows from the agent via the Workflow tool, not externally.

---

## 9. Additional Critiques

### 9.1 The "Elastic Already Demoed This" Problem

The Augmented Infrastructure pattern is directly from Elastic's own blog post. The bidirectional workflow pattern is from their agentic workflows blog post. The OpsAgent concept is similar to their "IT infrastructure management agent" demo. Judges will recognize these patterns.

**Counter**: The combination is novel. No single blog post combines FORK/FUSE + significant_terms + percolate + workflows + Graph API into one coherent system. The whole is greater than the sum of its parts. But you MUST acknowledge the inspiration and show what you added beyond the blog posts.

### 9.2 The Data Problem

Every demo feature depends on having realistic, sufficient data. If your sample data is:
- Too small: significant_terms returns nothing meaningful
- Too uniform: CATEGORIZE finds only one pattern
- Too clean: No anomalies for pipeline aggregations to detect
- Wrong schema: LOOKUP JOIN fails on field name mismatch

**Recommendation**: Spend 2-3 hours on data generation. Create a script that generates realistic IT ops data with:
- Multiple services with different error profiles
- Time-varying error rates (include a spike for the demo)
- Enough volume (10,000+ logs minimum)
- Pre-defined patterns that significant_terms will discover
- Service owner data in a lookup index

This is unglamorous work but it's the difference between a demo that works and one that doesn't.

### 9.3 The "3-Minute Video" Constraint

Three minutes is brutally short. The current plan has 10+ features to showcase. At 18 seconds per feature, you can't explain any of them. The judges will see a blur of features and retain nothing.

**Recommendation**: Show 3-4 features in depth, not 10 features in passing. Each feature gets 20-30 seconds of screen time with clear narration. The rest are mentioned in the description but not shown.

### 9.4 Judge Fatigue with "IT Ops" Framing

IT Ops is the right domain for Elastic judges, but the term "IT Ops" evokes images of boring dashboards and alert fatigue. The framing matters.

**Recommendation**: Don't call it "IT Ops." Call it "Self-Healing Infrastructure Intelligence" or "Autonomous Incident Response." The name should evoke capability, not domain.

---

## 10. Final Verdict: Conditional Pass

**If the team executes the MUST HAVE features flawlessly with a story-driven demo**: This project wins or places top 3. The combination of FORK/FUSE, significant_terms, percolate, and workflow actions is genuinely novel and deeply aligned with what Elastic judges want.

**If the team tries to build everything in the spec**: This project finishes mid-pack with a semi-working demo and a great-sounding description that the judges can't verify because half the features broke.

**The single most important decision**: Cut scope on Day 1 Hour 1. Decide which features to CUT before deciding which to BUILD.

---

*"The enemy of a good demo is a great plan." -- Every hackathon judge, ever.*
