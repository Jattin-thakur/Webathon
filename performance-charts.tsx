"use client"

import {
  AreaChart,
  Area,
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
import type { SimulationStats } from "@/lib/dsp/data-generator"

const CHART_COLORS = [
  "hsl(199, 89%, 48%)", // primary blue
  "hsl(142, 71%, 45%)", // green
  "hsl(38, 92%, 50%)",  // amber
  "hsl(0, 72%, 51%)",   // red
  "hsl(262, 83%, 58%)", // purple
]

function ChartCard({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      {children}
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 shadow-lg">
      <p className="text-xs font-medium text-foreground">{label}</p>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-xs" style={{ color: entry.color }}>
          {entry.name}: {typeof entry.value === "number" ? entry.value.toLocaleString() : entry.value}
        </p>
      ))}
    </div>
  )
}

export function BidsOverTimeChart({ stats }: { stats: SimulationStats }) {
  const currentHour = new Date().getHours()
  const lastDataPoint = stats.bidsByHour.find(d => d.hour === currentHour)
  
  return (
    <ChartCard title="Bids & Wins by Hour" description="Hourly bid volume and win distribution">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-muted-foreground">Current Hour ({currentHour}:00):</span>
          <span className="font-semibold text-foreground">{lastDataPoint?.bids || 0} bids</span>
          <span className="text-muted-foreground">•</span>
          <span className="font-semibold text-emerald-400">{lastDataPoint?.wins || 0} wins</span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-sm bg-blue-500/60" />
            <span className="text-muted-foreground">Total Bids</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-sm bg-emerald-500" />
            <span className="text-muted-foreground">Wins</span>
          </div>
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stats.bidsByHour}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 16%)" />
            <XAxis
              dataKey="hour"
              tick={{ fill: "hsl(215, 14%, 55%)", fontSize: 11 }}
              tickFormatter={(v) => `${v}h`}
            />
            <YAxis tick={{ fill: "hsl(215, 14%, 55%)", fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="bids" name="Total Bids" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} opacity={0.6} />
            <Bar dataKey="wins" name="Wins" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}

export function SpendOverTimeChart({ stats }: { stats: SimulationStats }) {
  const currentHour = new Date().getHours()
  const lastDataPoint = stats.performanceOverTime.find(d => d.time === `${String(currentHour).padStart(2, '0')}:00`)

  return (
    <ChartCard title="Spend Over Time" description="Hourly spend distribution">
      <div className="mb-2 flex items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs">
          <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-muted-foreground">Current Hour:</span>
          <span className="font-semibold text-foreground">${lastDataPoint?.spend.toFixed(2) || '0.00'}</span>
          <span className="text-muted-foreground">•</span>
          <span className="font-semibold text-blue-400">{lastDataPoint?.impressions || 0} impr</span>
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={stats.performanceOverTime}>
            <defs>
              <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS[0]} stopOpacity={0.3} />
                <stop offset="95%" stopColor={CHART_COLORS[0]} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 16%)" />
            <XAxis dataKey="time" tick={{ fill: "hsl(215, 14%, 55%)", fontSize: 11 }} />
            <YAxis tick={{ fill: "hsl(215, 14%, 55%)", fontSize: 11 }} tickFormatter={(v) => `${v}`} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="spend"
              name="Spend ($)"
              stroke={CHART_COLORS[0]}
              fill="url(#spendGradient)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}

export function DeviceBreakdownChart({ stats }: { stats: SimulationStats }) {
  const data = stats.bidsByDevice.map((d, i) => ({
    ...d,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }))

  const totalBids = data.reduce((sum, d) => sum + d.bids, 0)
  const topDevice = data.reduce((max, d) => d.bids > max.bids ? d : max, data[0])

  return (
    <ChartCard title="Bids by Device" description="Device type distribution">
      <div className="mb-2 flex items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs">
          <div className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
          <span className="text-muted-foreground">Top Device:</span>
          <span className="font-semibold text-foreground">{topDevice?.device}</span>
          <span className="text-muted-foreground">•</span>
          <span className="font-semibold text-purple-400">{((topDevice?.bids / totalBids) * 100).toFixed(1)}%</span>
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={4}
              dataKey="bids"
              nameKey="device"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: "12px", color: "hsl(215, 14%, 55%)" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}

export function CategoryPerformanceChart({ stats }: { stats: SimulationStats }) {
  const topCategory = stats.bidsByCategory.reduce((max, cat) =>
    cat.ctr > max.ctr ? cat : max,
    stats.bidsByCategory[0] || { category: 'N/A', ctr: 0, bids: 0, wins: 0 }
  )

  return (
    <ChartCard title="CTR by Ad Category" description="Predicted CTR performance per category">
      <div className="mb-2 flex items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs">
          <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-muted-foreground">Best CTR:</span>
          <span className="font-semibold text-foreground">{topCategory.category}</span>
          <span className="text-muted-foreground">•</span>
          <span className="font-semibold text-amber-400">{topCategory.ctr.toFixed(2)}%</span>
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stats.bidsByCategory} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 16%)" />
            <XAxis
              type="number"
              tick={{ fill: "hsl(215, 14%, 55%)", fontSize: 11 }}
              tickFormatter={(v) => `${v}%`}
            />
            <YAxis
              dataKey="category"
              type="category"
              tick={{ fill: "hsl(215, 14%, 55%)", fontSize: 11 }}
              width={80}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="ctr" name="CTR (%)" fill={CHART_COLORS[2]} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}

export function BudgetUtilizationChart({ stats }: { stats: SimulationStats }) {
  return (
    <ChartCard title="Budget Utilization" description="Campaign budget spend progress">
      <div className="space-y-3">
        {stats.budgetUtilization.map((item) => (
          <div key={item.campaignId}>
            <div className="flex items-center justify-between text-xs">
              <span className="truncate text-foreground">{item.name}</span>
              <span className="text-muted-foreground">{item.utilization}%</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(item.utilization, 100)}%`,
                  backgroundColor:
                    item.utilization > 90
                      ? CHART_COLORS[3]
                      : item.utilization > 70
                      ? CHART_COLORS[2]
                      : CHART_COLORS[0],
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </ChartCard>
  )
}
