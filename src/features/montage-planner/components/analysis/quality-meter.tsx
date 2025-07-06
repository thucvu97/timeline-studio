/**
 * Quality meter component for Smart Montage Planner
 * Displays real-time quality metrics for video fragments and overall plan
 */

import { AlertTriangle, CheckCircle, Minus, TrendingDown, TrendingUp } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

import type { AudioAnalysis, MomentScore, VideoAnalysis } from "../../types"

interface QualityMeterProps {
  videoAnalysis?: VideoAnalysis
  audioAnalysis?: AudioAnalysis
  momentScore?: MomentScore
  className?: string
}

export function QualityMeter({ videoAnalysis, audioAnalysis, momentScore, className }: QualityMeterProps) {
  const getQualityColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getQualityBadge = (score: number) => {
    if (score >= 90) return { label: "Excellent", variant: "default" as const }
    if (score >= 75) return { label: "Good", variant: "secondary" as const }
    if (score >= 50) return { label: "Fair", variant: "outline" as const }
    return { label: "Poor", variant: "destructive" as const }
  }

  const getTrendIcon = (current: number, previous?: number) => {
    if (!previous) return <Minus className="h-3 w-3" />
    if (current > previous + 5) return <TrendingUp className="h-3 w-3 text-green-600" />
    if (current < previous - 5) return <TrendingDown className="h-3 w-3 text-red-600" />
    return <Minus className="h-3 w-3" />
  }

  const overallScore = momentScore?.totalScore || 0
  const qualityBadge = getQualityBadge(overallScore)

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle>Quality Metrics</CardTitle>
        <CardDescription>Real-time quality assessment of your content</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Quality */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Overall Quality</span>
            <div className="flex items-center gap-2">
              <Badge variant={qualityBadge.variant}>{qualityBadge.label}</Badge>
              <span className={cn("text-2xl font-bold", getQualityColor(overallScore))}>
                {overallScore.toFixed(0)}%
              </span>
            </div>
          </div>
          <Progress value={overallScore} className="h-3" />
        </div>

        {/* Video Metrics */}
        {videoAnalysis && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              Video Analysis
              {(videoAnalysis.quality?.sharpness || 0) >= 70 ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              )}
            </h4>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Resolution</span>
                  <span className="font-medium">
                    {videoAnalysis.quality?.resolution?.width || 0}x{videoAnalysis.quality?.resolution?.height || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Frame Rate</span>
                  <span className="font-medium">{videoAnalysis.quality?.frameRate || 0} fps</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Bitrate</span>
                  <span className="font-medium">
                    {((videoAnalysis.quality?.bitrate || 0) / 1000000).toFixed(1)} Mbps
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Sharpness</span>
                  <div className="flex items-center gap-1">
                    <span className={cn("font-medium", getQualityColor(videoAnalysis.quality?.sharpness || 0))}>
                      {(videoAnalysis.quality?.sharpness || 0).toFixed(0)}%
                    </span>
                    {getTrendIcon(videoAnalysis.quality?.sharpness || 0)}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Stability</span>
                  <div className="flex items-center gap-1">
                    <span className={cn("font-medium", getQualityColor(videoAnalysis.quality?.stability || 0))}>
                      {(videoAnalysis.quality?.stability || 0).toFixed(0)}%
                    </span>
                    {getTrendIcon(videoAnalysis.quality?.stability || 0)}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Brightness</span>
                  <div className="flex items-center gap-1">
                    <span className={cn("font-medium", getQualityColor(videoAnalysis.quality?.exposure || 0))}>
                      {(videoAnalysis.quality?.exposure || 0).toFixed(0)}%
                    </span>
                    {getTrendIcon(videoAnalysis.quality?.exposure || 0)}
                  </div>
                </div>
              </div>
            </div>

            {/* Composition */}
            <div className="space-y-2">
              <span className="text-sm text-muted-foreground">Composition Quality</span>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center">
                  <Progress value={videoAnalysis.content?.compositionScore || 0} className="h-2" />
                  <span className="text-xs text-muted-foreground mt-1">Rule of Thirds</span>
                </div>
                <div className="text-center">
                  <Progress value={videoAnalysis.content?.aestheticScore || 0} className="h-2" />
                  <span className="text-xs text-muted-foreground mt-1">Balance</span>
                </div>
                <div className="text-center">
                  <Progress value={videoAnalysis.content?.actionLevel || 0} className="h-2" />
                  <span className="text-xs text-muted-foreground mt-1">Leading Lines</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Audio Metrics */}
        {audioAnalysis && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              Audio Analysis
              {(audioAnalysis.quality?.clarity || 0) >= 70 ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              )}
            </h4>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Sample Rate</span>
                  <span className="font-medium">{audioAnalysis.quality?.sampleRate || 0} Hz</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Bit Depth</span>
                  <span className="font-medium">{audioAnalysis.quality?.bitDepth || 0} bit</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Noise Level</span>
                  <span className="font-medium">{(audioAnalysis.quality?.noiseLevel || 0).toFixed(0)}%</span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Speech Clarity</span>
                  <div className="flex items-center gap-1">
                    <span className={cn("font-medium", getQualityColor(audioAnalysis.quality?.clarity || 0))}>
                      {(audioAnalysis.quality?.clarity || 0).toFixed(0)}%
                    </span>
                    {getTrendIcon(audioAnalysis.quality?.clarity || 0)}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Music Energy</span>
                  <div className="flex items-center gap-1">
                    <span className={cn("font-medium", getQualityColor(audioAnalysis.music?.energy || 0))}>
                      {(audioAnalysis.music?.energy || 0).toFixed(0)}%
                    </span>
                    {getTrendIcon(audioAnalysis.music?.energy || 0)}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Silence Ratio</span>
                  <span className="font-medium">{(audioAnalysis.silenceRatio * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Moment Score Breakdown */}
        {momentScore && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Moment Score Details</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Visual Impact</span>
                  <Progress value={momentScore.visualScore} className="w-16 h-2" />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Technical Quality</span>
                  <Progress value={momentScore.technicalScore} className="w-16 h-2" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Emotional Value</span>
                  <Progress value={momentScore.emotionalScore} className="w-16 h-2" />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Relevance</span>
                  <Progress value={momentScore.relevanceScore} className="w-16 h-2" />
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
