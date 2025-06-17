import { useCallback, useState } from "react"

import { open } from "@tauri-apps/plugin-dialog"

import { VideoEffect } from "@/features/effects/types"

import { loadEffectsCollection, loadUserEffect } from "../utils/user-effects"

/**
 * Интерфейс для результата импорта эффектов
 */
interface ImportResult {
  success: boolean
  message: string
  effects: VideoEffect[]
}

/**
 * Хук для импорта пользовательских эффектов
 * Позволяет импортировать JSON файлы с эффектами или отдельные файлы эффектов
 */
export function useEffectsImport() {
  const [isImporting, setIsImporting] = useState(false)
  const [progress, setProgress] = useState(0)

  /**
   * Валидация структуры эффекта
   */
  const validateEffect = (effect: any): effect is VideoEffect => {
    return (
      effect &&
      typeof effect.id === "string" &&
      typeof effect.name === "string" &&
      typeof effect.type === "string" &&
      typeof effect.category === "string" &&
      typeof effect.complexity === "string" &&
      Array.isArray(effect.tags) &&
      effect.description &&
      typeof effect.description.ru === "string" &&
      typeof effect.description.en === "string"
    )
  }

  /**
   * Импорт JSON файла с эффектами
   */
  const importEffectsFile = useCallback(async (): Promise<ImportResult> => {
    if (isImporting) {
      return {
        success: false,
        message: "Импорт уже выполняется",
        effects: [],
      }
    }

    setIsImporting(true)
    setProgress(0)

    try {
      // Открываем диалог выбора файла эффектов
      const selected = await open({
        multiple: false,
        filters: [
          {
            name: "Effect Files",
            extensions: ["json", "effect", "effects"],
          },
        ],
      })

      if (!selected) {
        setIsImporting(false)
        return {
          success: false,
          message: "Файл не выбран",
          effects: [],
        }
      }

      setProgress(25)

      // Определяем тип файла
      const fileExtension = selected.split(".").pop()?.toLowerCase()
      let effects: VideoEffect[] = []

      try {
        if (fileExtension === "effect") {
          // Пользовательский эффект
          const userEffect = await loadUserEffect(selected)
          if (validateEffect(userEffect.effect)) {
            effects = [userEffect.effect]
          }
        } else if (fileExtension === "effects") {
          // Коллекция эффектов
          const collection = await loadEffectsCollection(selected)
          effects = collection.effects.map((ue) => ue.effect).filter(validateEffect)
        } else {
          // Обычный JSON
          const response = await fetch(`file://${selected}`)
          const data = await response.json()

          if (Array.isArray(data)) {
            effects = data.filter(validateEffect)
          } else if (data.effects && Array.isArray(data.effects)) {
            effects = data.effects.filter(validateEffect)
          } else if (validateEffect(data)) {
            effects = [data]
          }
        }
      } catch (error) {
        console.error("Ошибка чтения файла:", error)
        setIsImporting(false)
        return {
          success: false,
          message: "Ошибка чтения файла эффектов",
          effects: [],
        }
      }

      setProgress(50)

      setProgress(75)

      if (effects.length === 0) {
        setIsImporting(false)
        return {
          success: false,
          message: "В файле не найдено валидных эффектов",
          effects: [],
        }
      }

      // TODO: Сохранить эффекты в пользовательскую коллекцию
      console.log("Импортированные эффекты:", effects)

      setProgress(100)
      setIsImporting(false)

      return {
        success: true,
        message: `Успешно импортировано ${effects.length} эффектов`,
        effects,
      }
    } catch (error) {
      console.error("Ошибка при импорте эффектов:", error)
      setIsImporting(false)
      return {
        success: false,
        message: `Ошибка при импорте: ${String(error)}`,
        effects: [],
      }
    }
  }, [isImporting])

  /**
   * Импорт отдельного файла эффекта (например, .cube для LUT)
   */
  const importEffectFile = useCallback(async (): Promise<ImportResult> => {
    if (isImporting) {
      return {
        success: false,
        message: "Импорт уже выполняется",
        effects: [],
      }
    }

    setIsImporting(true)
    setProgress(0)

    try {
      // Открываем диалог выбора файла эффекта
      const selected = await open({
        multiple: true,
        filters: [
          {
            name: "Effect Files",
            extensions: ["cube", "3dl", "lut", "json", "preset"],
          },
        ],
      })

      if (!selected) {
        setIsImporting(false)
        return {
          success: false,
          message: "Файлы не выбраны",
          effects: [],
        }
      }

      const files = Array.isArray(selected) ? selected : [selected]
      setProgress(25)

      const importedEffects: VideoEffect[] = []

      for (let i = 0; i < files.length; i++) {
        const filePath = files[i]
        const fileName = filePath.split("/").pop() || filePath.split("\\").pop() || "unknown"
        const extension = fileName.split(".").pop()?.toLowerCase()

        // Создаем базовый эффект на основе файла
        const effect: VideoEffect = {
          id: `user-${Date.now()}-${i}`,
          name: fileName.replace(/\.[^/.]+$/, ""), // Убираем расширение
          type: extension === "cube" || extension === "3dl" ? "vintage" : "glow", // Используем существующие типы
          duration: 0,
          category: "creative", // Используем существующую категорию
          complexity: "intermediate",
          tags: ["experimental"], // Используем существующие теги
          description: {
            ru: `Пользовательский эффект: ${fileName}`,
            en: `User effect: ${fileName}`,
          },
          ffmpegCommand: (params) => {
            // Используем intensity как основной параметр для пользовательских эффектов
            const intensity = params.intensity || 50
            return extension === "cube" || extension === "3dl"
              ? `lut3d=${filePath}:interp=trilinear:amount=${intensity / 100}`
              : `custom=${filePath}:intensity=${intensity}`
          },
          params: {
            intensity: 50, // Интенсивность применения эффекта
            amount: 100, // Количество эффекта
          },
          previewPath: "/t1.mp4",
          labels: {
            ru: fileName.replace(/\.[^/.]+$/, ""),
            en: fileName.replace(/\.[^/.]+$/, ""),
            es: fileName.replace(/\.[^/.]+$/, ""),
            fr: fileName.replace(/\.[^/.]+$/, ""),
            de: fileName.replace(/\.[^/.]+$/, ""),
          },
        }

        importedEffects.push(effect)
        setProgress(25 + (i + 1) * (50 / files.length))
      }

      // TODO: Сохранить эффекты в пользовательскую коллекцию
      console.log("Импортированные файлы эффектов:", importedEffects)

      setProgress(100)
      setIsImporting(false)

      return {
        success: true,
        message: `Успешно импортировано ${importedEffects.length} файлов эффектов`,
        effects: importedEffects,
      }
    } catch (error) {
      console.error("Ошибка при импорте файлов эффектов:", error)
      setIsImporting(false)
      return {
        success: false,
        message: `Ошибка при импорте: ${String(error)}`,
        effects: [],
      }
    }
  }, [isImporting])

  return {
    importEffectsFile,
    importEffectFile,
    isImporting,
    progress,
  }
}
