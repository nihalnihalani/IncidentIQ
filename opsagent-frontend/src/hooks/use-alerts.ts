import { useEsData } from './use-es-data'
import { esSearch } from '@/lib/es-client'
import { alertRules as mockAlerts } from '@/data/mock'
import type { AlertRule } from '@/data/mock'

async function fetchAlertRules(): Promise<AlertRule[]> {
  const res = await esSearch<{
    rule_name: string
    rule_description: string
    severity: string
    enabled: boolean
    last_triggered: string
    created_by: string
    notification_channel: string
    query: Record<string, unknown>
  }>({
    index: 'alert-rules',
    body: {
      size: 50,
      sort: [{ severity: 'asc' }, { last_triggered: 'desc' }],
    },
  })

  return res.hits.hits.map((hit) => {
    const s = hit._source
    return {
      id: hit._id,
      name: s.rule_name,
      description: s.rule_description ?? '',
      condition: formatCondition(s.query),
      severity: s.severity as AlertRule['severity'],
      active: s.enabled,
      matchCount: 0,
      lastTriggered: s.last_triggered,
      createdBy: s.created_by,
      percolateQuery: JSON.stringify(s.query, null, 2),
      workflowAction: s.notification_channel ? `${s.notification_channel} notification` : undefined,
    }
  })
}

function formatCondition(query: Record<string, unknown>): string {
  try {
    return JSON.stringify(query).slice(0, 80) + '...'
  } catch {
    return 'Complex query'
  }
}

export function useAlertRules() {
  return useEsData<AlertRule[]>({
    fetchFn: fetchAlertRules,
    mockData: mockAlerts,
  })
}
