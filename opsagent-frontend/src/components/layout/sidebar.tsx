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
} from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/incident', icon: Search, label: 'Investigation' },
  { to: '/alerts', icon: Bell, label: 'Alert Rules' },
  { to: '/blast-radius', icon: Share2, label: 'Blast Radius' },
  { to: '/agent-activity', icon: Activity, label: 'Activity Log' },
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
          <h1 className="text-xs font-bold text-elastic tracking-tight leading-tight">Infrastructure Intelligence</h1>
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
                  ? 'bg-elastic/10 text-elastic font-medium'
                  : 'text-text-muted hover:bg-surface-2 hover:text-text'
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* OpsAgent Status Footer -- 1 agent, 4 phases */}
      <div className="border-t border-border p-3">
        <div className="rounded-lg border border-border bg-surface-2 p-2.5">
          <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider mb-2">OpsAgent Phases</p>
          <div className="space-y-1.5">
            {[
              { name: 'Triage', color: '#00bfb3', status: 'Complete' },
              { name: 'Investigation', color: '#4488ff', status: 'Active' },
              { name: 'Alert', color: '#ffaa00', status: 'Matched' },
              { name: 'Action', color: '#8844ff', status: 'Executing' },
            ].map(a => (
              <div key={a.name} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-1.5 w-1.5">
                    <span
                      className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                      style={{ backgroundColor: a.color }}
                    />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ backgroundColor: a.color }} />
                  </span>
                  <span className="text-[11px] text-text-muted">{a.name}</span>
                </div>
                <span className="text-[10px] font-mono" style={{ color: a.color }}>{a.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Story context */}
        <div className="mt-2 rounded-lg border border-critical/20 bg-critical-bg p-2">
          <p className="text-[10px] font-mono text-critical">03:07 AM -- Active Incident</p>
          <p className="text-[10px] text-text-dim mt-0.5">orders-service down</p>
        </div>
      </div>
    </aside>
  )
}
