#!/usr/bin/env python3
"""
generate-knowledge-base.py -- Generate past incident records for the incident-knowledge index.

Creates 5 realistic past incident entries that the hybrid_rag_search tool
can query against for similar-incident lookup during triage.

Usage:
    export ES_URL="https://your-es-instance.elastic.cloud:443"
    export ES_API_KEY="your-api-key"
    python3 generate-knowledge-base.py
"""

import json
import os
import random
import sys
from datetime import datetime, timedelta, timezone

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

INDEX = "incident-knowledge"

NOW = datetime.now(timezone.utc)

# ---------------------------------------------------------------------------
# Incident records
# ---------------------------------------------------------------------------
INCIDENTS = [
    {
        "title": "Payment service database connection pool exhaustion",
        "description": (
            "Payment service experienced complete database connection pool exhaustion "
            "during peak Black Friday traffic. All payment processing stopped for 23 minutes. "
            "Error logs showed ConnectionTimeout exceptions from HikariCP with max pool size "
            "of 50 connections reached. CircuitBreakerOpen errors followed as the circuit "
            "breaker tripped. order-service began failing with GRPCDeadlineExceeded when "
            "calling payment-service."
        ),
        "resolution": (
            "Increased HikariCP max pool size from 50 to 200. Enabled connection pool "
            "monitoring alerts at 80% capacity. Added circuit breaker for database calls "
            "with fallback to async queue. Implemented connection pool pre-warming during "
            "deployment."
        ),
        "root_cause": "Database connection pool too small for peak traffic",
        "severity": "P1",
        "category": "database",
        "affected_services": ["payment-service", "order-service"],
        "tags": ["database", "connection-pool", "peak-traffic", "hikaricp", "circuit-breaker"],
        "mttr_minutes": 23,
    },
    {
        "title": "API gateway rate limiter misconfiguration blocking legitimate traffic",
        "description": (
            "A rate limiter configuration change reduced the per-IP request limit from "
            "1000/min to 10/min for the api-gateway. Legitimate API consumers were being "
            "rate-limited with 429 Too Many Requests responses. RateLimitExceeded errors "
            "spiked across all downstream services. order-service and payment-service saw "
            "cascading 5xx errors."
        ),
        "resolution": (
            "Reverted rate limiter configuration. Implemented rate limiter config validation "
            "with dry-run mode. Added canary deployment for rate limiter changes. Created "
            "tiered rate limits based on API key tier."
        ),
        "root_cause": "Incorrect rate limiter configuration deployed without validation",
        "severity": "P1",
        "category": "configuration",
        "affected_services": ["api-gateway", "order-service", "payment-service", "inventory-service"],
        "tags": ["rate-limiter", "configuration", "429", "api-gateway"],
        "mttr_minutes": 12,
    },
    {
        "title": "Inventory service out of memory crash loop after schema migration",
        "description": (
            "Inventory service pods entered a crash loop due to OutOfMemoryError after a "
            "database schema migration added a new indexed column. Large inventory queries "
            "consumed all available JVM heap. GC overhead limit exceeded errors in logs. "
            "order-service could not verify stock levels, causing order placement failures."
        ),
        "resolution": (
            "Increased pod memory limits from 2Gi to 4Gi. Added LIMIT clauses to all "
            "inventory queries. Implemented result size validation. Added JVM heap monitoring "
            "alerts at 80% threshold."
        ),
        "root_cause": "Unbounded database query result sets consuming all JVM heap",
        "severity": "P2",
        "category": "memory",
        "affected_services": ["inventory-service", "order-service"],
        "tags": ["oom", "jvm", "heap", "memory", "schema-migration"],
        "mttr_minutes": 35,
    },
    {
        "title": "Order service Kafka producer backpressure during flash sale",
        "description": (
            "Order service experienced KafkaProducerError with message buffer full exceptions "
            "during a flash sale event. Orders were being accepted but not processed for "
            "fulfillment. Kafka broker disk usage was at 95%, causing slow writes and producer "
            "backpressure. inventory-service updates were delayed by 15 minutes."
        ),
        "resolution": (
            "Expanded Kafka broker storage from 500GB to 2TB. Reduced topic retention from "
            "7 days to 3 days for high-volume topics. Implemented Kafka producer retry with "
            "exponential backoff. Added disk usage alerts at 80% threshold."
        ),
        "root_cause": "Kafka broker disk space nearly full causing write backpressure",
        "severity": "P2",
        "category": "messaging",
        "affected_services": ["order-service", "inventory-service"],
        "tags": ["kafka", "backpressure", "disk", "message-queue", "flash-sale"],
        "mttr_minutes": 52,
    },
    {
        "title": "Cascading failure from payment-service database connection leak",
        "description": (
            "A connection leak in payment-service caused gradual connection pool exhaustion "
            "over 4 hours. Initially manifested as intermittent slow queries, then progressed "
            "to ConnectionTimeout errors. api-gateway circuit breaker opened for payment-service. "
            "order-service failed to process checkouts. inventory-service reported stale stock "
            "data due to failed inventory reservation calls."
        ),
        "resolution": (
            "Identified and fixed connection leak in payment retry logic -- connections were "
            "not being returned to the pool on retry failures. Added connection leak detection "
            "with HikariCP leak detection threshold of 60 seconds. Implemented connection "
            "pool metrics dashboard."
        ),
        "root_cause": "Database connection leak in payment retry error handling path",
        "severity": "P1",
        "category": "database",
        "affected_services": ["payment-service", "order-service", "api-gateway", "inventory-service"],
        "tags": ["connection-leak", "database", "cascading-failure", "circuit-breaker"],
        "mttr_minutes": 48,
    },
]


def run():
    """Generate and index incident knowledge base entries."""
    print("=" * 60)
    print("  Incident Knowledge Base Generator")
    print("=" * 60)
    print(f"  ES URL: {ES_URL}")
    print(f"  Index:  {INDEX}")
    print("=" * 60)

    docs = []
    for i, incident in enumerate(INCIDENTS):
        doc = {
            **incident,
            "incident_date": (NOW - timedelta(days=random.randint(7, 180))).isoformat(),
            "created_at": NOW.isoformat(),
            "runbook_url": f"https://wiki.acme.com/runbooks/INC-{1000 + i}",
            "author": random.choice(["sre-bot", "jane.smith", "ops-oncall", "john.doe"]),
            # semantic_text fields for hybrid RAG search
            "semantic_title": incident["title"],
            "semantic_description": incident["description"],
            "semantic_resolution": incident["resolution"],
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
        print(f"\n  [OK] Indexed {len(docs)} incident records to '{INDEX}'")

    print(f"\nDone! Generated {len(docs)} incident knowledge entries")
    for inc in INCIDENTS:
        print(f"  - {inc['title']} ({inc['severity']}, MTTR: {inc['mttr_minutes']}min)")


if __name__ == "__main__":
    run()
