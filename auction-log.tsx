"use client"

import { Badge } from "@/components/ui/badge"
import type { LiveBid } from "@/lib/dsp/live-data-stream"

export function AuctionLog({ data }: { data: { recentBids: LiveBid[] } }) {
  const recentBids = data.recentBids.slice(0, 20)

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="border-b border-border px-5 py-4">
        <h3 className="text-sm font-semibold text-foreground">Live Auction Stream</h3>
        <p className="text-xs text-muted-foreground">Real-time bid results • Updates every second</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Timestamp</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Bid ID</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Device</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Category</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Bid Price</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Est. CTR</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Win Price</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Result</th>
            </tr>
          </thead>
          <tbody>
            {recentBids.map((bid) => {
              const time = new Date(bid.timestamp).toLocaleTimeString()
              return (
                <tr key={bid.id} className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-muted-foreground text-[10px]">{time}</td>
                  <td className="px-4 py-3 font-mono text-foreground text-[10px]">{bid.id.slice(-8)}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="text-[10px]">
                      {bid.device}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-foreground">{bid.category}</td>
                  <td className="px-4 py-3 text-foreground">${bid.bidPrice.toFixed(2)}</td>
                  <td className="px-4 py-3 text-foreground">{bid.ctr.toFixed(2)}%</td>
                  <td className="px-4 py-3 text-foreground">
                    {bid.winPrice ? `$${bid.winPrice.toFixed(2)}` : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={bid.won ? "default" : "secondary"}
                      className={bid.won ? "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/15" : "bg-red-500/15 text-red-400 hover:bg-red-500/15"}
                    >
                      {bid.won ? "WON" : "LOST"}
                    </Badge>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
