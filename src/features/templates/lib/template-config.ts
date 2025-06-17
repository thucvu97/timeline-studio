/**
 * Конфигурационные интерфейсы для системы шаблонов
 */

import { JSX } from "react"

// Существующие интерфейсы
export interface SplitPoint {
  x: number // Координата X точки разделения (в процентах от 0 до 100)
  y: number // Координата Y точки разделения (в процентах от 0 до 100)
}

// Расширенная конфигурация ячейки
export interface CellConfiguration {
  // Существующие настройки
  fitMode?: "contain" | "cover" | "fill" // Режим масштабирования видео в ячейке
  alignX?: "left" | "center" | "right" // Горизонтальное выравнивание
  alignY?: "top" | "center" | "bottom" // Вертикальное выравнивание
  initialScale?: number // Начальный масштаб (1.0 = 100%)
  initialPosition?: { x: number; y: number } // Начальная позиция (в процентах от размера ячейки)
  
  // Новые настройки для заголовка/номера ячейки
  title?: {
    show: boolean
    text?: string // Если не указан, используется номер
    position?: "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right"
    style?: {
      fontSize?: string
      color?: string
      fontWeight?: string
      opacity?: number
      fontFamily?: string
      transform?: string // Для трансформаций, включая смещения
      margin?: string // Для отступов
      padding?: string // Для внутренних отступов
    }
  }
  
  // Настройки фона
  background?: {
    color?: string
    gradient?: string
    image?: string
    opacity?: number
  }
  
  // Настройки границ
  border?: {
    width?: string
    color?: string
    style?: "solid" | "dashed" | "dotted"
    radius?: string
  }
  
  // Отступы
  padding?: string
  margin?: string
}

// Конфигурация разделительных линий
export interface DividerConfig {
  show?: boolean
  width?: string
  color?: string
  style?: "solid" | "dashed" | "dotted"
  dashArray?: string // Для более сложных паттернов (например, "5,10,5")
  opacity?: number
  shadow?: boolean
  shadowColor?: string
  shadowBlur?: string
}

// Глобальные настройки макета
export interface LayoutConfig {
  gap?: string // Расстояние между ячейками
  padding?: string // Внутренние отступы контейнера
  backgroundColor?: string
  borderRadius?: string
  containerStyle?: React.CSSProperties // Дополнительные стили контейнера
}

// Расширенная конфигурация расположения ячейки
export interface CellLayout {
  position?: "absolute" | "relative"
  top?: string
  left?: string
  right?: string
  bottom?: string
  width?: string
  height?: string
  flex?: string
  gridColumn?: string
  gridRow?: string
  zIndex?: number
}

// Новый интерфейс шаблона без метода render
export interface MediaTemplateConfig {
  id: string
  split: "vertical" | "horizontal" | "diagonal" | "custom" | "grid"
  resizable?: boolean // Флаг, указывающий, что шаблон поддерживает изменение размеров
  screens: number // Количество экранов в шаблоне
  splitPoints?: SplitPoint[] // Координаты точек разделения (для нестандартных разделений)
  splitPosition?: number // Позиция разделения в процентах (от 0 до 100)
  
  // Конфигурация ячеек
  cells?: CellConfiguration[] // Массив конфигураций для каждой ячейки
  
  // Расположение ячеек (для custom шаблонов)
  cellLayouts?: CellLayout[] // Массив расположений для каждой ячейки
  
  // Стили разделительных линий
  dividers?: DividerConfig
  
  // Глобальные настройки шаблона
  layout?: LayoutConfig
  
  // Настройки сетки (для grid шаблонов)
  gridConfig?: {
    columns: number
    rows: number
    columnGap?: string
    rowGap?: string
  }
}

// Интерфейс для обратной совместимости (временный)
export interface MediaTemplate extends MediaTemplateConfig {
  cellConfig?: CellConfiguration | CellConfiguration[] // Старое поле для совместимости
  render?: () => JSX.Element // Временно оставляем для постепенной миграции
}

// Вспомогательные типы
export type TemplateAspectRatio = "landscape" | "portrait" | "square"

// Предустановленные стили для быстрого создания шаблонов
export const PRESET_STYLES = {
  cell: {
    default: {
      background: { color: "#23262b" },
      border: { width: "1px", color: "rgba(156, 163, 175, 0.3)", style: "solid" as const },
      title: {
        show: true,
        position: "center" as const,
        style: {
          fontSize: "18px",
          color: "rgba(156, 163, 175, 0.4)",
          fontWeight: "normal",
        },
      },
    },
    alternate: {
      background: { color: "#2a2e36" },
      border: { width: "1px", color: "rgba(156, 163, 175, 0.3)", style: "solid" as const },
      title: {
        show: true,
        position: "center" as const,
        style: {
          fontSize: "18px",
          color: "rgba(156, 163, 175, 0.4)",
          fontWeight: "normal",
        },
      },
    },
  },
  divider: {
    default: {
      show: true,
      width: "1px",
      color: "#4b5563", // gray-600
      style: "solid" as const,
    },
    dashed: {
      show: true,
      width: "1px",
      color: "#4b5563",
      style: "dashed" as const,
      dashArray: "5,5",
    },
    thick: {
      show: true,
      width: "2px",
      color: "#374151", // gray-700
      style: "solid" as const,
    },
  },
  layout: {
    default: {
      backgroundColor: "transparent",
    },
    withGap: {
      gap: "2px",
      backgroundColor: "#1f2937", // gray-800
    },
  },
}

// Утилиты для работы с конфигурациями
export function createCellConfig(
  index: number,
  customConfig?: Partial<CellConfiguration>,
): CellConfiguration {
  const isAlternate = index % 2 === 1
  const preset = isAlternate ? PRESET_STYLES.cell.alternate : PRESET_STYLES.cell.default
  
  return {
    ...preset,
    ...customConfig,
    title: {
      ...preset.title,
      ...customConfig?.title,
      text: customConfig?.title?.text || String(index + 1),
      style: {
        ...preset.title?.style,
        ...customConfig?.title?.style,
      },
    },
  }
}

export function createDividerConfig(
  preset: keyof typeof PRESET_STYLES.divider = "default",
  customConfig?: Partial<DividerConfig>,
): DividerConfig {
  return {
    ...PRESET_STYLES.divider[preset],
    ...customConfig,
  }
}