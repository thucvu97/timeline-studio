import { useState } from "react"

import { ChevronDown, ChevronRight, Settings } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { VideoEffect } from "@/features/effects/types/effects"

interface EffectPresetsProps {
  effect: VideoEffect
  onApplyPreset: (presetName: string, params: Record<string, number>) => void
  selectedPreset?: string
}

/**
 * Компонент для отображения и выбора пресетов эффекта
 */
export function EffectPresets({ effect, onApplyPreset, selectedPreset }: EffectPresetsProps) {
  const { i18n, t } = useTranslation()
  const [isExpanded, setIsExpanded] = useState(false)
  const currentLang = i18n.language as "ru" | "en"

  if (!effect.presets || Object.keys(effect.presets).length === 0) {
    return null
  }

  const presetEntries = Object.entries(effect.presets)

  return (
    <div className="border rounded-lg">
      {/* Заголовок с кнопкой разворачивания */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <Settings size={16} />
          <span className="text-sm font-medium">{t("effects.detail.presets", "Пресеты")}</span>
          <span className="text-xs text-gray-500">({presetEntries.length})</span>
        </div>
      </button>

      {/* Список пресетов */}
      {isExpanded && (
        <div className="border-t p-2 space-y-2">
          {presetEntries.map(([presetKey, preset]) => (
            <div key={presetKey} className="space-y-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={selectedPreset === presetKey ? "default" : "outline"}
                      size="sm"
                      className="w-full justify-start text-left h-auto py-2"
                      onClick={() => onApplyPreset(presetKey, preset.params)}
                    >
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{preset.name[currentLang] || preset.name.en}</span>
                        <span className="text-xs text-gray-500 font-normal">
                          {preset.description[currentLang] || preset.description.en}
                        </span>
                      </div>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <div className="space-y-1">
                      <div className="font-medium">{preset.name[currentLang] || preset.name.en}</div>
                      <div className="text-sm">{preset.description[currentLang] || preset.description.en}</div>
                      <div className="text-xs text-gray-400">
                        {t("effects.detail.parameters", "Параметры")}:{" "}
                        {Object.entries(preset.params)
                          .map(([key, value]) => `${key}: ${value}`)
                          .join(", ")}
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
