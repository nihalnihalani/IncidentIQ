import { cn } from '@/lib/utils'
import { useState } from 'react'

interface EsqlBlockProps {
  query: string
  className?: string
}

export function EsqlBlock({ query, className }: EsqlBlockProps) {
  const [copied, setCopied] = useState(false)

  const highlighted = query
    .replace(/\b(FROM|WHERE|SORT|LIMIT|STATS|EVAL|KEEP|DROP|FORK|FUSE|RERANK|CATEGORIZE|MATCH|LOOKUP JOIN|BY|AND|OR|AS|DESC|ASC|COUNT|AVG|MIN|MAX|SUM|NOW|METADATA|RRF|WITH|ON|IN)\b/g, '<span class="text-elastic font-bold">$1</span>')
    .replace(/\|/g, '<span class="text-agent-purple font-bold">|</span>')
    .replace(/"([^"]*)"/g, '<span class="text-agent-amber">"$1"</span>')
    .replace(/\?(\w+)/g, '<span class="text-agent-rose">?$1</span>')
    .replace(/(\d+)/g, '<span class="text-agent-blue">$1</span>')

  const handleCopy = () => {
    navigator.clipboard.writeText(query)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={cn('group relative rounded-lg border border-border bg-background overflow-hidden', className)}>
      <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
        <span className="text-[10px] font-mono text-elastic uppercase tracking-widest">ES|QL</span>
        <button
          onClick={handleCopy}
          className="text-[10px] text-text-dim hover:text-text transition-colors"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="overflow-x-auto p-3 text-xs font-mono leading-relaxed">
        <code dangerouslySetInnerHTML={{ __html: highlighted }} />
      </pre>
    </div>
  )
}
