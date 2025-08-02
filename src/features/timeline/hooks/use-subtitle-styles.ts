/**
 * Hook для работы со стилями субтитров
 */

import { useCallback, useMemo } from "react"
import type { SubtitleStyle } from "../types/timeline"
import { useTimeline } from "./use-timeline"

interface UseSubtitleStylesReturn {
  // Данные
  subtitleStyles: SubtitleStyle[]

  // Методы
  getStyleById: (styleId: string) => SubtitleStyle | undefined
  getStyleByName: (name: string) => SubtitleStyle | undefined
  addSubtitleStyle: (style: SubtitleStyle) => void
  updateSubtitleStyle: (styleId: string, updates: Partial<SubtitleStyle>) => void
  removeSubtitleStyle: (styleId: string) => void

  // Утилиты
  getDefaultStyle: () => SubtitleStyle | undefined
  getBuiltInStyles: () => SubtitleStyle[]
  getCustomStyles: () => SubtitleStyle[]

  // Применение стилей
  getComputedStyle: (styleId?: string, overrides?: any) => ComputedSubtitleStyle
}

/**
 * Вычисленный стиль субтитров с применением всех переопределений
 */
export interface ComputedSubtitleStyle {
  fontFamily: string
  fontSize: number
  fontWeight: string | number
  fontStyle: string
  textAlign: string
  color: string
  backgroundColor?: string
  strokeColor?: string
  strokeWidth: number
  textShadow?: {
    offsetX: number
    offsetY: number
    blur: number
    color: string
  }
  padding: {
    top: number
    right: number
    bottom: number
    left: number
  }
  borderRadius: number
  maxWidth: number
  wordWrap: boolean
  letterSpacing: number
  lineHeight: number
  position: {
    alignment: string
    marginX: number
    marginY: number
  }
}

export function useSubtitleStyles(): UseSubtitleStylesReturn {
  const { project } = useTimeline()

  // TODO: В новой архитектуре с backend нужно добавить команды для управления subtitle styles
  const updateProject = (_updatedProject: any) => {
    console.warn("updateProject is not implemented in new architecture - need backend command")
  }

  const subtitleStyles = useMemo(() => {
    return project?.resources?.subtitleStyles || []
  }, [project?.resources?.subtitleStyles])

  const getStyleById = useCallback(
    (styleId: string): SubtitleStyle | undefined => {
      return subtitleStyles.find((style) => style.id === styleId)
    },
    [subtitleStyles],
  )

  const getStyleByName = useCallback(
    (name: string): SubtitleStyle | undefined => {
      return subtitleStyles.find((style) => style.name === name)
    },
    [subtitleStyles],
  )

  const addSubtitleStyle = useCallback(
    (style: SubtitleStyle) => {
      if (!project) return

      const updatedProject = {
        ...project,
        resources: {
          ...project.resources,
          subtitleStyles: [...subtitleStyles, style],
        },
      }

      updateProject(updatedProject)
    },
    [project, subtitleStyles, updateProject],
  )

  const updateSubtitleStyle = useCallback(
    (styleId: string, updates: Partial<SubtitleStyle>) => {
      if (!project) return

      const updatedStyles = subtitleStyles.map((style) =>
        style.id === styleId ? { ...style, ...updates, updatedAt: new Date() } : style,
      )

      const updatedProject = {
        ...project,
        resources: {
          ...project.resources,
          subtitleStyles: updatedStyles,
        },
      }

      updateProject(updatedProject)
    },
    [project, subtitleStyles, updateProject],
  )

  const removeSubtitleStyle = useCallback(
    (styleId: string) => {
      if (!project) return

      const style = getStyleById(styleId)
      if (style?.isBuiltIn) {
        console.warn("Нельзя удалить встроенный стиль")
        return
      }

      const updatedStyles = subtitleStyles.filter((style) => style.id !== styleId)

      const updatedProject = {
        ...project,
        resources: {
          ...project.resources,
          subtitleStyles: updatedStyles,
        },
      }

      updateProject(updatedProject)
    },
    [project, subtitleStyles, updateProject, getStyleById],
  )

  const getDefaultStyle = useCallback((): SubtitleStyle | undefined => {
    // Ищем встроенный стиль "Классический" или первый встроенный
    return (
      subtitleStyles.find((style) => style.isBuiltIn && (style.name === "Классический" || style.name === "Default")) ||
      subtitleStyles.find((style) => style.isBuiltIn) ||
      subtitleStyles[0]
    )
  }, [subtitleStyles])

  const getBuiltInStyles = useCallback((): SubtitleStyle[] => {
    return subtitleStyles.filter((style) => style.isBuiltIn)
  }, [subtitleStyles])

  const getCustomStyles = useCallback((): SubtitleStyle[] => {
    return subtitleStyles.filter((style) => !style.isBuiltIn)
  }, [subtitleStyles])

  const getComputedStyle = useCallback(
    (styleId?: string, overrides?: any): ComputedSubtitleStyle => {
      // Получаем базовый стиль
      const baseStyle = styleId ? getStyleById(styleId) : getDefaultStyle()

      // Стиль по умолчанию если ничего не найдено
      const defaultStyle: ComputedSubtitleStyle = {
        fontFamily: "Inter, system-ui, sans-serif",
        fontSize: 24,
        fontWeight: "normal",
        fontStyle: "normal",
        textAlign: "center",
        color: "#ffffff",
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        strokeWidth: 0,
        padding: {
          top: 8,
          right: 12,
          bottom: 8,
          left: 12,
        },
        borderRadius: 4,
        maxWidth: 80,
        wordWrap: true,
        letterSpacing: 0,
        lineHeight: 1.2,
        position: {
          alignment: "bottom-center",
          marginX: 0,
          marginY: 50,
        },
      }

      if (!baseStyle) {
        return { ...defaultStyle, ...overrides }
      }

      // Применяем стиль и переопределения
      return {
        fontFamily: overrides?.fontFamily || baseStyle.fontFamily,
        fontSize: overrides?.fontSize || baseStyle.fontSize,
        fontWeight: overrides?.fontWeight || baseStyle.fontWeight,
        fontStyle: overrides?.fontStyle || baseStyle.fontStyle,
        textAlign: overrides?.textAlign || baseStyle.textAlign,
        color: overrides?.color || baseStyle.color,
        backgroundColor: overrides?.backgroundColor || baseStyle.backgroundColor,
        strokeColor: overrides?.strokeColor || baseStyle.strokeColor,
        strokeWidth: overrides?.strokeWidth || baseStyle.strokeWidth || 0,
        textShadow: overrides?.textShadow || baseStyle.textShadow,
        padding: overrides?.padding || baseStyle.padding,
        borderRadius: overrides?.borderRadius || baseStyle.borderRadius || 0,
        maxWidth: overrides?.maxWidth || baseStyle.maxWidth || 80,
        wordWrap: overrides?.wordWrap !== undefined ? overrides.wordWrap : baseStyle.wordWrap,
        letterSpacing: overrides?.letterSpacing || baseStyle.letterSpacing || 0,
        lineHeight: overrides?.lineHeight || baseStyle.lineHeight || 1.2,
        position: overrides?.position || baseStyle.defaultPosition,
      }
    },
    [getStyleById, getDefaultStyle],
  )

  return {
    subtitleStyles,
    getStyleById,
    getStyleByName,
    addSubtitleStyle,
    updateSubtitleStyle,
    removeSubtitleStyle,
    getDefaultStyle,
    getBuiltInStyles,
    getCustomStyles,
    getComputedStyle,
  }
}
