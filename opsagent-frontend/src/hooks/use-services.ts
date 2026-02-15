import { useEsData } from './use-es-data'
import { esSearch } from '@/lib/es-client'
import { services as mockServices } from '@/data/mock'
import type { ServiceHealth } from '@/data/mock'

async function fetchServices(): Promise<ServiceHealth[]> {
  const res = await esSearch<Record<string, unknown>>({
    index: 'service-health-realtime',
    body: {
      size: 0,
      aggs: {
        by_service: {
          terms: { field: 'service.name', size: 20 },
          aggs: {
            latest: {
              top_hits: {
                size: 7,
                sort: [{ time_bucket: { order: 'desc' } }],
                _source: ['service.name', 'error_rate', 'avg_duration_ms', 'total_requests'],
              },
            },
          },
        },
      },
    },
  })

  const buckets = (res as any).aggregations?.by_service?.buckets ?? []
  return buckets.map((bucket: any) => {
    const hits = bucket.latest.hits.hits
    const latest = hits[0]?._source ?? {}
    const trend = hits.map((h: any) => h._source.error_rate ?? 0).reverse()

    const errorRate = latest.error_rate ?? 0
    let status: 'healthy' | 'degraded' | 'down' = 'healthy'
    if (errorRate > 25) status = 'down'
    else if (errorRate > 5) status = 'degraded'

    return {
      name: bucket.key,
      status,
      latency: Math.round(latest.avg_duration_ms ?? 0),
      errorRate: Math.round((errorRate + Number.EPSILON) * 10) / 10,
      requests: latest.total_requests ?? 0,
      trend,
    }
  })
}

export function useServices() {
  return useEsData<ServiceHealth[]>({
    fetchFn: fetchServices,
    mockData: mockServices,
    refreshInterval: 30000,
  })
}
