/**
 * Main dashboard component for Smart Montage Planner
 * Provides overview and control of the montage planning process
 */

import { AlertCircle, Download, Play, Settings, Sparkles, Upload } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

import { PlanViewer } from "./plan-viewer"
import { ProjectAnalyzer } from "./project-analyzer"
import { Suggestions } from "./suggestions"
import { useMontagePlanner } from "../../hooks/use-montage-planner"
import { MONTAGE_STYLES } from "../../types"

export function PlannerDashboard() {
  const { t } = useTranslation()
  const {
    // State
    videos,
    fragments,
    currentPlan,
    selectedStyle,
    targetDuration,
    error,

    // Status
    isAnalyzing,
    isGenerating,
    isOptimizing,
    hasVideos,
    hasFragments,
    hasPlan,
    canGeneratePlan,
    canOptimizePlan,
    isBusy,

    // Progress
    progress,
    progressMessage,

    // Statistics
    videoCount,
    fragmentCount,
    totalVideoDuration,
    planDuration,
    utilizationRate,

    // Actions
    startAnalysis,
    generatePlan,
    optimizePlan,
    applyPlanToTimeline,
    exportPlan,
    reset,
    clearError,

    // Helpers
    formatDuration,
    getStyleName,
  } = useMontagePlanner()

  const handleApplyToTimeline = () => {
    applyPlanToTimeline()
    // TODO: Show success notification
  }

  const handleExport = () => {
    exportPlan("JSON")
    // TODO: Show export dialog with format options
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t("montage-planner.title")}</h2>
          <p className="text-muted-foreground">{t("montage-planner.description")}</p>
        </div>
        <div className="flex gap-2">
          {hasPlan && (
            <>
              <Button variant="outline" size="sm" onClick={handleExport} disabled={isBusy}>
                <Download className="mr-2 h-4 w-4" />
                {t("topBar.export")}
              </Button>
              <Button variant="default" size="sm" onClick={handleApplyToTimeline} disabled={isBusy}>
                <Play className="mr-2 h-4 w-4" />
                {t("montage-planner.timeline.applyToTimeline")}
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" onClick={reset} disabled={isBusy}>
            {t("common.reset")}
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="ghost" size="sm" onClick={clearError}>
              {t("common.close")}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Progress Bar */}
      {isBusy && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{progressMessage}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Project Overview */}
        <Card>
          <CardHeader>
            <CardTitle>{t("common.projectOverview")}</CardTitle>
            <CardDescription>{t("common.currentProjectStatistics")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("common.videos")}</span>
                <span className="font-medium">{videoCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("common.totalDuration")}</span>
                <span className="font-medium">{formatDuration(totalVideoDuration)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("common.fragmentsDetected")}</span>
                <span className="font-medium">{fragmentCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("common.utilizationRate")}</span>
                <span className="font-medium">{utilizationRate.toFixed(1)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Montage Style */}
        <Card>
          <CardHeader>
            <CardTitle>{t("montage-planner.planning.style")}</CardTitle>
            <CardDescription>{t("montage-planner.planning.preferences")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="font-medium">{getStyleName(selectedStyle)}</p>
                <p className="text-sm text-muted-foreground">{(MONTAGE_STYLES as any)[selectedStyle]?.description}</p>
              </div>
              {targetDuration && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("montage-planner.planning.duration")}</span>
                  <span>{formatDuration(targetDuration)}</span>
                </div>
              )}
              {hasPlan && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("common.planDuration")}</span>
                  <span
                    className={targetDuration && Math.abs(planDuration - targetDuration) > 10 ? "text-yellow-600" : ""}
                  >
                    {formatDuration(planDuration)}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>{t("common.actions")}</CardTitle>
            <CardDescription>{t("montage-planner.navigation.planning")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button className="w-full" onClick={startAnalysis} disabled={!hasVideos || isBusy}>
                <Upload className="mr-2 h-4 w-4" />
                {t("montage-planner.analysis.analyzeVideos")}
              </Button>
              <Button
                className="w-full"
                onClick={generatePlan}
                disabled={!canGeneratePlan}
                variant={hasFragments ? "default" : "outline"}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {t("montage-planner.planning.generatePlan")}
              </Button>
              <Button className="w-full" onClick={optimizePlan} disabled={!canOptimizePlan} variant="outline">
                <Settings className="mr-2 h-4 w-4" />
                {t("common.optimizePlan")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analysis Results */}
      {hasFragments && <ProjectAnalyzer />}

      {/* Plan Viewer */}
      {hasPlan && currentPlan && <PlanViewer plan={currentPlan} />}

      {/* Suggestions */}
      {hasPlan && <Suggestions />}
    </div>
  )
}
