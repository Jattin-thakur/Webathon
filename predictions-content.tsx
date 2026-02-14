"use client"

import { useState, useEffect, useRef } from "react"
import {
  RULE_FACTORS,
  DEVICE_PERFORMANCE_DATA,
  CATEGORY_PERFORMANCE_DATA,
  TIME_OF_DAY_DATA,
  FREQUENCY_DECAY_DATA,
  type ImpressionContext,
} from "@/lib/dsp/statistical-engine"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts"
import { Activity, Target, TrendingUp, Loader2, Calculator, Layers } from "lucide-react"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 shadow-lg">
      <p className="text-xs font-medium text-foreground">{label}</p>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-xs" style={{ color: entry.color }}>
          {entry.name}: {typeof entry.value === "number" ? entry.value.toFixed(4) : entry.value}
        </p>
      ))}
    </div>
  )
}

interface AnalyticsData {
  sampleMetrics: {
    context: ImpressionContext
    ctr: number
    cvr: number
    performanceScore: number
  }[]
  overallMetrics: {
    avgCTR: number
    avgCVR: number
    avgPerformanceScore: number
  }
}

export function PredictionsContent() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    import("@/lib/dsp/statistical-engine").then(({ estimateCTR, estimateCVR }) => {
      const sampleMetrics: AnalyticsData["sampleMetrics"] = []

      for (let i = 0; i < 200; i++) {
        const context: ImpressionContext = {
          userAge: 18 + Math.floor(Math.random() * 47),
          deviceType: Math.floor(Math.random() * 3),
          location: Math.floor(Math.random() * 10),
          timeOfDay: Math.floor(Math.random() * 24),
          adCategory: Math.floor(Math.random() * 10),
          historicalCTR: Math.random() * 0.3,
          frequencyCount: Math.floor(Math.random() * 15),
        }

        const ctr = estimateCTR(context)
        const cvr = estimateCVR(context)
        const performanceScore = (ctr * 0.6) + (cvr * 0.4)

        sampleMetrics.push({ context, ctr, cvr, performanceScore })
      }

      const avgCTR = sampleMetrics.reduce((s, m) => s + m.ctr, 0) / sampleMetrics.length
      const avgCVR = sampleMetrics.reduce((s, m) => s + m.cvr, 0) / sampleMetrics.length
      const avgPerformanceScore = sampleMetrics.reduce((s, m) => s + m.performanceScore, 0) / sampleMetrics.length

      setData({
        sampleMetrics,
        overallMetrics: { avgCTR, avgCVR, avgPerformanceScore },
      })
    })
  }, [])

  if (!data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Computing performance analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-6 py-6 lg:px-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold tracking-tight text-foreground">Performance Analytics</h2>
        <p className="text-sm text-muted-foreground">
          Rule-based statistical engine with historical performance data and configurable factors
        </p>
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <div className="rounded-md bg-primary/10 p-2">
              <Activity className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Avg CTR Estimate</p>
              <p className="text-2xl font-bold text-primary">{(data.overallMetrics.avgCTR * 100).toFixed(2)}%</p>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Statistical estimate across 200 impression samples.</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <div className="rounded-md bg-amber-500/10 p-2">
              <Target className="h-4 w-4 text-amber-500" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Avg CVR Estimate</p>
              <p className="text-2xl font-bold text-amber-500">{(data.overallMetrics.avgCVR * 100).toFixed(2)}%</p>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Conversion rate from rule-based calculation.</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <div className="rounded-md bg-emerald-500/10 p-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Avg Performance Score</p>
              <p className="text-2xl font-bold text-emerald-500">{(data.overallMetrics.avgPerformanceScore * 100).toFixed(2)}%</p>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{"PerformanceScore = (CTR x 0.6) + (CVR x 0.4)"}</p>
        </div>
      </div>

      {/* Device & Category performance charts */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground">Device Performance Rates</h3>
          <p className="mb-4 text-xs text-muted-foreground">
            Historical CTR/CVR by device type from aggregated data
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={DEVICE_PERFORMANCE_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 16%)" />
                <XAxis dataKey="device" tick={{ fill: "hsl(215, 14%, 55%)", fontSize: 11 }} />
                <YAxis tick={{ fill: "hsl(215, 14%, 55%)", fontSize: 11 }} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="ctr" name="CTR %" fill="hsl(199, 89%, 48%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cvr" name="CVR %" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground">Category Performance Rates</h3>
          <p className="mb-4 text-xs text-muted-foreground">
            Historical CTR/CVR by ad category
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={CATEGORY_PERFORMANCE_DATA} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 16%)" />
                <XAxis type="number" tick={{ fill: "hsl(215, 14%, 55%)", fontSize: 11 }} />
                <YAxis dataKey="category" type="category" tick={{ fill: "hsl(215, 14%, 55%)", fontSize: 10 }} width={80} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="ctr" name="CTR %" fill="hsl(199, 89%, 48%)" radius={[0, 4, 4, 0]} />
                <Bar dataKey="cvr" name="CVR %" fill="hsl(142, 71%, 45%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Time-of-day multiplier & frequency decay */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground">Time-of-Day Engagement Multiplier</h3>
          <p className="mb-4 text-xs text-muted-foreground">
            How engagement scales through the day (1.0 = baseline)
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={TIME_OF_DAY_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 16%)" />
                <XAxis dataKey="hour" tick={{ fill: "hsl(215, 14%, 55%)", fontSize: 10 }} interval={3} />
                <YAxis tick={{ fill: "hsl(215, 14%, 55%)", fontSize: 11 }} domain={[0.5, 1.5]} />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="multiplier"
                  name="Multiplier"
                  stroke="hsl(199, 89%, 48%)"
                  fill="hsl(199, 89%, 48%)"
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground">Frequency Decay Curve</h3>
          <p className="mb-4 text-xs text-muted-foreground">
            Ad fatigue: engagement drops with repeated exposures
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={FREQUENCY_DECAY_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 16%)" />
                <XAxis dataKey="impressions" tick={{ fill: "hsl(215, 14%, 55%)", fontSize: 11 }} label={{ value: "Impressions", position: "bottom", fill: "hsl(215, 14%, 55%)", fontSize: 11 }} />
                <YAxis tick={{ fill: "hsl(215, 14%, 55%)", fontSize: 11 }} domain={[0, 1.1]} />
                <Tooltip content={<ChartTooltip />} />
                <Line
                  type="monotone"
                  dataKey="factor"
                  name="Decay Factor"
                  stroke="hsl(0, 84%, 60%)"
                  strokeWidth={2}
                  dot={{ fill: "hsl(0, 84%, 60%)", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Rule factors */}
      <div className="mt-6 rounded-lg border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Statistical Rule Factors</h3>
        </div>
        <p className="mb-4 text-xs text-muted-foreground">
          The rule-based engine uses these configurable factors instead of trained model weights
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {RULE_FACTORS.map((factor, i) => (
            <div key={i} className="rounded-md bg-secondary p-3">
              <p className="text-xs font-semibold text-foreground">{factor.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">{factor.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Formulas */}
      <div className="mt-6 rounded-lg border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <Calculator className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Calculation Formulas</h3>
        </div>
        <div className="rounded-md bg-secondary p-4">
          <p className="font-mono text-xs text-foreground">
            <span className="text-muted-foreground">{"// CTR Estimation:"}</span>
            <br />
            {"CTR = BaseCTR(device) * CategoryFactor * TimeFactor * FrequencyDecay * AgeFactor * GeoFactor"}
            <br />
            {"Blended: 70% calculated + 30% historical (when available)"}
            <br />
            <br />
            <span className="text-muted-foreground">{"// CVR Estimation:"}</span>
            <br />
            {"CVR = BaseCVR(device) * CategoryFactor * FrequencyDecay * AgeFactor * GeoFactor"}
            <br />
            <br />
            <span className="text-muted-foreground">{"// Bid Calculation:"}</span>
            <br />
            {"Bid = BaseBid * PerformanceScore * BudgetFactor * StrategyMultiplier * AdaptiveAdj * BidShading"}
            <br />
            {"PerformanceScore = (CTR * 0.6) + (CVR * 0.4)"}
            <br />
            {"BudgetFactor = RemainingBudget / TotalBudget"}
          </p>
        </div>
      </div>
    </div>
  )
}
