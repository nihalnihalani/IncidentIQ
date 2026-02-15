import { TopBar } from '@/components/layout/top-bar'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { blastRadiusNodes, blastRadiusEdges } from '@/data/mock'
import { Share2 } from 'lucide-react'

const statusColor: Record<string, string> = {
  healthy: '#44cc44',
  degraded: '#ff8c00',
  down: '#ff4444',
}

const typeIcon: Record<string, string> = {
  service: '\u2B22',
  database: '\u25C6',
  queue: '\u25B6',
  cache: '\u25CF',
  gateway: '\u2B21',
}

export function BlastRadiusPage() {
  return (
    <div className="min-h-screen">
      <TopBar title="Blast Radius Visualization" />

      <div className="p-6 space-y-6">
        {/* Header */}
        <Card glow>
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-agent-blue/15">
              <Share2 className="h-5 w-5 text-agent-blue" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-bold text-text">Graph Explore API -- Incident Propagation</h3>
                <Badge color="#4488ff">Hidden Gem</Badge>
              </div>
              <p className="text-xs text-text-muted leading-relaxed">
                The Graph Explore API discovers relationships between terms without predefined ontologies.
                This visualization shows how the payment-service failure cascades across the infrastructure,
                revealing the blast radius in real-time.
              </p>
            </div>
          </div>
        </Card>

        {/* Graph Visualization */}
        <Card className="relative overflow-hidden">
          <CardHeader>
            <CardTitle>Live Blast Radius Map</CardTitle>
            <div className="flex items-center gap-3">
              {(['down', 'degraded', 'healthy'] as const).map(s => (
                <div key={s} className="flex items-center gap-1.5 text-[10px]">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: statusColor[s] }} />
                  <span className="text-text-dim capitalize">{s}</span>
                </div>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative h-[520px] w-full">
              <svg width="100%" height="100%" viewBox="0 0 800 520">
                {/* Edges */}
                {blastRadiusEdges.map((edge, i) => {
                  const source = blastRadiusNodes.find(n => n.id === edge.source)
                  const target = blastRadiusNodes.find(n => n.id === edge.target)
                  if (!source || !target) return null

                  const targetNode = blastRadiusNodes.find(n => n.id === edge.target)
                  const isAffected = targetNode && targetNode.status !== 'healthy'

                  return (
                    <g key={i}>
                      <line
                        x1={source.x}
                        y1={source.y}
                        x2={target.x}
                        y2={target.y}
                        stroke={isAffected ? '#ff444460' : '#2a2a3e'}
                        strokeWidth={Math.max(1, edge.weight * 3)}
                        strokeDasharray={isAffected ? undefined : '4 4'}
                      />
                      {isAffected && (
                        <line
                          x1={source.x}
                          y1={source.y}
                          x2={target.x}
                          y2={target.y}
                          stroke="#ff444430"
                          strokeWidth={Math.max(2, edge.weight * 6)}
                          className="animate-pulse-glow"
                        />
                      )}
                      {/* Latency label */}
                      <text
                        x={(source.x + target.x) / 2}
                        y={(source.y + target.y) / 2 - 6}
                        textAnchor="middle"
                        fill="#555570"
                        fontSize="9"
                        fontFamily="monospace"
                      >
                        {edge.latency}ms
                      </text>
                    </g>
                  )
                })}

                {/* Nodes */}
                {blastRadiusNodes.map(node => {
                  const color = statusColor[node.status]
                  return (
                    <g key={node.id}>
                      {/* Glow for affected nodes */}
                      {node.status !== 'healthy' && (
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={28}
                          fill={`${color}15`}
                          className={node.status === 'down' ? 'animate-pulse-glow' : undefined}
                        />
                      )}
                      {/* Node circle */}
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={20}
                        fill="#12121a"
                        stroke={color}
                        strokeWidth={2}
                      />
                      {/* Type icon */}
                      <text
                        x={node.x}
                        y={node.y + 1}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill={color}
                        fontSize="14"
                      >
                        {typeIcon[node.type]}
                      </text>
                      {/* Label */}
                      <text
                        x={node.x}
                        y={node.y + 34}
                        textAnchor="middle"
                        fill="#e8e8f0"
                        fontSize="10"
                        fontWeight="600"
                      >
                        {node.name}
                      </text>
                      {/* Status label */}
                      <text
                        x={node.x}
                        y={node.y + 46}
                        textAnchor="middle"
                        fill={color}
                        fontSize="8"
                        fontFamily="monospace"
                        style={{ textTransform: 'uppercase' }}
                      >
                        {node.status.toUpperCase()}
                      </text>
                    </g>
                  )
                })}
              </svg>
            </div>
          </CardContent>
        </Card>

        {/* Impact Summary */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Discovered Root Cause</p>
            <p className="text-sm font-bold text-critical font-mono">payment-service &rarr; orders-service</p>
            <p className="text-xs text-text-dim mt-1">Payment DB connection pool exhausted, cascading to orders</p>
          </Card>
          <Card>
            <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Affected Services</p>
            <p className="text-sm font-bold text-high font-mono">7 / 10 nodes</p>
            <p className="text-xs text-text-dim mt-1">4 degraded, 1 down, 2 at risk</p>
          </Card>
          <Card>
            <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Critical Path</p>
            <p className="text-sm font-bold text-agent-blue font-mono">
              api-gw \u2192 payment \u2192 checkout
            </p>
            <p className="text-xs text-text-dim mt-1">Highest latency chain: 5.2s total</p>
          </Card>
        </div>
      </div>
    </div>
  )
}
