#!/usr/bin/env bash
# =============================================================================
# Self-Healing Infrastructure Intelligence - Setup Script
# =============================================================================
# Provisions all Elasticsearch indices, Agent Builder tools, agent, workflow,
# and transform for the hackathon project.
#
# Usage:
#   export ES_URL="https://your-es-instance.elastic.cloud:443"
#   export KIBANA_URL="https://your-kibana.kb.company.io"
#   export ES_API_KEY="your-api-key"
#   ./setup.sh          # Full setup (all tools including OPTIONAL)
#   ./setup.sh --mvp    # MVP setup (only MUST HAVE tools, skips CATEGORIZE/LOOKUP JOIN)
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
ES_URL="${ES_URL:?Set ES_URL to your Elasticsearch endpoint}"
KIBANA_URL="${KIBANA_URL:?Set KIBANA_URL to your Kibana endpoint}"
ES_API_KEY="${ES_API_KEY:?Set ES_API_KEY to your API key}"

# MVP mode: only register essential tools and skip optional/risky features
MVP_MODE=false
if [[ "${1:-}" == "--mvp" ]]; then
  MVP_MODE=true
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MAPPINGS_DIR="${SCRIPT_DIR}/setup/mappings"
TOOLS_DIR="${SCRIPT_DIR}/tools"
AGENTS_DIR="${SCRIPT_DIR}/agents"
WORKFLOWS_DIR="${SCRIPT_DIR}/workflows"
TRANSFORMS_DIR="${SCRIPT_DIR}/transforms"

ES_AUTH="Authorization: ApiKey ${ES_API_KEY}"
KBN_AUTH="Authorization: ApiKey ${ES_API_KEY}"
CONTENT_TYPE="Content-Type: application/json"
KBN_HEADER="kbn-xsrf: true"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*"; }

# ---------------------------------------------------------------------------
# Helper: make an Elasticsearch API call
# ---------------------------------------------------------------------------
es_call() {
  local method="$1" path="$2"
  shift 2
  curl -s -X "${method}" \
    "${ES_URL}${path}" \
    -H "${ES_AUTH}" \
    -H "${CONTENT_TYPE}" \
    "$@"
}

# ---------------------------------------------------------------------------
# Helper: make a Kibana API call
# ---------------------------------------------------------------------------
kbn_call() {
  local method="$1" path="$2"
  shift 2
  curl -s -X "${method}" \
    "${KIBANA_URL}${path}" \
    -H "${KBN_AUTH}" \
    -H "${CONTENT_TYPE}" \
    -H "${KBN_HEADER}" \
    "$@"
}

# ---------------------------------------------------------------------------
# 1. Create Indices (delegates to Python script for full coverage)
# ---------------------------------------------------------------------------
create_indices() {
  log_info "Creating Elasticsearch indices via create-indices.py..."
  python3 "${SCRIPT_DIR}/scripts/create-indices.py" --no-confirm
  echo
  log_info "All indices created."
}

# ---------------------------------------------------------------------------
# 1b. Load Data (runbooks, knowledge base, alert rules, service owners, logs, metrics)
# ---------------------------------------------------------------------------
load_data() {
  log_info "Loading data into Elasticsearch..."

  log_info "  Loading runbooks..."
  python3 "${SCRIPT_DIR}/scripts/load-runbooks.py"
  echo

  log_info "  Loading incident data (logs + metrics + knowledge base + alerts + service owners)..."
  python3 "${SCRIPT_DIR}/scripts/generate-all-data.py"
  echo

  log_info "All data loaded."
}

# ---------------------------------------------------------------------------
# 2. Register Tools
# MVP mode: only MUST HAVE tools (skip OPTIONAL and fallback files)
# Full mode: registers all tools including OPTIONAL ones
# ---------------------------------------------------------------------------
# MUST HAVE tools (always registered)
MVP_TOOLS=(
  "hybrid_rag_search"
  "error_trend_analysis"
  "service_error_breakdown"
  "anomaly_detector"
  "search_runbooks"
  "search_runbooks_by_symptom"
  "analyze_host_metrics"
  "correlate_host_timeline"
)
# OPTIONAL tools (skipped in MVP mode - CATEGORIZE and LOOKUP JOIN are risky)
OPTIONAL_TOOLS=(
  "discover_log_patterns"
  "service_owner_lookup"
)

register_tools() {
  log_info "Registering Agent Builder tools..."

  # Always register MUST HAVE tools
  for tool_name in "${MVP_TOOLS[@]}"; do
    local tool_file="${TOOLS_DIR}/${tool_name}.json"
    if [[ -f "${tool_file}" ]]; then
      log_info "  [MUST HAVE] Registering tool: ${tool_name}..."
      kbn_call POST "/api/agent_builder/tools" -d @"${tool_file}"
      echo
    fi
  done

  # Register OPTIONAL tools only in full mode
  if [[ "${MVP_MODE}" == "false" ]]; then
    for tool_name in "${OPTIONAL_TOOLS[@]}"; do
      local tool_file="${TOOLS_DIR}/${tool_name}.json"
      if [[ -f "${tool_file}" ]]; then
        log_info "  [OPTIONAL] Registering tool: ${tool_name}..."
        kbn_call POST "/api/agent_builder/tools" -d @"${tool_file}"
        echo
      fi
    done
    log_info "All tools registered (${#MVP_TOOLS[@]} must-have + ${#OPTIONAL_TOOLS[@]} optional)."
  else
    log_warn "MVP mode: skipped OPTIONAL tools (discover_log_patterns, service_owner_lookup)"
    log_info "Registered ${#MVP_TOOLS[@]} must-have tools."
  fi
}

# ---------------------------------------------------------------------------
# 3. Register Agents (multi-agent system: triage + investigation + postmortem)
# ---------------------------------------------------------------------------
# Multi-agent agents (registered in order)
MULTI_AGENT_LIST=(
  "triage-agent"
  "investigation-agent"
  "postmortem-agent"
)
# Fallback: single-agent (only in full mode)
FALLBACK_AGENT="ops-agent"

register_agents() {
  log_info "Registering Agent Builder agents (multi-agent system)..."

  for agent_name in "${MULTI_AGENT_LIST[@]}"; do
    local agent_file="${AGENTS_DIR}/${agent_name}.json"
    if [[ -f "${agent_file}" ]]; then
      log_info "  Registering agent: ${agent_name}..."
      kbn_call POST "/api/agent_builder/agents" -d @"${agent_file}"
      echo
    else
      log_error "  Agent file not found: ${agent_file}"
    fi
  done

  if [[ "${MVP_MODE}" == "false" ]]; then
    local fallback_file="${AGENTS_DIR}/${FALLBACK_AGENT}.json"
    if [[ -f "${fallback_file}" ]]; then
      log_info "  [FALLBACK] Registering single-agent fallback: ${FALLBACK_AGENT}..."
      kbn_call POST "/api/agent_builder/agents" -d @"${fallback_file}"
      echo
    fi
    log_info "All agents registered (${#MULTI_AGENT_LIST[@]} multi-agent + 1 fallback)."
  else
    log_info "Registered ${#MULTI_AGENT_LIST[@]} agents (multi-agent system)."
  fi
}

# ---------------------------------------------------------------------------
# 4. Create Transform
# ---------------------------------------------------------------------------
create_transform() {
  log_info "Creating service-health-summary transform..."

  local transform_body
  transform_body=$(cat "${TRANSFORMS_DIR}/service-health-summary.json")

  local transform_id
  transform_id=$(echo "${transform_body}" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['id'])")

  local body_without_id
  body_without_id=$(echo "${transform_body}" | python3 -c "
import sys, json
d = json.load(sys.stdin)
del d['id']
del d['description']
print(json.dumps(d))
")

  es_call PUT "/_transform/${transform_id}" -d "${body_without_id}"
  echo

  log_info "Starting transform..."
  es_call POST "/_transform/${transform_id}/_start"
  echo

  log_info "Transform created and started."
}

# ---------------------------------------------------------------------------
# 5. Workflow Instructions
# ---------------------------------------------------------------------------
upload_workflows() {
  log_info "Workflow YAML ready in ${WORKFLOWS_DIR}/"
  log_info "To register the workflow:"
  log_info "  1. Navigate to Kibana > Stack Management > Workflows"
  log_info "  2. Click 'Create Workflow' and paste the YAML"
  log_info "  3. Or use the Workflows API if available:"
  log_info ""

  for wf_file in "${WORKFLOWS_DIR}"/*.yaml; do
    local wf_name
    wf_name="$(basename "${wf_file}" .yaml)"
    log_info "  - ${wf_name}: ${wf_file}"
  done
  echo
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
main() {
  echo "=============================================="
  echo "  Self-Healing Infrastructure Intelligence"
  echo "  Backend Setup"
  echo "=============================================="
  echo "  ES URL:     ${ES_URL}"
  echo "  Kibana URL: ${KIBANA_URL}"
  echo "  Mode:       $( [[ "${MVP_MODE}" == "true" ]] && echo "MVP (must-have only)" || echo "FULL (all features)" )"
  echo "=============================================="
  echo

  # Step 1: Check Python 3 is available
  log_info "Checking prerequisites..."
  if ! command -v python3 &>/dev/null; then
    log_error "python3 is required but not found. Install Python 3.9+."
    exit 1
  fi
  log_info "  python3: $(python3 --version)"

  # Step 2: Install Python dependencies
  log_info "Installing Python dependencies..."
  python3 -m pip install --quiet requests 2>/dev/null || log_warn "pip install failed -- ensure 'requests' is available"
  echo

  # Step 3: Create all indices and templates
  create_indices
  echo

  # Step 4: Load data (runbooks, knowledge base, alerts, service owners, logs, metrics)
  load_data
  echo

  # Step 5: Register Kibana tools
  register_tools
  echo

  # Step 6: Register Kibana agents
  register_agents
  echo

  # Step 7: Create transform
  create_transform
  echo

  # Step 8: Workflow instructions
  upload_workflows
  echo

  log_info "Setup complete!"
  log_info ""
  log_info "Data loaded into indices:"
  log_info "  - service-owners       (4 records)"
  log_info "  - incident-knowledge   (5 past incidents)"
  log_info "  - alert-rules          (5 percolator rules)"
  log_info "  - runbooks             (8 operational runbooks)"
  log_info "  - logs-opsagent        (~1,100 log entries)"
  log_info "  - infra-metrics        (~1,080 metric data points)"
  log_info ""
  log_info "Suggested demo prompt:"
  log_info '  > "Payment service errors are spiking. What is happening?"'
  log_info ""
  log_info "Or chat with individual agents:"
  log_info '  Triage Agent: "Payment service errors are spiking. What is happening?"'
  log_info '  Investigation Agent: "Deep-dive into order-service connection pool errors"'
  log_info '  PostMortem Agent: "Generate post-mortem for INC-4091"'
}

main "$@"
