/**
 * Moment detector UI component for Smart Montage Planner
 * Visualizes detected key moments and their scores
 */

import { Camera, Heart, Music, Sparkles, Target, Users, Zap } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatTime } from "@/lib/date"
import { cn } from "@/lib/utils"

import { MomentCategory } from "../../types"

import type { Fragment } from "../../types"

interface MomentDetectorProps {
  fragments: Fragment[]
  className?: string
}

export function MomentDetector({ fragments, className }: MomentDetectorProps) {
  const { t } = useTranslation()

  const getMomentIcon = (type: MomentCategory) => {
    const icons = {
      [MomentCategory.Highlight]: <Sparkles className="h-4 w-4" />,
      [MomentCategory.Action]: <Zap className="h-4 w-4" />,
      [MomentCategory.Drama]: <Heart className="h-4 w-4" />,
      [MomentCategory.Comedy]: <Music className="h-4 w-4" />,
      [MomentCategory.Transition]: <Camera className="h-4 w-4" />,
      [MomentCategory.BRoll]: <Camera className="h-4 w-4" />,
      [MomentCategory.Opening]: <Target className="h-4 w-4" />,
      [MomentCategory.Closing]: <Users className="h-4 w-4" />,
    }
    return icons[type] || <Sparkles className="h-4 w-4" />
  }

  const getMomentColor = (type: MomentCategory) => {
    const colors = {
      [MomentCategory.Highlight]: "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20",
      [MomentCategory.Action]: "text-red-600 bg-red-100 dark:bg-red-900/20",
      [MomentCategory.Drama]: "text-pink-600 bg-pink-100 dark:bg-pink-900/20",
      [MomentCategory.Comedy]: "text-purple-600 bg-purple-100 dark:bg-purple-900/20",
      [MomentCategory.Transition]: "text-blue-600 bg-blue-100 dark:bg-blue-900/20",
      [MomentCategory.BRoll]: "text-gray-600 bg-gray-100 dark:bg-gray-900/20",
      [MomentCategory.Opening]: "text-green-600 bg-green-100 dark:bg-green-900/20",
      [MomentCategory.Closing]: "text-orange-600 bg-orange-100 dark:bg-orange-900/20",
    }
    return colors[type] || "text-gray-600 bg-gray-100 dark:bg-gray-900/20"
  }

  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "outline" => {
    if (score >= 80) return "default"
    if (score >= 60) return "secondary"
    return "outline"
  }

  // Group fragments by video and moment type
  const fragmentsByVideo = fragments.reduce<Record<string, Fragment[]>>((acc, fragment) => {
    if (!acc[fragment.videoId]) {
      acc[fragment.videoId] = []
    }
    acc[fragment.videoId].push(fragment)
    return acc
  }, {})

  const fragmentsByType = fragments.reduce<Record<MomentCategory, Fragment[]>>((acc, fragment) => {
    const type = fragment.score.category
    if (!acc[type]) {
      acc[type] = []
    }
    acc[type].push(fragment)
    return acc
  }, {})

  // Sort fragments by score
  const topMoments = [...fragments].sort((a, b) => b.score.totalScore - a.score.totalScore).slice(0, 10)

  // Calculate statistics
  const averageScore =
    fragments.length > 0 ? fragments.reduce((sum, f) => sum + f.score.totalScore, 0) / fragments.length : 0

  const momentTypeCounts = Object.entries(fragmentsByType)
    .map(([type, frags]) => ({
      type: type as MomentCategory,
      count: frags.length,
      percentage: (frags.length / fragments.length) * 100,
    }))
    .sort((a, b) => b.count - a.count)

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle>{t("montage-planner.analysis.moments")}</CardTitle>
        <CardDescription>
          {t("common.analyzedMoments", { count: fragments.length, videos: Object.keys(fragmentsByVideo).length })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">{t("common.overview")}</TabsTrigger>
            <TabsTrigger value="moments">{t("common.topMoments")}</TabsTrigger>
            <TabsTrigger value="timeline">{t("timeline.title")}</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {/* Statistics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">{t("common.averageScore")}</p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">{averageScore.toFixed(0)}</span>
                  <Progress value={averageScore} className="flex-1 h-2" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">{t("common.detectionRate")}</p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">{fragments.length}</span>
                  <span className="text-sm text-muted-foreground">{t("common.momentsDetected")}</span>
                </div>
              </div>
            </div>

            {/* Moment Type Distribution */}
            <div className="space-y-2">
              <p className="text-sm font-medium">{t("common.momentTypes")}</p>
              <div className="space-y-2">
                {momentTypeCounts.map(({ type, count, percentage }) => (
                  <div key={type} className="flex items-center gap-2">
                    <div className={cn("p-1 rounded", getMomentColor(type))}>{getMomentIcon(type)}</div>
                    <span className="text-sm flex-1">{type}</span>
                    <Badge variant="secondary">{count}</Badge>
                    <Progress value={percentage} className="w-20 h-2" />
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Top Moments Tab */}
          <TabsContent value="moments">
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {topMoments.map((fragment, index) => (
                  <div
                    key={fragment.id}
                    className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-medium">
                      {index + 1}
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className={cn("p-1 rounded", getMomentColor(fragment.score.momentType))}>
                            {getMomentIcon(fragment.score.momentType)}
                          </div>
                          <span className="font-medium">{fragment.videoId}</span>
                          <span className="text-sm text-muted-foreground">
                            {formatTime(fragment.startTime)} - {formatTime(fragment.endTime)}
                          </span>
                        </div>
                        <Badge variant={getScoreBadgeVariant(fragment.score.totalScore)}>
                          {fragment.score.totalScore.toFixed(0)}
                        </Badge>
                      </div>

                      {fragment.description && <p className="text-sm text-muted-foreground">{fragment.description}</p>}

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Visual: {fragment.score.visualScore.toFixed(0)}</span>
                        <span>Technical: {fragment.score.technicalScore.toFixed(0)}</span>
                        <span>Emotional: {fragment.score.emotionalScore.toFixed(0)}</span>
                        <span>Relevance: {fragment.score.relevanceScore.toFixed(0)}</span>
                      </div>

                      {fragment.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {fragment.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline">
            <div className="space-y-4">
              {Object.entries(fragmentsByVideo).map(([videoId, videoFragments]) => (
                <div key={videoId} className="space-y-2">
                  <p className="text-sm font-medium">{videoId}</p>
                  <div className="relative h-8 bg-muted rounded overflow-hidden">
                    {videoFragments.map((fragment) => {
                      const videoDuration = Math.max(...videoFragments.map((f) => f.endTime))
                      const left = (fragment.startTime / videoDuration) * 100
                      const width = (fragment.duration / videoDuration) * 100

                      return (
                        <div
                          key={fragment.id}
                          className={cn(
                            "absolute top-1 h-6 rounded",
                            getMomentColor(fragment.score.momentType),
                            "opacity-80 hover:opacity-100 transition-opacity cursor-pointer",
                          )}
                          style={{
                            left: `${left}%`,
                            width: `${width}%`,
                            minWidth: "2px",
                          }}
                          title={`${fragment.score.momentType} - Score: ${fragment.score.totalScore.toFixed(0)}`}
                        />
                      )
                    })}
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0:00</span>
                    <span>{formatTime(Math.max(...videoFragments.map((f) => f.endTime)))}</span>
                  </div>
                </div>
              ))}

              {/* Legend */}
              <div className="flex flex-wrap gap-2 pt-4 border-t">
                {Object.keys(fragmentsByType).map((type) => (
                  <div key={type} className="flex items-center gap-1">
                    <div className={cn("p-1 rounded", getMomentColor(type as MomentType))}>
                      {getMomentIcon(type as MomentType)}
                    </div>
                    <span className="text-xs">{type}</span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
