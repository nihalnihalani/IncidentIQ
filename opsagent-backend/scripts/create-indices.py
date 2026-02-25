#!/usr/bin/env python3
"""
create-indices.py -- Create all Elasticsearch indices and templates for OpsAgent.

Creates:
  - logs-opsagent-* index template
  - infra-metrics index template
  - incident-knowledge index (semantic_text)
  - alert-rules index (percolator)
  - service-owners index
  - service-health-realtime index (transform destination)
  - runbooks index
  - incidents index (incident records)

Idempotent: deletes existing indices/templates before recreating them
(with optional --no-confirm flag to skip confirmation).

Usage:
    export ES_URL="https://your-es-instance.elastic.cloud:443"
    export ES_API_KEY="your-api-key"
    python3 create-indices.py             # interactive confirmation
    python3 create-indices.py --no-confirm  # skip confirmation (for CI/scripts)
"""

import json
import os
import sys

try:
    import requests
except ImportError:
    print("Install requests: pip install requests")
    sys.exit(1)

ES_URL = os.environ.get("ES_URL", "http://localhost:9200")
ES_API_KEY = os.environ.get("ES_API_KEY", "")

HEADERS = {"Content-Type": "application/json"}
if ES_API_KEY:
    HEADERS["Authorization"] = f"ApiKey {ES_API_KEY}"

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MAPPINGS_DIR = os.path.join(SCRIPT_DIR, "..", "setup", "mappings")

# ---------------------------------------------------------------------------
# Index and template definitions
# ---------------------------------------------------------------------------
# Index templates (applied to index patterns, not standalone indices)
INDEX_TEMPLATES = [
    {
        "name": "logs-opsagent-template",
        "file": "logs-template.json",
        "description": "logs-opsagent-* index template",
    },
    {
        "name": "infra-metrics-template",
        "file": "infra-metrics-mapping.json",
        "description": "infra-metrics* index template",
    },
]

# Standalone indices (created directly with mappings)
INDICES = [
    {
        "name": "incident-knowledge",
        "file": "incident-knowledge.json",
        "description": "Incident knowledge base (semantic_text for RAG)",
    },
    {
        "name": "alert-rules",
        "file": "alert-rules.json",
        "description": "Alert rules (percolator queries)",
    },
    {
        "name": "service-owners",
        "file": "service-owners.json",
        "description": "Service ownership records",
    },
    {
        "name": "service-health-realtime",
        "file": "service-health-realtime.json",
        "description": "Service health realtime (transform destination)",
    },
    {
        "name": "runbooks",
        "file": "runbooks.json",
        "description": "Operational runbooks",
    },
    {
        "name": "incidents",
        "file": "incidents-mapping.json",
        "description": "Incident records",
    },
]


def load_mapping(filename):
    """Load a JSON mapping file from the mappings directory."""
    filepath = os.path.join(MAPPINGS_DIR, filename)
    with open(filepath, "r") as f:
        return json.load(f)


def delete_index(name):
    """Delete an index if it exists. Returns True if deleted."""
    resp = requests.head(f"{ES_URL}/{name}", headers=HEADERS)
    if resp.status_code == 200:
        del_resp = requests.delete(f"{ES_URL}/{name}", headers=HEADERS)
        if del_resp.status_code == 200:
            print(f"    Deleted existing index: {name}")
            return True
        else:
            print(f"    Warning: failed to delete {name} (HTTP {del_resp.status_code})")
    return False


def delete_template(name):
    """Delete an index template if it exists."""
    resp = requests.head(f"{ES_URL}/_index_template/{name}", headers=HEADERS)
    if resp.status_code == 200:
        del_resp = requests.delete(f"{ES_URL}/_index_template/{name}", headers=HEADERS)
        if del_resp.status_code == 200:
            print(f"    Deleted existing template: {name}")
            return True
        else:
            print(f"    Warning: failed to delete template {name} (HTTP {del_resp.status_code})")
    return False


def create_template(name, body, description):
    """Create an index template."""
    print(f"  Creating template: {name} ({description})...")
    delete_template(name)
    resp = requests.put(
        f"{ES_URL}/_index_template/{name}",
        headers=HEADERS,
        json=body,
    )
    if resp.status_code == 200:
        print(f"    [OK] Template '{name}' created")
    else:
        print(f"    [ERR] HTTP {resp.status_code}: {resp.text[:200]}")


def create_index(name, body, description):
    """Create a standalone index."""
    print(f"  Creating index: {name} ({description})...")
    delete_index(name)
    resp = requests.put(
        f"{ES_URL}/{name}",
        headers=HEADERS,
        json=body,
    )
    if resp.status_code == 200:
        print(f"    [OK] Index '{name}' created")
    else:
        print(f"    [ERR] HTTP {resp.status_code}: {resp.text[:200]}")


def run(no_confirm=False):
    """Create all indices and templates."""
    print("=" * 60)
    print("  OpsAgent -- Index & Template Creator")
    print("=" * 60)
    print(f"  ES URL: {ES_URL}")
    print(f"  Auth:   {'API Key configured' if ES_API_KEY else 'No auth (local dev)'}")
    print(f"  Templates: {len(INDEX_TEMPLATES)}")
    print(f"  Indices:   {len(INDICES)}")
    print("=" * 60)

    if not no_confirm:
        print("\nThis will DELETE and recreate existing indices. Data will be lost.")
        answer = input("Continue? [y/N] ").strip().lower()
        if answer != "y":
            print("Aborted.")
            return

    # Create index templates
    print("\n--- Index Templates ---")
    for tmpl in INDEX_TEMPLATES:
        body = load_mapping(tmpl["file"])
        create_template(tmpl["name"], body, tmpl["description"])

    # Create standalone indices
    print("\n--- Standalone Indices ---")
    for idx in INDICES:
        body = load_mapping(idx["file"])
        create_index(idx["name"], body, idx["description"])

    # Also create the concrete logs-opsagent index so bulk indexing works
    # (the template only matches logs-opsagent-* patterns, but we use "logs-opsagent" as index name)
    print("\n--- Concrete Log Index ---")
    resp = requests.head(f"{ES_URL}/logs-opsagent", headers=HEADERS)
    if resp.status_code != 200:
        create_resp = requests.put(
            f"{ES_URL}/logs-opsagent",
            headers=HEADERS,
            json={"settings": {"number_of_shards": 1, "number_of_replicas": 1}},
        )
        if create_resp.status_code == 200:
            print("  [OK] Created concrete index 'logs-opsagent'")
        else:
            print(f"  [ERR] HTTP {create_resp.status_code}: {create_resp.text[:200]}")
    else:
        print("  [OK] 'logs-opsagent' already exists")

    # Create concrete infra-metrics index
    resp = requests.head(f"{ES_URL}/infra-metrics", headers=HEADERS)
    if resp.status_code != 200:
        create_resp = requests.put(
            f"{ES_URL}/infra-metrics",
            headers=HEADERS,
            json={"settings": {"number_of_shards": 1, "number_of_replicas": 1}},
        )
        if create_resp.status_code == 200:
            print("  [OK] Created concrete index 'infra-metrics'")
        else:
            print(f"  [ERR] HTTP {create_resp.status_code}: {create_resp.text[:200]}")
    else:
        print("  [OK] 'infra-metrics' already exists")

    print(f"\nDone! Created {len(INDEX_TEMPLATES)} templates and {len(INDICES) + 2} indices.")


if __name__ == "__main__":
    no_confirm = "--no-confirm" in sys.argv
    run(no_confirm=no_confirm)
