import { useEffect, useMemo, useState } from "react"

import { ChevronDown, ChevronRight, Settings, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { EffectPreset, VideoEffect } from "@/features/effects/types"

interface EffectPresetsProps {
  effect: VideoEffect
  onApplyPreset: (presetName: string, params: Record<string, number>) => void
  selectedPreset?: string
}

interface CustomPreset extends EffectPreset {
  createdAt?: string
}

/**
 * Компонент для отображения и выбора пресетов эффекта
 */
export function EffectPresets({ effect, onApplyPreset, selectedPreset }: EffectPresetsProps) {
  const { i18n, t } = useTranslation()
  const [isExpanded, setIsExpanded] = useState(false)
  const [customPresets, setCustomPresets] = useState<Record<string, CustomPreset>>({})
  const currentLang = i18n.language as "ru" | "en"

  // Загружаем пользовательские пресеты из localStorage
  useEffect(() => {
    const storageKey = `effect_presets_${effect.id}`
    const savedPresets = localStorage.getItem(storageKey)
    if (savedPresets) {
      try {
        setCustomPresets(JSON.parse(savedPresets))
      } catch (error) {
        console.error("Error loading custom presets:", error)
      }
    }
  }, [effect.id])

  // Объединяем встроенные и пользовательские пресеты
  const allPresets = useMemo(() => {
    const combined: Record<string, CustomPreset> = {}
    
    // Сначала добавляем встроенные пресеты
    if (effect.presets) {
      Object.entries(effect.presets).forEach(([key, preset]) => {
        combined[key] = preset
      })
    }
    
    // Затем добавляем пользовательские пресеты
    Object.entries(customPresets).forEach(([key, preset]) => {
      combined[key] = preset
    })
    
    return combined
  }, [effect.presets, customPresets])

  // Обработчик удаления пользовательского пресета
  const handleDeleteCustomPreset = (presetKey: string) => {
    const updatedPresets = { ...customPresets }
    delete updatedPresets[presetKey]
    setCustomPresets(updatedPresets)
    
    // Сохраняем обновленные пресеты в localStorage
    const storageKey = `effect_presets_${effect.id}`
    if (Object.keys(updatedPresets).length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(updatedPresets))
    } else {
      localStorage.removeItem(storageKey)
    }
  }

  if (Object.keys(allPresets).length === 0) {
    return null
  }

  const presetEntries = Object.entries(allPresets)

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
          {presetEntries.map(([presetKey, preset]) => {
            const isCustom = presetKey.startsWith("custom_")
            
            return (
              <div key={presetKey} className="space-y-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2">
                        <Button
                          variant={selectedPreset === presetKey ? "default" : "outline"}
                          size="sm"
                          className="flex-1 justify-start text-left h-auto py-2"
                          onClick={() => onApplyPreset(presetKey, preset.params)}
                        >
                          <div className="flex flex-col items-start">
                            <span className="font-medium">
                              {preset.name[currentLang] || preset.name.en}
                              {isCustom && (
                                <span className="ml-2 text-xs text-blue-500">
                                  {t("effects.customPreset", "Пользовательский")}
                                </span>
                              )}
                            </span>
                            <span className="text-xs text-gray-500 font-normal">
                              {preset.description[currentLang] || preset.description.en}
                            </span>
                          </div>
                        </Button>
                        {isCustom && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-1"
                            onClick={() => handleDeleteCustomPreset(presetKey)}
                            title={t("effects.deletePreset", "Удалить пресет")}
                          >
                            <Trash2 size={14} />
                          </Button>
                        )}
                      </div>
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
                        {isCustom && (preset).createdAt && (
                          <div className="text-xs text-gray-400">
                            {t("effects.createdAt", "Создано")}: {new Date((preset).createdAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
