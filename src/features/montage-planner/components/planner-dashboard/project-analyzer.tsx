/**
 * Project analysis viewer component
 * Displays results of content analysis including quality metrics and detected moments
 */

import { Eye, Film, MessageSquare, Music, Star, Zap } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { useContentAnalysis } from "../../hooks/use-content-analysis"
import { MomentCategory } from "../../types"

export function ProjectAnalyzer() {
  const { contentStats, averageVideoQuality, averageAudioQuality, topMoments, momentCategoryCounts, fragments } =
    useContentAnalysis()

  const getCategoryIcon = (category: MomentCategory) => {
    const icons = {
      [MomentCategory.Highlight]: <Star className="h-4 w-4" />,
      [MomentCategory.Action]: <Zap className="h-4 w-4" />,
      [MomentCategory.Drama]: <MessageSquare className="h-4 w-4" />,
      [MomentCategory.Comedy]: <Film className="h-4 w-4" />,
      [MomentCategory.Opening]: <Eye className="h-4 w-4" />,
      [MomentCategory.Closing]: <Film className="h-4 w-4" />,
      [MomentCategory.BRoll]: <Film className="h-4 w-4" />,
      [MomentCategory.Transition]: <Film className="h-4 w-4" />,
    }
    return icons[category] || <Film className="h-4 w-4" />
  }

  const getCategoryColor = (category: MomentCategory) => {
    const colors = {
      [MomentCategory.Highlight]: "bg-yellow-500",
      [MomentCategory.Action]: "bg-red-500",
      [MomentCategory.Drama]: "bg-purple-500",
      [MomentCategory.Comedy]: "bg-green-500",
      [MomentCategory.Opening]: "bg-blue-500",
      [MomentCategory.Closing]: "bg-indigo-500",
      [MomentCategory.BRoll]: "bg-gray-500",
      [MomentCategory.Transition]: "bg-cyan-500",
    }
    return colors[category] || "bg-gray-500"
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Content Analysis Results</h3>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Video Quality */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Video Quality</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Film className="h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold">{averageVideoQuality.toFixed(0)}%</span>
              </div>
              <Progress value={averageVideoQuality} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Audio Quality */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Audio Quality</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Music className="h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold">{averageAudioQuality.toFixed(0)}%</span>
              </div>
              <Progress value={averageAudioQuality} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Action Level */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Action Level</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Zap className="h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold">{contentStats.averageActionLevel.toFixed(0)}%</span>
              </div>
              <Progress value={contentStats.averageActionLevel} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Speech Presence */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Speech Presence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold">{contentStats.speechPresence.toFixed(0)}%</span>
              </div>
              <Progress value={contentStats.speechPresence} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="moments" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="moments">Top Moments</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="fragments">All Fragments</TabsTrigger>
        </TabsList>

        {/* Top Moments */}
        <TabsContent value="moments">
          <Card>
            <CardHeader>
              <CardTitle>Top Moments</CardTitle>
              <CardDescription>Highest scoring moments detected in your content</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {topMoments.map((moment, index) => (
                    <div key={`moment-${index}`} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-3">
                        <div className={`h-2 w-2 rounded-full ${getCategoryColor(moment.category)}`} />
                        <div>
                          <p className="font-medium">
                            {Number(moment.timestamp || 0).toFixed(1)}s -{" "}
                            {(Number(moment.timestamp || 0) + Number(moment.duration || 0)).toFixed(1)}s
                          </p>
                          <p className="text-sm text-muted-foreground">{moment.category}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{moment.totalScore.toFixed(0)}</Badge>
                        {getCategoryIcon(moment.category)}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories */}
        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>Moment Categories</CardTitle>
              <CardDescription>Distribution of detected moment types</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(momentCategoryCounts).map(([category, count]) => (
                  <div key={category} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(category as MomentCategory)}
                      <span className="capitalize">{category.replace("-", " ")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={(count / contentStats.totalMoments) * 100} className="w-[100px] h-2" />
                      <span className="text-sm font-medium w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* All Fragments */}
        <TabsContent value="fragments">
          <Card>
            <CardHeader>
              <CardTitle>All Fragments</CardTitle>
              <CardDescription>Complete list of detected video fragments</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {fragments.map((fragment) => (
                    <div key={fragment.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex-1">
                        <p className="font-medium">{fragment.videoId}</p>
                        <p className="text-sm text-muted-foreground">
                          {fragment.startTime.toFixed(1)}s - {fragment.endTime.toFixed(1)}s
                          {fragment.description && ` • ${fragment.description}`}
                        </p>
                        <div className="mt-1 flex gap-1">
                          {fragment.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {fragment.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{fragment.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge>{fragment.score.totalScore.toFixed(0)}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
