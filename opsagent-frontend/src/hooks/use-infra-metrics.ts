import { useCallback } from 'react'
import { useEsData } from './use-es-data'
import { esEsql } from '@/lib/es-client'
import {
  infraHosts as mockHosts,
  infraTimelines as mockTimelines,
} from '@/data/mock'
import type { InfraHost, InfraTimelinePoint } from '@/data/mock'
import { isLiveMode } from '@/lib/es-client'

async function fetchInfraHosts(): Promise<InfraHost[]> {
  const result = await esEsql({
    query: `FROM infra-metrics
      | WHERE @timestamp > NOW() - 3 HOURS
      | STATS
          avg_cpu = AVG(system.cpu.total.pct),
          max_cpu = MAX(system.cpu.total.pct),
          avg_mem = AVG(system.memory.used.pct),
          max_mem = MAX(system.memory.used.pct),
          avg_disk = AVG(system.disk.used.pct)
        BY host.name, service.name
      | SORT avg_cpu DESC`,
  })

  const colIdx = Object.fromEntries(result.columns.map((c, i) => [c.name, i]))
  return result.values.map((row) => ({
    hostName: row[colIdx['host.name']] as string,
    avgCpu: Math.round((row[colIdx['avg_cpu']] as number) * 100),
    maxCpu: Math.round((row[colIdx['max_cpu']] as number) * 100),
    avgMem: Math.round((row[colIdx['avg_mem']] as number) * 100),
    maxMem: Math.round((row[colIdx['max_mem']] as number) * 100),
    avgDisk: Math.round((row[colIdx['avg_disk']] as number) * 100),
    serviceName: row[colIdx['service.name']] as string,
  }))
}

export function useInfraMetrics() {
  const result = useEsData<InfraHost[]>({
    fetchFn: fetchInfraHosts,
    mockData: mockHosts,
    refreshInterval: 30000,
  })

  const getHostTimeline = useCallback(
    (hostName: string): InfraTimelinePoint[] => {
      if (isLiveMode()) {
        // In live mode, timeline would require a separate query;
        // for now fall back to mock timeline data
        return mockTimelines[hostName] ?? []
      }
      return mockTimelines[hostName] ?? []
    },
    [],
  )

  return { ...result, getHostTimeline }
}
