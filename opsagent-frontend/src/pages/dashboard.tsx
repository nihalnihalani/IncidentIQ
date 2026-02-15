import { TopBar } from '@/components/layout/top-bar'
import { MetricCard } from '@/components/ui/metric-card'
import { ServiceHealthGrid } from '@/components/dashboard/service-health-grid'
import { IncidentList } from '@/components/dashboard/incident-list'
import { AgentFeed } from '@/components/dashboard/agent-feed'
import { AlertTriangle, Activity, DollarSign, Clock } from 'lucide-react'
import { useState, useEffect } from 'react'

function useRevenueTicker(startAmount: number, ratePerSec: number) {
  const [amount, setAmount] = useState(startAmount)
  useEffect(() => {
    const interval = setInterval(() => {
      setAmount(prev => prev + ratePerSec)
    }, 1000)
    return () => clearInterval(interval)
  }, [ratePerSec])
  return amount
}

function formatRevenue(amount: number) {
  if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}k`
  return `$${amount}`
}

export function DashboardPage() {
  // $12k/min = $200/sec, start at $36k (3 min into incident)
  const revenue = useRevenueTicker(36000, 200)

  return (
    <div className="min-h-screen">
      <TopBar title="Live Operations Dashboard" />

      <div className="p-6 space-y-6">
        {/* Story Banner */}
        <div className="rounded-lg border border-critical/30 bg-critical-bg p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-critical/20">
              <AlertTriangle className="h-5 w-5 text-critical animate-pulse-glow" />
            </div>
            <div>
              <p className="text-sm font-bold text-critical">It's 3:07 AM. The orders-service is failing.</p>
              <p className="text-xs text-text-muted mt-0.5">
                Customers can't checkout. Revenue bleeding at $12k/min. Watch the system detect, investigate, and heal itself.
              </p>
            </div>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-4 gap-4">
          <MetricCard
            label="Active Incidents"
            value="3"
            subtitle="1 critical, 1 high, 1 medium"
            icon={<AlertTriangle className="h-5 w-5" />}
            color="#ff4444"
            trend="up"
            trendValue="Cascading from orders-service"
          />
          <MetricCard
            label="MTTR (Current)"
            value="3m 12s"
            subtitle="Agent auto-investigating"
            icon={<Clock className="h-5 w-5" />}
            color="#00bfb3"
            trend="down"
            trendValue="vs. 47m manual baseline"
          />
          <MetricCard
            label="Revenue Impact"
            value={formatRevenue(revenue)}
            subtitle="Estimated since 03:07 AM"
            icon={<DollarSign className="h-5 w-5" />}
            color="#ff8c00"
            trend="up"
            trendValue="$12k/min burn rate"
            live
          />
          <MetricCard
            label="Agent Actions"
            value="8"
            subtitle="In last 3 minutes"
            icon={<Activity className="h-5 w-5" />}
            color="#8844ff"
            trend="up"
            trendValue="Slack + Jira + Auto-fix"
          />
        </div>

        {/* Service Health */}
        <div>
          <h3 className="text-sm font-semibold text-text mb-3">Service Health</h3>
          <ServiceHealthGrid />
        </div>

        {/* Incidents + Agent Feed side by side */}
        <div className="grid grid-cols-2 gap-6">
          <IncidentList />
          <AgentFeed />
        </div>
      </div>
    </div>
  )
}
