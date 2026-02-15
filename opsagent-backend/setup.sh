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
# 1. Create Indices
# ---------------------------------------------------------------------------
create_indices() {
  log_info "Creating Elasticsearch indices..."

  log_info "  Creating incident-knowledge index (semantic_text)..."
  es_call PUT "/incident-knowledge" -d @"${MAPPINGS_DIR}/incident-knowledge.json"
  echo

  log_info "  Creating logs-opsagent index template..."
  es_call PUT "/_index_template/logs-opsagent-template" -d @"${MAPPINGS_DIR}/logs-template.json"
  echo

  log_info "  Creating alert-rules index (percolator)..."
  es_call PUT "/alert-rules" -d @"${MAPPINGS_DIR}/alert-rules.json"
  echo

  log_info "  Creating service-owners index..."
  es_call PUT "/service-owners" -d @"${MAPPINGS_DIR}/service-owners.json"
  echo

  log_info "  Creating service-health-realtime index (transform destination)..."
  es_call PUT "/service-health-realtime" -d @"${MAPPINGS_DIR}/service-health-realtime.json"
  echo

  log_info "All indices created (5 indices + 1 template)."
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
# 3. Register Agent (single primary agent)
# ---------------------------------------------------------------------------
register_agents() {
  log_info "Registering Agent Builder agent..."

  for agent_file in "${AGENTS_DIR}"/*.json; do
    local agent_name
    agent_name="$(basename "${agent_file}" .json)"
    log_info "  Registering agent: ${agent_name}..."
    kbn_call POST "/api/agent_builder/agents" -d @"${agent_file}"
    echo
  done

  log_info "Agent registered."
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

  create_indices
  echo
  register_tools
  echo
  register_agents
  echo
  create_transform
  echo
  upload_workflows
  echo

  log_info "Setup complete!"
  log_info ""
  log_info "Next steps:"
  log_info "  1. Run: python3 scripts/generate-demo-data.py  (to load 12K+ demo logs)"
  log_info "  2. Open Kibana > Agents and chat with 'Self-Healing Infrastructure Intelligence'"
  log_info ""
  log_info "Suggested demo prompt:"
  log_info '  "Payment service errors are spiking. What is happening?"'
}

main "$@"
