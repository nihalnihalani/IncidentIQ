import { Loader2, AlertCircle, Inbox } from 'lucide-react'

interface DataStateProps {
  loading: boolean
  error: string | null
  isEmpty?: boolean
  children: React.ReactNode
}

export function DataState({ loading, error, isEmpty, children }: DataStateProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 text-elastic animate-spin" />
          <p className="text-xs text-text-muted">Loading from Elasticsearch...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <AlertCircle className="h-6 w-6 text-critical" />
          <p className="text-xs text-critical">{error}</p>
          <p className="text-[10px] text-text-dim">Showing cached data</p>
        </div>
      </div>
    )
  }

  if (isEmpty) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <Inbox className="h-6 w-6 text-text-dim" />
          <p className="text-xs text-text-muted">No data available</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
