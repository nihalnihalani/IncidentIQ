#!/usr/bin/env python3
"""
generate-service-owners.py -- Generate service owner records for the service-owners index.

Creates ownership records for all 4 core services:
order-service, payment-service, inventory-service, api-gateway.

Usage:
    export ES_URL="https://your-es-instance.elastic.cloud:443"
    export ES_API_KEY="your-api-key"
    python3 generate-service-owners.py
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

INDEX = "service-owners"

# ---------------------------------------------------------------------------
# Service owner records
# ---------------------------------------------------------------------------
SERVICE_OWNERS = [
    {
        "service_name": "order-service",
        "owner_team": "Commerce Team",
        "owner_email": "commerce-team@example.com",
        "escalation_email": "commerce-escalation@example.com",
        "slack_channel": "#ops-commerce",
        "pagerduty_service_id": "PCOMMERSVC",
        "tier": "tier-1",
        "dependencies": ["payment-service", "inventory-service"],
        "repository_url": "https://github.com/acme/order-service",
        "runbook_url": "https://wiki.acme.com/runbooks/order-service",
    },
    {
        "service_name": "payment-service",
        "owner_team": "Payments Team",
        "owner_email": "payments-team@example.com",
        "escalation_email": "payments-escalation@example.com",
        "slack_channel": "#ops-payments",
        "pagerduty_service_id": "PPAYMNTSVC",
        "tier": "tier-1",
        "dependencies": ["order-service"],
        "repository_url": "https://github.com/acme/payment-service",
        "runbook_url": "https://wiki.acme.com/runbooks/payment-service",
    },
    {
        "service_name": "inventory-service",
        "owner_team": "Commerce Team",
        "owner_email": "commerce-team@example.com",
        "escalation_email": "commerce-escalation@example.com",
        "slack_channel": "#ops-commerce",
        "pagerduty_service_id": "PINVNTRYSVC",
        "tier": "tier-2",
        "dependencies": ["order-service"],
        "repository_url": "https://github.com/acme/inventory-service",
        "runbook_url": "https://wiki.acme.com/runbooks/inventory-service",
    },
    {
        "service_name": "api-gateway",
        "owner_team": "Platform Team",
        "owner_email": "platform-team@example.com",
        "escalation_email": "platform-escalation@example.com",
        "slack_channel": "#ops-platform",
        "pagerduty_service_id": "PPLATFMSVC",
        "tier": "tier-1",
        "dependencies": ["order-service", "payment-service", "inventory-service"],
        "repository_url": "https://github.com/acme/api-gateway",
        "runbook_url": "https://wiki.acme.com/runbooks/api-gateway",
    },
]


def run():
    """Generate and index service owner records."""
    print("=" * 60)
    print("  Service Owners Generator")
    print("=" * 60)
    print(f"  ES URL: {ES_URL}")
    print(f"  Index:  {INDEX}")
    print("=" * 60)

    # Index each service owner individually (small count, simpler to debug)
    for doc in SERVICE_OWNERS:
        resp = requests.post(
            f"{ES_URL}/{INDEX}/_doc",
            headers=HEADERS,
            json=doc,
        )
        status = resp.status_code
        if 200 <= status < 300:
            print(f"  [OK] {doc['service_name']} -> {doc['owner_team']} ({doc['slack_channel']})")
        else:
            print(f"  [ERR] {doc['service_name']} -> HTTP {status}: {resp.text[:200]}")

    print(f"\nDone! Generated {len(SERVICE_OWNERS)} service owner records")


if __name__ == "__main__":
    run()
