import { useEsData } from './use-es-data'
import { esSearch } from '@/lib/es-client'
import {
  blastRadiusNodes as mockNodes,
  blastRadiusEdges as mockEdges,
} from '@/data/mock'
import type { BlastRadiusNode, BlastRadiusEdge } from '@/data/mock'

interface BlastRadiusData {
  nodes: BlastRadiusNode[]
  edges: BlastRadiusEdge[]
}

async function fetchBlastRadius(): Promise<BlastRadiusData> {
  const res = await esSearch<{
    service_name: string
    dependencies: string[]
    tier: string
  }>({
    index: 'service-owners',
    body: { size: 50 },
  })

  const healthRes: any = await esSearch({
    index: 'service-health-realtime',
    body: {
      size: 0,
      aggs: {
        by_service: {
          terms: { field: 'service.name', size: 20 },
          aggs: {
            latest: {
              top_hits: {
                size: 1,
                sort: [{ time_bucket: { order: 'desc' } }],
                _source: ['error_rate', 'avg_duration_ms'],
              },
            },
          },
        },
      },
    },
  })

  const healthMap = new Map<string, { errorRate: number; latency: number }>()
  const healthBuckets = healthRes.aggregations?.by_service?.buckets ?? []
  for (const b of healthBuckets) {
    const src = b.latest.hits.hits[0]?._source
    if (src) healthMap.set(b.key, { errorRate: src.error_rate ?? 0, latency: src.avg_duration_ms ?? 0 })
  }

  const serviceHits = res.hits.hits
  const nodePositions = calculatePositions(serviceHits.length)

  const nodes: BlastRadiusNode[] = serviceHits.map((hit, i) => {
    const s = hit._source
    const health = healthMap.get(s.service_name)
    const errorRate = health?.errorRate ?? 0
    let status: 'healthy' | 'degraded' | 'down' = 'healthy'
    if (errorRate > 25) status = 'down'
    else if (errorRate > 5) status = 'degraded'

    return {
      id: s.service_name,
      name: s.service_name,
      type: 'service',
      status,
      x: nodePositions[i].x,
      y: nodePositions[i].y,
    }
  })

  const edges: BlastRadiusEdge[] = []
  for (const hit of serviceHits) {
    const s = hit._source
    if (s.dependencies) {
      for (const dep of s.dependencies) {
        const targetHealth = healthMap.get(dep)
        edges.push({
          source: s.service_name,
          target: dep,
          weight: 0.5,
          latency: targetHealth?.latency ?? 0,
        })
      }
    }
  }

  return { nodes, edges }
}

function calculatePositions(count: number): Array<{ x: number; y: number }> {
  const cx = 400, cy = 260, r = 200
  return Array.from({ length: count }, (_, i) => ({
    x: Math.round(cx + r * Math.cos((2 * Math.PI * i) / count - Math.PI / 2)),
    y: Math.round(cy + r * Math.sin((2 * Math.PI * i) / count - Math.PI / 2)),
  }))
}

export function useBlastRadius() {
  return useEsData<BlastRadiusData>({
    fetchFn: fetchBlastRadius,
    mockData: { nodes: mockNodes, edges: mockEdges },
    refreshInterval: 30000,
  })
}
