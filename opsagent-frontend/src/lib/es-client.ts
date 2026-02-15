const ES_BASE = '/es'

interface EsSearchParams {
  index: string
  body: Record<string, unknown>
}

interface EsEsqlParams {
  query: string
  params?: Record<string, unknown>
}

function getConfig() {
  const url = import.meta.env.VITE_ES_URL
  const forceMock = import.meta.env.VITE_FORCE_MOCK === 'true'
  return { isLive: !!url && !forceMock }
}

export function isLiveMode(): boolean {
  return getConfig().isLive
}

export async function esSearch<T = unknown>({ index, body }: EsSearchParams): Promise<{
  hits: { total: { value: number }; hits: Array<{ _id: string; _source: T }> }
}> {
  const res = await fetch(`${ES_BASE}/${index}/_search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`ES search failed: ${res.status} ${res.statusText}`)
  return res.json()
}

export async function esEsql<T = Record<string, unknown>>({ query, params }: EsEsqlParams): Promise<{
  columns: Array<{ name: string; type: string }>
  values: unknown[][]
}> {
  const res = await fetch(`${ES_BASE}/_query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, ...(params ? { params } : {}) }),
  })
  if (!res.ok) throw new Error(`ES|QL query failed: ${res.status} ${res.statusText}`)
  return res.json()
}

export async function esAggregate<T = unknown>(index: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${ES_BASE}/${index}/_search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ size: 0, ...body }),
  })
  if (!res.ok) throw new Error(`ES aggregation failed: ${res.status} ${res.statusText}`)
  return res.json()
}
