#!/usr/bin/env python3
"""
generate-infra-metrics.py — Generate realistic infrastructure metrics data

Scenario: Database Connection Pool Exhaustion
- 2 hours of normal operations across 6 hosts
- Then: db-primary-01 CPU climbs to 98%, memory to 96%
- Cascading stress to app hosts, then web hosts
- Hosts mapped to project services: order-service, payment-service,
  inventory-service, api-gateway

Usage:
    export ES_URL="https://your-es-instance.elastic.cloud:443"
    export ES_API_KEY="your-api-key"
    python3 generate-infra-metrics.py
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

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
HOSTS = ["web-01", "web-02", "app-01", "app-02", "db-primary-01", "db-replica-01"]
APP_HOSTS = ["web-01", "web-02", "app-01", "app-02"]

# Service names aligned with main project conventions
SERVICES = ["order-service", "payment-service", "inventory-service", "api-gateway"]

# Host-to-service mapping
HOST_SERVICE_MAP = {
    "web-01": "api-gateway",
    "web-02": "api-gateway",
    "app-01": "payment-service",
    "app-02": "order-service",
    "db-primary-01": "postgresql",
    "db-replica-01": "postgresql",
}

# Timing
NOW = datetime.now(timezone.utc)
INCIDENT_START = NOW - timedelta(hours=1)
NORMAL_START = NOW - timedelta(hours=3)

BATCH_SIZE = 500


# ---------------------------------------------------------------------------
# Bulk indexing
# ---------------------------------------------------------------------------
def bulk_index(index, docs):
    """Index documents using the Bulk API."""
    body_lines = []
    for doc in docs:
        body_lines.append(json.dumps({"index": {"_index": index}}))
        body_lines.append(json.dumps(doc))
    body = "\n".join(body_lines) + "\n"

    resp = requests.post(
        f"{ES_URL}/_bulk",
        headers={**HEADERS, "Content-Type": "application/x-ndjson"},
        data=body,
    )
    result = resp.json()
    errors = result.get("errors", False)
    items = result.get("items", [])
    success = sum(1 for i in items if i.get("index", {}).get("status", 0) < 300)
    if errors:
        err_count = sum(1 for i in items if i.get("index", {}).get("error"))
        print(f"  Indexed {success}/{len(docs)} docs into {index} ({err_count} errors)")
    else:
        print(f"  Indexed {success}/{len(docs)} docs into {index}")


def get_service_for_host(host):
    """Return the service associated with a host."""
    return HOST_SERVICE_MAP.get(host, random.choice(SERVICES))


# ---------------------------------------------------------------------------
# Normal metrics: 2 hours of healthy baseline (1 data point/min/host)
# ---------------------------------------------------------------------------
def generate_normal_metrics():
    """Generate 2 hours of healthy infrastructure metrics."""
    metrics = []
    for host in HOSTS:
        for minute in range(120):
            ts = NORMAL_START + timedelta(minutes=minute)
            is_db = host.startswith("db-")
            metrics.append({
                "@timestamp": ts.isoformat(),
                "host.name": host,
                "service.name": get_service_for_host(host),
                "system.cpu.total.pct": round(random.uniform(0.12, 0.40), 3),
                "system.memory.used.pct": round(random.uniform(0.35, 0.60), 3),
                "system.memory.total": 17179869184 if is_db else 8589934592,
                "system.disk.used.pct": round(random.uniform(0.25, 0.45), 3),
                "system.network.in.bytes": random.randint(100_000, 5_000_000),
                "system.network.out.bytes": random.randint(100_000, 5_000_000),
                "container.name": f"{host}-container",
                "kubernetes.pod.name": f"{get_service_for_host(host)}-{host}-pod",
                "cloud.region": "us-east-1",
            })
    return metrics


# ---------------------------------------------------------------------------
# Incident metrics: 1 hour of escalating stress
# ---------------------------------------------------------------------------
def generate_incident_metrics():
    """Generate 1 hour of incident metrics showing db-primary-01 under extreme stress."""
    metrics = []
    for minute in range(60):
        ts = INCIDENT_START + timedelta(minutes=minute)

        for host in HOSTS:
            is_db = host.startswith("db-")

            # Default normal values
            cpu = round(random.uniform(0.15, 0.40), 3)
            mem = round(random.uniform(0.40, 0.60), 3)
            disk = round(random.uniform(0.30, 0.50), 3)

            if host == "db-primary-01":
                # Database server under extreme stress -- CPU climbs over time
                cpu = round(min(0.45 + (minute * 0.009) + random.uniform(-0.02, 0.03), 0.98), 3)
                mem = round(min(0.55 + (minute * 0.006) + random.uniform(-0.02, 0.02), 0.96), 3)
                disk = round(min(0.42 + (minute * 0.001), 0.62), 3)  # WAL growth

            elif host == "db-replica-01":
                # Replica shows some stress from replication lag
                cpu = round(min(0.30 + (minute * 0.004) + random.uniform(-0.02, 0.02), 0.70), 3)
                mem = round(random.uniform(0.50, 0.65), 3)

            elif host in ["app-01", "app-02"] and minute > 12:
                # App hosts stressed by connection wait threads
                cpu = round(min(0.35 + (minute * 0.006) + random.uniform(-0.03, 0.03), 0.85), 3)
                mem = round(min(0.50 + (minute * 0.004) + random.uniform(-0.02, 0.02), 0.88), 3)

            elif host in ["web-01", "web-02"] and minute > 25:
                # Web hosts show mild stress from queued requests
                cpu = round(random.uniform(0.35, 0.55), 3)
                mem = round(random.uniform(0.50, 0.70), 3)

            metrics.append({
                "@timestamp": ts.isoformat(),
                "host.name": host,
                "service.name": get_service_for_host(host),
                "system.cpu.total.pct": cpu,
                "system.memory.used.pct": mem,
                "system.memory.total": 17179869184 if is_db else 8589934592,
                "system.disk.used.pct": disk,
                "system.network.in.bytes": random.randint(100_000, 10_000_000),
                "system.network.out.bytes": random.randint(100_000, 10_000_000),
                "container.name": f"{host}-container",
                "kubernetes.pod.name": f"{get_service_for_host(host)}-{host}-pod",
                "cloud.region": "us-east-1",
            })
    return metrics


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    print("=" * 60)
    print("  Infrastructure Metrics Generator")
    print("=" * 60)
    print(f"  ES URL:    {ES_URL}")
    print(f"  Auth:      {'API Key configured' if ES_API_KEY else 'No auth (local dev)'}")
    print(f"  Hosts:     {', '.join(HOSTS)}")
    print(f"  Services:  {', '.join(SERVICES)}")
    print("=" * 60)

    print("\nPhase 1: Normal metrics (2 hours, 720 docs)...")
    normal_metrics = generate_normal_metrics()

    print("Phase 2: Incident metrics (1 hour, 360 docs)...")
    incident_metrics = generate_incident_metrics()

    all_metrics = normal_metrics + incident_metrics
    total = len(all_metrics)
    print(f"\nIndexing {total} metric documents to Elasticsearch...\n")

    # Index in batches
    for i in range(0, len(all_metrics), BATCH_SIZE):
        batch = all_metrics[i:i + BATCH_SIZE]
        bulk_index("infra-metrics", batch)

    print(f"\nDone! Generated {total} infrastructure metric documents")
    print(f"  Normal period:   {len(normal_metrics)} docs (2 hours baseline)")
    print(f"  Incident period: {len(incident_metrics)} docs (1 hour escalation)")
    print(f"\nIncident scenario: Database Connection Pool Exhaustion")
    print(f"  Root cause host: db-primary-01 (CPU -> 98%, memory -> 96%)")
    print(f"  Cascade: db-primary-01 -> app-01/app-02 -> web-01/web-02")


if __name__ == "__main__":
    main()
