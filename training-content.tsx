"use client"

import { useState, useCallback } from "react"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import {
  Brain,
  PlayCircle,
  BarChart3,
  Activity,
  Target,
  Clock,
  Loader2,
  CheckCircle2,
} from "lucide-react"
import {
  trainModels,
  DEFAULT_TRAINING_CONFIG,
  type TrainingConfig,
  type TrainingResult,
  type TrainingEpochResult,
} from "@/lib/dsp/trainable-model"

// ---- Sub-components ----

function MetricCard({
  label,
  value,
  suffix = "%",
  color,
}: {
  label: string
  value: number
  suffix?: string
  color?: string
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-1 text-xl font-bold tracking-tight ${color || "text-foreground"}`}>
        {value}
        {suffix}
      </p>
    </div>
  )
}

function ConfusionMatrix({
  tp,
  fp,
  tn,
  fn,
  title,
}: {
  tp: number
  fp: number
  tn: number
  fn: number
  title: string
}) {
  const total = tp + fp + tn + fn
  const maxVal = Math.max(tp, fp, tn, fn)

  function cellOpacity(val: number) {
    return maxVal > 0 ? 0.15 + (val / maxVal) * 0.85 : 0.15
  }

  return (
    <div>
      <h4 className="mb-3 text-sm font-semibold text-foreground">{title}</h4>
      <div className="grid grid-cols-[auto_1fr_1fr] gap-0.5 text-center text-xs">
        {/* Header row */}
        <div />
        <div className="rounded-tl-md bg-secondary px-3 py-2 font-medium text-muted-foreground">
          Predicted Pos
        </div>
        <div className="rounded-tr-md bg-secondary px-3 py-2 font-medium text-muted-foreground">
          Predicted Neg
        </div>

        {/* Row 1: Actual Positive */}
        <div className="flex items-center rounded-tl-md bg-secondary px-3 py-2 font-medium text-muted-foreground">
          Actual Pos
        </div>
        <div
          className="flex flex-col items-center justify-center px-3 py-4"
          style={{ backgroundColor: `hsl(142, 71%, 45%, ${cellOpacity(tp)})` }}
        >
          <span className="text-lg font-bold text-emerald-400">{tp}</span>
          <span className="text-muted-foreground">TP</span>
        </div>
        <div
          className="flex flex-col items-center justify-center px-3 py-4"
          style={{ backgroundColor: `hsl(0, 72%, 51%, ${cellOpacity(fn)})` }}
        >
          <span className="text-lg font-bold text-red-400">{fn}</span>
          <span className="text-muted-foreground">FN</span>
        </div>

        {/* Row 2: Actual Negative */}
        <div className="flex items-center rounded-bl-md bg-secondary px-3 py-2 font-medium text-muted-foreground">
          Actual Neg
        </div>
        <div
          className="flex flex-col items-center justify-center rounded-bl-md px-3 py-4"
          style={{ backgroundColor: `hsl(0, 72%, 51%, ${cellOpacity(fp)})` }}
        >
          <span className="text-lg font-bold text-red-400">{fp}</span>
          <span className="text-muted-foreground">FP</span>
        </div>
        <div
          className="flex flex-col items-center justify-center rounded-br-md px-3 py-4"
          style={{ backgroundColor: `hsl(142, 71%, 45%, ${cellOpacity(tn)})` }}
        >
          <span className="text-lg font-bold text-emerald-400">{tn}</span>
          <span className="text-muted-foreground">TN</span>
        </div>
      </div>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        Total: {total} samples
      </p>
    </div>
  )
}

// ---- Custom Tooltip ----

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 shadow-lg">
      <p className="mb-1 text-xs font-medium text-foreground">Epoch {label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="text-xs text-muted-foreground">
          <span className="inline-block h-2 w-2 rounded-full mr-1.5" style={{ backgroundColor: entry.color }} />
          {entry.name}: {typeof entry.value === "number" ? entry.value.toFixed(4) : entry.value}
        </p>
      ))}
    </div>
  )
}

// ---- Main Component ----

export function TrainingContent() {
  const [config, setConfig] = useState<TrainingConfig>({ ...DEFAULT_TRAINING_CONFIG })
  const [isTraining, setIsTraining] = useState(false)
  const [trainingPhase, setTrainingPhase] = useState<"ctr" | "cvr" | null>(null)
  const [currentEpoch, setCurrentEpoch] = useState(0)
  const [liveEpochs, setLiveEpochs] = useState<{ ctr: TrainingEpochResult[]; cvr: TrainingEpochResult[] }>({
    ctr: [],
    cvr: [],
  })
  const [result, setResult] = useState<TrainingResult | null>(null)

  const handleTrain = useCallback(async () => {
    setIsTraining(true)
    setResult(null)
    setLiveEpochs({ ctr: [], cvr: [] })
    setCurrentEpoch(0)
    setTrainingPhase("ctr")

    try {
      const trainResult = await trainModels(config, ({ phase, epoch }) => {
        setTrainingPhase(phase)
        setCurrentEpoch(epoch.epoch)
        setLiveEpochs((prev) => ({
          ...prev,
          [phase]: [...prev[phase], epoch],
        }))
      })

      setResult(trainResult)
    } finally {
      setIsTraining(false)
      setTrainingPhase(null)
    }
  }, [config])

  const totalProgress = isTraining
    ? Math.round(
        ((liveEpochs.ctr.length + liveEpochs.cvr.length) / (config.epochs * 2)) * 100
      )
    : result
    ? 100
    : 0

  // Chart data for live updates or final results
  const ctrEpochData = result?.ctrEpochs ?? liveEpochs.ctr
  const cvrEpochData = result?.cvrEpochs ?? liveEpochs.cvr

  return (
    <div className="px-6 py-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Model Training</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Train logistic regression models for CTR and CVR prediction using gradient descent
        </p>
      </div>

      {/* Config + Train Button */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Left: Configuration Panel */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Brain className="h-4 w-4 text-primary" />
              Training Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {/* Learning Rate */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Learning Rate</Label>
                  <span className="text-xs font-mono text-foreground">{config.learningRate}</span>
                </div>
                <Slider
                  value={[config.learningRate]}
                  min={0.001}
                  max={1}
                  step={0.001}
                  onValueChange={([v]) => setConfig((c) => ({ ...c, learningRate: v }))}
                  disabled={isTraining}
                />
              </div>

              {/* Epochs */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Epochs</Label>
                  <span className="text-xs font-mono text-foreground">{config.epochs}</span>
                </div>
                <Slider
                  value={[config.epochs]}
                  min={10}
                  max={500}
                  step={10}
                  onValueChange={([v]) => setConfig((c) => ({ ...c, epochs: v }))}
                  disabled={isTraining}
                />
              </div>

              {/* Batch Size */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Batch Size</Label>
                  <span className="text-xs font-mono text-foreground">{config.batchSize}</span>
                </div>
                <Slider
                  value={[config.batchSize]}
                  min={16}
                  max={256}
                  step={16}
                  onValueChange={([v]) => setConfig((c) => ({ ...c, batchSize: v }))}
                  disabled={isTraining}
                />
              </div>

              {/* Train/Test Split */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Train/Test Split</Label>
                  <span className="text-xs font-mono text-foreground">{(config.trainTestSplit * 100).toFixed(0)}%</span>
                </div>
                <Slider
                  value={[config.trainTestSplit]}
                  min={0.5}
                  max={0.9}
                  step={0.05}
                  onValueChange={([v]) => setConfig((c) => ({ ...c, trainTestSplit: v }))}
                  disabled={isTraining}
                />
              </div>

              {/* Number of Samples */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Training Samples</Label>
                  <span className="text-xs font-mono text-foreground">{config.numSamples.toLocaleString()}</span>
                </div>
                <Slider
                  value={[config.numSamples]}
                  min={500}
                  max={10000}
                  step={500}
                  onValueChange={([v]) => setConfig((c) => ({ ...c, numSamples: v }))}
                  disabled={isTraining}
                />
              </div>

              {/* Regularization */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">L2 Regularization</Label>
                  <span className="text-xs font-mono text-foreground">{config.regularization}</span>
                </div>
                <Slider
                  value={[config.regularization]}
                  min={0}
                  max={0.1}
                  step={0.001}
                  onValueChange={([v]) => setConfig((c) => ({ ...c, regularization: v }))}
                  disabled={isTraining}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right: Train Action */}
        <Card className="border-border bg-card">
          <CardContent className="flex flex-col items-center justify-center gap-4 p-6 h-full">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              {isTraining ? (
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              ) : result ? (
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              ) : (
                <Brain className="h-8 w-8 text-primary" />
              )}
            </div>

            {isTraining && (
              <div className="w-full space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    Training {trainingPhase === "ctr" ? "CTR" : "CVR"} Model
                  </span>
                  <span className="font-mono text-foreground">
                    Epoch {currentEpoch}/{config.epochs}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-200"
                    style={{ width: `${totalProgress}%` }}
                  />
                </div>
                <p className="text-center text-xs text-muted-foreground">{totalProgress}% complete</p>
              </div>
            )}

            {result && !isTraining && (
              <div className="space-y-1 text-center">
                <p className="text-sm font-medium text-foreground">Training Complete</p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {result.trainingTimeMs}ms
                </div>
              </div>
            )}

            <Button
              size="lg"
              onClick={handleTrain}
              disabled={isTraining}
              className="w-full gap-2"
            >
              {isTraining ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Training...
                </>
              ) : (
                <>
                  <PlayCircle className="h-4 w-4" />
                  {result ? "Re-train Models" : "Start Training"}
                </>
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              {config.numSamples.toLocaleString()} samples, {config.epochs} epochs each
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row: Loss Curves */}
      {(ctrEpochData.length > 0 || cvrEpochData.length > 0) && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* CTR Loss Curve */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Activity className="h-4 w-4 text-primary" />
                CTR Model -- Loss Curve
                {isTraining && trainingPhase === "ctr" && (
                  <Badge variant="outline" className="ml-auto border-primary/30 text-primary text-xs">
                    Training
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={ctrEpochData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 16%)" />
                  <XAxis
                    dataKey="epoch"
                    tick={{ fill: "hsl(215, 14%, 55%)", fontSize: 11 }}
                    axisLine={{ stroke: "hsl(220, 13%, 16%)" }}
                  />
                  <YAxis
                    tick={{ fill: "hsl(215, 14%, 55%)", fontSize: 11 }}
                    axisLine={{ stroke: "hsl(220, 13%, 16%)" }}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11, color: "hsl(215, 14%, 55%)" }} />
                  <Line
                    type="monotone"
                    dataKey="trainLoss"
                    name="Train Loss"
                    stroke="hsl(199, 89%, 48%)"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="valLoss"
                    name="Val Loss"
                    stroke="hsl(38, 92%, 50%)"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* CVR Loss Curve */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Activity className="h-4 w-4 text-chart-2" />
                CVR Model -- Loss Curve
                {isTraining && trainingPhase === "cvr" && (
                  <Badge variant="outline" className="ml-auto border-emerald-500/30 text-emerald-400 text-xs">
                    Training
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={cvrEpochData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 16%)" />
                  <XAxis
                    dataKey="epoch"
                    tick={{ fill: "hsl(215, 14%, 55%)", fontSize: 11 }}
                    axisLine={{ stroke: "hsl(220, 13%, 16%)" }}
                  />
                  <YAxis
                    tick={{ fill: "hsl(215, 14%, 55%)", fontSize: 11 }}
                    axisLine={{ stroke: "hsl(220, 13%, 16%)" }}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11, color: "hsl(215, 14%, 55%)" }} />
                  <Line
                    type="monotone"
                    dataKey="trainLoss"
                    name="Train Loss"
                    stroke="hsl(142, 71%, 45%)"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="valLoss"
                    name="Val Loss"
                    stroke="hsl(38, 92%, 50%)"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Accuracy Curves */}
      {(ctrEpochData.length > 0 || cvrEpochData.length > 0) && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Target className="h-4 w-4 text-primary" />
                CTR Model -- Accuracy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={ctrEpochData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 16%)" />
                  <XAxis
                    dataKey="epoch"
                    tick={{ fill: "hsl(215, 14%, 55%)", fontSize: 11 }}
                    axisLine={{ stroke: "hsl(220, 13%, 16%)" }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: "hsl(215, 14%, 55%)", fontSize: 11 }}
                    axisLine={{ stroke: "hsl(220, 13%, 16%)" }}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11, color: "hsl(215, 14%, 55%)" }} />
                  <Area
                    type="monotone"
                    dataKey="trainAccuracy"
                    name="Train Accuracy"
                    stroke="hsl(199, 89%, 48%)"
                    fill="hsl(199, 89%, 48%)"
                    fillOpacity={0.1}
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="valAccuracy"
                    name="Val Accuracy"
                    stroke="hsl(38, 92%, 50%)"
                    fill="hsl(38, 92%, 50%)"
                    fillOpacity={0.1}
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Target className="h-4 w-4 text-chart-2" />
                CVR Model -- Accuracy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={cvrEpochData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 16%)" />
                  <XAxis
                    dataKey="epoch"
                    tick={{ fill: "hsl(215, 14%, 55%)", fontSize: 11 }}
                    axisLine={{ stroke: "hsl(220, 13%, 16%)" }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: "hsl(215, 14%, 55%)", fontSize: 11 }}
                    axisLine={{ stroke: "hsl(220, 13%, 16%)" }}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11, color: "hsl(215, 14%, 55%)" }} />
                  <Area
                    type="monotone"
                    dataKey="trainAccuracy"
                    name="Train Accuracy"
                    stroke="hsl(142, 71%, 45%)"
                    fill="hsl(142, 71%, 45%)"
                    fillOpacity={0.1}
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="valAccuracy"
                    name="Val Accuracy"
                    stroke="hsl(38, 92%, 50%)"
                    fill="hsl(38, 92%, 50%)"
                    fillOpacity={0.1}
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Final Results (only when training complete) */}
      {result && !isTraining && (
        <>
          {/* Evaluation Metrics */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  CTR Model Evaluation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  <MetricCard label="Accuracy" value={result.ctrMetrics.accuracy} color="text-primary" />
                  <MetricCard label="Precision" value={result.ctrMetrics.precision} color="text-emerald-400" />
                  <MetricCard label="Recall" value={result.ctrMetrics.recall} color="text-amber-400" />
                  <MetricCard label="F1 Score" value={result.ctrMetrics.f1Score} color="text-foreground" />
                  <MetricCard label="AUC" value={result.ctrMetrics.auc} color="text-primary" />
                  <MetricCard
                    label="Support"
                    value={result.ctrMetrics.truePositives + result.ctrMetrics.falsePositives + result.ctrMetrics.trueNegatives + result.ctrMetrics.falseNegatives}
                    suffix=""
                    color="text-muted-foreground"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <BarChart3 className="h-4 w-4 text-chart-2" />
                  CVR Model Evaluation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  <MetricCard label="Accuracy" value={result.cvrMetrics.accuracy} color="text-emerald-400" />
                  <MetricCard label="Precision" value={result.cvrMetrics.precision} color="text-emerald-400" />
                  <MetricCard label="Recall" value={result.cvrMetrics.recall} color="text-amber-400" />
                  <MetricCard label="F1 Score" value={result.cvrMetrics.f1Score} color="text-foreground" />
                  <MetricCard label="AUC" value={result.cvrMetrics.auc} color="text-emerald-400" />
                  <MetricCard
                    label="Support"
                    value={result.cvrMetrics.truePositives + result.cvrMetrics.falsePositives + result.cvrMetrics.trueNegatives + result.cvrMetrics.falseNegatives}
                    suffix=""
                    color="text-muted-foreground"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Confusion Matrices */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-border bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">CTR Confusion Matrix</CardTitle>
              </CardHeader>
              <CardContent>
                <ConfusionMatrix
                  tp={result.ctrMetrics.truePositives}
                  fp={result.ctrMetrics.falsePositives}
                  tn={result.ctrMetrics.trueNegatives}
                  fn={result.ctrMetrics.falseNegatives}
                  title="Click-Through Rate Classification"
                />
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">CVR Confusion Matrix</CardTitle>
              </CardHeader>
              <CardContent>
                <ConfusionMatrix
                  tp={result.cvrMetrics.truePositives}
                  fp={result.cvrMetrics.falsePositives}
                  tn={result.cvrMetrics.trueNegatives}
                  fn={result.cvrMetrics.falseNegatives}
                  title="Conversion Rate Classification"
                />
              </CardContent>
            </Card>
          </div>

          {/* Feature Weights */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-border bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Brain className="h-4 w-4 text-primary" />
                  CTR Feature Weights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={result.ctrModel.featureNames.map((name, i) => ({
                      feature: name,
                      weight: Math.round(result.ctrModel.weights[i] * 10000) / 10000,
                    }))}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 16%)" />
                    <XAxis
                      type="number"
                      tick={{ fill: "hsl(215, 14%, 55%)", fontSize: 11 }}
                      axisLine={{ stroke: "hsl(220, 13%, 16%)" }}
                    />
                    <YAxis
                      type="category"
                      dataKey="feature"
                      tick={{ fill: "hsl(215, 14%, 55%)", fontSize: 11 }}
                      width={100}
                      axisLine={{ stroke: "hsl(220, 13%, 16%)" }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(220, 18%, 7%)",
                        border: "1px solid hsl(220, 13%, 16%)",
                        borderRadius: "6px",
                        color: "hsl(210, 20%, 95%)",
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="weight" fill="hsl(199, 89%, 48%)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  Bias: {result.ctrModel.bias.toFixed(4)}
                </p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Brain className="h-4 w-4 text-chart-2" />
                  CVR Feature Weights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={result.cvrModel.featureNames.map((name, i) => ({
                      feature: name,
                      weight: Math.round(result.cvrModel.weights[i] * 10000) / 10000,
                    }))}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 16%)" />
                    <XAxis
                      type="number"
                      tick={{ fill: "hsl(215, 14%, 55%)", fontSize: 11 }}
                      axisLine={{ stroke: "hsl(220, 13%, 16%)" }}
                    />
                    <YAxis
                      type="category"
                      dataKey="feature"
                      tick={{ fill: "hsl(215, 14%, 55%)", fontSize: 11 }}
                      width={100}
                      axisLine={{ stroke: "hsl(220, 13%, 16%)" }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(220, 18%, 7%)",
                        border: "1px solid hsl(220, 13%, 16%)",
                        borderRadius: "6px",
                        color: "hsl(210, 20%, 95%)",
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="weight" fill="hsl(142, 71%, 45%)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  Bias: {result.cvrModel.bias.toFixed(4)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Training Summary */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Training Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg bg-secondary p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Samples Used</p>
                  <p className="mt-1 text-xl font-bold text-foreground">{config.numSamples.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">
                    {Math.floor(config.numSamples * config.trainTestSplit).toLocaleString()} train / {Math.floor(config.numSamples * (1 - config.trainTestSplit)).toLocaleString()} test
                  </p>
                </div>
                <div className="rounded-lg bg-secondary p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Epochs</p>
                  <p className="mt-1 text-xl font-bold text-foreground">{config.epochs * 2}</p>
                  <p className="text-xs text-muted-foreground">{config.epochs} per model</p>
                </div>
                <div className="rounded-lg bg-secondary p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Training Time</p>
                  <p className="mt-1 text-xl font-bold text-foreground">{result.trainingTimeMs}ms</p>
                  <p className="text-xs text-muted-foreground">Client-side execution</p>
                </div>
                <div className="rounded-lg bg-secondary p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Final Val Loss</p>
                  <p className="mt-1 text-xl font-bold text-foreground">
                    {result.ctrEpochs[result.ctrEpochs.length - 1]?.valLoss.toFixed(4)} / {result.cvrEpochs[result.cvrEpochs.length - 1]?.valLoss.toFixed(4)}
                  </p>
                  <p className="text-xs text-muted-foreground">CTR / CVR</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
