/**
 * Content Intelligence Panel - UI для новых AI возможностей
 *
 * Панель для отображения результатов Content Intelligence анализа
 * прямо в AI Chat интерфейсе.
 */

import { Airplay, Bot, FileVideo, Layers, Settings, Sparkles, Target } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import type { PipelineProgress } from "../../ai-content-intelligence/unified-pipeline/unified-content-pipeline"
import { UnifiedContentAnalysis } from "../services/content-intelligence-service"

interface ContentIntelligencePanelProps {
  analysis?: UnifiedContentAnalysis[]
  progress?: PipelineProgress
  onStartAnalysis?: (config: any) => void
  onExportResults?: (format: "json" | "csv" | "xml") => void
}

/**
 * Content Intelligence Panel компонент
 */
export function ContentIntelligencePanel({
  analysis,
  progress,
  onStartAnalysis,
  onExportResults,
}: ContentIntelligencePanelProps) {
  const { t } = useTranslation()
  const [selectedTab, setSelectedTab] = useState("overview")

  // Если есть прогресс pipeline
  if (progress && progress.status === "running") {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-teal" />
            Content Intelligence Analysis
          </CardTitle>
          <CardDescription>Анализируем ваш контент с помощью AI...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Текущий этап: {progress.currentStage}</span>
              <span>{Math.round(progress.progress)}%</span>
            </div>
            <Progress value={progress.progress} className="w-full" />
            <div className="text-xs text-muted-foreground">
              Завершено этапов: {progress.completedStages.length} из {progress.totalStages}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Если анализ завершен
  if (analysis && analysis.length > 0) {
    return (
      <div className="w-full space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-teal" />
              Content Intelligence Results
            </CardTitle>
            <CardDescription>Результаты AI анализа {analysis.length} файл(ов)</CardDescription>
          </CardHeader>
        </Card>

        {analysis.map((result, _index) => (
          <Card key={result.id} className="w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileVideo className="h-4 w-4" />
                {result.mediaFile.filename}
              </CardTitle>
              <div className="flex gap-2">
                <Badge variant="secondary">{result.classification.genre}</Badge>
                <Badge variant="outline">{result.classification.audience}</Badge>
                {result.classification.technicalQuality && (
                  <Badge variant={result.classification.technicalQuality === "excellent" ? "default" : "secondary"}>
                    {result.classification.technicalQuality}
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent>
              <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Обзор</TabsTrigger>
                  <TabsTrigger value="scenes">Сцены</TabsTrigger>
                  <TabsTrigger value="platforms">Платформы</TabsTrigger>
                  <TabsTrigger value="insights">Рекомендации</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Классификация */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium flex items-center gap-1">
                        <Target className="h-4 w-4" />
                        Классификация
                      </h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Жанр:</span>
                          <span>{result.classification.genre}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Стиль:</span>
                          <span>{result.classification.style}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Эмоция:</span>
                          <span>{result.classification.emotion}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Аудитория:</span>
                          <span>{result.classification.audience}</span>
                        </div>
                      </div>
                    </div>

                    {/* Качество */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium flex items-center gap-1">
                        <Settings className="h-4 w-4" />
                        Метрики качества
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Техническое:</span>
                          <div className="flex items-center gap-2">
                            <Progress value={result.qualityMetrics.technical.overallScore * 10} className="w-16 h-2" />
                            <span className="text-xs">{result.qualityMetrics.technical.overallScore}/10</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Повествование:</span>
                          <div className="flex items-center gap-2">
                            <Progress value={result.qualityMetrics.narrative.overallScore * 10} className="w-16 h-2" />
                            <span className="text-xs">{result.qualityMetrics.narrative.overallScore}/10</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Вовлеченность:</span>
                          <div className="flex items-center gap-2">
                            <Progress value={result.qualityMetrics.engagement.overallScore * 10} className="w-16 h-2" />
                            <span className="text-xs">{result.qualityMetrics.engagement.overallScore}/10</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Доступность:</span>
                          <div className="flex items-center gap-2">
                            <Progress
                              value={result.qualityMetrics.accessibility.overallScore * 10}
                              className="w-16 h-2"
                            />
                            <span className="text-xs">{result.qualityMetrics.accessibility.overallScore}/10</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="scenes" className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium flex items-center gap-1">
                      <Layers className="h-4 w-4" />
                      Анализ сцен ({result.scenes.length})
                    </h4>

                    {result.scenes.length > 0 ? (
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {result.scenes.slice(0, 5).map((scene, _sceneIndex) => (
                          <div key={scene.id} className="p-3 rounded-lg border bg-muted/50">
                            <div className="flex justify-between items-start mb-2">
                              <Badge variant="outline" className="text-xs">
                                {scene.type}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {scene.startTime}s - {scene.endTime}s
                              </span>
                            </div>
                            <p className="text-sm">{scene.description}</p>
                            <div className="mt-2 flex justify-between items-center">
                              <span className="text-xs text-muted-foreground">
                                Уверенность: {Math.round(scene.confidence * 100)}%
                              </span>
                              {scene.keyFrames && scene.keyFrames.length > 0 && (
                                <span className="text-xs text-muted-foreground">
                                  {scene.keyFrames.length} ключевых кадров
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                        {result.scenes.length > 5 && (
                          <div className="text-center text-sm text-muted-foreground">
                            И еще {result.scenes.length - 5} сцен...
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground text-center py-4">Сцены не найдены</div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="platforms" className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium flex items-center gap-1">
                      <Airplay className="h-4 w-4" />
                      Адаптация под платформы
                    </h4>

                    {result.platformVariants && result.platformVariants.length > 0 ? (
                      <div className="space-y-3">
                        {result.platformVariants.map((variant, variantIndex) => (
                          <div
                            key={`${variant.platform}-${variantIndex}`}
                            className="p-3 rounded-lg border bg-muted/50"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <Badge className="capitalize">{variant.platform}</Badge>
                              {variant.seoData && (
                                <span className="text-xs text-muted-foreground">SEO оптимизирован</span>
                              )}
                            </div>

                            {variant.adaptations && variant.adaptations.length > 0 && (
                              <div className="space-y-1">
                                {variant.adaptations.slice(0, 3).map((adaptation: any, adaptIndex: number) => (
                                  <div key={adaptIndex} className="text-xs">
                                    <span className="font-medium">{adaptation.type}:</span>
                                    <span className="text-muted-foreground ml-1">{adaptation.reason}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground text-center py-4">
                        Адаптации под платформы не созданы
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="insights" className="space-y-4">
                  <div className="space-y-4">
                    {/* Сильные стороны */}
                    {result.insights.strengths.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-green-400">✓ Сильные стороны</h4>
                        <ul className="space-y-1">
                          {result.insights.strengths.map((strength, index) => (
                            <li key={index} className="text-sm text-muted-foreground">
                              • {strength}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Слабые стороны */}
                    {result.insights.weaknesses.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-orange-400">⚠ Области для улучшения</h4>
                        <ul className="space-y-1">
                          {result.insights.weaknesses.map((weakness, index) => (
                            <li key={index} className="text-sm text-muted-foreground">
                              • {weakness}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <Separator />

                    {/* Рекомендации */}
                    {result.insights.recommendations.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-blue-400">💡 Рекомендации</h4>
                        <div className="space-y-3">
                          {result.insights.recommendations.slice(0, 3).map((rec, index) => (
                            <div key={index} className="p-3 rounded-lg border bg-muted/50">
                              <div className="flex justify-between items-start mb-1">
                                <span className="text-sm font-medium">{rec.title}</span>
                                <Badge
                                  variant={
                                    rec.priority === "high"
                                      ? "destructive"
                                      : rec.priority === "medium"
                                        ? "default"
                                        : "secondary"
                                  }
                                  className="text-xs"
                                >
                                  {rec.priority}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">{rec.description}</p>
                              {rec.estimatedImpact && (
                                <div className="mt-2 text-xs">
                                  <span className="font-medium">Ожидаемый эффект:</span>
                                  <span className="ml-1 text-muted-foreground">{rec.estimatedImpact}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Маркетинговые углы */}
                    {result.insights.marketingAngles.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-purple-400">🎯 Маркетинговые углы</h4>
                        <div className="flex flex-wrap gap-1">
                          {result.insights.marketingAngles.map((angle, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {angle}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              {/* Действия */}
              <div className="mt-4 pt-4 border-t flex gap-2">
                <Button size="sm" variant="outline" onClick={() => onExportResults?.("json")} className="text-xs">
                  Экспорт JSON
                </Button>
                <Button size="sm" variant="outline" onClick={() => onExportResults?.("csv")} className="text-xs">
                  Экспорт CSV
                </Button>
                {result.script && (
                  <Button size="sm" variant="outline" className="text-xs">
                    Посмотреть сценарий
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // Стартовый экран
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-teal" />
          Content Intelligence
        </CardTitle>
        <CardDescription>
          Комплексный AI анализ видео контента с генерацией сценариев и адаптацией под платформы
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <div className="font-medium">Scene Analysis</div>
              <div className="text-muted-foreground">Детекция сцен, классификация типов</div>
            </div>
            <div className="space-y-1">
              <div className="font-medium">Script Generation</div>
              <div className="text-muted-foreground">Автоматическая генерация сценариев</div>
            </div>
            <div className="space-y-1">
              <div className="font-medium">Content Classification</div>
              <div className="text-muted-foreground">Анализ жанра, аудитории, настроения</div>
            </div>
            <div className="space-y-1">
              <div className="font-medium">Platform Adaptation</div>
              <div className="text-muted-foreground">Оптимизация под YouTube, TikTok, Instagram</div>
            </div>
          </div>

          <Separator />

          <div className="text-xs text-muted-foreground">
            Используйте команды вроде: &quot;Проанализируй это видео&quot;, &quot;Создай сценарий для TikTok&quot;,
            &quot;Адаптируй под все платформы&quot;
          </div>

          <Button className="w-full" onClick={() => onStartAnalysis?.({})} variant="outline">
            <Bot className="h-4 w-4 mr-2" />
            Начать анализ
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default ContentIntelligencePanel
