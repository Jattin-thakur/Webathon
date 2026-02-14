"use client"

import { useState, useEffect, useRef } from "react"
import type { FraudAlert } from "@/lib/dsp/fraud-detection"
import { Badge } from "@/components/ui/badge"
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Zap,
  Globe,
  MousePointerClick,
  Activity,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"

const SEVERITY_CONFIG = {
  critical: { color: "bg-red-500/15 text-red-400 hover:bg-red-500/15", dot: "bg-red-500" },
  high: { color: "bg-amber-500/15 text-amber-400 hover:bg-amber-500/15", dot: "bg-amber-500" },
  medium: { color: "bg-yellow-500/15 text-yellow-400 hover:bg-yellow-500/15", dot: "bg-yellow-500" },
  low: { color: "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/15", dot: "bg-emerald-500" },
}

const TYPE_ICONS: Record<FraudAlert["type"], typeof ShieldAlert> = {
  click_flood: MousePointerClick,
  ip_suspicious: Globe,
  anomaly: Activity,
  rapid_clicks: Zap,
}

const TYPE_LABELS: Record<FraudAlert["type"], string> = {
  click_flood: "Click Flood",
  ip_suspicious: "IP Suspicious",
  anomaly: "Anomaly",
  rapid_clicks: "Rapid Clicks",
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 shadow-lg">
      <p className="text-xs font-medium text-foreground">{label}</p>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-xs" style={{ color: entry.color || entry.fill }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  )
}

export function FraudContent() {
  const [alerts, setAlerts] = useState<FraudAlert[]>([])
  const [loaded, setLoaded] = useState(false)
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true
    import("@/lib/dsp/fraud-detection").then(({ generateSampleAlerts }) => {
      setAlerts(generateSampleAlerts(16))
      setLoaded(true)
    })
  }, [])

  if (!loaded) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Activity className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading fraud detection data...</p>
        </div>
      </div>
    )
  }

  const counts = { critical: 0, high: 0, medium: 0, low: 0 }
  const typeCounts: Record<string, number> = {}
  for (const alert of alerts) {
    counts[alert.severity]++
    typeCounts[alert.type] = (typeCounts[alert.type] || 0) + 1
  }
  const summary = { counts, typeCounts }

  const severityChartData = [
    { severity: "Critical", count: summary.counts.critical, fill: "hsl(0, 72%, 51%)" },
    { severity: "High", count: summary.counts.high, fill: "hsl(38, 92%, 50%)" },
    { severity: "Medium", count: summary.counts.medium, fill: "hsl(48, 96%, 53%)" },
    { severity: "Low", count: summary.counts.low, fill: "hsl(142, 71%, 45%)" },
  ]

  const typeChartData = Object.entries(summary.typeCounts).map(([type, count]) => ({
    type: TYPE_LABELS[type as FraudAlert["type"]] || type,
    count,
  }))

  const COLORS = ["hsl(199, 89%, 48%)", "hsl(38, 92%, 50%)", "hsl(142, 71%, 45%)", "hsl(0, 72%, 51%)"]

  return (
    <div className="px-6 py-6 lg:px-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold tracking-tight text-foreground">Fraud Detection</h2>
        <p className="text-sm text-muted-foreground">
          Real-time click fraud monitoring and anomaly detection
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-red-500/20 bg-card p-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-red-500" />
            <span className="text-xs font-medium text-muted-foreground">Critical</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-red-400">{summary.counts.critical}</p>
        </div>
        <div className="rounded-lg border border-amber-500/20 bg-card p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span className="text-xs font-medium text-muted-foreground">High</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-400">{summary.counts.high}</p>
        </div>
        <div className="rounded-lg border border-yellow-500/20 bg-card p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <span className="text-xs font-medium text-muted-foreground">Medium</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-yellow-400">{summary.counts.medium}</p>
        </div>
        <div className="rounded-lg border border-emerald-500/20 bg-card p-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span className="text-xs font-medium text-muted-foreground">Low</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-400">{summary.counts.low}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground">Alerts by Severity</h3>
          <p className="mb-4 text-xs text-muted-foreground">Distribution of fraud alerts by severity level</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={severityChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 16%)" />
                <XAxis dataKey="severity" tick={{ fill: "hsl(215, 14%, 55%)", fontSize: 11 }} />
                <YAxis tick={{ fill: "hsl(215, 14%, 55%)", fontSize: 11 }} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="count" name="Alerts" radius={[4, 4, 0, 0]}>
                  {severityChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground">Alerts by Type</h3>
          <p className="mb-4 text-xs text-muted-foreground">Fraud detection method breakdown</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typeChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="count"
                  nameKey="type"
                >
                  {typeChartData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: "12px", color: "hsl(215, 14%, 55%)" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Alert list */}
      <div className="mt-6 rounded-lg border border-border bg-card">
        <div className="border-b border-border px-5 py-4">
          <h3 className="text-sm font-semibold text-foreground">Active Fraud Alerts</h3>
          <p className="text-xs text-muted-foreground">{alerts.length} alerts requiring review</p>
        </div>
        <div className="divide-y divide-border">
          {alerts.map((alert, i) => {
            const Icon = TYPE_ICONS[alert.type]
            const config = SEVERITY_CONFIG[alert.severity]
            return (
              <div key={i} className="flex items-start gap-4 px-5 py-4 hover:bg-secondary/30 transition-colors">
                <div className={`mt-0.5 rounded-md bg-secondary p-2`}>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{TYPE_LABELS[alert.type]}</span>
                    <Badge className={config.color}>{alert.severity}</Badge>
                    <span className="font-mono text-xs text-muted-foreground">Score: {alert.score}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{alert.details}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span>User: <span className="font-mono text-foreground">{alert.userId}</span></span>
                    <span>IP: <span className="font-mono text-foreground">{alert.ip}</span></span>
                    <span>{new Date(alert.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
                {/* Fraud score bar */}
                <div className="hidden sm:flex sm:flex-col sm:items-end sm:gap-1">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Risk</span>
                  <div className="h-1.5 w-20 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${alert.score * 100}%`,
                        backgroundColor:
                          alert.score > 0.8 ? "hsl(0, 72%, 51%)"
                          : alert.score > 0.5 ? "hsl(38, 92%, 50%)"
                          : "hsl(142, 71%, 45%)",
                      }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
