import { TemplateList } from "./template-list"
import { TemplateListProvider } from "./template-list-provider"

/**
 * Компонент для отображения списка шаблонов с провайдером
 * @returns {JSX.Element} Компонент списка шаблонов с провайдером
 */
export function TemplatesTab() {
  return (
    <TemplateListProvider>
      <TemplateList />
    </TemplateListProvider>
  )
}

// Реэкспортируем компоненты и типы
export * from "./template-list"
export * from "./template-list-provider"
export * from "./template-list-machine"
export * from "./template-labels"
export * from "./template-preview"
export * from "./templates"
