import { cn } from '@/lib/utils'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Search,
  Bell,
  Share2,
  Activity,
  Play,
  Shield,
  Bot,
  MessageSquare,
  BookOpen,
  Code2,
} from 'lucide-react'
import { GlowingStarsBackground } from '@/components/ui/glowing-stars-background'
import { isLiveMode } from '@/lib/es-client'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/incident', icon: Search, label: 'Investigation' },
  { to: '/alerts', icon: Bell, label: 'Alert Rules' },
  { to: '/blast-radius', icon: Share2, label: 'Blast Radius' },
  { to: '/agent-activity', icon: Activity, label: 'Activity Log' },
  { to: '/chat', icon: MessageSquare, label: 'Agent Chat' },
  { to: '/runbooks', icon: BookOpen, label: 'Runbooks' },
  { to: '/esql-showcase', icon: Code2, label: 'ES|QL Showcase' },
  { to: '/demo', icon: Play, label: 'Demo Mode' },
]

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-border bg-surface">
      {/* Logo */}
      <div className="flex items-center gap-2.5 border-b border-border px-4 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-elastic/15">
          <Shield className="h-4 w-4 text-elastic" />
        </div>
        <div>
          <h1 className="text-xs font-bold text-text tracking-tight leading-tight">Self-Healing</h1>
          <h1 className="text-xs font-bold gradient-text tracking-tight leading-tight">Infrastructure Intelligence</h1>
          <p className="text-[9px] text-text-dim font-mono mt-0.5">Elastic Agent Builder</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 p-2">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all duration-150',
                isActive
                  ? 'bg-elastic/10 text-elastic font-medium glow-elastic'
                  : 'text-text-muted hover:bg-surface-2 hover:text-text'
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Multi-Agent Status Footer */}
      <div className="border-t border-border p-3">
        <div className="relative overflow-hidden rounded-lg border border-border bg-surface-2 p-2.5">
          <GlowingStarsBackground starCount={20} className="opacity-40" />
          <div className="relative">
            <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider mb-2">Multi-Agent System</p>
            <div className="space-y-1.5">
              {[
                { name: 'Triage Agent', color: '#00bfb3', status: 'Complete', icon: '1' },
                { name: 'Investigation Agent', color: '#4488ff', status: 'Active', icon: '2' },
                { name: 'PostMortem Agent', color: '#8844ff', status: 'Queued', icon: '3' },
              ].map(a => (
                <div key={a.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div
                      className="flex h-4 w-4 items-center justify-center rounded text-[8px] font-bold"
                      style={{ backgroundColor: `${a.color}20`, color: a.color }}
                    >
                      <Bot className="h-2.5 w-2.5" />
                    </div>
                    <span className="text-[11px] text-text-muted">{a.name}</span>
                  </div>
                  <span
                    className={cn(
                      'text-[10px] font-mono',
                      a.status === 'Active' && 'animate-pulse-glow'
                    )}
                    style={{ color: a.color }}
                  >
                    {a.status}
                  </span>
                </div>
              ))}
            </div>
            {/* Workflow orchestration line */}
            <div className="mt-2 flex items-center justify-center gap-1">
              <span className="text-[8px] font-mono text-text-dim">workflow:</span>
              <span className="text-[8px] font-mono text-elastic">triage</span>
              <span className="text-[8px] text-text-dim">{"\u2192"}</span>
              <span className="text-[8px] font-mono text-agent-blue">investigate</span>
              <span className="text-[8px] text-text-dim">{"\u2192"}</span>
              <span className="text-[8px] font-mono text-agent-purple">postmortem</span>
            </div>
          </div>
        </div>

        {/* Story context */}
        <div className="mt-2 relative overflow-hidden rounded-lg border border-critical/20 bg-critical-bg p-2">
          <p className="text-[10px] font-mono text-critical">03:07 AM -- Active Incident</p>
          <p className="text-[10px] text-text-dim mt-0.5">order-service down</p>
        </div>
      </div>

      <div className="mt-auto p-3 border-t border-border">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${isLiveMode() ? 'bg-low animate-pulse' : 'bg-text-dim'}`} />
          <span className="text-[10px] text-text-dim font-mono">
            {isLiveMode() ? 'Live: Elasticsearch' : 'Mock Data Mode'}
          </span>
        </div>
      </div>
    </aside>
  )
}
