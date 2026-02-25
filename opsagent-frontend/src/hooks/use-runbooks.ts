import { useEsData } from './use-es-data'
import { esSearch } from '@/lib/es-client'
import { runbooks as mockRunbooks } from '@/data/mock'
import type { Runbook, RunbookCategory } from '@/data/mock'

async function fetchRunbooks(category?: RunbookCategory): Promise<Runbook[]> {
  const query: Record<string, unknown> = category
    ? { bool: { filter: [{ term: { category } }] } }
    : { match_all: {} }

  const res = await esSearch<{
    title: string
    category: string
    severity: string
    symptoms: string
    root_cause: string
    remediation_steps: string
    prevention: string
    tags: string[]
  }>({
    index: 'runbooks',
    body: {
      size: 50,
      query,
      sort: [{ severity: 'asc' }],
    },
  })

  return res.hits.hits.map((hit) => {
    const s = hit._source
    return {
      title: s.title,
      category: s.category as RunbookCategory,
      severity: s.severity as Runbook['severity'],
      symptoms: s.symptoms,
      rootCause: s.root_cause,
      remediationSteps: s.remediation_steps,
      prevention: s.prevention,
      tags: s.tags ?? [],
    }
  })
}

export function useRunbooks(category?: RunbookCategory) {
  const mock = category
    ? mockRunbooks.filter((r) => r.category === category)
    : mockRunbooks

  return useEsData<Runbook[]>({
    fetchFn: () => fetchRunbooks(category),
    mockData: mock,
  })
}
