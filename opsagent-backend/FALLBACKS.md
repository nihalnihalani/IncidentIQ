# Tool Fallback Queries

If a primary ES|QL tool fails (e.g., FORK/FUSE not supported, EVAL CASE syntax error), manually register the corresponding fallback tool from the `tools/` directory or paste the alternative query below.

## hybrid_rag_search

**Primary** (FORK/FUSE/RRF):
```esql
FROM incident-knowledge METADATA _score
| FORK
    (WHERE MATCH(title, ?query) | SORT _score DESC | LIMIT 20)
    (WHERE MATCH(semantic_description, ?query) | SORT _score DESC | LIMIT 20)
| FUSE RRF WITH {"rank_constant": 60}
| SORT _score DESC | LIMIT ?result_count
| KEEP title, description, resolution, root_cause, severity, category, affected_services, mttr_minutes, _score
```

**Tier 2** -- Semantic-only (no FORK/FUSE):
```esql
FROM incident-knowledge METADATA _score
| WHERE MATCH(semantic_description, ?query)
| SORT _score DESC | LIMIT ?result_count
| KEEP title, description, resolution, root_cause, severity, category, affected_services, mttr_minutes, _score
```

**Tier 3** -- Keyword match (any ES version):
```esql
FROM incident-knowledge METADATA _score
| WHERE MATCH(title, ?query) OR MATCH(description, ?query)
| SORT _score DESC | LIMIT ?result_count
| KEEP title, description, resolution, root_cause, severity, category, affected_services, mttr_minutes, _score
```

Separate fallback tool file: `tools/hybrid_rag_search_fallback.json`

---

## error_trend_analysis

**Primary** (EVAL CASE + DATE_TRUNC):
```esql
FROM logs-opsagent-*
| WHERE service.name == ?service_name AND @timestamp > NOW() - ?time_range
| EVAL is_error = CASE(log.level IN ("ERROR", "FATAL"), 1, 0)
| EVAL time_bucket = DATE_TRUNC(?bucket_size, @timestamp)
| STATS error_count = SUM(is_error), total_count = COUNT(*) BY time_bucket
| EVAL error_rate_pct = ROUND(error_count / total_count * 100, 2)
| SORT time_bucket ASC | LIMIT 100
```

**Tier 2** -- Error-only counts per bucket (no EVAL CASE):
```esql
FROM logs-opsagent-*
| WHERE service.name == ?service_name AND @timestamp > NOW() - ?time_range AND log.level IN ("ERROR", "FATAL")
| EVAL time_bucket = DATE_TRUNC(?bucket_size, @timestamp)
| STATS error_count = COUNT(*) BY time_bucket
| SORT time_bucket ASC | LIMIT 100
```

**Tier 3** -- Total counts by log level (no time bucketing):
```esql
FROM logs-opsagent-*
| WHERE service.name == ?service_name AND @timestamp > NOW() - ?time_range
| STATS total = COUNT(*), errors = COUNT_DISTINCT(CASE(log.level == "ERROR" OR log.level == "FATAL", @timestamp, NULL)) BY log.level
| SORT errors DESC | LIMIT 20
```

Separate fallback tool file: `tools/error_trend_analysis_fallback.json`

---

## service_error_breakdown

**Primary** (full breakdown with sample_message):
```esql
FROM logs-opsagent-*
| WHERE service.name == ?service_name AND log.level IN ("ERROR", "FATAL") AND @timestamp > NOW() - ?time_range
| STATS error_count = COUNT(*), last_seen = MAX(@timestamp), sample_message = MAX(error.message) BY error.type
| SORT error_count DESC | LIMIT ?result_count
```

**Tier 2** -- Counts by error type only (no sample_message):
```esql
FROM logs-opsagent-*
| WHERE service.name == ?service_name AND log.level IN ("ERROR", "FATAL") AND @timestamp > NOW() - ?time_range
| STATS error_count = COUNT(*) BY error.type
| SORT error_count DESC | LIMIT ?result_count
```

**Tier 3** -- Counts by log level only:
```esql
FROM logs-opsagent-*
| WHERE service.name == ?service_name AND @timestamp > NOW() - ?time_range
| STATS count = COUNT(*) BY log.level
| SORT count DESC | LIMIT 10
```

Separate fallback tool file: `tools/service_error_breakdown_fallback.json`
