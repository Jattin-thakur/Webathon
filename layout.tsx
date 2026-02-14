import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import "./globals.css"

const _inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const _jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" })

export const metadata: Metadata = {
  title: "RTB-DSP Optimizer | Real-Time Bidding Platform",
  description:
    "Full-stack Real-Time Bidding Demand Side Platform with ML-powered CTR/CVR prediction, auction simulation, bid optimization, and fraud detection.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${_inter.variable} ${_jetbrains.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}
