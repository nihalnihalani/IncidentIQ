#!/usr/bin/env python3
"""
load-runbooks.py — Load IT operations runbooks into Elasticsearch

These runbooks serve as the agent's knowledge base for diagnosis and remediation.
Ported from ElasticSearch_hack-main/scripts/02_load_runbooks.py.

Usage:
    export ES_URL="https://your-es-instance.elastic.cloud:443"
    export ES_API_KEY="your-api-key"
    python3 load-runbooks.py
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

RUNBOOKS = [
    {
        "title": "Database Connection Pool Exhaustion",
        "category": "database",
        "severity": "P1",
        "symptoms": "Connection timeout errors in application logs, increasing response latency above 5 seconds, HTTP 503 from dependent services, connection pool metrics showing 100% utilization",
        "root_cause": "Connection pool maximum size reached due to slow queries holding connections, connection leaks in application code, or sudden traffic spike exceeding pool capacity",
        "remediation_steps": "1. Check active connections with pg_stat_activity or equivalent. 2. Identify and kill long-running transactions holding connections. 3. Temporarily increase connection pool max size in application config. 4. Restart affected application pods/instances to release leaked connections. 5. Monitor connection pool metrics to verify recovery. 6. If caused by slow queries, identify them and add missing indexes.",
        "prevention": "Set connection pool idle timeout to 30s, implement circuit breakers on database calls, add connection pool utilization alerts at 80% threshold, regular query performance reviews, connection leak detection in CI/CD pipeline",
        "tags": ["database", "connection-pool", "timeout", "postgresql", "mysql"],
    },
    {
        "title": "High CPU Usage on Database Server",
        "category": "database",
        "severity": "P2",
        "symptoms": "CPU usage consistently above 85%, slow query response times exceeding SLA, increased IO wait percentage, replication lag increasing on replicas",
        "root_cause": "Unoptimized queries performing full table scans, missing indexes on frequently queried columns, excessive concurrent connections causing context switching, runaway background processes like vacuum or reindex",
        "remediation_steps": "1. Check pg_stat_activity or processlist for expensive queries. 2. Review recent deployment changes that may have introduced new queries. 3. Use EXPLAIN ANALYZE on slow queries to identify missing indexes. 4. Add missing indexes to resolve full table scans. 5. Scale read traffic to replicas if needed. 6. Kill any runaway background processes.",
        "prevention": "Regular slow query log review, automated query plan analysis in staging, mandatory EXPLAIN checks for new queries, index usage monitoring, CPU alert at 80% threshold",
        "tags": ["database", "cpu", "performance", "indexing", "queries"],
    },
    {
        "title": "Cascading Service Failures",
        "category": "microservices",
        "severity": "P1",
        "symptoms": "Multiple services returning HTTP 5xx errors simultaneously, circuit breakers tripped across service mesh, health checks failing on multiple services, error rates climbing service by service over time",
        "root_cause": "Single critical dependency failure propagating through the service dependency chain, missing or misconfigured circuit breakers allowing failure propagation, synchronous call chains without timeouts creating bottlenecks",
        "remediation_steps": "1. Identify the ROOT failing service by examining error timestamps - the earliest errors point to the origin. 2. Check the dependency graph to understand the failure propagation path. 3. Isolate the failing service from the mesh if possible. 4. Restart or scale the root cause service. 5. Reset circuit breakers on dependent services once root cause is resolved. 6. Monitor recovery across all affected services.",
        "prevention": "Implement bulkhead pattern to isolate failure domains, configure proper timeout chains (downstream timeouts < upstream timeouts), use async communication where possible, implement circuit breakers with proper thresholds on all service-to-service calls",
        "tags": ["microservices", "cascade", "circuit-breaker", "dependency", "timeout"],
    },
    {
        "title": "Memory Pressure and GC Pauses",
        "category": "application",
        "severity": "P2",
        "symptoms": "Long garbage collection pauses exceeding 5 seconds, out-of-memory errors or OOMKilled pods, steadily increasing memory usage over time, increased application response latency",
        "root_cause": "Memory leaks in application code retaining object references, undersized JVM heap relative to workload, large object allocations from unbounded collections, improper caching without eviction policies",
        "remediation_steps": "1. Capture heap dump from affected instance (jmap -dump:format=b). 2. Analyze dump with Eclipse MAT or VisualVM to find retention chains. 3. Restart affected pods as immediate fix to restore service. 4. Tune JVM flags: increase Xmx, adjust GC algorithm. 5. Identify and fix the memory leak in application code. 6. Add bounded caches with eviction.",
        "prevention": "Set container memory limits with appropriate headroom, enable GC logging for all services, add memory usage alerts at 80% of limit, automated heap dump collection on OOM, regular memory profiling in staging",
        "tags": ["memory", "gc", "jvm", "oomkilled", "heap", "leak"],
    },
    {
        "title": "Disk Space Exhaustion",
        "category": "infrastructure",
        "severity": "P1",
        "symptoms": "Disk usage above 95%, write operations failing, database unable to write WAL or temporary files, application logs failing to write, container evictions due to disk pressure",
        "root_cause": "Log files growing unbounded without rotation, database temporary files or WAL accumulation, large data imports filling disk, missing disk usage monitoring and alerting",
        "remediation_steps": "1. Identify the largest directories consuming disk: du -sh /* | sort -rh. 2. Remove old log files and temporary files safely. 3. If database WAL, run a checkpoint to reclaim space. 4. Implement or fix log rotation configuration. 5. Add monitoring for disk usage at 80% and 90% thresholds. 6. Consider expanding disk if structurally undersized.",
        "prevention": "Implement log rotation with max file size and count, monitor disk usage with alerts at 80%, set database WAL size limits, use separate volumes for data and logs, regular capacity planning reviews",
        "tags": ["disk", "storage", "logs", "wal", "capacity"],
    },
    {
        "title": "Network Connectivity Issues",
        "category": "infrastructure",
        "severity": "P1",
        "symptoms": "Connection refused or connection timeout errors between services, DNS resolution failures, intermittent packet loss, services unable to reach external APIs or databases",
        "root_cause": "Security group or firewall rule changes blocking traffic, DNS service disruption, network partition or cloud provider networking issue, exhausted ephemeral ports or file descriptors",
        "remediation_steps": "1. Verify DNS resolution from affected hosts: nslookup/dig. 2. Check security groups and network ACLs for recent changes. 3. Test connectivity with telnet/nc to specific ports. 4. Check for exhausted file descriptors: lsof | wc -l. 5. Review cloud provider status page for known issues. 6. Rollback recent network configuration changes if identified.",
        "prevention": "Infrastructure as code for network config with change review, network connectivity monitoring between critical services, file descriptor and port exhaustion alerts, maintain network topology documentation",
        "tags": ["network", "dns", "firewall", "connectivity", "timeout"],
    },
    {
        "title": "SSL/TLS Certificate Expiration",
        "category": "security",
        "severity": "P1",
        "symptoms": "HTTPS connection failures with certificate errors, browser security warnings, service-to-service mTLS authentication failures, automated API clients receiving SSL errors",
        "root_cause": "Certificate expired without renewal, auto-renewal process failed silently, certificate was manually provisioned without automated renewal, certificate authority or intermediate cert expired",
        "remediation_steps": "1. Identify which certificate expired: openssl s_client -connect host:443. 2. Check certificate management system for renewal status. 3. Issue new certificate or trigger manual renewal. 4. Deploy new certificate to all affected endpoints. 5. Restart services to pick up new certificates. 6. Verify certificate chain is complete.",
        "prevention": "Implement automated certificate renewal (cert-manager, Let's Encrypt), add certificate expiry monitoring with 30-day warning alerts, maintain certificate inventory, use short-lived certificates where possible",
        "tags": ["ssl", "tls", "certificate", "https", "security"],
    },
    {
        "title": "API Rate Limiting / Throttling",
        "category": "application",
        "severity": "P3",
        "symptoms": "HTTP 429 Too Many Requests responses, increasing response latency, request queuing, third-party API calls failing with rate limit errors",
        "root_cause": "Traffic spike exceeding configured rate limits, misconfigured retry logic causing amplification, batch job sending burst of API calls, external API provider reducing rate limits",
        "remediation_steps": "1. Identify which API or endpoint is being rate limited. 2. Check if traffic spike is legitimate or from a misbehaving client. 3. Implement or adjust exponential backoff in retry logic. 4. Temporarily increase rate limits if traffic is legitimate. 5. Queue and throttle batch operations. 6. Contact external provider if their limits changed.",
        "prevention": "Implement client-side rate limiting with backoff, use request queuing for batch operations, monitor rate limit headers, set up alerts for 429 response rates, maintain rate limit documentation for all external APIs",
        "tags": ["rate-limit", "throttling", "429", "api", "backoff"],
    },
]


def create_index():
    """Create the runbooks index with mappings if it doesn't exist."""
    mapping_path = os.path.join(
        os.path.dirname(os.path.abspath(__file__)),
        "..",
        "setup",
        "mappings",
        "runbooks.json",
    )
    if os.path.exists(mapping_path):
        with open(mapping_path) as f:
            mapping = json.load(f)
    else:
        mapping = {
            "settings": {"number_of_shards": 1, "number_of_replicas": 1},
            "mappings": {
                "properties": {
                    "title": {"type": "text", "fields": {"keyword": {"type": "keyword"}}},
                    "category": {"type": "keyword"},
                    "severity": {"type": "keyword"},
                    "symptoms": {"type": "text"},
                    "root_cause": {"type": "text"},
                    "remediation_steps": {"type": "text"},
                    "prevention": {"type": "text"},
                    "tags": {"type": "keyword"},
                }
            },
        }

    resp = requests.put(
        f"{ES_URL}/runbooks",
        headers=HEADERS,
        json=mapping,
    )
    if resp.status_code == 200:
        print("[OK] Created 'runbooks' index")
    elif resp.status_code == 400 and "resource_already_exists" in resp.text:
        print("[OK] 'runbooks' index already exists")
    else:
        print(f"[WARN] Create index response: {resp.status_code} {resp.text}")


def bulk_load():
    """Load all runbooks using the Bulk API."""
    body_lines = []
    for runbook in RUNBOOKS:
        body_lines.append(json.dumps({"index": {"_index": "runbooks"}}))
        body_lines.append(json.dumps(runbook))
    body = "\n".join(body_lines) + "\n"

    resp = requests.post(
        f"{ES_URL}/_bulk",
        headers={**HEADERS, "Content-Type": "application/x-ndjson"},
        data=body,
    )
    result = resp.json()

    if result.get("errors"):
        print("[FAIL] Some errors occurred during indexing:")
        for item in result["items"]:
            if item["index"].get("error"):
                print(f"  Error: {item['index']['error']}")
    else:
        print(f"[OK] Loaded {len(RUNBOOKS)} runbooks into 'runbooks' index")


def verify():
    """Verify the runbooks were loaded."""
    resp = requests.get(f"{ES_URL}/runbooks/_count", headers=HEADERS)
    if resp.status_code == 200:
        count = resp.json().get("count", 0)
        print(f"[OK] Verification: {count} runbooks in index")
    else:
        print(f"[WARN] Could not verify: {resp.status_code}")


if __name__ == "__main__":
    print("=" * 50)
    print("  OpsAgent — Runbook Loader")
    print("=" * 50)
    print(f"  ES URL: {ES_URL}")
    print(f"  Auth:   {'API Key configured' if ES_API_KEY else 'No auth (local dev)'}")
    print("=" * 50)

    create_index()
    bulk_load()
    verify()

    print(f"\nLoaded {len(RUNBOOKS)} runbooks:")
    for rb in RUNBOOKS:
        print(f"  - [{rb['severity']}] {rb['title']} ({rb['category']})")
