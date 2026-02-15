#!/usr/bin/env python3
"""
Self-Healing Infrastructure Intelligence - Demo Data Generator
================================================================
Generates 10,000+ realistic log entries across 10 services with:
- Time-varying error rates with a clear spike for demo
- Per-service error profiles (each service has distinct failure modes)
- Pre-defined patterns that significant_terms aggregation will discover
- Service owner data with dependencies
- Incident knowledge base with semantic fields
- Percolator alert rules for reverse-search

Usage:
    export ES_URL="https://your-es-instance.elastic.cloud:443"
    export ES_API_KEY="your-api-key"
    python3 generate-demo-data.py
"""

import json
import math
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
TOTAL_HOURS = 24          # 24 hours of log data
TARGET_LOGS = 12000       # Target ~12K log entries
BATCH_SIZE = 500          # Bulk batch size

HOSTS = [f"host-{i:02d}.prod.internal" for i in range(1, 21)]
HTTP_METHODS = ["GET", "POST", "PUT", "DELETE"]
HTTP_PATHS = [
    "/api/v1/users", "/api/v1/orders", "/api/v1/payments",
    "/api/v1/inventory", "/api/v1/auth/token", "/api/v1/search",
    "/api/v1/notifications", "/health", "/metrics", "/api/v2/analytics",
]

# ---------------------------------------------------------------------------
# Service profiles: each service has a DISTINCT error fingerprint
# This is critical for significant_terms to work well.
# ---------------------------------------------------------------------------
SERVICE_PROFILES = {
    "api-gateway": {
        "base_error_rate": 0.03,     # 3% baseline errors
        "primary_errors": {          # errors characteristic of this service
            "RateLimitExceeded": 0.40,
            "ConnectionTimeout": 0.30,
            "SSLHandshakeError": 0.15,
            "CircuitBreakerOpen": 0.15,
        },
        "normal_rps": 15,            # requests per minute baseline
    },
    "auth-service": {
        "base_error_rate": 0.02,
        "primary_errors": {
            "AuthenticationFailure": 0.50,
            "SSLHandshakeError": 0.20,
            "CertificateExpired": 0.15,
            "ConnectionTimeout": 0.15,
        },
        "normal_rps": 12,
    },
    "payment-service": {
        "base_error_rate": 0.02,
        "primary_errors": {
            "DatabaseConnectionError": 0.35,
            "ConnectionTimeout": 0.30,
            "CircuitBreakerOpen": 0.20,
            "GRPCDeadlineExceeded": 0.15,
        },
        "normal_rps": 8,
    },
    "order-service": {
        "base_error_rate": 0.03,
        "primary_errors": {
            "GRPCDeadlineExceeded": 0.40,
            "KafkaProducerError": 0.25,
            "DatabaseConnectionError": 0.20,
            "ConnectionTimeout": 0.15,
        },
        "normal_rps": 10,
    },
    "inventory-service": {
        "base_error_rate": 0.02,
        "primary_errors": {
            "DatabaseConnectionError": 0.40,
            "GRPCDeadlineExceeded": 0.30,
            "ConnectionTimeout": 0.20,
            "OutOfMemoryError": 0.10,
        },
        "normal_rps": 7,
    },
    "notification-service": {
        "base_error_rate": 0.04,
        "primary_errors": {
            "RedisConnectionRefused": 0.40,
            "KafkaProducerError": 0.25,
            "ConnectionTimeout": 0.20,
            "DNSResolutionFailure": 0.15,
        },
        "normal_rps": 6,
    },
    "search-service": {
        "base_error_rate": 0.03,
        "primary_errors": {
            "OutOfMemoryError": 0.35,
            "ConnectionTimeout": 0.30,
            "CircuitBreakerOpen": 0.20,
            "GRPCDeadlineExceeded": 0.15,
        },
        "normal_rps": 10,
    },
    "user-service": {
        "base_error_rate": 0.02,
        "primary_errors": {
            "NullPointerException": 0.40,
            "DatabaseConnectionError": 0.25,
            "ConnectionTimeout": 0.20,
            "AuthenticationFailure": 0.15,
        },
        "normal_rps": 9,
    },
    "analytics-pipeline": {
        "base_error_rate": 0.05,
        "primary_errors": {
            "S3AccessDenied": 0.35,
            "KafkaProducerError": 0.25,
            "OutOfMemoryError": 0.20,
            "DiskSpaceFull": 0.20,
        },
        "normal_rps": 5,
    },
    "cdn-edge": {
        "base_error_rate": 0.02,
        "primary_errors": {
            "DNSResolutionFailure": 0.40,
            "ConnectionTimeout": 0.25,
            "SSLHandshakeError": 0.20,
            "RateLimitExceeded": 0.15,
        },
        "normal_rps": 12,
    },
}

SERVICES = list(SERVICE_PROFILES.keys())

# ---------------------------------------------------------------------------
# Error message templates
# ---------------------------------------------------------------------------
ERROR_MESSAGES = {
    "ConnectionTimeout": [
        "Connection to database timed out after 30000ms",
        "Connection pool exhausted, no available connections after 5000ms",
        "TCP connection to upstream service timed out",
    ],
    "DatabaseConnectionError": [
        "Failed to acquire connection from pool: pool exhausted",
        "Database connection reset by peer",
        "FATAL: too many connections for role 'app_user'",
    ],
    "OutOfMemoryError": [
        "java.lang.OutOfMemoryError: Java heap space",
        "GC overhead limit exceeded",
        "Unable to allocate 256MB of memory for query buffer",
    ],
    "NullPointerException": [
        "NullPointerException at UserService.getProfile(UserService.java:142)",
        "Cannot invoke method on null reference: user.getPreferredLanguage()",
        "Null value in non-null column 'preferred_language'",
    ],
    "RateLimitExceeded": [
        "Rate limit exceeded for client IP 10.0.42.15: 10 req/min",
        "API rate limit reached, retry after 60 seconds",
        "Too many requests from API key: ak_prod_***",
    ],
    "CertificateExpired": [
        "SSL certificate for auth-service.internal has expired",
        "Certificate validity period has ended: NotAfter=2026-02-10T00:00:00Z",
        "TLS handshake failed: certificate has expired or is not yet valid",
    ],
    "DiskSpaceFull": [
        "No space left on device: /var/log partition at 100%",
        "Kafka broker disk usage at 95%, rejecting new writes",
        "Failed to write WAL segment: disk full",
    ],
    "DNSResolutionFailure": [
        "DNS resolution failed for origin.api.acme.com: NXDOMAIN",
        "Unable to resolve hostname: temporary failure in name resolution",
        "DNS lookup timeout after 5000ms for service-discovery.internal",
    ],
    "CircuitBreakerOpen": [
        "Circuit breaker OPEN for payment-service: failure rate 85%",
        "Request rejected by circuit breaker: service unavailable",
        "Circuit breaker tripped after 10 consecutive failures",
    ],
    "AuthenticationFailure": [
        "Authentication failed: invalid bearer token",
        "JWT signature verification failed",
        "API key authentication failed: key revoked or expired",
    ],
    "SSLHandshakeError": [
        "SSL handshake failed: certificate_unknown",
        "TLS handshake error: peer certificate not trusted",
        "SSL_ERROR_HANDSHAKE_FAILURE_ALERT from upstream",
    ],
    "KafkaProducerError": [
        "Kafka producer buffer full: 33554432 bytes",
        "Failed to send message to topic 'orders': timeout",
        "Kafka producer closed due to unrecoverable error",
    ],
    "RedisConnectionRefused": [
        "Connection refused by Redis at 10.0.1.50:6379",
        "Redis connection lost, attempting reconnection",
        "Failed to connect to Redis sentinel: connection refused",
    ],
    "S3AccessDenied": [
        "Access Denied: s3:PutObject on bucket analytics-data-lake",
        "AWS credentials expired for IAM role analytics-writer",
        "S3 access denied: insufficient permissions for analytics pipeline",
    ],
    "GRPCDeadlineExceeded": [
        "gRPC deadline exceeded: inventory-service.CheckStock",
        "RPC timeout after 5000ms calling inventory-service",
        "Deadline exceeded for upstream call: 10s timeout",
    ],
}

NORMAL_MESSAGES = [
    "Request processed successfully in {}ms",
    "Health check passed",
    "Connection established to database",
    "Cache hit for key user_profile_{}",
    "Processed message from queue in {}ms",
    "API response sent: 200 OK in {}ms",
    "Background job completed: cleanup_sessions",
    "Metrics exported to monitoring endpoint",
    "Configuration reloaded successfully",
    "Deployment health check: all pods ready",
    "Request routed to backend instance {}",
    "Session validated for user_{}",
    "Query executed in {}ms, returned {} rows",
    "Webhook delivery confirmed: event_{}",
    "Rate limit check passed: 42/1000 req/min",
]

WARN_MESSAGES = [
    "Slow query detected: {}ms",
    "Connection pool usage at {}%",
    "Retry attempt 2/3 for upstream call",
    "Response time exceeded SLO: {}ms",
    "Deprecated API version used by client",
    "Memory usage at {}%, approaching threshold",
    "Request queue depth: {} (above normal)",
    "Upstream latency p99 elevated: {}ms",
]


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
        print(f"  Indexed {success}/{len(docs)} docs into {index} (some errors)")
    else:
        print(f"  Indexed {success}/{len(docs)} docs into {index}")
    return result


def pick_weighted(options_dict):
    """Pick from a dict of {option: weight}."""
    items = list(options_dict.keys())
    weights = list(options_dict.values())
    return random.choices(items, weights=weights, k=1)[0]


# ---------------------------------------------------------------------------
# Error rate modulation: creates realistic time-varying patterns
# ---------------------------------------------------------------------------
def get_error_rate_multiplier(service, minutes_ago, total_minutes):
    """
    Returns an error rate multiplier for a service at a given time.

    Key patterns engineered for the demo:
    - payment-service: SHARP spike in last 45 minutes (5x-10x normal)
    - order-service: cascading spike starting 30 minutes ago (3x-5x normal)
    - auth-service: brief spike 8-6 hours ago (resolved, for contrast)
    - All services: slight diurnal pattern (more errors at "peak hours")
    """
    hours_ago = minutes_ago / 60.0

    # Base diurnal pattern: simulate peak hours
    hour_of_day = (24 - hours_ago) % 24
    diurnal = 1.0 + 0.3 * math.sin(math.pi * (hour_of_day - 6) / 12)

    # Service-specific incident patterns
    if service == "payment-service":
        if minutes_ago <= 45:
            # ACTIVE INCIDENT: sharp ramp from 5x at 45min ago to 10x now
            progress = 1.0 - (minutes_ago / 45.0)
            return diurnal * (5.0 + 5.0 * progress)
        return diurnal

    if service == "order-service":
        if minutes_ago <= 30:
            # CASCADING: starts 15 min after payment, ramps to 5x
            progress = 1.0 - (minutes_ago / 30.0)
            return diurnal * (2.0 + 3.0 * progress)
        return diurnal

    if service == "auth-service":
        if 360 <= minutes_ago <= 480:
            # RESOLVED incident 6-8 hours ago (shows in trends as past spike)
            return diurnal * 4.0
        return diurnal

    if service == "notification-service":
        if minutes_ago <= 25:
            # Secondary cascade from payment-service
            return diurnal * 2.5
        return diurnal

    return diurnal


def get_rps_multiplier(minutes_ago):
    """Simulate traffic volume variation."""
    hours_ago = minutes_ago / 60.0
    hour_of_day = (24 - hours_ago) % 24
    # Peak at 10-14, trough at 2-6
    return 0.5 + 0.5 * max(0, math.sin(math.pi * (hour_of_day - 4) / 12))


# ---------------------------------------------------------------------------
# Log generator
# ---------------------------------------------------------------------------
def generate_log_entry(service, ts, is_incident=False):
    """Generate a single log entry for a service at a timestamp."""
    profile = SERVICE_PROFILES[service]

    doc = {
        "@timestamp": ts.isoformat(),
        "service.name": service,
        "service.environment": "production",
        "host.name": random.choice(HOSTS),
        "host.ip": f"10.0.{random.randint(1, 10)}.{random.randint(1, 254)}",
        "http.request.method": random.choice(HTTP_METHODS),
        "url.path": random.choice(HTTP_PATHS),
        "trace.id": f"trace-{random.randint(100000, 999999):06d}",
        "span.id": f"span-{random.randint(1000, 9999):04d}",
    }

    # Determine log level
    if is_incident:
        log_level = random.choices(
            ["ERROR", "FATAL", "WARN"],
            weights=[70, 15, 15],
            k=1
        )[0]
    else:
        log_level = random.choices(
            ["DEBUG", "INFO", "WARN", "ERROR", "FATAL"],
            weights=[3, 60, 25, 10, 2],
            k=1
        )[0]

    doc["log.level"] = log_level

    if log_level in ("ERROR", "FATAL"):
        error_type = pick_weighted(profile["primary_errors"])
        doc["error.type"] = error_type
        doc["error.message"] = random.choice(ERROR_MESSAGES[error_type])
        doc["message"] = f"[{log_level}] {doc['error.message']}"
        doc["http.response.status_code"] = random.choice([500, 502, 503, 504])
        doc["event.duration"] = random.randint(5000, 30000)
    elif log_level == "WARN":
        msg_tmpl = random.choice(WARN_MESSAGES)
        val = random.randint(500, 5000)
        doc["message"] = msg_tmpl.format(val) if "{}" in msg_tmpl else msg_tmpl
        doc["http.response.status_code"] = random.choice([200, 201, 429])
        doc["event.duration"] = random.randint(500, 5000)
    else:
        msg_tmpl = random.choice(NORMAL_MESSAGES)
        val = random.randint(10, 200)
        doc["message"] = msg_tmpl.format(val) if "{}" in msg_tmpl else msg_tmpl
        doc["http.response.status_code"] = random.choice([200, 201, 204])
        doc["event.duration"] = val

    return doc


def generate_log_data():
    """Generate 10,000+ realistic log entries with time-varying patterns."""
    print("\n[4/5] Generating log data (target: 12,000+ entries)...")
    now = datetime.now(timezone.utc)
    total_minutes = TOTAL_HOURS * 60
    all_docs = []
    total_generated = 0

    for minutes_ago in range(total_minutes, 0, -1):
        ts_base = now - timedelta(minutes=minutes_ago)
        rps_mult = get_rps_multiplier(minutes_ago)

        for service in SERVICES:
            profile = SERVICE_PROFILES[service]
            error_mult = get_error_rate_multiplier(service, minutes_ago, total_minutes)

            # How many log entries this minute for this service
            base_count = profile["normal_rps"] * rps_mult
            count = max(1, int(base_count * random.uniform(0.7, 1.3)))

            # During incidents, also increase total volume (more retries, more logs)
            if error_mult > 2.0:
                count = int(count * min(error_mult * 0.5, 3.0))

            effective_error_rate = min(profile["base_error_rate"] * error_mult, 0.85)

            for _ in range(count):
                ts = ts_base + timedelta(seconds=random.randint(0, 59))
                is_err = random.random() < effective_error_rate
                doc = generate_log_entry(service, ts, is_incident=is_err)
                all_docs.append(doc)
                total_generated += 1

            # Flush in batches
            if len(all_docs) >= BATCH_SIZE:
                bulk_index("logs-opsagent-demo", all_docs)
                all_docs = []

    # Flush remaining
    if all_docs:
        bulk_index("logs-opsagent-demo", all_docs)

    print(f"  Total log entries generated: {total_generated}")


# ---------------------------------------------------------------------------
# Service owner data
# ---------------------------------------------------------------------------
SERVICE_TEAMS = {
    "api-gateway":           ("Platform Team",        "platform"),
    "auth-service":          ("Security Team",        "security"),
    "payment-service":       ("Payments Team",        "payments"),
    "order-service":         ("Commerce Team",        "commerce"),
    "inventory-service":     ("Commerce Team",        "commerce"),
    "notification-service":  ("Platform Team",        "platform"),
    "search-service":        ("Search Team",          "search"),
    "user-service":          ("Identity Team",        "identity"),
    "analytics-pipeline":    ("Data Team",            "data"),
    "cdn-edge":              ("Infrastructure Team",  "infra"),
}

SERVICE_DEPENDENCIES = {
    "api-gateway":           ["auth-service", "order-service", "search-service"],
    "auth-service":          ["user-service"],
    "payment-service":       ["auth-service", "order-service"],
    "order-service":         ["payment-service", "inventory-service", "notification-service"],
    "inventory-service":     ["order-service"],
    "notification-service":  ["user-service", "auth-service"],
    "search-service":        ["inventory-service"],
    "user-service":          ["auth-service"],
    "analytics-pipeline":    ["order-service", "payment-service", "inventory-service"],
    "cdn-edge":              ["api-gateway"],
}

SERVICE_TIERS = {
    "api-gateway": "tier-1",
    "auth-service": "tier-1",
    "payment-service": "tier-1",
    "order-service": "tier-1",
    "inventory-service": "tier-2",
    "notification-service": "tier-2",
    "search-service": "tier-2",
    "user-service": "tier-2",
    "analytics-pipeline": "tier-3",
    "cdn-edge": "tier-1",
}


def generate_service_owners():
    print("\n[1/5] Generating service owner data...")
    docs = []
    for svc in SERVICES:
        team_name, team_slug = SERVICE_TEAMS[svc]
        docs.append({
            "service_name": svc,
            "owner_team": team_name,
            "owner_email": f"{team_slug}-team@example.com",
            "escalation_email": f"{team_slug}-escalation@example.com",
            "slack_channel": f"#ops-{team_slug}",
            "pagerduty_service_id": f"P{team_slug.upper()[:6]}SVC",
            "tier": SERVICE_TIERS[svc],
            "dependencies": SERVICE_DEPENDENCIES[svc],
            "repository_url": f"https://github.com/acme/{svc}",
            "runbook_url": f"https://wiki.acme.com/runbooks/{svc}",
        })

    for doc in docs:
        resp = requests.post(
            f"{ES_URL}/service-owners/_doc",
            headers=HEADERS,
            json=doc,
        )
        print(f"  Indexed service-owner for {doc['service_name']} (HTTP {resp.status_code})")


# ---------------------------------------------------------------------------
# Incident knowledge base
# ---------------------------------------------------------------------------
INCIDENTS = [
    {
        "title": "Payment service database connection pool exhaustion",
        "description": "Payment service experienced complete database connection pool exhaustion during peak Black Friday traffic. All payment processing stopped for 23 minutes. Error logs showed ConnectionTimeout exceptions from HikariCP with max pool size of 50 connections reached. CircuitBreakerOpen errors followed as the circuit breaker tripped.",
        "resolution": "Increased HikariCP max pool size from 50 to 200. Enabled connection pool monitoring alerts. Added circuit breaker for database calls with fallback to async queue. Implemented connection pool pre-warming during deployment.",
        "root_cause": "Database connection pool too small for peak traffic",
        "severity": "P1",
        "category": "database",
        "affected_services": ["payment-service", "order-service"],
        "tags": ["database", "connection-pool", "peak-traffic", "hikaricp", "circuit-breaker"],
        "mttr_minutes": 23,
    },
    {
        "title": "Auth service SSL certificate expiration",
        "description": "The auth-service TLS certificate expired at 02:00 UTC causing all authentication requests to fail with SSLHandshakeError. All downstream services that depend on auth-service started returning 401 errors. Customer-facing login completely broken.",
        "resolution": "Emergency certificate renewal using Let's Encrypt. Implemented certificate expiry monitoring with 30-day, 14-day, and 7-day alerts. Added cert-manager for automatic renewal in Kubernetes.",
        "root_cause": "TLS certificate expired without renewal",
        "severity": "P1",
        "category": "security",
        "affected_services": ["auth-service", "api-gateway", "user-service"],
        "tags": ["ssl", "certificate", "authentication", "tls"],
        "mttr_minutes": 45,
    },
    {
        "title": "Search service out of memory crash loop",
        "description": "Search service pods entered a crash loop due to OutOfMemoryError. Elasticsearch queries returning large result sets were consuming all available heap. JVM heap usage spiked to 100% and GC could not reclaim memory fast enough.",
        "resolution": "Increased pod memory limits from 2Gi to 4Gi. Added ES|QL LIMIT clauses to all search queries. Implemented result size validation in the search API layer. Added JVM heap monitoring alerts at 80% threshold.",
        "root_cause": "Unbounded Elasticsearch query result sets consuming all JVM heap",
        "severity": "P2",
        "category": "memory",
        "affected_services": ["search-service"],
        "tags": ["oom", "jvm", "heap", "elasticsearch", "memory"],
        "mttr_minutes": 35,
    },
    {
        "title": "CDN edge node DNS resolution failure",
        "description": "Multiple CDN edge nodes in us-east-1 reported DNSResolutionFailure when attempting to resolve origin server addresses. Static content serving continued from cache but dynamic API requests failed. Affected approximately 15% of US East Coast traffic.",
        "resolution": "Switched DNS resolver from corporate DNS to Cloudflare 1.1.1.1 as fallback. Implemented DNS caching at the edge with 5-minute TTL. Added health checks for DNS resolution with automatic failover.",
        "root_cause": "Corporate DNS resolver overloaded during maintenance window",
        "severity": "P2",
        "category": "network",
        "affected_services": ["cdn-edge", "api-gateway"],
        "tags": ["dns", "cdn", "network", "resolution-failure"],
        "mttr_minutes": 18,
    },
    {
        "title": "Kafka producer backpressure causing order processing delays",
        "description": "Order service experienced KafkaProducerError with message buffer full exceptions. Orders were being accepted but not processed for fulfillment. Kafka broker disk usage was at 95%, causing slow writes and producer backpressure.",
        "resolution": "Expanded Kafka broker storage from 500GB to 2TB. Reduced topic retention from 7 days to 3 days for high-volume topics. Implemented Kafka producer retry with exponential backoff. Added disk usage alerts at 80% threshold.",
        "root_cause": "Kafka broker disk space nearly full causing write backpressure",
        "severity": "P2",
        "category": "messaging",
        "affected_services": ["order-service", "inventory-service", "notification-service"],
        "tags": ["kafka", "backpressure", "disk", "message-queue"],
        "mttr_minutes": 52,
    },
    {
        "title": "Redis connection refused after failover",
        "description": "After a planned Redis Sentinel failover, the notification-service continued connecting to the old primary node which was now a replica. RedisConnectionRefused errors appeared in logs. Push notifications and email dispatches stopped.",
        "resolution": "Updated Redis client configuration to use Sentinel-aware connection pooling. Implemented Redis connection health checks with automatic reconnection. Added Sentinel topology change event handling.",
        "root_cause": "Redis client not Sentinel-aware, connecting to stale primary address",
        "severity": "P3",
        "category": "cache",
        "affected_services": ["notification-service"],
        "tags": ["redis", "sentinel", "failover", "connection"],
        "mttr_minutes": 28,
    },
    {
        "title": "Rate limiter misconfiguration blocking legitimate API traffic",
        "description": "A rate limiter configuration change reduced the per-IP request limit from 1000/min to 10/min for the api-gateway. Legitimate API consumers were being rate-limited with 429 Too Many Requests responses. RateLimitExceeded errors spiked across all downstream services.",
        "resolution": "Reverted rate limiter configuration. Implemented rate limiter config validation with dry-run mode. Added canary deployment for rate limiter changes. Created tiered rate limits based on API key tier.",
        "root_cause": "Incorrect rate limiter configuration deployed without validation",
        "severity": "P1",
        "category": "configuration",
        "affected_services": ["api-gateway", "auth-service", "payment-service", "order-service"],
        "tags": ["rate-limiter", "configuration", "429", "api-gateway"],
        "mttr_minutes": 12,
    },
    {
        "title": "Analytics pipeline S3 permission denied after IAM rotation",
        "description": "Automated IAM key rotation revoked the analytics pipeline's S3 write permissions. S3AccessDenied errors in logs. Daily analytics reports failed to generate and data lake ingestion stopped.",
        "resolution": "Updated IAM policy to use role-based access instead of access keys. Configured IRSA (IAM Roles for Service Accounts) for the Kubernetes pods. Added S3 write permission validation as part of IAM rotation runbook.",
        "root_cause": "IAM key rotation did not preserve S3 write permissions",
        "severity": "P3",
        "category": "permissions",
        "affected_services": ["analytics-pipeline"],
        "tags": ["iam", "s3", "permissions", "aws", "key-rotation"],
        "mttr_minutes": 65,
    },
    {
        "title": "gRPC deadline exceeded between order and inventory services",
        "description": "GRPCDeadlineExceeded errors between order-service and inventory-service during flash sale event. Inventory lookups that normally complete in 50ms were taking 5-10 seconds due to database lock contention on the inventory table.",
        "resolution": "Implemented read replicas for inventory lookups. Added gRPC deadline budget propagation. Created a cached inventory count that updates every 30 seconds for flash sale scenarios.",
        "root_cause": "Database lock contention on inventory table during high write throughput",
        "severity": "P2",
        "category": "latency",
        "affected_services": ["order-service", "inventory-service"],
        "tags": ["grpc", "deadline", "latency", "database-locks", "flash-sale"],
        "mttr_minutes": 40,
    },
    {
        "title": "User service NullPointerException after schema migration",
        "description": "A database schema migration added a new nullable column 'preferred_language' but the user-service code expected it to be non-null. NullPointerException on every user profile load. User profiles returned 500 errors.",
        "resolution": "Deployed hotfix to handle null preferred_language with default value 'en'. Updated migration to set default value. Added null-safety checks to all database entity mappings.",
        "root_cause": "Database schema migration introduced nullable column without code handling null case",
        "severity": "P2",
        "category": "deployment",
        "affected_services": ["user-service", "auth-service"],
        "tags": ["npe", "schema-migration", "deployment", "null-pointer"],
        "mttr_minutes": 30,
    },
]


def generate_incident_knowledge():
    print("\n[2/5] Generating incident knowledge base...")
    now = datetime.now(timezone.utc)
    docs = []
    for i, incident in enumerate(INCIDENTS):
        doc = {
            **incident,
            "incident_date": (now - timedelta(days=random.randint(7, 180))).isoformat(),
            "created_at": now.isoformat(),
            "runbook_url": f"https://wiki.acme.com/runbooks/INC-{1000 + i}",
            "author": random.choice(["sre-bot", "jane.smith", "ops-oncall", "john.doe"]),
            "semantic_title": incident["title"],
            "semantic_description": incident["description"],
            "semantic_resolution": incident["resolution"],
        }
        docs.append(doc)
    bulk_index("incident-knowledge", docs)


# ---------------------------------------------------------------------------
# Alert rules (percolator queries)
# ---------------------------------------------------------------------------
ALERT_RULES = [
    {
        "rule_name": "critical-error-spike",
        "rule_description": "Triggers when FATAL or critical errors are detected in any service",
        "severity": "critical",
        "category": "error",
        "owner_team": "Platform Team",
        "notification_channel": "slack",
        "enabled": True,
        "cooldown_minutes": 15,
        "query": {"bool": {"must": [{"terms": {"log.level": ["FATAL", "ERROR"]}}]}},
    },
    {
        "rule_name": "payment-service-errors",
        "rule_description": "Triggers on any error in the payment service - highest priority",
        "severity": "critical",
        "category": "payment",
        "owner_team": "Payments Team",
        "notification_channel": "pagerduty",
        "enabled": True,
        "cooldown_minutes": 5,
        "query": {"bool": {"must": [
            {"term": {"service.name": "payment-service"}},
            {"terms": {"log.level": ["ERROR", "FATAL"]}},
        ]}},
    },
    {
        "rule_name": "auth-failure-detected",
        "rule_description": "Triggers when authentication failures are detected",
        "severity": "high",
        "category": "security",
        "owner_team": "Security Team",
        "notification_channel": "slack",
        "enabled": True,
        "cooldown_minutes": 10,
        "query": {"bool": {"must": [
            {"term": {"service.name": "auth-service"}},
            {"term": {"error.type": "AuthenticationFailure"}},
        ]}},
    },
    {
        "rule_name": "ssl-certificate-error",
        "rule_description": "Triggers when SSL/TLS handshake errors are detected",
        "severity": "critical",
        "category": "security",
        "owner_team": "Infrastructure Team",
        "notification_channel": "pagerduty",
        "enabled": True,
        "cooldown_minutes": 5,
        "query": {"bool": {"should": [
            {"term": {"error.type": "SSLHandshakeError"}},
            {"term": {"error.type": "CertificateExpired"}},
        ], "minimum_should_match": 1}},
    },
    {
        "rule_name": "database-connection-issues",
        "rule_description": "Triggers when database connection errors are detected",
        "severity": "high",
        "category": "database",
        "owner_team": "Platform Team",
        "notification_channel": "slack",
        "enabled": True,
        "cooldown_minutes": 10,
        "query": {"bool": {"should": [
            {"term": {"error.type": "DatabaseConnectionError"}},
            {"term": {"error.type": "ConnectionTimeout"}},
        ], "minimum_should_match": 1}},
    },
    {
        "rule_name": "disk-space-warning",
        "rule_description": "Triggers when disk space full errors are detected",
        "severity": "high",
        "category": "infrastructure",
        "owner_team": "Infrastructure Team",
        "notification_channel": "slack",
        "enabled": True,
        "cooldown_minutes": 30,
        "query": {"term": {"error.type": "DiskSpaceFull"}},
    },
    {
        "rule_name": "5xx-error-responses",
        "rule_description": "Triggers on HTTP 5xx responses indicating server errors",
        "severity": "high",
        "category": "availability",
        "owner_team": "Platform Team",
        "notification_channel": "slack",
        "enabled": True,
        "cooldown_minutes": 10,
        "query": {"range": {"http.response.status_code": {"gte": 500, "lt": 600}}},
    },
    {
        "rule_name": "oom-detected",
        "rule_description": "Triggers when OutOfMemoryError is detected in any service",
        "severity": "critical",
        "category": "memory",
        "owner_team": "Platform Team",
        "notification_channel": "pagerduty",
        "enabled": True,
        "cooldown_minutes": 5,
        "query": {"term": {"error.type": "OutOfMemoryError"}},
    },
]


def generate_alert_rules():
    print("\n[3/5] Generating alert rules (percolator queries)...")
    now = datetime.now(timezone.utc)
    docs = []
    for rule in ALERT_RULES:
        doc = {**rule, "created_at": now.isoformat(), "created_by": "opsagent-setup", "last_triggered": None}
        docs.append(doc)
    bulk_index("alert-rules", docs)


# ---------------------------------------------------------------------------
# Verify
# ---------------------------------------------------------------------------
def verify():
    print("\n[5/5] Verifying data...")
    indices = ["incident-knowledge", "alert-rules", "service-owners", "logs-opsagent-demo"]
    for idx in indices:
        resp = requests.get(f"{ES_URL}/{idx}/_count", headers=HEADERS)
        if resp.status_code == 200:
            count = resp.json().get("count", 0)
            print(f"  {idx}: {count} documents")
        else:
            print(f"  {idx}: error ({resp.status_code})")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    print("=" * 60)
    print("  Self-Healing Infrastructure Intelligence")
    print("  Demo Data Generator")
    print("=" * 60)
    print(f"  ES URL:       {ES_URL}")
    print(f"  Auth:         {'API Key configured' if ES_API_KEY else 'No auth (local dev)'}")
    print(f"  Log hours:    {TOTAL_HOURS}")
    print(f"  Target logs:  ~{TARGET_LOGS}+")
    print("=" * 60)

    generate_service_owners()
    generate_incident_knowledge()
    generate_alert_rules()
    generate_log_data()
    verify()

    print("\n" + "=" * 60)
    print("  Data generation complete!")
    print("=" * 60)
    print("\nEngineered patterns for demo:")
    print("  - payment-service: ACTIVE error spike (last 45 min)")
    print("    -> DatabaseConnectionError + ConnectionTimeout + CircuitBreakerOpen")
    print("    -> significant_terms will surface these vs baseline")
    print("  - order-service: CASCADING errors (last 30 min)")
    print("    -> GRPCDeadlineExceeded calling payment-service")
    print("  - auth-service: RESOLVED spike (6-8 hours ago)")
    print("    -> Shows in trend analysis as past incident")
    print("  - notification-service: SECONDARY cascade (last 25 min)")
    print("")
    print("Suggested demo prompt:")
    print('  > "Payment service errors are spiking. What is happening?"')
    print("")
    print("Expected agent behavior:")
    print("  1. hybrid_rag_search finds 'Payment service DB pool exhaustion' incident")
    print("  2. error_trend_analysis shows 5x-10x error rate increase")
    print("  3. service_error_breakdown shows ConnectionTimeout + CircuitBreakerOpen")
    print("  4. anomaly_detector (significant_terms) surfaces DatabaseConnectionError")
    print("     as statistically disproportionate vs baseline")
    print("  5. Agent identifies cascading impact on order-service")


if __name__ == "__main__":
    main()
