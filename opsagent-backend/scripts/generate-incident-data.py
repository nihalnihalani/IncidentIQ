#!/usr/bin/env python3
"""
generate-incident-data.py -- Generate realistic incident scenario data

Scenario: Database Connection Pool Exhaustion
- 2 hours of normal operations across 4 services and 4 hosts
- Phase 1 (0-10 min):  Early warnings -- connection pool warnings on payment-service
- Phase 2 (10-30 min): Active incident -- errors concentrated in payment-service, order-service
- Phase 3 (30-60 min): Cascading failures -- all services affected
- Also generates infrastructure metrics for the same time window

Usage:
    export ES_URL="https://your-es-instance.elastic.cloud:443"
    export ES_API_KEY="your-api-key"
    python3 generate-incident-data.py
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
# Service topology
# ---------------------------------------------------------------------------
SERVICES = ["payment-service", "order-service", "inventory-service", "api-gateway"]
HOSTS = ["web-01", "web-02", "app-01", "app-02", "db-primary-01", "db-replica-01"]
APP_HOSTS = ["web-01", "web-02", "app-01", "app-02"]
PATHS = ["/api/orders", "/api/payments", "/api/inventory", "/api/auth/token", "/api/products", "/health"]
HTTP_METHODS = ["GET", "POST", "PUT", "DELETE"]

# Timing
NOW = datetime.now(timezone.utc)
INCIDENT_START = NOW - timedelta(hours=1)   # incident started 1 hour ago
NORMAL_START = NOW - timedelta(hours=3)     # normal ops started 3 hours ago

BATCH_SIZE = 500
LOG_INDEX = "logs-opsagent"
METRICS_INDEX = "infra-metrics"


def bulk_index(index, docs):
    """Bulk index documents in batches."""
    total = 0
    for i in range(0, len(docs), BATCH_SIZE):
        batch = docs[i : i + BATCH_SIZE]
        body = ""
        for doc in batch:
            body += json.dumps({"index": {"_index": index}}) + "\n"
            body += json.dumps(doc) + "\n"
        resp = requests.post(
            f"{ES_URL}/_bulk",
            headers={**HEADERS, "Content-Type": "application/x-ndjson"},
            data=body,
        )
        result = resp.json()
        if result.get("errors"):
            err_count = sum(1 for item in result["items"] if item["index"].get("error"))
            print(f"  Batch {i // BATCH_SIZE + 1}: {err_count} errors")
        total += len(batch)
    print(f"  [OK] Indexed {total} documents to '{index}'")
    return total


# ---------------------------------------------------------------------------
# Normal operation messages
# ---------------------------------------------------------------------------
NORMAL_MESSAGES = [
    "Request processed successfully in {}ms",
    "Cache hit for session {}",
    "Health check passed",
    "Database query completed in {}ms",
    "Payment processed for order #{}",
    "Inventory check completed for SKU-{}",
    "User {} authenticated successfully",
    "Order #{} created, total: ${:.2f}",
    "Rate limiter: 42/{} requests this window",
    "Connection pool stats: 12/50 active, 38 idle",
]


def _format_normal_message():
    """Return a random normal-operation log message."""
    idx = random.randint(0, len(NORMAL_MESSAGES) - 1)
    tmpl = NORMAL_MESSAGES[idx]
    if idx == 7:
        return tmpl.format(random.randint(10000, 99999), random.uniform(10, 500))
    elif "{}" in tmpl:
        return tmpl.format(random.randint(10, 9999))
    return tmpl


# ---------------------------------------------------------------------------
# Log generators
# ---------------------------------------------------------------------------
def generate_normal_logs():
    """Generate 2 hours of healthy application logs (600 docs)."""
    logs = []
    for _ in range(600):
        ts = NORMAL_START + timedelta(seconds=random.randint(0, 7200))
        service = random.choice(SERVICES)
        host = random.choice(APP_HOSTS)
        level = random.choices(["INFO", "DEBUG", "WARN"], weights=[80, 15, 5])[0]

        logs.append({
            "@timestamp": ts.isoformat(),
            "service.name": service,
            "service.environment": "production",
            "host.name": host,
            "host.ip": f"10.0.{random.randint(1, 10)}.{random.randint(1, 254)}",
            "log.level": level,
            "message": _format_normal_message(),
            "http.request.method": random.choice(HTTP_METHODS),
            "http.response.status_code": random.choices([200, 201, 204, 304], weights=[60, 20, 10, 10])[0],
            "url.path": random.choice(PATHS),
            "event.duration": random.randint(5_000_000, 200_000_000),  # 5-200ms in nanos
            "trace.id": f"trace-{random.randint(100000, 999999):06d}",
            "span.id": f"span-{random.randint(1000, 9999):04d}",
        })
    return logs


def generate_incident_logs():
    """Generate 1 hour of escalating incident logs (~500 docs)."""
    logs = []

    # Phase 1: Early warnings (0-10 min) -- connection pool warnings
    for _ in range(60):
        ts = INCIDENT_START + timedelta(seconds=random.randint(0, 600))
        logs.append({
            "@timestamp": ts.isoformat(),
            "service.name": "payment-service",
            "service.environment": "production",
            "host.name": "app-01",
            "host.ip": "10.0.2.15",
            "log.level": "WARN",
            "message": random.choice([
                f"Database connection pool nearing capacity - {random.randint(42, 48)}/50 connections in use",
                f"Slow database query detected: SELECT * FROM transactions took {random.randint(2000, 5000)}ms",
                f"Connection checkout time: {random.randint(800, 3000)}ms (threshold: 1000ms)",
                "Thread pool saturation warning: 85% of worker threads blocked on DB I/O",
            ]),
            "error.type": "ConnectionPoolWarning",
            "http.request.method": "POST",
            "http.response.status_code": 200,
            "url.path": "/api/payments",
            "event.duration": random.randint(800_000_000, 3_000_000_000),
            "trace.id": f"trace-{random.randint(100000, 999999):06d}",
            "span.id": f"span-{random.randint(1000, 9999):04d}",
        })

    # Phase 2: Active incident (10-30 min) -- errors on payment, order, gateway
    for _ in range(200):
        ts = INCIDENT_START + timedelta(seconds=random.randint(600, 1800))
        service = random.choices(
            ["payment-service", "order-service", "api-gateway"],
            weights=[60, 30, 10],
        )[0]
        host = random.choice(["app-01", "app-02"])
        error_type = random.choice([
            "ConnectionTimeoutException",
            "SQLException",
            "CircuitBreakerOpenException",
            "HikariPoolTimeoutException",
        ])
        logs.append({
            "@timestamp": ts.isoformat(),
            "service.name": service,
            "service.environment": "production",
            "host.name": host,
            "host.ip": f"10.0.2.{random.randint(10, 30)}",
            "log.level": "ERROR",
            "message": random.choice([
                "FATAL: connection pool exhausted -- cannot acquire connection after 30000ms timeout",
                "java.sql.SQLException: Cannot get a connection, pool error Timeout waiting for idle object",
                "Transaction failed: unable to reach database within timeout period",
                "Circuit breaker OPEN for database connections -- failing fast",
                f"HikariPool-1 - Connection is not available, request timed out after {random.randint(29000, 31000)}ms",
                "org.postgresql.util.PSQLException: Connection to db-primary-01:5432 refused",
                f"Downstream dependency payment-service returned HTTP 503 after {random.randint(30, 60)}s",
                "CRITICAL: Payment processing halted -- all database connections exhausted",
            ]),
            "error.type": error_type,
            "error.message": "Connection pool exhausted on db-primary-01:5432",
            "http.request.method": random.choice(["POST", "PUT"]),
            "http.response.status_code": random.choice([500, 503, 504]),
            "url.path": random.choice(["/api/payments", "/api/orders"]),
            "event.duration": random.randint(30_000_000_000, 62_000_000_000),
            "trace.id": f"trace-{random.randint(100000, 999999):06d}",
            "span.id": f"span-{random.randint(1000, 9999):04d}",
        })

    # Phase 3: Cascading failures (30-60 min) -- all services affected
    for _ in range(140):
        ts = INCIDENT_START + timedelta(seconds=random.randint(1800, 3600))
        service = random.choice(SERVICES)
        host = random.choice(APP_HOSTS)
        logs.append({
            "@timestamp": ts.isoformat(),
            "service.name": service,
            "service.environment": "production",
            "host.name": host,
            "host.ip": f"10.0.{random.randint(1, 10)}.{random.randint(1, 254)}",
            "log.level": random.choices(["ERROR", "FATAL"], weights=[70, 30])[0],
            "message": random.choice([
                f"Service degraded -- upstream dependency {random.choice(['payment-service', 'order-service'])} failures detected",
                "Health check FAILED -- database unreachable from this host",
                f"Request queue overflow -- dropping requests (queue depth: {random.randint(500, 2000)})",
                f"GC pause detected: {random.randint(3000, 8000)}ms (threshold: 2000ms)",
                f"Customer-facing error rate: {random.randint(45, 78)}% (threshold: 5%)",
                "Circuit breaker for order-service OPEN -- too many failures in window",
                f"HTTP connection pool to payment-service exhausted ({random.randint(50, 100)}/{random.randint(50, 100)} connections used)",
                "Kubernetes readiness probe failed -- pod will be removed from service",
                f"Memory pressure critical: {random.randint(88, 96)}% heap used, frequent full GCs",
            ]),
            "error.type": random.choice(["CascadeFailure", "ServiceDegradation", "HealthCheckFailure"]),
            "error.message": "Cascading failure originating from database connection pool exhaustion",
            "http.request.method": random.choice(HTTP_METHODS),
            "http.response.status_code": random.choice([500, 502, 503, 504]),
            "url.path": random.choice(PATHS),
            "event.duration": random.randint(30_000_000_000, 120_000_000_000),
            "trace.id": f"trace-{random.randint(100000, 999999):06d}",
            "span.id": f"span-{random.randint(1000, 9999):04d}",
        })

    # Sprinkle in some successful requests during the incident (not everything fails)
    for _ in range(100):
        ts = INCIDENT_START + timedelta(seconds=random.randint(0, 3600))
        logs.append({
            "@timestamp": ts.isoformat(),
            "service.name": random.choice(["api-gateway", "inventory-service"]),
            "service.environment": "production",
            "host.name": random.choice(["web-01", "web-02"]),
            "host.ip": f"10.0.1.{random.randint(1, 20)}",
            "log.level": "INFO",
            "message": random.choice([
                "Request processed successfully (cached response)",
                "Static asset served",
                "Health check passed (no DB dependency)",
            ]),
            "http.request.method": "GET",
            "http.response.status_code": 200,
            "url.path": random.choice(["/health", "/api/inventory", "/static"]),
            "event.duration": random.randint(1_000_000, 50_000_000),
            "trace.id": f"trace-{random.randint(100000, 999999):06d}",
            "span.id": f"span-{random.randint(1000, 9999):04d}",
        })

    return logs


# ---------------------------------------------------------------------------
# Metrics generators
# ---------------------------------------------------------------------------
def generate_normal_metrics():
    """Generate 2 hours of healthy infrastructure metrics (1 point/min/host)."""
    metrics = []
    for host in HOSTS:
        for minute in range(120):
            ts = NORMAL_START + timedelta(minutes=minute)
            is_db = host.startswith("db-")
            metrics.append({
                "@timestamp": ts.isoformat(),
                "host.name": host,
                "service.name": "postgresql" if is_db else random.choice(SERVICES),
                "system.cpu.total.pct": round(random.uniform(0.12, 0.40), 3),
                "system.memory.used.pct": round(random.uniform(0.35, 0.60), 3),
                "system.memory.total": 17179869184,  # 16 GiB
                "system.disk.used.pct": round(random.uniform(0.25, 0.45), 3),
                "system.network.in.bytes": random.randint(100_000, 5_000_000),
                "system.network.out.bytes": random.randint(100_000, 5_000_000),
                "container.name": f"{host}-container",
                "kubernetes.pod.name": f"{host}-pod-{''.join(random.choices('abcdef0123456789', k=5))}",
                "cloud.region": "us-east-1",
            })
    return metrics


def generate_incident_metrics():
    """Generate 1 hour of incident metrics -- db-primary-01 under extreme stress."""
    metrics = []
    for minute in range(60):
        ts = INCIDENT_START + timedelta(minutes=minute)

        for host in HOSTS:
            cpu = round(random.uniform(0.15, 0.40), 3)
            mem = round(random.uniform(0.40, 0.60), 3)
            disk = round(random.uniform(0.30, 0.50), 3)

            if host == "db-primary-01":
                # Database server under extreme stress
                cpu = round(min(0.45 + (minute * 0.009) + random.uniform(-0.02, 0.03), 0.98), 3)
                mem = round(min(0.55 + (minute * 0.006) + random.uniform(-0.02, 0.02), 0.96), 3)
                disk = round(min(0.42 + (minute * 0.001), 0.62), 3)
            elif host == "db-replica-01":
                cpu = round(min(0.30 + (minute * 0.004) + random.uniform(-0.02, 0.02), 0.70), 3)
                mem = round(random.uniform(0.50, 0.65), 3)
            elif host in ("app-01", "app-02") and minute > 12:
                cpu = round(min(0.35 + (minute * 0.006) + random.uniform(-0.03, 0.03), 0.85), 3)
                mem = round(min(0.50 + (minute * 0.004) + random.uniform(-0.02, 0.02), 0.88), 3)
            elif host in ("web-01", "web-02") and minute > 25:
                cpu = round(random.uniform(0.35, 0.55), 3)
                mem = round(random.uniform(0.50, 0.70), 3)

            metrics.append({
                "@timestamp": ts.isoformat(),
                "host.name": host,
                "service.name": "postgresql" if host.startswith("db-") else random.choice(SERVICES),
                "system.cpu.total.pct": cpu,
                "system.memory.used.pct": mem,
                "system.memory.total": 17179869184,
                "system.disk.used.pct": disk,
                "system.network.in.bytes": random.randint(100_000, 10_000_000),
                "system.network.out.bytes": random.randint(100_000, 10_000_000),
                "container.name": f"{host}-container",
                "kubernetes.pod.name": f"{host}-pod-{''.join(random.choices('abcdef0123456789', k=5))}",
                "cloud.region": "us-east-1",
            })
    return metrics


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def run():
    """Generate and index all incident data."""
    print("=" * 60)
    print("  Incident Data Generator")
    print("  Scenario: Database Connection Pool Exhaustion")
    print("=" * 60)
    print(f"  ES URL: {ES_URL}")
    print(f"  Auth:   {'API Key configured' if ES_API_KEY else 'No auth (local dev)'}")
    print("=" * 60)

    print("\nPhase 1: Normal operation logs (600 docs)...")
    normal_logs = generate_normal_logs()

    print("Phase 2: Incident logs (~500 docs)...")
    incident_logs = generate_incident_logs()

    print("Phase 3: Normal metrics (720 docs)...")
    normal_metrics = generate_normal_metrics()

    print("Phase 4: Incident metrics (360 docs)...")
    incident_metrics = generate_incident_metrics()

    print("\nIndexing to Elasticsearch...\n")
    log_count = bulk_index(LOG_INDEX, normal_logs + incident_logs)
    metric_count = bulk_index(METRICS_INDEX, normal_metrics + incident_metrics)

    total = log_count + metric_count
    print(f"\nDone! Generated {total} total documents")
    print(f"  {LOG_INDEX}: {len(normal_logs) + len(incident_logs)} documents")
    print(f"  {METRICS_INDEX}: {len(normal_metrics) + len(incident_metrics)} documents")
    print(f"\nIncident scenario: Database connection pool exhaustion")
    print(f"  Started: ~1 hour ago | Root cause: db-primary-01")


if __name__ == "__main__":
    run()
