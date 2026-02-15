# Full Project Verification & Production-Readiness

**Date:** 2026-02-15
**Goal:** Verify the entire SHII project works top-to-bottom, fix all bugs, and make the frontend behave like a real product — not just a mock prototype.

## Context

- Elastic Hackathon project (Self-Healing Infrastructure Intelligence)
- No Elasticsearch cluster provisioned yet — all verification is local
- Success = zero bugs + demo-ready + production-grade data flow

## Approach: Layered Audit (Bottom-Up)

Five layers verified in order. Each layer must be solid before moving to the next.

---

## Section 1: Backend JSON & Script Validation

**Verify:**
- All JSON files (agents, tools, mappings, transforms) parse correctly, required fields present
- No dangling references (tool names in agent configs match actual tool filenames)
- Workflow YAML is valid, step references consistent, template variables match step names
- `setup.sh` is valid bash with env var checks and well-formed curl commands
- `generate-demo-data.py` has valid Python syntax, imports resolve, no hardcoded paths
- Cross-file consistency: tool names in agents exist as files, index names in tools match mappings, field names in ES|QL match index mappings

**Fix:** Syntax errors, missing fields, mismatched references, broken scripts.

---

## Section 2: Frontend Build & Runtime Verification

**Verify:**
- `npm install` resolves all dependencies without conflicts
- `npm run build` compiles TypeScript with zero errors, Vite bundles successfully
- Type warnings that could cause runtime issues (missing props, wrong types)
- Dev server starts on localhost:5173
- All 6 pages render: Dashboard, Incident, Alerts, Blast Radius, Agent Activity, Demo
- Routing works, no dead sidebar links, no console errors on any page

**Fix:** Build errors, broken imports, type errors, missing components, routing issues, console errors.

---

## Section 3: Demo Flow & Animations

**Verify:**
- Demo page steps/phases progress correctly, no stuck states
- Animations work: pipeline viz, blast radius cascade, revenue counter, before/after card
- Timeline coherence: "3:07 AM outage" narrative consistent across all pages
- 21st.dev effects render correctly (spotlight cards, border beams, dot patterns, shimmer)
- Layout holds at typical laptop/projector resolutions

**Fix:** Broken animations, stuck states, timeline inconsistencies, visual glitches, layout issues.

---

## Section 4: Cross-Layer Consistency

**Verify:**
- Mock data TypeScript types match shapes backend tools/agents would produce
- Tool names in agent system prompts and workflow steps match actual tool files
- ES|QL queries reference correct index names from mappings
- Service names in mock data match what `generate-demo-data.py` creates
- Fallback tool variants match primary versions structurally (same output shape)

**Fix:** Field name mismatches, orphaned references, inconsistent names between layers.

---

## Section 5: Production-Ready Data Flow

**Verify & Build:**
- API integration layer: connect frontend to real Elasticsearch data (not just mock)
- Environment-based switching: mock mode (offline demos) vs live mode (real cluster), controlled by env vars
- Real API calls: pages fetch incidents, service health, agent activity, alerts, blast radius from Elasticsearch
- Error states: loading, error, and empty states on every page (not just assuming data exists)
- Data refresh: live dashboards poll/update periodically for service health and revenue counter

**Fix/Build:**
- Add API/data fetching layer that talks to Elasticsearch
- Wire each page to use real data when available, fall back to mock when not
- Add loading/error/empty states to all pages
- Make the app feel like a real product

---

## Out of Scope

- Provisioning or testing against a live Elasticsearch cluster (no cluster yet)
- Adding new features or pages
- Changing the multi-agent architecture or workflow design
