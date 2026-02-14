"use client"

import {
  TrendingUp,
  TrendingDown,
  MousePointerClick,
  DollarSign,
  Target,
  BarChart3,
  Eye,
  Repeat,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { SimulationStats } from "@/lib/dsp/data-generator"

interface KPICardProps {
  title: string
  value: string
  subtitle?: string
  trend?: "up" | "down" | "neutral"
  trendValue?: string
  icon: React.ReactNode
  accentColor?: string
}

function KPICard({ title, value, subtitle, trend, trendValue, icon, accentColor }: KPICardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
          <p className={cn("mt-2 text-2xl font-bold tracking-tight", accentColor || "text-foreground")}>{value}</p>
          {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="rounded-md bg-secondary p-2.5">{icon}</div>
      </div>
      {trend && trendValue && (
        <div className="mt-3 flex items-center gap-1.5">
          {trend === "up" ? (
            <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
          ) : trend === "down" ? (
            <TrendingDown className="h-3.5 w-3.5 text-red-500" />
          ) : null}
          <span
            className={cn(
              "text-xs font-medium",
              trend === "up" ? "text-emerald-500" : trend === "down" ? "text-red-500" : "text-muted-foreground"
            )}
          >
            {trendValue}
          </span>
          <span className="text-xs text-muted-foreground">vs last period</span>
        </div>
      )}
    </div>
  )
}

export function KPICards({ stats }: { stats: SimulationStats }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KPICard
        title="Win Rate"
        value={`${stats.winRate.toFixed(2)}%`}
        subtitle={`${stats.totalWins} / ${stats.totalBids} bids`}
        trend="up"
        trendValue="+2.4%"
        icon={<Target className="h-4 w-4 text-primary" />}
        accentColor="text-primary"
      />
      <KPICard
        title="Total Spend"
        value={`$${stats.totalSpend.toFixed(2)}`}
        subtitle={`Avg win price: $${stats.avgWinPrice.toFixed(2)}`}
        trend="up"
        trendValue="+8.1%"
        icon={<DollarSign className="h-4 w-4 text-emerald-500" />}
        accentColor="text-emerald-500"
      />
      <KPICard
        title="CTR"
        value={`${stats.ctr.toFixed(2)}%`}
        subtitle={`${stats.clicks} clicks / ${stats.impressions} imps`}
        trend="up"
        trendValue="+1.2%"
        icon={<MousePointerClick className="h-4 w-4 text-amber-500" />}
        accentColor="text-amber-500"
      />
      <KPICard
        title="ROI"
        value={`${stats.roi.toFixed(2)}%`}
        subtitle={`${stats.conversions} conversions`}
        trend="up"
        trendValue="+5.7%"
        icon={<BarChart3 className="h-4 w-4 text-primary" />}
        accentColor="text-primary"
      />
      <KPICard
        title="Impressions"
        value={stats.impressions.toLocaleString()}
        subtitle="Total ad views served"
        trend="up"
        trendValue="+12.3%"
        icon={<Eye className="h-4 w-4 text-muted-foreground" />}
      />
      <KPICard
        title="CVR"
        value={`${(stats.cvr || 0).toFixed(2)}%`}
        subtitle={`${stats.conversions} conversions from ${stats.clicks} clicks`}
        trend="down"
        trendValue="-0.3%"
        icon={<Repeat className="h-4 w-4 text-muted-foreground" />}
      />
      <KPICard
        title="Avg Bid Price"
        value={`$${stats.avgBidPrice.toFixed(2)}`}
        subtitle="Per impression"
        trend="neutral"
        trendValue="0.0%"
        icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
      />
      <KPICard
        title="Avg CTR (Estimated)"
        value={`${stats.avgCTR.toFixed(2)}%`}
        subtitle="Statistical estimate"
        trend="up"
        trendValue="+0.8%"
        icon={<BarChart3 className="h-4 w-4 text-muted-foreground" />}
      />
    </div>
  )
}
