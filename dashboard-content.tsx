"use client"

import { useState, useEffect, useRef } from "react"
import { type LiveMetrics, getLiveDataStream } from "@/lib/dsp/live-data-stream"
import { KPICards } from "./kpi-cards"
import {
  BidsOverTimeChart,
  SpendOverTimeChart,
  DeviceBreakdownChart,
  CategoryPerformanceChart,
} from "./performance-charts"
import { AuctionLog } from "./auction-log"
import { Clock, Loader2, Activity, Pause, Play, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function DashboardContent() {
  const [metrics, setMetrics] = useState<LiveMetrics | null>(null)
  const [isLive, setIsLive] = useState(true)
  const streamRef = useRef<ReturnType<typeof getLiveDataStream> | null>(null)
  const unsubscribeRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    // Initialize stream on client side only
    if (typeof window === "undefined") return

    const stream = getLiveDataStream()
    streamRef.current = stream

    // Subscribe to updates
    const unsubscribe = stream.subscribe((newMetrics) => {
      setMetrics(newMetrics)
    })
    unsubscribeRef.current = unsubscribe

    // Start streaming
    stream.start()

    // Cleanup
    return () => {
      unsubscribe()
      stream.stop()
    }
  }, [])

  const toggleLive = () => {
    if (!streamRef.current) return

    if (isLive) {
      streamRef.current.stop()
    } else {
      streamRef.current.start()
    }
    setIsLive(!isLive)
  }

  const resetStream = () => {
    if (!streamRef.current) return
    streamRef.current.reset()
    if (!isLive) {
      streamRef.current.start()
      setIsLive(true)
    }
  }

  if (!metrics) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Initializing live data stream...</p>
        </div>
      </div>
    )
  }

  // Convert live metrics to stats format for existing components
  const stats = {
    totalRequests: metrics.totalRequests,
    totalBids: metrics.totalBids,
    totalWins: metrics.totalWins,
    winRate: metrics.winRate,
    totalSpend: metrics.totalSpend,
    avgCTR: metrics.avgCTR,
    avgCVR: metrics.avgCVR,
    avgBidPrice: metrics.totalBids > 0 ? metrics.totalSpend / metrics.totalBids : 0,
    avgWinPrice: metrics.totalWins > 0 ? metrics.totalSpend / metrics.totalWins : 0,
    impressions: metrics.impressions,
    clicks: metrics.clicks,
    conversions: metrics.conversions,
    ctr: metrics.ctr,
    cvr: metrics.cvr,
    roi: metrics.roi,
    bidsByHour: metrics.performanceOverTime.map((p, i) => ({
      hour: i,
      bids: p.impressions,
      wins: p.impressions,
    })),
    bidsByDevice: metrics.deviceBreakdown.map(d => ({
      device: d.device,
      bids: d.bids,
      wins: d.wins,
      spend: d.spend,
    })),
    bidsByCategory: metrics.categoryPerformance.map(c => ({
      category: c.category,
      bids: c.bids,
      wins: c.wins,
      ctr: c.ctr,
    })),
    performanceOverTime: metrics.performanceOverTime,
    budgetUtilization: [],
    strategyBreakdown: [],
  }

  return (
    <div className="px-6 py-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-foreground">Live Analytics Dashboard</h2>
            {isLive && (
              <Badge variant="default" className="gap-1">
                <Activity className="h-3 w-3 animate-pulse" />
                LIVE
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Real-time bidding performance • {metrics.totalRequests.toLocaleString()} requests processed
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-md bg-secondary px-3 py-1.5">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              Updates every second
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleLive}
            className="gap-2"
          >
            {isLive ? (
              <>
                <Pause className="h-3.5 w-3.5" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" />
                Resume
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={resetStream}
            className="gap-2"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <KPICards stats={stats} />

      {/* Charts Grid */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <BidsOverTimeChart stats={stats} />
        <SpendOverTimeChart stats={stats} />
        <DeviceBreakdownChart stats={stats} />
        <CategoryPerformanceChart stats={stats} />
      </div>

      {/* Auction Log */}
      <div className="mt-6">
        <AuctionLog data={{ recentBids: metrics.recentBids }} />
      </div>
    </div>
  )
}
