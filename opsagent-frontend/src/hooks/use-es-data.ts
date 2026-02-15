import { useState, useEffect, useCallback } from 'react'
import { isLiveMode } from '@/lib/es-client'

interface UseEsDataOptions<T> {
  fetchFn: () => Promise<T>
  mockData: T
  refreshInterval?: number
}

interface UseEsDataResult<T> {
  data: T
  loading: boolean
  error: string | null
  isLive: boolean
  refresh: () => void
}

export function useEsData<T>({ fetchFn, mockData, refreshInterval = 0 }: UseEsDataOptions<T>): UseEsDataResult<T> {
  const live = isLiveMode()
  const [data, setData] = useState<T>(mockData)
  const [loading, setLoading] = useState(live)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!live) return
    try {
      setLoading(true)
      setError(null)
      const result = await fetchFn()
      setData(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }, [live, fetchFn])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (!live || !refreshInterval) return
    const interval = setInterval(fetchData, refreshInterval)
    return () => clearInterval(interval)
  }, [live, refreshInterval, fetchData])

  return { data, loading, error, isLive: live, refresh: fetchData }
}
