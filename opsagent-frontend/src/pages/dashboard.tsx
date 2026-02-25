import { TopBar } from '@/components/layout/top-bar'
import { MetricCard } from '@/components/ui/metric-card'
import { ServiceHealthGrid } from '@/components/dashboard/service-health-grid'
import { IncidentList } from '@/components/dashboard/incident-list'
import { AgentFeed } from '@/components/dashboard/agent-feed'
import { InfraMetricsPanel } from '@/components/InfraMetricsPanel'
import { DotPattern } from '@/components/ui/dot-pattern'
import { BorderBeam } from '@/components/ui/border-beam'
import { AlertTriangle, Activity, DollarSign, Clock, Server } from 'lucide-react'
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
    <div className="relative min-h-screen">
      {/* Subtle dot pattern background */}
      <DotPattern className="[mask-image:radial-gradient(ellipse_at_center,white_20%,transparent_70%)] opacity-60" />

      <TopBar title="Live Operations Dashboard" />

      <div className="relative p-6 space-y-6">
        {/* Story Banner */}
        <div className="relative overflow-hidden rounded-lg border border-critical/30 bg-critical-bg p-4 glow-critical animate-blur-in">
          <BorderBeam colorFrom="#ff4444" colorTo="#ff8c00" size={200} duration={8} />
          <div className="relative flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-critical/20">
              <AlertTriangle className="h-5 w-5 text-critical animate-pulse-glow" />
            </div>
            <div>
              <p className="text-sm font-bold text-critical">It's 3:07 AM. The order-service is failing.</p>
              <p className="text-xs text-text-muted mt-0.5">
                Customers can't checkout. Revenue bleeding at $12k/min. Watch the multi-agent system detect, investigate, and respond.
              </p>
            </div>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-4 gap-4 stagger-children">
          <MetricCard
            label="Active Incidents"
            value="3"
            subtitle="1 critical, 1 high, 1 medium"
            icon={<AlertTriangle className="h-5 w-5" />}
            color="#ff4444"
            trend="up"
            trendValue="Cascading from order-service"
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
            subtitle="Across 3 agents"
            icon={<Activity className="h-5 w-5" />}
            color="#8844ff"
            trend="up"
            trendValue="Triage → Investigate → PostMortem"
          />
        </div>

        {/* Service Health */}
        <div>
          <h3 className="text-sm font-semibold text-text mb-3">Service Health</h3>
          <ServiceHealthGrid />
        </div>

        {/* Infrastructure Health */}
        <div>
          <h3 className="text-sm font-semibold text-text mb-3 flex items-center gap-2">
            <Server className="h-4 w-4 text-text-dim" />
            Infrastructure Health
          </h3>
          <InfraMetricsPanel />
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
