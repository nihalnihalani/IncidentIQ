import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppLayout } from '@/components/layout/app-layout'
import { DashboardPage } from '@/pages/dashboard'
import { IncidentPage } from '@/pages/incident'
import { AlertsPage } from '@/pages/alerts'
import { BlastRadiusPage } from '@/pages/blast-radius'
import { AgentActivityPage } from '@/pages/agent-activity'
import { DemoPage } from '@/pages/demo'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/incident" element={<IncidentPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/blast-radius" element={<BlastRadiusPage />} />
          <Route path="/agent-activity" element={<AgentActivityPage />} />
          <Route path="/demo" element={<DemoPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
