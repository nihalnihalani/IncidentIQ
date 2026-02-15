import { useEsData } from './use-es-data'
import { esAggregate } from '@/lib/es-client'
import { errorTrendData as mockTrends, significantTermsData as mockTerms } from '@/data/mock'

interface ErrorTrendPoint {
  time: string
  errors: number
  baseline: number
}

interface SignificantTerm {
  term: string
  score: number
  bgCount: number
  docCount: number
  significance: 'critical' | 'high' | 'medium'
}

async function fetchErrorTrends(service: string): Promise<ErrorTrendPoint[]> {
  const res: any = await esAggregate('logs-opsagent-*', {
    query: {
      bool: {
        filter: [
          { term: { 'service.name': service } },
          { range: { '@timestamp': { gte: 'now-1h' } } },
        ],
      },
    },
    aggs: {
      over_time: {
        date_histogram: {
          field: '@timestamp',
          fixed_interval: '5m',
        },
        aggs: {
          error_count: {
            filter: { terms: { 'log.level': ['ERROR', 'FATAL'] } },
          },
        },
      },
    },
  })

  const buckets = res.aggregations?.over_time?.buckets ?? []
  return buckets.map((b: any) => ({
    time: new Date(b.key_as_string).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
    errors: b.error_count.doc_count,
    baseline: 5,
  }))
}

async function fetchSignificantTerms(service: string): Promise<SignificantTerm[]> {
  const res: any = await esAggregate('logs-opsagent-*', {
    query: {
      bool: {
        filter: [
          { term: { 'service.name': service } },
          { terms: { 'log.level': ['ERROR', 'FATAL'] } },
          { range: { '@timestamp': { gte: 'now-1h' } } },
        ],
      },
    },
    aggs: {
      unusual_errors: {
        significant_terms: {
          field: 'error.type',
          size: 10,
        },
      },
    },
  })

  const buckets = res.aggregations?.unusual_errors?.buckets ?? []
  return buckets.map((b: any) => {
    const score = Math.round((b.score ?? 0) * 10) / 10
    return {
      term: b.key,
      score,
      bgCount: b.bg_count ?? 0,
      docCount: b.doc_count ?? 0,
      significance: score > 80 ? 'critical' as const : score > 50 ? 'high' as const : 'medium' as const,
    }
  })
}

export function useErrorTrends(service: string = 'order-service') {
  return useEsData<ErrorTrendPoint[]>({
    fetchFn: () => fetchErrorTrends(service),
    mockData: mockTrends,
    refreshInterval: 15000,
  })
}

export function useSignificantTerms(service: string = 'order-service') {
  return useEsData<SignificantTerm[]>({
    fetchFn: () => fetchSignificantTerms(service),
    mockData: mockTerms,
  })
}
