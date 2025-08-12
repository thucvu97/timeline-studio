import { CheckCircle, Download, HardDrive, Loader2 } from "lucide-react"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useWhisperModels } from "../hooks/use-transcription"

export function ModelSelector() {
  const { t } = useTranslation()
  const { models, isLoading, downloadProgress, loadModels, downloadModel } = useWhisperModels()

  useEffect(() => {
    loadModels()
  }, [loadModels])

  const getModelDescription = (name: string): string => {
    const descriptions: Record<string, string> = {
      tiny: "Самая быстрая, базовое качество",
      "tiny.en": "Самая быстрая, только английский",
      base: "Хороший баланс скорости и качества",
      "base.en": "Хороший баланс, только английский",
      small: "Улучшенное качество",
      "small.en": "Улучшенное качество, только английский",
      medium: "Высокое качество",
      "medium.en": "Высокое качество, только английский",
      "large-v1": "Превосходное качество (v1)",
      "large-v2": "Превосходное качество (v2)",
      "large-v3": "Лучшее качество (последняя версия)",
    }
    return descriptions[name] || ""
  }

  const formatSize = (size: string): string => {
    // Размер уже отформатирован (например, "39M", "1.5G")
    return size
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        {t("transcription.modelsDescription", "Скачайте модели для локальной транскрипции")}
      </div>

      <div className="space-y-2">
        {models.map((model) => {
          const isDownloading = downloadProgress[model.name] !== undefined
          const progress = downloadProgress[model.name] || 0

          return (
            <div key={model.name} className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{model.name}</h4>
                  <Badge variant="secondary" className="text-xs">
                    {formatSize(model.size)}
                  </Badge>
                  {model.englishOnly && (
                    <Badge variant="outline" className="text-xs">
                      EN only
                    </Badge>
                  )}
                  {model.isDownloaded && <CheckCircle className="h-4 w-4 text-green-500" />}
                </div>
                <p className="text-sm text-muted-foreground">{getModelDescription(model.name)}</p>
                {isDownloading && <Progress value={progress} className="h-2" />}
              </div>

              <div className="ml-4">
                {model.isDownloaded ? (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <HardDrive className="h-4 w-4" />
                    {t("transcription.downloaded", "Скачано")}
                  </div>
                ) : isDownloading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">{Math.round(progress)}%</span>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => downloadModel(model.name)}>
                    <Download className="mr-2 h-4 w-4" />
                    {t("transcription.download", "Скачать")}
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="rounded-lg bg-muted p-3">
        <p className="text-sm text-muted-foreground">
          <strong>{t("transcription.tip", "Совет")}:</strong>{" "}
          {t(
            "transcription.modelTip",
            "Для большинства задач модель 'base' обеспечивает хороший баланс между скоростью и качеством. Используйте 'large' модели для максимальной точности.",
          )}
        </p>
      </div>
    </div>
  )
}
