/**
 * AI Marker Controls
 * Компонент для управления созданием маркеров из AI анализа
 */

import { useState } from "react"

import { AlertCircle, Bookmark, CheckCircle, Play, Settings, Sparkles, X } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import { useTimeline } from "../../hooks/use-timeline"
import { useTimelineAIAnalysis } from "../../hooks/use-timeline-ai-analysis"
import { type AIMarkerConfig, AIMarkerService } from "../../services/ai-marker-service"

interface AIMarkerControlsProps {
  className?: string
}

export function AIMarkerControls({ className }: AIMarkerControlsProps) {
  const aiAnalysis = useTimelineAIAnalysis()
  const { send } = useTimeline()

  const [showSettings, setShowSettings] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [lastResult, setLastResult] = useState<{
    success: boolean
    message: string
    markerCount?: number
  } | null>(null)

  // Конфигурация маркеров
  const [markerConfig, setMarkerConfig] = useState<AIMarkerConfig>({
    createSceneMarkers: true,
    createKeyMomentMarkers: true,
    createQualityMarkers: false,
    createEmotionalMarkers: true,
    minConfidence: 0.7,
    minSceneDuration: 2,
    minQualityScore: 80,
    groupNearbyMarkers: true,
    groupingThreshold: 2,
  })

  const [markerService] = useState(() => new AIMarkerService(markerConfig))

  // Генерация маркеров из текущего анализа
  const generateMarkers = async () => {
    const { sceneAnalysis, keyMoments, insights } = aiAnalysis.state

    if (!sceneAnalysis && keyMoments.length === 0) {
      setLastResult({
        success: false,
        message: "Нет данных анализа. Сначала проанализируйте Timeline.",
      })
      return
    }

    setIsGenerating(true)
    setGenerationProgress(0)
    setLastResult(null)

    try {
      markerService.updateConfig(markerConfig)
      let allMarkers: any[] = []

      // Создаем маркеры из сцен
      if (sceneAnalysis && markerConfig.createSceneMarkers) {
        setGenerationProgress(20)
        const sceneMarkers = markerService.createMarkersFromScenes(sceneAnalysis.scenes)
        allMarkers = [...allMarkers, ...sceneMarkers]
      }

      // Создаем маркеры из ключевых моментов
      if (keyMoments.length > 0 && markerConfig.createKeyMomentMarkers) {
        setGenerationProgress(40)
        const momentMarkers = markerService.createMarkersFromKeyMoments(keyMoments)
        allMarkers = [...allMarkers, ...momentMarkers]
      }

      // Создаем маркеры качества
      if (insights && markerConfig.createQualityMarkers) {
        setGenerationProgress(60)
        const qualityMarkers = markerService.createQualityMarkers(
          insights,
          [0, 30, 60], // Временные метки для примера
        )
        allMarkers = [...allMarkers, ...qualityMarkers]
      }

      // Создаем эмоциональные маркеры
      if (insights && markerConfig.createEmotionalMarkers) {
        setGenerationProgress(80)
        const emotionalMarkers = markerService.createEmotionalMarkers(insights, 15)
        allMarkers = [...allMarkers, ...emotionalMarkers]
      }

      // Группируем близкие маркеры
      if (markerConfig.groupNearbyMarkers && allMarkers.length > 1) {
        setGenerationProgress(90)
        allMarkers = markerService.groupNearbyMarkers(allMarkers)
      }

      // Добавляем маркеры в Timeline
      setGenerationProgress(95)
      allMarkers.forEach((marker) => {
        send({ type: "ADD_MARKER", marker })
      })

      setGenerationProgress(100)
      setLastResult({
        success: true,
        message: `Создано ${allMarkers.length} маркеров`,
        markerCount: allMarkers.length,
      })

      // Скрываем прогресс через 2 секунды
      setTimeout(() => {
        setIsGenerating(false)
        setGenerationProgress(0)
      }, 2000)
    } catch (error) {
      console.error("Failed to generate markers:", error)
      setLastResult({
        success: false,
        message: "Ошибка при создании маркеров",
      })
      setIsGenerating(false)
      setGenerationProgress(0)
    }
  }

  // Обновление конфигурации
  const updateConfig = (key: keyof AIMarkerConfig, value: any) => {
    setMarkerConfig((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <>
      <TooltipProvider>
        <div className={className}>
          <div className="flex items-center gap-2">
            {/* Основная кнопка генерации */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generateMarkers}
                  disabled={isGenerating || aiAnalysis.state.isAnalyzing}
                  className="gap-2"
                >
                  {isGenerating ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Создание...
                    </>
                  ) : (
                    <>
                      <Bookmark className="h-4 w-4" />
                      <Sparkles className="h-3 w-3" />
                      AI Маркеры
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Создать маркеры из AI анализа</TooltipContent>
            </Tooltip>

            {/* Кнопка настроек */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={() => setShowSettings(true)}>
                  <Settings className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Настройки генерации маркеров</TooltipContent>
            </Tooltip>
          </div>

          {/* Индикатор прогресса */}
          {isGenerating && (
            <div className="mt-2">
              <Progress value={generationProgress} className="h-1 w-32" />
            </div>
          )}

          {/* Результат генерации */}
          {lastResult && !isGenerating && (
            <Alert className="mt-2" variant={lastResult.success ? "default" : "destructive"}>
              {lastResult.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <AlertDescription className="flex items-center justify-between">
                <span>{lastResult.message}</span>
                <Button variant="ghost" size="sm" onClick={() => setLastResult(null)} className="h-6 w-6 p-0">
                  <X className="h-3 w-3" />
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </div>
      </TooltipProvider>

      {/* Диалог настроек */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Настройки AI маркеров</DialogTitle>
            <DialogDescription>Настройте параметры автоматического создания маркеров</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Типы маркеров */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Типы маркеров</h4>

              <div className="flex items-center justify-between">
                <Label htmlFor="scene-markers">Маркеры смены сцен</Label>
                <Switch
                  id="scene-markers"
                  checked={markerConfig.createSceneMarkers}
                  onCheckedChange={(checked) => updateConfig("createSceneMarkers", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="moment-markers">Ключевые моменты</Label>
                <Switch
                  id="moment-markers"
                  checked={markerConfig.createKeyMomentMarkers}
                  onCheckedChange={(checked) => updateConfig("createKeyMomentMarkers", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="quality-markers">Маркеры качества</Label>
                <Switch
                  id="quality-markers"
                  checked={markerConfig.createQualityMarkers}
                  onCheckedChange={(checked) => updateConfig("createQualityMarkers", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="emotion-markers">Эмоциональные маркеры</Label>
                <Switch
                  id="emotion-markers"
                  checked={markerConfig.createEmotionalMarkers}
                  onCheckedChange={(checked) => updateConfig("createEmotionalMarkers", checked)}
                />
              </div>
            </div>

            {/* Пороги */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Пороговые значения</h4>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Минимальная уверенность</Label>
                  <span className="text-sm text-muted-foreground">{Math.round(markerConfig.minConfidence * 100)}%</span>
                </div>
                <Slider
                  value={[markerConfig.minConfidence]}
                  onValueChange={([value]) => updateConfig("minConfidence", value)}
                  min={0.5}
                  max={1}
                  step={0.05}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Минимальная длительность сцены</Label>
                  <span className="text-sm text-muted-foreground">{markerConfig.minSceneDuration}с</span>
                </div>
                <Slider
                  value={[markerConfig.minSceneDuration]}
                  onValueChange={([value]) => updateConfig("minSceneDuration", value)}
                  min={0.5}
                  max={10}
                  step={0.5}
                />
              </div>
            </div>

            {/* Группировка */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Группировка</h4>

              <div className="flex items-center justify-between">
                <Label htmlFor="group-markers">Группировать близкие маркеры</Label>
                <Switch
                  id="group-markers"
                  checked={markerConfig.groupNearbyMarkers}
                  onCheckedChange={(checked) => updateConfig("groupNearbyMarkers", checked)}
                />
              </div>

              {markerConfig.groupNearbyMarkers && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Порог группировки</Label>
                    <span className="text-sm text-muted-foreground">{markerConfig.groupingThreshold}с</span>
                  </div>
                  <Slider
                    value={[markerConfig.groupingThreshold]}
                    onValueChange={([value]) => updateConfig("groupingThreshold", value)}
                    min={0.5}
                    max={5}
                    step={0.5}
                  />
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettings(false)}>
              Закрыть
            </Button>
            <Button
              onClick={() => {
                void generateMarkers()
                setShowSettings(false)
              }}
            >
              <Play className="h-4 w-4 mr-2" />
              Создать маркеры
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
