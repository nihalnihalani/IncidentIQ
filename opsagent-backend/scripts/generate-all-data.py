#!/usr/bin/env python3
"""
generate-all-data.py -- Master script that runs all data generators in order.

Generates the complete dataset for OpsAgent:
  1. Service owners (4 records)
  2. Incident knowledge base (5 past incidents)
  3. Alert rules with percolator queries (5 rules)
  4. Incident scenario logs + infrastructure metrics (~2,200 docs)

Usage:
    export ES_URL="https://your-es-instance.elastic.cloud:443"
    export ES_API_KEY="your-api-key"
    python3 generate-all-data.py
"""

import importlib.util
import os
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))


def _load_module(filename):
    """Import a sibling script by filename (supports hyphens in names)."""
    filepath = os.path.join(SCRIPT_DIR, filename)
    module_name = filename.replace("-", "_").removesuffix(".py")
    spec = importlib.util.spec_from_file_location(module_name, filepath)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def main():
    es_url = os.environ.get("ES_URL", "http://localhost:9200")
    es_api_key = os.environ.get("ES_API_KEY", "")

    print("=" * 60)
    print("  OpsAgent -- Complete Data Generator")
    print("=" * 60)
    print(f"  ES URL: {es_url}")
    print(f"  Auth:   {'API Key configured' if es_api_key else 'No auth (local dev)'}")
    print("=" * 60)
    print()

    print("[1/4] Service Owners")
    print("-" * 40)
    _load_module("generate-service-owners.py").run()
    print()

    print("[2/4] Incident Knowledge Base")
    print("-" * 40)
    _load_module("generate-knowledge-base.py").run()
    print()

    print("[3/4] Alert Rules")
    print("-" * 40)
    _load_module("generate-alert-rules.py").run()
    print()

    print("[4/4] Incident Data (Logs + Metrics)")
    print("-" * 40)
    _load_module("generate-incident-data.py").run()
    print()

    print("=" * 60)
    print("  All data generation complete!")
    print("=" * 60)
    print()
    print("Indices populated:")
    print("  - service-owners       (4 records)")
    print("  - incident-knowledge   (5 past incidents)")
    print("  - alert-rules          (5 percolator rules)")
    print("  - logs-opsagent        (~1,100 log entries)")
    print("  - infra-metrics        (~1,080 metric data points)")
    print()
    print("Incident scenario: Database Connection Pool Exhaustion")
    print("  Phase 1 (0-10 min):  Early warnings on payment-service")
    print("  Phase 2 (10-30 min): Active errors -- payment, order, gateway")
    print("  Phase 3 (30-60 min): Cascading failures across all services")
    print()
    print("Suggested demo prompt:")
    print('  > "Payment service errors are spiking. What is happening?"')


if __name__ == "__main__":
    main()
