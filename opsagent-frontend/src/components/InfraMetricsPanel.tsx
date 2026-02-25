import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useInfraMetrics } from '@/hooks/use-infra-metrics'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Cpu, HardDrive, Server, ChevronDown } from 'lucide-react'
import type { InfraHost } from '@/data/mock'

function metricColor(value: number): string {
  if (value >= 80) return '#ff4444'
  if (value >= 60) return '#ff8c00'
  return '#44cc44'
}

function metricLabel(value: number): string {
  if (value >= 80) return 'critical'
  if (value >= 60) return 'elevated'
  return 'normal'
}

function MetricBar({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  const color = metricColor(value)
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[10px]">
        <span className="flex items-center gap-1 text-text-dim">
          {icon}
          {label}
        </span>
        <span className="font-mono font-bold" style={{ color }}>{value}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-surface-2 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

function HostCard({
  host,
  isExpanded,
  onToggle,
  timeline,
}: {
  host: InfraHost
  isExpanded: boolean
  onToggle: () => void
  timeline: { time: string; cpu: number; mem: number }[]
}) {
  const severity = metricLabel(Math.max(host.avgCpu, host.avgMem))

  return (
    <Card
      onClick={onToggle}
      className={cn(
        severity === 'critical' && 'border-critical/40 glow-critical',
        severity === 'elevated' && 'border-high/30',
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Server className="h-4 w-4 text-text-dim" />
          <span className="text-sm font-semibold font-mono text-text">{host.hostName}</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={severity === 'critical' ? 'critical' : undefined}
            color={severity === 'elevated' ? '#ff8c00' : severity === 'normal' ? '#44cc44' : undefined}
            pulse={severity === 'critical'}
          >
            {severity}
          </Badge>
          <ChevronDown
            className={cn(
              'h-3.5 w-3.5 text-text-dim transition-transform duration-200',
              isExpanded && 'rotate-180',
            )}
          />
        </div>
      </div>

      <div className="text-[10px] text-text-dim mb-2">{host.serviceName}</div>

      <div className="space-y-2">
        <MetricBar label="CPU" value={host.avgCpu} icon={<Cpu className="h-3 w-3" />} />
        <MetricBar label="Memory" value={host.avgMem} icon={<Server className="h-3 w-3" />} />
        <MetricBar label="Disk" value={host.avgDisk} icon={<HardDrive className="h-3 w-3" />} />
      </div>

      <AnimatePresence>
        {isExpanded && timeline.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-3 border-t border-border">
              <p className="text-[10px] text-text-dim mb-2">CPU + Memory (3h timeline, 5-min buckets)</p>
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timeline}>
                    <defs>
                      <linearGradient id={`cpuGrad-${host.hostName}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ff4444" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#ff4444" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id={`memGrad-${host.hostName}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4488ff" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#4488ff" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
                    <XAxis
                      dataKey="time"
                      tick={{ fill: '#8888a8', fontSize: 9 }}
                      interval={5}
                    />
                    <YAxis
                      tick={{ fill: '#8888a8', fontSize: 9 }}
                      domain={[0, 100]}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#12121a',
                        border: '1px solid #2a2a3e',
                        borderRadius: 8,
                        fontSize: 11,
                      }}
                      formatter={(value, name) => [`${value}%`, name === 'cpu' ? 'CPU' : 'Memory']}
                    />
                    <Area
                      type="monotone"
                      dataKey="cpu"
                      stroke="#ff4444"
                      fill={`url(#cpuGrad-${host.hostName})`}
                      strokeWidth={1.5}
                    />
                    <Area
                      type="monotone"
                      dataKey="mem"
                      stroke="#4488ff"
                      fill={`url(#memGrad-${host.hostName})`}
                      strokeWidth={1.5}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center gap-4 mt-2 text-[10px] text-text-dim">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-[#ff4444]" /> CPU
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-[#4488ff]" /> Memory
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}

interface InfraMetricsPanelProps {
  /** If provided, only show hosts matching these severity levels */
  filterSeverity?: ('critical' | 'elevated')[]
  /** If provided, auto-expand these host names */
  expandedHosts?: string[]
  className?: string
}

export function InfraMetricsPanel({ filterSeverity, expandedHosts: initialExpanded, className }: InfraMetricsPanelProps) {
  const { data: hosts, getHostTimeline } = useInfraMetrics()
  const [expandedHost, setExpandedHost] = useState<string | null>(initialExpanded?.[0] ?? null)

  const filteredHosts = filterSeverity
    ? hosts.filter((h) => {
        const sev = metricLabel(Math.max(h.avgCpu, h.avgMem))
        return filterSeverity.includes(sev as 'critical' | 'elevated')
      })
    : hosts

  return (
    <div className={cn('grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3', className)}>
      {filteredHosts.map((host) => (
        <HostCard
          key={host.hostName}
          host={host}
          isExpanded={expandedHost === host.hostName}
          onToggle={() =>
            setExpandedHost((prev) => (prev === host.hostName ? null : host.hostName))
          }
          timeline={getHostTimeline(host.hostName)}
        />
      ))}
    </div>
  )
}
