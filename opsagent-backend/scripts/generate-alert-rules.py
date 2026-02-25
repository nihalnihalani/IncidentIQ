#!/usr/bin/env python3
"""
generate-alert-rules.py -- Generate percolator alert rules for the alert-rules index.

Creates 5 alert rules that use Elasticsearch percolator queries to match
incoming log documents against pre-defined alert conditions.

Usage:
    export ES_URL="https://your-es-instance.elastic.cloud:443"
    export ES_API_KEY="your-api-key"
    python3 generate-alert-rules.py
"""

import json
import os
import sys
from datetime import datetime, timezone

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

INDEX = "alert-rules"

NOW = datetime.now(timezone.utc)

# ---------------------------------------------------------------------------
# Alert rule definitions
# ---------------------------------------------------------------------------
ALERT_RULES = [
    {
        "rule_name": "payment-service-errors",
        "rule_description": "Triggers on any error in the payment service -- highest priority",
        "severity": "critical",
        "category": "payment",
        "owner_team": "Payments Team",
        "notification_channel": "pagerduty",
        "enabled": True,
        "cooldown_minutes": 5,
        "query": {
            "bool": {
                "must": [
                    {"term": {"service.name": "payment-service"}},
                    {"terms": {"log.level": ["ERROR", "FATAL"]}},
                ]
            }
        },
    },
    {
        "rule_name": "database-connection-issues",
        "rule_description": "Triggers when database connection errors or timeouts are detected in any service",
        "severity": "high",
        "category": "database",
        "owner_team": "Platform Team",
        "notification_channel": "slack",
        "enabled": True,
        "cooldown_minutes": 10,
        "query": {
            "bool": {
                "should": [
                    {"term": {"error.type": "ConnectionTimeoutException"}},
                    {"term": {"error.type": "SQLException"}},
                    {"term": {"error.type": "HikariPoolTimeoutException"}},
                ],
                "minimum_should_match": 1,
            }
        },
    },
    {
        "rule_name": "circuit-breaker-open",
        "rule_description": "Triggers when a circuit breaker opens for any service",
        "severity": "critical",
        "category": "availability",
        "owner_team": "Platform Team",
        "notification_channel": "pagerduty",
        "enabled": True,
        "cooldown_minutes": 5,
        "query": {
            "term": {"error.type": "CircuitBreakerOpenException"}
        },
    },
    {
        "rule_name": "5xx-error-responses",
        "rule_description": "Triggers on HTTP 5xx server error responses across all services",
        "severity": "high",
        "category": "availability",
        "owner_team": "Platform Team",
        "notification_channel": "slack",
        "enabled": True,
        "cooldown_minutes": 10,
        "query": {
            "range": {"http.response.status_code": {"gte": 500, "lt": 600}}
        },
    },
    {
        "rule_name": "cascading-failure-detected",
        "rule_description": "Triggers when cascading failure or service degradation errors are detected",
        "severity": "critical",
        "category": "availability",
        "owner_team": "SRE Team",
        "notification_channel": "pagerduty",
        "enabled": True,
        "cooldown_minutes": 5,
        "query": {
            "bool": {
                "should": [
                    {"term": {"error.type": "CascadeFailure"}},
                    {"term": {"error.type": "ServiceDegradation"}},
                    {"term": {"error.type": "HealthCheckFailure"}},
                ],
                "minimum_should_match": 1,
            }
        },
    },
]


def run():
    """Generate and index alert rules."""
    print("=" * 60)
    print("  Alert Rules Generator (Percolator Queries)")
    print("=" * 60)
    print(f"  ES URL: {ES_URL}")
    print(f"  Index:  {INDEX}")
    print("=" * 60)

    docs = []
    for rule in ALERT_RULES:
        doc = {
            **rule,
            "created_at": NOW.isoformat(),
            "created_by": "opsagent-setup",
            "last_triggered": None,
        }
        docs.append(doc)

    # Bulk index
    body = ""
    for doc in docs:
        body += json.dumps({"index": {"_index": INDEX}}) + "\n"
        body += json.dumps(doc) + "\n"

    resp = requests.post(
        f"{ES_URL}/_bulk",
        headers={**HEADERS, "Content-Type": "application/x-ndjson"},
        data=body,
    )
    result = resp.json()
    if result.get("errors"):
        err_count = sum(1 for item in result["items"] if item["index"].get("error"))
        print(f"\n  Indexed with {err_count} errors")
    else:
        print(f"\n  [OK] Indexed {len(docs)} alert rules to '{INDEX}'")

    print(f"\nDone! Generated {len(docs)} alert rules")
    for rule in ALERT_RULES:
        print(f"  - {rule['rule_name']} ({rule['severity']}, channel: {rule['notification_channel']})")


if __name__ == "__main__":
    run()
