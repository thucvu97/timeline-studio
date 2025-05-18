import { vi } from "vitest"

const changeLanguageMock = vi.fn().mockResolvedValue(undefined)

module.exports = {
  // Мок для useTranslation
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: "ru",
      changeLanguage: changeLanguageMock,
    },
  }),
  // Мок для initReactI18next
  initReactI18next: {
    type: "3rdParty",
    init: vi.fn(),
  },
  // Мок для I18nextProvider
  I18nextProvider: ({ children }: { children: React.ReactNode }) => children,
}
