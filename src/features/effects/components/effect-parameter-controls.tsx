import { useCallback, useEffect, useState } from "react"

import { RotateCcw, Save } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { VideoEffect } from "@/features/effects/types"

interface EffectParameterControlsProps {
  effect: VideoEffect
  onParametersChange: (params: Record<string, number>) => void
  selectedPreset?: string
  onSavePreset?: (name: string, params: Record<string, number>) => void
}

// Конфигурация параметров с их диапазонами и описаниями
const PARAMETER_CONFIG = {
  intensity: {
    min: 0,
    max: 100,
    step: 1,
    default: 50,
    label: { ru: "Интенсивность", en: "Intensity" },
    description: { ru: "Сила применения эффекта", en: "Effect strength" },
  },
  speed: {
    min: 0.1,
    max: 5.0,
    step: 0.1,
    default: 1.0,
    label: { ru: "Скорость", en: "Speed" },
    description: { ru: "Скорость воспроизведения", en: "Playback speed" },
  },
  angle: {
    min: 0,
    max: 360,
    step: 1,
    default: 0,
    label: { ru: "Угол", en: "Angle" },
    description: {
      ru: "Угол поворота в градусах",
      en: "Rotation angle in degrees",
    },
  },
  radius: {
    min: 0,
    max: 50,
    step: 0.5,
    default: 5,
    label: { ru: "Радиус", en: "Radius" },
    description: {
      ru: "Радиус размытия или эффекта",
      en: "Blur or effect radius",
    },
  },
  amount: {
    min: 0,
    max: 200,
    step: 1,
    default: 100,
    label: { ru: "Количество", en: "Amount" },
    description: { ru: "Количество эффекта", en: "Effect amount" },
  },
  threshold: {
    min: 0,
    max: 100,
    step: 1,
    default: 50,
    label: { ru: "Порог", en: "Threshold" },
    description: { ru: "Пороговое значение", en: "Threshold value" },
  },
  temperature: {
    min: -100,
    max: 100,
    step: 1,
    default: 0,
    label: { ru: "Температура", en: "Temperature" },
    description: { ru: "Цветовая температура", en: "Color temperature" },
  },
  tint: {
    min: -100,
    max: 100,
    step: 1,
    default: 0,
    label: { ru: "Оттенок", en: "Tint" },
    description: { ru: "Цветовой оттенок", en: "Color tint" },
  },
} as const

/**
 * Компонент для интерактивной настройки параметров эффекта
 */
export function EffectParameterControls({
  effect,
  onParametersChange,
  selectedPreset,
  onSavePreset,
}: EffectParameterControlsProps) {
  const { i18n, t } = useTranslation()
  const currentLang = i18n.language as "ru" | "en"

  // Состояние параметров
  const [parameters, setParameters] = useState<Record<string, number>>(() => {
    // Инициализируем значениями по умолчанию или из эффекта
    const defaultParams: Record<string, number> = {}

    if (effect.params) {
      Object.keys(effect.params).forEach((key) => {
        const config = PARAMETER_CONFIG[key as keyof typeof PARAMETER_CONFIG]
        const paramKey = key as keyof typeof effect.params
        defaultParams[key] = effect.params![paramKey] ?? config?.default ?? 0
      })
    }

    return defaultParams
  })

  // Обновляем параметры при смене пресета
  useEffect(() => {
    if (selectedPreset && effect.presets?.[selectedPreset]) {
      const presetParams = effect.presets[selectedPreset].params
      setParameters(presetParams)
      onParametersChange(presetParams)
    }
  }, [selectedPreset, effect.presets, onParametersChange])

  // Обработчик изменения параметра
  const handleParameterChange = useCallback(
    (paramName: string, value: number[]) => {
      const newValue = value[0]
      const newParameters = { ...parameters, [paramName]: newValue }
      setParameters(newParameters)
      onParametersChange(newParameters)
    },
    [parameters, onParametersChange],
  )

  // Сброс к значениям по умолчанию
  const handleReset = useCallback(() => {
    const defaultParams: Record<string, number> = {}

    if (effect.params) {
      Object.keys(effect.params).forEach((key) => {
        const config = PARAMETER_CONFIG[key as keyof typeof PARAMETER_CONFIG]
        defaultParams[key] = config?.default ?? 0
      })
    }

    setParameters(defaultParams)
    onParametersChange(defaultParams)
  }, [effect.params, onParametersChange])

  // Сохранение пользовательского пресета
  const handleSavePreset = useCallback(() => {
    if (onSavePreset) {
      const presetName = `custom_${Date.now()}`
      onSavePreset(presetName, parameters)
    }
  }, [onSavePreset, parameters])

  // Если у эффекта нет параметров, не показываем контролы
  if (!effect.params || Object.keys(effect.params).length === 0) {
    return null
  }

  const availableParams = Object.keys(effect.params)

  return (
    <div className="space-y-4">
      {/* Заголовок с кнопками действий */}
      <div className="flex items-center justify-between">
        <h3 className="font-medium">{t("effects.detail.parameters", "Параметры")}</h3>
        <div className="flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={handleReset}>
                  <RotateCcw size={14} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("effects.detail.resetToDefault", "Сбросить к значениям по умолчанию")}</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {onSavePreset && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={handleSavePreset}>
                    <Save size={14} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("effects.detail.savePreset", "Сохранить как пресет")}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      {/* Контролы параметров */}
      <div className="space-y-4">
        {availableParams.map((paramName) => {
          const config = PARAMETER_CONFIG[paramName as keyof typeof PARAMETER_CONFIG]
          if (!config) return null

          const currentValue = parameters[paramName] ?? config.default

          return (
            <div key={paramName} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">{config.label[currentLang] || config.label.en}</Label>
                <span className="text-sm text-gray-500 font-mono">{currentValue}</span>
              </div>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Slider
                        value={[currentValue]}
                        onValueChange={(value) => handleParameterChange(paramName, value)}
                        min={config.min}
                        max={config.max}
                        step={config.step}
                        className="w-full"
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-center">
                      <div className="font-medium">{config.label[currentLang] || config.label.en}</div>
                      <div className="text-sm text-gray-400">
                        {config.description[currentLang] || config.description.en}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {config.min} - {config.max}
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )
        })}
      </div>

      {/* Информация о текущих параметрах */}
      <div className="text-xs text-gray-500 space-y-1">
        <div>{t("effects.detail.currentValues", "Текущие значения")}:</div>
        <div className="font-mono bg-gray-50 dark:bg-gray-800 p-2 rounded">
          {Object.entries(parameters).map(([key, value]) => (
            <div key={key}>
              {key}: {value}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
