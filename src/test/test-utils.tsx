import { ReactElement, ReactNode } from "react"

import { RenderOptions, render } from "@testing-library/react"

import { ThemeProvider } from "@/components/theme/theme-context"
import { BrowserVisibilityProvider } from "@/features/layouts/providers/browser-visibility-provider"
import { I18nProvider } from "@/i18n/i18n-provider"

// Провайдер для всех тестов
const AllProviders = ({ children }: { children: ReactNode }) => {
  return (
    <ThemeProvider>
      <I18nProvider>
        <BrowserVisibilityProvider>{children}</BrowserVisibilityProvider>
      </I18nProvider>
    </ThemeProvider>
  )
}

// Кастомная функция рендеринга
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) => render(ui, { wrapper: AllProviders, ...options })

// Реэкспортируем только то, что нам нужно
export { screen, fireEvent, waitFor, within } from "@testing-library/react"

// Переопределение функции render
export { customRender as render }
