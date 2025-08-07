/**
 * Simplified Content Intelligence Panel - UI для новых AI возможностей
 * Работает с реальной структурой ContentAnalysisResult
 */

import { FileVideo, Layers, Settings } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"

import type { PipelineProgress } from "../../ai-content-intelligence/unified-pipeline/unified-content-pipeline"
import { UnifiedContentAnalysis } from "../services/content-intelligence-service"

interface ContentIntelligencePanelProps {
  analysis?: UnifiedContentAnalysis[]
  progress?: PipelineProgress
  onStartAnalysis?: (config: any) => void
  onExportResults?: (format: "json" | "csv" | "xml") => void
}

/**
 * Simplified Content Intelligence Panel компонент
 */
export function ContentIntelligencePanel({ analysis = [], progress }: ContentIntelligencePanelProps) {
  const { t } = useTranslation()

  if (analysis.length === 0 && !progress) {
    return (
      <Card className="w-full">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-center text-muted-foreground">
            Начните анализ контента для получения AI инсайтов
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full space-y-4">
      {/* Progress */}
      {progress && (
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-lg">Прогресс анализа</CardTitle>
            <CardDescription>
              {progress.currentPhase} - {progress.status}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={(progress.completedSteps / progress.totalSteps) * 100} className="h-2" />
            <p className="mt-2 text-sm text-muted-foreground">
              Выполнено {progress.completedSteps} из {progress.totalSteps} шагов
            </p>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {analysis.length > 0 && (
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-lg">Результаты анализа</CardTitle>
            <CardDescription>Результаты AI анализа {analysis.length} файл(ов)</CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Analysis Results */}
      {analysis.map((result, index) => (
        <Card key={`analysis-${index}`} className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileVideo className="h-4 w-4" />
              {result.mediaFile.name}
            </CardTitle>
            <div className="flex gap-2">
              {result.metadata && (
                <>
                  <Badge variant="secondary">{result.metadata.format}</Badge>
                  <Badge variant="outline">
                    {result.metadata.width}x{result.metadata.height}
                  </Badge>
                  <Badge variant="outline">{Math.round(result.metadata.duration)}s</Badge>
                </>
              )}
              {result.quality && (
                <Badge variant={result.quality.overall >= 80 ? "default" : "secondary"}>
                  Quality: {result.quality.overall}%
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Video Information */}
            {result.metadata && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-1">
                  <FileVideo className="h-4 w-4" />
                  Информация о видео
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">FPS:</span> {result.metadata.fps}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Битрейт:</span>{" "}
                    {Math.round(result.metadata.bitrate / 1000)}k
                  </div>
                  <div>
                    <span className="text-muted-foreground">Кодек:</span> {result.metadata.codec || "N/A"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Аудио:</span>{" "}
                    {result.metadata.hasAudio ? "Да" : "Нет"}
                  </div>
                </div>
              </div>
            )}

            <Separator />

            {/* Quality Metrics */}
            {result.quality && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-1">
                  <Settings className="h-4 w-4" />
                  Метрики качества
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Общее качество:</span>
                    <div className="flex items-center gap-2">
                      <Progress value={result.quality.overall} className="w-20 h-2" />
                      <span className="text-xs font-medium">{result.quality.overall}%</span>
                    </div>
                  </div>
                  {result.quality.video && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Резкость:</span>
                        <span className="text-xs">{Math.round(result.quality.video.sharpness)}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Стабильность:</span>
                        <span className="text-xs">{Math.round(result.quality.video.stability)}%</span>
                      </div>
                    </>
                  )}
                </div>
                {result.quality.issues && result.quality.issues.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground">
                      Проблемы: {result.quality.issues.join(", ")}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Scene Detection */}
            {result.scenes && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-1">
                    <Layers className="h-4 w-4" />
                    Анализ сцен
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Обнаружено сцен: {result.scenes.scenes.length}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Метод: {result.scenes.method} (уверенность: {Math.round(result.scenes.confidence * 100)}%)
                  </p>
                </div>
              </>
            )}

            {/* Motion Analysis */}
            {result.motion && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Анализ движения</h4>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Интенсивность движения:</span>
                    <span className="text-sm">{result.motion.motionIntensity}%</span>
                  </div>
                  {result.motion.cameraMovement && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Движение камеры:</span>
                      <span className="text-sm">{result.motion.cameraMovement.type}</span>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Processing Info */}
            {result.processingTime && (
              <div className="text-xs text-muted-foreground mt-2">
                Время обработки: {result.processingTime}мс
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}