import { useCallback, useEffect, useMemo, useRef } from "react"

import { useTranslation } from "react-i18next"

import { useFavorites } from "@/features/app-state"
import { NoFiles } from "@/features/browser/components/no-files"
import { useBrowserState } from "@/features/browser/services/browser-state-provider"
import { VideoEffect } from "@/features/effects/types"
import { PREVIEW_SIZES } from "@/features/media/utils/preview-sizes"
import { useProjectSettings } from "@/features/project-settings"

import { EffectGroup } from "./effect-group"
import { useEffects } from "../hooks/use-effects"

/**
 * Компонент для отображения списка эффектов
 * Предоставляет интерфейс для просмотра, поиска и фильтрации видеоэффектов
 */
export function EffectList() {
  const { t } = useTranslation() // Хук для интернационализации
  const { effects, loading, error } = useEffects() // Хук для загрузки эффектов

  const { isItemFavorite } = useFavorites() // Хук для доступа к избранным эффектам

  // Используем общий провайдер состояния браузера
  const { currentTabSettings } = useBrowserState()

  // Извлекаем настройки для эффектов
  const { searchQuery, showFavoritesOnly, sortBy, sortOrder, groupBy, filterType, previewSizeIndex } =
    currentTabSettings

  // Получаем настройки проекта для соотношения сторон
  const { settings } = useProjectSettings()

  // Получаем текущий размер превью из массива
  const basePreviewSize = PREVIEW_SIZES[previewSizeIndex]

  // Refs для навигации клавиатурой
  const effectRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const focusedIndexRef = useRef<number>(-1)

  // Вычисляем размеры превью с учетом соотношения сторон проекта
  const previewDimensions = useMemo(() => {
    const aspectRatio = settings.aspectRatio.value
    const ratio = aspectRatio.width / aspectRatio.height

    let width: number
    let height: number

    if (ratio >= 1) {
      // Горизонтальное или квадратное видео
      width = basePreviewSize
      height = Math.round(basePreviewSize / ratio)
    } else {
      // Вертикальное видео
      height = basePreviewSize
      width = Math.round(basePreviewSize * ratio)
    }

    return { width, height }
  }, [basePreviewSize, settings.aspectRatio])

  /**
   * Фильтрация, сортировка и группировка эффектов
   * @returns {VideoEffect[]} Обработанный массив эффектов
   */
  const processedEffects = (() => {
    // 1. Фильтрация
    const filtered = effects.filter((effect) => {
      // Фильтрация по поисковому запросу
      const matchesSearch =
        !searchQuery ||
        effect.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (effect.labels?.ru || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (effect.labels?.en || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (effect.description?.ru || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (effect.description?.en || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (effect.tags || []).some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

      // Фильтрация по избранному
      const matchesFavorites = !showFavoritesOnly || isItemFavorite(effect, "effect")

      // Фильтрация по типу (сложность или категория)
      const matchesFilter = (() => {
        if (filterType === "all") return true

        // Фильтрация по сложности
        if (["basic", "intermediate", "advanced"].includes(filterType)) {
          return (effect.complexity || "basic") === filterType
        }

        // Фильтрация по категории
        if (
          ["color-correction", "artistic", "vintage", "cinematic", "creative", "technical", "distortion"].includes(
            filterType,
          )
        ) {
          return effect.category === filterType
        }

        return true
      })()

      // Эффект должен соответствовать всем условиям
      return matchesSearch && matchesFavorites && matchesFilter
    })

    // 2. Сортировка
    filtered.sort((a, b) => {
      let result = 0

      switch (sortBy) {
        case "name":
          const nameA = a.name.toLowerCase()
          const nameB = b.name.toLowerCase()
          result = nameA.localeCompare(nameB)
          break

        case "complexity":
          // Определяем порядок сложности: basic < intermediate < advanced
          const complexityOrder = { basic: 0, intermediate: 1, advanced: 2 }
          const complexityA = complexityOrder[a.complexity || "basic"]
          const complexityB = complexityOrder[b.complexity || "basic"]
          result = complexityA - complexityB
          break

        case "category":
          const categoryA = (a.category || "").toLowerCase()
          const categoryB = (b.category || "").toLowerCase()
          result = categoryA.localeCompare(categoryB)
          break

        default:
          result = 0
      }

      return sortOrder === "asc" ? result : -result
    })

    return filtered
  })()

  /**
   * Группировка эффектов по выбранному критерию
   */
  const groupedEffects = useMemo(() => {
    if (groupBy === "none") {
      return [{ title: "", effects: processedEffects }]
    }

    const groups: Record<string, VideoEffect[]> = {}

    processedEffects.forEach((effect) => {
      let groupKey = ""

      switch (groupBy) {
        case "category":
          groupKey = effect.category || "other"
          break
        case "complexity":
          groupKey = effect.complexity || "basic"
          break
        case "type":
          groupKey = effect.type || "unknown"
          break
        case "tags":
          // Группируем по первому тегу или "untagged"
          groupKey = effect.tags && effect.tags.length > 0 ? effect.tags[0] : "untagged"
          break
        default:
          groupKey = "ungrouped"
      }

      if (!groups[groupKey]) {
        groups[groupKey] = []
      }
      groups[groupKey].push(effect)
    })

    // Преобразуем в массив групп с переводами заголовков
    return Object.entries(groups)
      .map(([key, effects]) => {
        let title = ""

        switch (groupBy) {
          case "category":
            title = t(`effects.categories.${key}`, key)
            break
          case "complexity":
            title = t(`effects.complexity.${key}`, key)
            break
          case "type":
            title = t(`effects.names.${key}`, key)
            break
          case "tags":
            title = key === "untagged" ? t("effects.filters.allTags", "Без тегов") : key
            break
          default:
            title = key
        }

        return { title, effects }
      })
      .sort((a, b) => a.title.localeCompare(b.title))
  }, [processedEffects, groupBy, t])

  /**
   * Обработчик клика по эффекту
   * В текущей реализации только выводит информацию в консоль
   */
  const handleEffectClick = useCallback((effect: VideoEffect, index: number) => {
    console.log("Applying effect:", effect.name) // Отладочный вывод
    focusedIndexRef.current = index
    // Здесь может быть логика применения эффекта к видео
  }, [])

  /**
   * Обработчик навигации клавиатурой
   */
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const allEffects = processedEffects
      const currentIndex = focusedIndexRef.current

      let newIndex = currentIndex

      switch (event.key) {
        case "ArrowRight":
          event.preventDefault()
          newIndex = Math.min(currentIndex + 1, allEffects.length - 1)
          break

        case "ArrowLeft":
          event.preventDefault()
          newIndex = Math.max(currentIndex - 1, 0)
          break

        case "ArrowDown":
          event.preventDefault()
          // Переход на следующую строку (зависит от количества колонок)
          const itemsPerRow = Math.floor(window.innerWidth / (basePreviewSize + 16)) // 16px - отступы
          newIndex = Math.min(currentIndex + itemsPerRow, allEffects.length - 1)
          break

        case "ArrowUp":
          event.preventDefault()
          const itemsPerRowUp = Math.floor(window.innerWidth / (basePreviewSize + 16))
          newIndex = Math.max(currentIndex - itemsPerRowUp, 0)
          break

        case "Enter":
        case " ":
          event.preventDefault()
          if (currentIndex >= 0 && currentIndex < allEffects.length) {
            handleEffectClick(allEffects[currentIndex], currentIndex)
          }
          break

        case "Tab":
          // Позволяем Tab работать по умолчанию для навигации между элементами
          if (event.shiftKey) {
            newIndex = Math.max(currentIndex - 1, 0)
          } else {
            newIndex = Math.min(currentIndex + 1, allEffects.length - 1)
          }
          break

        default:
          return
      }

      if (newIndex !== currentIndex && newIndex >= 0 && newIndex < allEffects.length) {
        focusedIndexRef.current = newIndex
        const effectId = allEffects[newIndex].id
        const element = effectRefs.current.get(effectId)

        if (element) {
          element.focus()
          element.scrollIntoView({ behavior: "smooth", block: "nearest" })
        }
      }
    },
    [processedEffects, handleEffectClick, basePreviewSize],
  )

  // Добавляем слушатель клавиатуры
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  // Показываем индикатор загрузки
  if (loading) {
    return (
      <div className="flex h-full flex-1 flex-col bg-background">
        <div className="flex h-32 items-center justify-center text-gray-500">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900" />
            {t("common.loading")}...
          </div>
        </div>
      </div>
    )
  }

  // Показываем ошибку загрузки
  if (error) {
    return (
      <div className="flex h-full flex-1 flex-col bg-background">
        <div className="flex h-32 items-center justify-center text-red-500">
          <div className="text-center">
            <div className="text-sm font-medium">Ошибка загрузки эффектов</div>
            <div className="text-xs mt-1">{error}</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-1 flex-col bg-background">
      {/* Сетка эффектов */}
      <div className="flex-1 overflow-y-auto p-3">
        {/* Отображение сгруппированных эффектов */}
        <div className="space-y-4">
          {groupedEffects.map((group, groupIndex) => {
            // Вычисляем начальный индекс для группы
            let startIndex = 0
            for (let i = 0; i < groupIndex; i++) {
              startIndex += groupedEffects[i].effects.length
            }

            return (
              <EffectGroup
                key={group.title || "ungrouped"}
                title={group.title}
                effects={group.effects}
                previewSize={basePreviewSize}
                previewWidth={previewDimensions.width}
                previewHeight={previewDimensions.height}
                onEffectClick={handleEffectClick}
                effectRefs={effectRefs}
                startIndex={startIndex}
              />
            )
          })}
        </div>

        {/* Сообщение, если эффекты не найдены */}
        {processedEffects.length === 0 && !showFavoritesOnly && <NoFiles type="effects" />}

        {/* Сообщение для избранного */}
        {processedEffects.length === 0 && showFavoritesOnly && (
          <div className="flex h-32 items-center justify-center text-gray-500">{t("browser.media.noFavorites")}</div>
        )}
      </div>
    </div>
  )
}
