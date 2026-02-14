"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PlayCircle, Loader2 } from "lucide-react"

interface BidResult {
  success: boolean
  bidRequest?: {
    id: string
    userAge: number
    deviceType: number
    location: number
    timeOfDay: number
    adCategory: number
    historicalCTR: number
    frequencyCount: number
    floorPrice: number
    auctionType: string
  }
  bidResponse?: {
    bidPrice: number
    estimatedCTR: number
    estimatedCVR: number
    performanceScore: number
    budgetFactor: number
    bidShading: number
    adaptiveAdjustment: number
    strategy: string
    won: boolean
    winPrice?: number
  }
  auctionResult?: {
    auctionType: string
    won: boolean
    winPrice: number
    numCompetitors: number
    allBids: { bidderId: string; bidPrice: number; isOurBid: boolean }[]
  }
  campaign?: { id: string; name: string }
  processingTimeMs?: number
  withinSLA?: boolean
  message?: string
}

const DEVICE_LABELS = ["Desktop", "Mobile", "Tablet"]
const CATEGORY_LABELS = [
  "Electronics", "Fashion", "Auto", "Gaming", "SaaS",
  "Fitness", "Travel", "Food", "Finance", "Health",
]

export function SimulatorContent() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<BidResult | null>(null)
  const [history, setHistory] = useState<BidResult[]>([])

  const [form, setForm] = useState({
    userAge: 30,
    deviceType: 1,
    location: 3,
    timeOfDay: 14,
    adCategory: 0,
    historicalCTR: 0.08,
    frequencyCount: 2,
    floorPrice: 0.5,
    auctionType: "first-price" as "first-price" | "second-price",
  })

  async function runBid() {
    setLoading(true)
    try {
      const res = await fetch("/api/bid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      setResult(data)
      if (data.success) {
        setHistory((prev) => [data, ...prev].slice(0, 10))
      }
    } catch {
      setResult({ success: false, message: "Request failed" })
    } finally {
      setLoading(false)
    }
  }

  function randomize() {
    setForm({
      userAge: 18 + Math.floor(Math.random() * 47),
      deviceType: Math.floor(Math.random() * 3),
      location: Math.floor(Math.random() * 10),
      timeOfDay: Math.floor(Math.random() * 24),
      adCategory: Math.floor(Math.random() * 10),
      historicalCTR: Math.round(Math.random() * 30) / 100,
      frequencyCount: Math.floor(Math.random() * 10),
      floorPrice: Math.round((0.1 + Math.random() * 2) * 100) / 100,
      auctionType: Math.random() > 0.5 ? "first-price" : "second-price",
    })
  }

  return (
    <div className="px-6 py-6 lg:px-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold tracking-tight text-foreground">Bid Simulator</h2>
        <p className="text-sm text-muted-foreground">
          Send bid requests and see auction results in real time
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Input form */}
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground">Bid Request Parameters</h3>
          <p className="mb-4 text-xs text-muted-foreground">Configure the impression parameters</p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">User Age</label>
              <input
                type="number"
                min={18}
                max={65}
                value={form.userAge}
                onChange={(e) => setForm({ ...form, userAge: parseInt(e.target.value) || 30 })}
                className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Device Type</label>
              <select
                value={form.deviceType}
                onChange={(e) => setForm({ ...form, deviceType: parseInt(e.target.value) })}
                className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
              >
                {DEVICE_LABELS.map((label, i) => (
                  <option key={i} value={i}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Location (Geo Cluster)</label>
              <input
                type="number"
                min={0}
                max={9}
                value={form.location}
                onChange={(e) => setForm({ ...form, location: parseInt(e.target.value) || 0 })}
                className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Time of Day (0-23)</label>
              <input
                type="number"
                min={0}
                max={23}
                value={form.timeOfDay}
                onChange={(e) => setForm({ ...form, timeOfDay: parseInt(e.target.value) || 12 })}
                className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Ad Category</label>
              <select
                value={form.adCategory}
                onChange={(e) => setForm({ ...form, adCategory: parseInt(e.target.value) })}
                className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
              >
                {CATEGORY_LABELS.map((label, i) => (
                  <option key={i} value={i}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Historical CTR</label>
              <input
                type="number"
                min={0}
                max={1}
                step={0.01}
                value={form.historicalCTR}
                onChange={(e) => setForm({ ...form, historicalCTR: parseFloat(e.target.value) || 0.05 })}
                className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Frequency Count</label>
              <input
                type="number"
                min={0}
                max={100}
                value={form.frequencyCount}
                onChange={(e) => setForm({ ...form, frequencyCount: parseInt(e.target.value) || 0 })}
                className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Floor Price ($)</label>
              <input
                type="number"
                min={0.01}
                step={0.01}
                value={form.floorPrice}
                onChange={(e) => setForm({ ...form, floorPrice: parseFloat(e.target.value) || 0.5 })}
                className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Auction Type</label>
              <div className="flex gap-3">
                {(["first-price", "second-price"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setForm({ ...form, auctionType: type })}
                    className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                      form.auctionType === type
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {type === "first-price" ? "1st Price" : "2nd Price"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5 flex gap-3">
            <Button onClick={runBid} disabled={loading} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <PlayCircle className="mr-2 h-4 w-4" />
              )}
              Submit Bid
            </Button>
            <Button onClick={randomize} variant="outline" className="border-border text-foreground">
              Randomize
            </Button>
          </div>
        </div>

        {/* Result panel */}
        <div className="space-y-4">
          {result && result.success && result.bidResponse && result.auctionResult ? (
            <>
              {/* Auction outcome */}
              <div className={`rounded-lg border p-5 ${
                result.auctionResult.won
                  ? "border-emerald-500/30 bg-emerald-500/5"
                  : "border-red-500/30 bg-red-500/5"
              }`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">Auction Result</h3>
                  <Badge className={
                    result.auctionResult.won
                      ? "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/15"
                      : "bg-red-500/15 text-red-400 hover:bg-red-500/15"
                  }>
                    {result.auctionResult.won ? "WON" : "LOST"}
                  </Badge>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <Stat label="Our Bid" value={`$${result.bidResponse.bidPrice.toFixed(2)}`} />
                  <Stat label="Win Price" value={`$${result.auctionResult.winPrice.toFixed(2)}`} />
                  <Stat label="Auction Type" value={result.auctionResult.auctionType === "first-price" ? "1st Price" : "2nd Price"} />
                  <Stat label="Competitors" value={String(result.auctionResult.numCompetitors)} />
                </div>
              </div>

              {/* Performance Estimates */}
              <div className="rounded-lg border border-border bg-card p-5">
                <h3 className="text-sm font-semibold text-foreground">Statistical Estimates</h3>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <Stat label="CTR Estimate" value={`${(result.bidResponse.estimatedCTR * 100).toFixed(2)}%`} />
                  <Stat label="CVR Estimate" value={`${(result.bidResponse.estimatedCVR * 100).toFixed(2)}%`} />
                  <Stat label="Perf. Score" value={result.bidResponse.performanceScore.toFixed(4)} />
                  <Stat label="Strategy" value={result.bidResponse.strategy} />
                  <Stat label="Budget Factor" value={result.bidResponse.budgetFactor.toFixed(2)} />
                  <Stat label="Bid Shading" value={result.bidResponse.bidShading.toFixed(2)} />
                  <Stat label="Adaptive Adj." value={result.bidResponse.adaptiveAdjustment.toFixed(2)} />
                </div>
              </div>

              {/* Bid landscape */}
              <div className="rounded-lg border border-border bg-card p-5">
                <h3 className="mb-3 text-sm font-semibold text-foreground">Bid Landscape</h3>
                <div className="space-y-2">
                  {result.auctionResult.allBids
                    .sort((a, b) => b.bidPrice - a.bidPrice)
                    .map((bid, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="w-5 text-xs text-muted-foreground">#{i + 1}</span>
                        <div className="flex-1">
                          <div className="h-2 overflow-hidden rounded-full bg-secondary">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${(bid.bidPrice / (result.auctionResult!.allBids[0]?.bidPrice || 1)) * 100}%`,
                                backgroundColor: bid.isOurBid ? "hsl(199, 89%, 48%)" : "hsl(220, 13%, 30%)",
                              }}
                            />
                          </div>
                        </div>
                        <span className={`text-xs font-mono ${bid.isOurBid ? "text-primary font-semibold" : "text-muted-foreground"}`}>
                          ${bid.bidPrice.toFixed(2)}
                        </span>
                        {bid.isOurBid && (
                          <Badge variant="outline" className="text-[10px] text-primary border-primary/30">
                            OURS
                          </Badge>
                        )}
                      </div>
                    ))}
                </div>
              </div>

              {/* Performance */}
              {result.processingTimeMs !== undefined && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className={`h-2 w-2 rounded-full ${result.withinSLA ? "bg-emerald-500" : "bg-red-500"}`} />
                  Response time: {result.processingTimeMs}ms {result.withinSLA ? "(within 100ms SLA)" : "(SLA exceeded)"}
                </div>
              )}
            </>
          ) : result && !result.success ? (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-5">
              <h3 className="text-sm font-semibold text-amber-400">No Bid Placed</h3>
              <p className="mt-1 text-xs text-muted-foreground">{result.message || "No eligible campaigns for this bid request."}</p>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border">
              <p className="text-sm text-muted-foreground">Configure parameters and submit a bid to see results</p>
            </div>
          )}

          {/* History */}
          {history.length > 0 && (
            <div className="rounded-lg border border-border bg-card p-5">
              <h3 className="mb-3 text-sm font-semibold text-foreground">Bid History</h3>
              <div className="space-y-2">
                {history.map((h, i) => (
                  <div key={i} className="flex items-center justify-between rounded-md bg-secondary/50 px-3 py-2 text-xs">
                    <span className="text-muted-foreground">Bid #{history.length - i}</span>
                    <span className="text-foreground">${h.bidResponse?.bidPrice.toFixed(2)}</span>
                    <Badge className={
                      h.auctionResult?.won
                        ? "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/15"
                        : "bg-red-500/15 text-red-400 hover:bg-red-500/15"
                    }>
                      {h.auctionResult?.won ? "WON" : "LOST"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-foreground">{value}</p>
    </div>
  )
}
