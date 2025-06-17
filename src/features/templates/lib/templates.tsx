import { JSX } from "react"

import { landscapeTemplates } from "../components/template-previews/landscape-templates"
import { portraitTemplates } from "../components/template-previews/portrait-templates"
import { squareTemplates } from "../components/template-previews/square-templates"

// Импортируем и реэкспортируем типы из template-config для обратной совместимости
import type {
  CellConfiguration,
  DividerConfig,
  LayoutConfig,
  MediaTemplate,
  MediaTemplateConfig,
  SplitPoint,
  TemplateAspectRatio,
} from "./template-config"

export type {
  SplitPoint,
  CellConfiguration as CellConfig,
  MediaTemplate,
  MediaTemplateConfig,
  DividerConfig,
  LayoutConfig,
  TemplateAspectRatio,
}

// Импортируем утилиты для работы с конфигурациями
export {
  PRESET_STYLES,
  createCellConfig,
  createDividerConfig,
} from "./template-config"

export const TEMPLATE_MAP: Record<"landscape" | "portrait" | "square", MediaTemplate[]> = {
  landscape: landscapeTemplates,
  portrait: portraitTemplates,
  square: squareTemplates,
}
