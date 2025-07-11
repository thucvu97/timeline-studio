import { useCallback, useState } from "react"

import { Download, Pause, Play, RotateCcw, SplitSquareHorizontal, X } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { VideoEffect } from "@/features/effects/types"

import { EffectComparison } from "./effect-comparison"
import { EffectIndicators } from "./effect-indicators"
import { EffectParameterControls } from "./effect-parameter-controls"
import { EffectPresets } from "./effect-presets"
import { EffectPreview } from "./effect-preview"
import { prepareEffectForExport, saveUserEffect } from "../utils/user-effects"

interface EffectDetailProps {
  effect: VideoEffect
  isOpen: boolean
  onClose: () => void
  onApplyEffect: (effect: VideoEffect, preset?: string, customParams?: Record<string, number>) => void
}

/**
 * Компонент для детального просмотра эффекта с возможностью настройки параметров
 */
export function EffectDetail({ effect, isOpen, onClose, onApplyEffect }: EffectDetailProps) {
  // Ранний возврат, если эффект не передан
  // if (!effect) return null;

  const { i18n, t } = useTranslation()
  const [selectedPreset, setSelectedPreset] = useState<string | undefined>()
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentParameters, setCurrentParameters] = useState<Record<string, number>>({})
  const [previewKey, setPreviewKey] = useState(0) // Для обновления превью
  const currentLang = i18n.language as "ru" | "en"

  // Обработчик применения пресета
  const handleApplyPreset = useCallback((presetName: string, params: Record<string, number>) => {
    setSelectedPreset(presetName)
    setCurrentParameters(params)
    setPreviewKey((prev) => prev + 1) // Обновляем превью
  }, [])

  // Обработчик изменения параметров
  const handleParametersChange = useCallback(
    (params: Record<string, number>) => {
      setCurrentParameters(params)
      setPreviewKey((prev) => prev + 1) // Обновляем превью
      // Сбрасываем выбранный пресет при ручном изменении
      if (selectedPreset) {
        setSelectedPreset(undefined)
      }
    },
    [selectedPreset],
  )

  // Обработчик сохранения пользовательского пресета
  const handleSavePreset = useCallback(
    (name: string, params: Record<string, number>) => {
      try {
        // Получаем существующие пресеты для этого эффекта
        const storageKey = `effect_presets_${effect.id}`
        const existingPresets = localStorage.getItem(storageKey)
        const presets = existingPresets ? JSON.parse(existingPresets) : {}

        // Добавляем новый пресет
        const presetId = `custom_${Date.now()}`
        presets[presetId] = {
          name: {
            [currentLang]: name,
            en: name, // fallback
          },
          params,
          description: {
            [currentLang]: t("effects.customPreset", "Пользовательский пресет"),
            en: "Custom preset",
          },
          createdAt: new Date().toISOString(),
        }

        // Сохраняем обратно в localStorage
        localStorage.setItem(storageKey, JSON.stringify(presets))

        // Уведомляем пользователя об успешном сохранении
        console.log("Custom preset saved:", name, params)

        // Обновляем состояние компонента, если нужно показать новый пресет
        // Можно добавить toast уведомление здесь
      } catch (error) {
        console.error("Error saving custom preset:", error)
      }
    },
    [effect.id, currentLang, t],
  )

  // Обработчик применения эффекта
  const handleApplyEffect = useCallback(() => {
    onApplyEffect(effect, selectedPreset, currentParameters)
    onClose()
  }, [effect, selectedPreset, currentParameters, onApplyEffect, onClose])

  // Обработчик сброса параметров
  const handleReset = useCallback(() => {
    setSelectedPreset(undefined)
    setCurrentParameters({})
    setPreviewKey((prev) => prev + 1)
  }, [])

  // Обработчик экспорта эффекта
  const handleExportEffect = useCallback(async () => {
    try {
      const exportName = prompt(t("effects.enterExportName", "Введите название файла для экспорта:"))
      if (!exportName) return

      const effectToExport = prepareEffectForExport(
        effect,
        Object.keys(currentParameters).length > 0 ? currentParameters : undefined,
        selectedPreset,
      )

      const filePath = await saveUserEffect(effectToExport, exportName)
      console.log("Effect exported to:", filePath)

      // Можем добавить toast уведомление об успешном экспорте
    } catch (error) {
      console.error("Error exporting effect:", error)
    }
  }, [effect, currentParameters, selectedPreset, t])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3">
              <span>{effect?.labels[currentLang] ?? effect?.labels?.en ?? "Unnamed effect"}</span>
              <EffectIndicators effect={effect} size="md" />
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X size={16} />
            </Button>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Левая колонка - Превью */}
          <div className="space-y-4">
            <Tabs defaultValue="preview" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="preview">{t("effects.preview", "Превью")}</TabsTrigger>
                <TabsTrigger value="comparison">
                  <SplitSquareHorizontal size={16} className="mr-2" />
                  {t("effects.comparison", "Сравнение")}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="preview" className="mt-4">
                <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
                  <EffectPreview
                    key={previewKey} // Обновляем превью при изменении параметров
                    effectType={effect?.type}
                    onClick={() => setIsPlaying(!isPlaying)}
                    size={400}
                    customParams={currentParameters} // Передаем текущие параметры
                  />

                  {/* Контролы воспроизведения */}
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                    <Button variant="secondary" size="sm" onClick={() => setIsPlaying(!isPlaying)}>
                      {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleReset}
                      title={t("effects.detail.resetToDefault", "Сбросить к значениям по умолчанию")}
                    >
                      <RotateCcw size={16} />
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="comparison" className="mt-4">
                <EffectComparison effect={effect} customParams={currentParameters} width={400} height={300} />
              </TabsContent>
            </Tabs>

            {/* Информация об эффекте */}
            <div className="space-y-2">
              <h3 className="font-medium">{t("effects.detail.description", "Описание")}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {effect?.description[currentLang] || effect?.description?.en}
              </p>
            </div>

            {/* Категория и теги */}
            <div className="space-y-2">
              <h3 className="font-medium">{t("effects.detail.category", "Категория")}</h3>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded">
                  {effect?.category}
                </span>
                {effect?.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Правая колонка - Настройки */}
          <div className="space-y-4">
            {/* Пресеты */}
            <EffectPresets effect={effect} onApplyPreset={handleApplyPreset} selectedPreset={selectedPreset} />

            {/* Интерактивные контролы параметров */}
            <EffectParameterControls
              effect={effect}
              onParametersChange={handleParametersChange}
              selectedPreset={selectedPreset}
              onSavePreset={handleSavePreset}
            />

            {/* FFmpeg команда */}
            <div className="space-y-2">
              <h3 className="font-medium">{t("effects.detail.ffmpegCommand", "FFmpeg команда")}</h3>
              <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono overflow-x-auto">
                {effect?.ffmpegCommand({
                  ...effect?.params,
                  ...currentParameters,
                })}
              </div>
            </div>

            <Separator />

            {/* Кнопки действий */}
            <div className="flex gap-2">
              <Button onClick={handleApplyEffect} className="flex-1">
                {t("effects.detail.applyEffect", "Применить эффект")}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleExportEffect}
                title={t("effects.detail.exportEffect", "Экспортировать эффект")}
              >
                <Download size={16} />
              </Button>
              <Button variant="outline" onClick={onClose}>
                {t("common.cancel", "Отмена")}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
