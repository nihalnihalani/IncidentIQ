# OpsAgent - Elasticsearch Incident Response Platform

## Project Structure

Monorepo with three main directories:

- **`opsagent-frontend/`** — React 19 dashboard (Vite 7 + TypeScript 5.9 + Tailwind CSS 4 + Radix UI)
- **`opsagent-backend/`** — Elasticsearch agent configs, tools, and workflows (JSON + YAML + Python scripts)
- **`ElasticSearch_hack-main/`** — Original hackathon scaffold with setup scripts and configs

## Frontend (`opsagent-frontend/`)

- **Build**: `npm run dev` (dev server), `npm run build` (production)
- **Path alias**: `@/` maps to `src/` (configured in `vite.config.ts` and `tsconfig.app.json`)
- **UI stack**: Radix UI primitives + Tailwind CSS 4 + Framer Motion + Lucide icons
- **Charts**: Recharts
- **Routing**: React Router DOM v7
- **Pages**: dashboard, alerts, blast-radius, incident, agent-activity, demo
- **Hooks**: `use-es-data.ts` (generic ES data), `use-services.ts`, `use-alerts.ts`, `use-error-trends.ts`, `use-blast-radius.ts`
- **ES proxy**: Vite dev server proxies `/es` to Elasticsearch (configured via `VITE_ES_URL` and `VITE_ES_API_KEY` env vars)

## Backend (`opsagent-backend/`)

- **Agents** (`agents/*.json`): triage-agent, investigation-agent, ops-agent, postmortem-agent
- **Tools** (`tools/*.json`): ES|QL queries and index searches — hybrid_rag_search, error_trend_analysis, service_error_breakdown, anomaly_detector, discover_log_patterns, service_owner_lookup
- **Workflows** (`workflows/*.yaml`): incident-response orchestration
- **Scripts** (`scripts/`): Python data generation scripts

### Tool JSON schema

```json
{
  "id": "tool_name",
  "type": "esql | index_search",
  "description": "What the tool does",
  "configuration": {
    "query": "ES|QL query with ?param placeholders",
    "params": { "param_name": { "type": "text|integer", "description": "..." } }
  }
}
```

### Agent JSON schema

```json
{
  "id": "agent-name",
  "name": "Display Name",
  "description": "What the agent does",
  "configuration": {
    "instructions": "System prompt for the agent",
    "tools": ["tool_id_1", "tool_id_2"]
  }
}
```

## Environment & Credentials

- `.env` files contain Elasticsearch URLs and API keys — **never commit or edit these**
- Frontend env vars are prefixed with `VITE_`

## Conventions

- Frontend service names: `order-service`, `payment-service`, `inventory-service`, `api-gateway`
- Use existing Radix UI + Tailwind patterns when adding components
- Keep hooks in `src/hooks/`, pages in `src/pages/`, reusable UI in `src/components/ui/`
