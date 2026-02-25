import { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TopBar } from '@/components/layout/top-bar'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EsqlBlock } from '@/components/ui/esql-block'
import { DotPattern } from '@/components/ui/dot-pattern'
import { useChat } from '@/hooks/use-chat'
import type { ChatMessage, IncidentStatus } from '@/hooks/use-chat'
import { quickActions, agentColors, agentLabels } from '@/data/mock'
import type { AgentName } from '@/data/mock'
import {
  Send,
  Bot,
  User,
  Zap,
  Search,
  Activity,
  GitBranch,
  BookOpen,
  AlertTriangle,
  FileText,
  MessageSquare,
} from 'lucide-react'

const iconMap: Record<string, typeof Search> = {
  Search, Activity, GitBranch, BookOpen, AlertTriangle, FileText,
}

const statusConfig: Record<IncidentStatus, { label: string; color: string }> = {
  monitoring: { label: 'MONITORING', color: '#44cc44' },
  investigating: { label: 'INVESTIGATING', color: '#ffaa00' },
  critical: { label: 'INCIDENT ACTIVE', color: '#ff4444' },
}

function renderContent(content: string) {
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  let inCodeBlock = false
  let codeLines: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (line.startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre key={`code-${i}`} className="my-2 overflow-x-auto rounded-md bg-background p-3 text-xs font-mono leading-relaxed text-text-muted">
            {codeLines.join('\n')}
          </pre>
        )
        codeLines = []
        inCodeBlock = false
      } else {
        inCodeBlock = true
      }
      continue
    }

    if (inCodeBlock) {
      codeLines.push(line)
      continue
    }

    if (line.startsWith('## ')) {
      elements.push(
        <div key={i} className="mt-3 mb-1.5 text-sm font-bold text-text">
          {processInline(line.slice(3))}
        </div>
      )
    } else if (line.startsWith('### ')) {
      elements.push(
        <div key={i} className="mt-2 mb-1 text-xs font-bold text-elastic">
          {processInline(line.slice(4))}
        </div>
      )
    } else if (line === '---') {
      elements.push(<hr key={i} className="my-2 border-border" />)
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(
        <div key={i} className="pl-3 text-xs leading-relaxed">
          <span className="text-text-dim mr-1.5">-</span>
          {processInline(line.slice(2))}
        </div>
      )
    } else if (line.trim() === '') {
      elements.push(<div key={i} className="h-1.5" />)
    } else {
      elements.push(
        <div key={i} className="text-xs leading-relaxed">
          {processInline(line)}
        </div>
      )
    }
  }

  if (inCodeBlock && codeLines.length > 0) {
    elements.push(
      <pre key="code-final" className="my-2 overflow-x-auto rounded-md bg-background p-3 text-xs font-mono leading-relaxed text-text-muted">
        {codeLines.join('\n')}
      </pre>
    )
  }

  return elements
}

function processInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = []
  let remaining = text
  let key = 0

  while (remaining.length > 0) {
    // Bold
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/)
    // Inline code
    const codeMatch = remaining.match(/`([^`]+)`/)

    // Find which match comes first
    const candidates: { index: number; length: number; node: React.ReactNode }[] = []

    if (boldMatch && boldMatch.index !== undefined) {
      candidates.push({
        index: boldMatch.index,
        length: boldMatch[0].length,
        node: <strong key={`b-${key++}`} className="font-bold text-text">{boldMatch[1]}</strong>,
      })
    }

    if (codeMatch && codeMatch.index !== undefined) {
      candidates.push({
        index: codeMatch.index,
        length: codeMatch[0].length,
        node: <code key={`c-${key++}`} className="rounded bg-background px-1.5 py-0.5 font-mono text-[11px] text-elastic">{codeMatch[1]}</code>,
      })
    }

    if (candidates.length === 0) {
      parts.push(remaining)
      break
    }

    candidates.sort((a, b) => a.index - b.index)
    const first = candidates[0]

    if (first.index > 0) {
      parts.push(remaining.slice(0, first.index))
    }
    parts.push(first.node)
    remaining = remaining.slice(first.index + first.length)
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>
}

function AgentBadge({ agent }: { agent: AgentName }) {
  return (
    <Badge color={agentColors[agent]} className="text-[10px]">
      <Bot className="h-2.5 w-2.5" />
      {agentLabels[agent]}
    </Badge>
  )
}

function StatusBadge({ status }: { status: IncidentStatus }) {
  const config = statusConfig[status]
  return (
    <Badge color={config.color} pulse={status !== 'monitoring'} className="text-[10px]">
      {config.label}
    </Badge>
  )
}

function ToolCallMessage({ message }: { message: ChatMessage }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="ml-10 mb-2"
    >
      <div className="rounded-lg border border-elastic/20 bg-elastic-bg px-3 py-2">
        <div className="flex items-center gap-2 mb-1.5">
          <Zap className="h-3 w-3 text-elastic" />
          {message.agent && <AgentBadge agent={message.agent} />}
          {message.toolName && (
            <span className="font-mono text-[10px] text-elastic">
              {message.toolName}
            </span>
          )}
        </div>
        <p className="text-[11px] text-text-muted">{message.content}</p>
        {message.toolQuery && (
          <EsqlBlock query={message.toolQuery} className="mt-2" />
        )}
      </div>
    </motion.div>
  )
}

function AssistantMessage({ message }: { message: ChatMessage }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex gap-3 mb-4"
    >
      <div
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
        style={{
          backgroundColor: message.agent ? `${agentColors[message.agent]}20` : '#00bfb320',
          color: message.agent ? agentColors[message.agent] : '#00bfb3',
        }}
      >
        <Bot className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1.5">
          {message.agent && <AgentBadge agent={message.agent} />}
          <span className="text-[10px] font-mono text-text-dim">
            {new Date(message.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
          </span>
        </div>
        <div className="rounded-lg border border-border bg-surface-2 p-3">
          {renderContent(message.content)}
        </div>
      </div>
    </motion.div>
  )
}

function UserMessage({ message }: { message: ChatMessage }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex gap-3 mb-4 flex-row-reverse"
    >
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-agent-blue/20 text-agent-blue">
        <User className="h-3.5 w-3.5" />
      </div>
      <div className="max-w-[75%]">
        <div className="flex items-center justify-end gap-2 mb-1.5">
          <span className="text-[10px] font-mono text-text-dim">
            {new Date(message.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
          </span>
        </div>
        <div className="rounded-lg border border-agent-blue/20 bg-agent-blue/5 p-3">
          <p className="text-xs leading-relaxed text-text">{message.content}</p>
        </div>
      </div>
    </motion.div>
  )
}

function TypingIndicator({ agent }: { agent: AgentName | null }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className="flex gap-3 mb-4"
    >
      <div
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
        style={{
          backgroundColor: agent ? `${agentColors[agent]}20` : '#00bfb320',
          color: agent ? agentColors[agent] : '#00bfb3',
        }}
      >
        <Bot className="h-3.5 w-3.5" />
      </div>
      <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-4 py-2.5">
        <div className="flex gap-1">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-elastic animate-bounce"
              style={{ animationDelay: `${i * 0.15}s`, animationDuration: '1s' }}
            />
          ))}
        </div>
        <span className="text-[11px] text-text-muted">
          {agent ? `${agentLabels[agent]} is working...` : 'Investigating...'}
        </span>
      </div>
    </motion.div>
  )
}

export function ChatPage() {
  const { messages, isLoading, activeAgent, incidentStatus, sendMessage } = useChat()
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const handleSend = () => {
    if (!input.trim() || isLoading) return
    sendMessage(input)
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleQuickAction = (prompt: string) => {
    if (isLoading) return
    sendMessage(prompt)
  }

  return (
    <div className="relative flex h-screen flex-col">
      <DotPattern className="[mask-image:radial-gradient(ellipse_at_top,white_20%,transparent_70%)] opacity-30" />

      <TopBar title="Agent Chat" />

      <div className="relative flex flex-1 overflow-hidden">
        {/* Main Chat Area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Chat Header */}
          <div className="flex items-center justify-between border-b border-border px-6 py-2.5">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-elastic/15">
                <MessageSquare className="h-4 w-4 text-elastic" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-text">OpsAgent Chat</h3>
                <p className="text-[10px] text-text-dim font-mono">multi-agent incident response</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={incidentStatus} />
              {activeAgent && (
                <Badge color={agentColors[activeAgent]} pulse className="text-[10px]">
                  <Bot className="h-2.5 w-2.5" />
                  {agentLabels[activeAgent]}
                </Badge>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <AnimatePresence mode="popLayout">
              {messages.map(msg => {
                if (msg.role === 'tool') return <ToolCallMessage key={msg.id} message={msg} />
                if (msg.role === 'user') return <UserMessage key={msg.id} message={msg} />
                return <AssistantMessage key={msg.id} message={msg} />
              })}
            </AnimatePresence>

            <AnimatePresence>
              {isLoading && <TypingIndicator agent={activeAgent} />}
            </AnimatePresence>

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-border bg-surface/80 backdrop-blur-sm px-6 py-3">
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe the incident or ask a question..."
                disabled={isLoading}
                aria-label="Incident message"
                className="flex-1 rounded-lg border border-border bg-surface-2 px-4 py-2.5 text-xs text-text placeholder:text-text-dim outline-none transition-colors focus:border-elastic/50 disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                aria-label="Send message"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-elastic/15 text-elastic transition-all hover:bg-elastic/25 disabled:opacity-30 disabled:hover:bg-elastic/15"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-center text-[10px] text-text-dim font-mono">
              OpsAgent uses Elastic Agent Builder with ES|QL tools and multi-agent workflows
            </p>
          </div>
        </div>

        {/* Quick Actions Sidebar */}
        <aside className="hidden w-64 shrink-0 flex-col border-l border-border bg-surface lg:flex">
          <div className="border-b border-border px-4 py-3">
            <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest">Quick Actions</p>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            <div className="space-y-1">
              {quickActions.map((action, idx) => {
                const Icon = iconMap[action.icon] || Search
                return (
                  <button
                    key={idx}
                    onClick={() => handleQuickAction(action.prompt)}
                    disabled={isLoading}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs text-text-muted transition-all hover:bg-surface-2 hover:text-text disabled:opacity-50"
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0 text-elastic" />
                    <span>{action.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Agent Pipeline */}
          <div className="border-t border-border p-3">
            <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest mb-2">Agent Pipeline</p>
            <div className="space-y-1.5">
              {([
                { agent: 'triage-agent' as AgentName, tools: 'hybrid_rag_search' },
                { agent: 'investigation-agent' as AgentName, tools: 'significant_terms, pipeline aggs' },
                { agent: 'postmortem-agent' as AgentName, tools: 'report, slack, jira' },
              ]).map((a, i) => (
                <div key={a.agent}>
                  <div className="flex items-center gap-2">
                    <div
                      className="flex h-5 w-5 items-center justify-center rounded"
                      style={{ backgroundColor: `${agentColors[a.agent]}20`, color: agentColors[a.agent] }}
                    >
                      <Bot className="h-3 w-3" />
                    </div>
                    <div className="min-w-0">
                      <span className="block text-[11px] font-medium" style={{ color: agentColors[a.agent] }}>
                        {agentLabels[a.agent]}
                      </span>
                      <span className="block text-[9px] text-text-dim truncate">{a.tools}</span>
                    </div>
                  </div>
                  {i < 2 && (
                    <div className="ml-2.5 flex h-3 items-center">
                      <div className="h-full w-px bg-border" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Live Metrics Snapshot */}
          <div className="border-t border-border p-3">
            <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest mb-2">Live Metrics</p>
            <div className="space-y-1.5">
              <Card className="!p-2" spotlight={false}>
                <div className="text-[9px] text-text-dim uppercase tracking-wide">db-primary-01 CPU</div>
                <div className="text-sm font-bold font-mono text-critical">94.2%</div>
              </Card>
              <Card className="!p-2" spotlight={false}>
                <div className="text-[9px] text-text-dim uppercase tracking-wide">Error Rate (5m)</div>
                <div className="text-sm font-bold font-mono text-critical">34.7%</div>
              </Card>
              <Card className="!p-2" spotlight={false}>
                <div className="text-[9px] text-text-dim uppercase tracking-wide">Affected Services</div>
                <div className="text-sm font-bold font-mono text-high">5</div>
              </Card>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
