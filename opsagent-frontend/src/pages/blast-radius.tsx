import { TopBar } from '@/components/layout/top-bar'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { blastRadiusNodes, blastRadiusEdges } from '@/data/mock'
import { Share2, RotateCcw } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'

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

// Define cascade order: epicenter first, then adjacent, then further out
const cascadeWaves: string[][] = [
  ['orders'],              // Wave 0: epicenter (already down)
  ['pg-main', 'payment'], // Wave 1: direct dependencies
  ['cart', 'api-gw'],     // Wave 2: secondary cascade
  // Everything else stays healthy
]

export function BlastRadiusPage() {
  const [revealedWave, setRevealedWave] = useState(-1)
  const [isAnimating, setIsAnimating] = useState(true)

  const runCascade = useCallback(() => {
    setRevealedWave(-1)
    setIsAnimating(true)
    cascadeWaves.forEach((_, i) => {
      setTimeout(() => setRevealedWave(i), 800 + i * 1200)
    })
    setTimeout(() => setIsAnimating(false), 800 + cascadeWaves.length * 1200 + 500)
  }, [])

  useEffect(() => {
    runCascade()
  }, [runCascade])

  const getNodeStatus = (nodeId: string, originalStatus: string) => {
    if (!isAnimating && revealedWave >= cascadeWaves.length - 1) return originalStatus
    // Check which wave this node is in
    for (let w = 0; w < cascadeWaves.length; w++) {
      if (cascadeWaves[w].includes(nodeId)) {
        return revealedWave >= w ? originalStatus : 'healthy'
      }
    }
    return originalStatus
  }

  const getNodeOpacity = (nodeId: string) => {
    for (let w = 0; w < cascadeWaves.length; w++) {
      if (cascadeWaves[w].includes(nodeId) && revealedWave === w) {
        return true // Just revealed - should pulse
      }
    }
    return false
  }

  const affectedCount = blastRadiusNodes.filter(n => {
    const status = getNodeStatus(n.id, n.status)
    return status !== 'healthy'
  }).length

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
            <div className="flex-1">
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
            <button
              onClick={runCascade}
              className="flex items-center gap-1.5 rounded-lg border border-elastic/30 bg-elastic/10 px-3 py-1.5 text-xs font-medium text-elastic hover:bg-elastic/20 transition-colors shrink-0"
            >
              <RotateCcw className="h-3 w-3" />
              Replay Cascade
            </button>
          </div>
        </Card>

        {/* Graph Visualization */}
        <Card className="relative overflow-hidden">
          <CardHeader>
            <CardTitle>Live Blast Radius Map</CardTitle>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                {(['down', 'degraded', 'healthy'] as const).map(s => (
                  <div key={s} className="flex items-center gap-1.5 text-[10px]">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: statusColor[s] }} />
                    <span className="text-text-dim capitalize">{s}</span>
                  </div>
                ))}
              </div>
              {isAnimating && (
                <Badge variant="critical" pulse>
                  Propagating... {affectedCount}/{blastRadiusNodes.length} affected
                </Badge>
              )}
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

                  const targetStatus = getNodeStatus(target.id, target.status)
                  const sourceStatus = getNodeStatus(source.id, source.status)
                  const isAffected = targetStatus !== 'healthy' || sourceStatus !== 'healthy'

                  return (
                    <g key={i}>
                      <motion.line
                        x1={source.x}
                        y1={source.y}
                        x2={target.x}
                        y2={target.y}
                        stroke={isAffected ? '#ff444460' : '#2a2a3e'}
                        strokeWidth={Math.max(1, edge.weight * 3)}
                        strokeDasharray={isAffected ? undefined : '4 4'}
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
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

                {/* Shockwave rings for newly affected nodes */}
                {blastRadiusNodes.map(node => {
                  const justRevealed = getNodeOpacity(node.id)
                  const currentStatus = getNodeStatus(node.id, node.status)
                  if (!justRevealed || currentStatus === 'healthy') return null
                  const color = statusColor[currentStatus]
                  return (
                    <motion.circle
                      key={`shockwave-${node.id}`}
                      cx={node.x}
                      cy={node.y}
                      r={20}
                      fill="none"
                      stroke={color}
                      strokeWidth={2}
                      initial={{ r: 20, opacity: 0.8 }}
                      animate={{ r: 60, opacity: 0 }}
                      transition={{ duration: 1.2, ease: 'easeOut' }}
                    />
                  )
                })}

                {/* Nodes */}
                {blastRadiusNodes.map(node => {
                  const currentStatus = getNodeStatus(node.id, node.status)
                  const color = statusColor[currentStatus]
                  const justRevealed = getNodeOpacity(node.id)
                  return (
                    <g key={node.id}>
                      {/* Glow for affected nodes */}
                      {currentStatus !== 'healthy' && (
                        <motion.circle
                          cx={node.x}
                          cy={node.y}
                          r={28}
                          fill={`${color}15`}
                          initial={justRevealed ? { r: 10, opacity: 0 } : false}
                          animate={{ r: 28, opacity: 1 }}
                          transition={{ duration: 0.5 }}
                          className={currentStatus === 'down' ? 'animate-pulse-glow' : undefined}
                        />
                      )}
                      {/* Node circle */}
                      <motion.circle
                        cx={node.x}
                        cy={node.y}
                        r={20}
                        fill="#12121a"
                        stroke={color}
                        strokeWidth={2}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.4, delay: 0.1 }}
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
                      <motion.text
                        x={node.x}
                        y={node.y + 46}
                        textAnchor="middle"
                        fill={color}
                        fontSize="8"
                        fontFamily="monospace"
                        initial={justRevealed ? { opacity: 0 } : false}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        style={{ textTransform: 'uppercase' }}
                      >
                        {currentStatus.toUpperCase()}
                      </motion.text>
                    </g>
                  )
                })}
              </svg>
            </div>
          </CardContent>
        </Card>

        {/* Impact Summary - animate counters */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Discovered Root Cause</p>
            <p className="text-sm font-bold text-critical font-mono">payment-service &rarr; orders-service</p>
            <p className="text-xs text-text-dim mt-1">Payment DB connection pool exhausted, cascading to orders</p>
          </Card>
          <Card>
            <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Affected Services</p>
            <motion.p
              className="text-sm font-bold text-high font-mono"
              key={affectedCount}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              {affectedCount} / {blastRadiusNodes.length} nodes
            </motion.p>
            <p className="text-xs text-text-dim mt-1">4 degraded, 1 down, 2 at risk</p>
          </Card>
          <Card>
            <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Critical Path</p>
            <p className="text-sm font-bold text-agent-blue font-mono">
              api-gw {"\u2192"} payment {"\u2192"} checkout
            </p>
            <p className="text-xs text-text-dim mt-1">Highest latency chain: 5.2s total</p>
          </Card>
        </div>
      </div>
    </div>
  )
}
