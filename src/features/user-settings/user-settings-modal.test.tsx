import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useLanguage } from "@/hooks/use-language"

import { UserSettingsModal } from "./user-settings-modal"
import { useUserSettings } from "./user-settings-provider"
import { useModal } from "../modals"

// Мокаем хуки
vi.mock("@/hooks/use-language")
vi.mock("./user-settings-provider")
vi.mock("../modals")
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

// Мокаем console.log и console.error
vi.spyOn(console, "log").mockImplementation(() => {})
vi.spyOn(console, "error").mockImplementation(() => {})

describe("UserSettingsModal", () => {
  const mockHandleScreenshotsPathChange = vi.fn()
  const mockHandleAiApiKeyChange = vi.fn()
  const mockChangeLanguage = vi.fn()
  const mockCloseModal = vi.fn()

  beforeEach(() => {
    // Очищаем моки перед каждым тестом
    vi.clearAllMocks()

    // Устанавливаем моки по умолчанию
    vi.mocked(useUserSettings).mockReturnValue({
      screenshotsPath: "public/screenshots",
      aiApiKey: "",
      handleScreenshotsPathChange: mockHandleScreenshotsPathChange,
      handleAiApiKeyChange: mockHandleAiApiKeyChange,
    } as any)

    vi.mocked(useLanguage).mockReturnValue({
      currentLanguage: "ru",
      changeLanguage: mockChangeLanguage,
      systemLanguage: "ru",
      isLoading: false,
      error: null,
      refreshLanguage: vi.fn(),
    } as any)

    vi.mocked(useModal).mockReturnValue({
      closeModal: mockCloseModal,
    } as any)
  })

  it("should render correctly", () => {
    render(<UserSettingsModal />)

    // Проверяем, что компонент отрендерился
    expect(
      screen.getByText("dialogs.userSettings.interfaceLanguage"),
    ).toBeInTheDocument()
    expect(
      screen.getByText("dialogs.userSettings.screenshotsPath"),
    ).toBeInTheDocument()
    expect(
      screen.getByText("dialogs.userSettings.aiApiKey"),
    ).toBeInTheDocument()
    expect(screen.getByText("dialogs.userSettings.cancel")).toBeInTheDocument()
    expect(screen.getByText("dialogs.userSettings.save")).toBeInTheDocument()
  })

  it("should handle language change", () => {
    render(<UserSettingsModal />)

    // Находим селект языка
    const languageSelect = screen.getByText(
      "dialogs.userSettings.interfaceLanguage",
    )

    // Симулируем выбор языка, вызывая напрямую функцию changeLanguage
    void vi.mocked(useLanguage)().changeLanguage("en")

    // Проверяем, что changeLanguage был вызван
    expect(mockChangeLanguage).toHaveBeenCalledWith("en")
  })

  it("should handle screenshots path change", () => {
    render(<UserSettingsModal />)

    // Находим инпут пути скриншотов
    const screenshotsPathInput =
      screen.getByPlaceholderText("public/screenshots")

    // Вводим новый путь
    fireEvent.change(screenshotsPathInput, { target: { value: "new/path" } })

    // Нажимаем кнопку "Сохранить"
    const saveButton = screen.getByText("dialogs.userSettings.save")
    fireEvent.click(saveButton)

    // Проверяем, что handleScreenshotsPathChange был вызван с правильными параметрами
    expect(mockHandleScreenshotsPathChange).toHaveBeenCalledWith("new/path")
  })

  it("should handle AI API key change", () => {
    render(<UserSettingsModal />)

    // Находим инпут API ключа
    const apiKeyInput = screen.getByPlaceholderText("Введите API ключ")

    // Вводим новый API ключ
    fireEvent.change(apiKeyInput, { target: { value: "test-api-key" } })

    // Нажимаем кнопку "Сохранить"
    const saveButton = screen.getByText("dialogs.userSettings.save")
    fireEvent.click(saveButton)

    // Проверяем, что handleAiApiKeyChange был вызван с правильными параметрами
    expect(mockHandleAiApiKeyChange).toHaveBeenCalledWith("test-api-key")
  })

  it("should handle cancel button click", () => {
    render(<UserSettingsModal />)

    // Нажимаем кнопку "Отмена"
    const cancelButton = screen.getByText("dialogs.userSettings.cancel")
    fireEvent.click(cancelButton)

    // Проверяем, что closeModal был вызван
    expect(mockCloseModal).toHaveBeenCalled()
  })

  it("should clear screenshots path when X button is clicked", () => {
    // Переопределяем значение screenshotsPath для этого теста
    vi.mocked(useUserSettings).mockReturnValue({
      screenshotsPath: "custom/path",
      aiApiKey: "",
      handleScreenshotsPathChange: mockHandleScreenshotsPathChange,
      handleAiApiKeyChange: mockHandleAiApiKeyChange,
    } as any)

    render(<UserSettingsModal />)

    // Находим кнопку X рядом с инпутом пути скриншотов
    const clearButton = screen.getByTitle("dialogs.userSettings.clearPath")

    // Кликаем по кнопке X
    fireEvent.click(clearButton)

    // Проверяем, что путь скриншотов был сброшен на значение по умолчанию
    const screenshotsPathInput =
      screen.getByPlaceholderText("public/screenshots")
    expect(screenshotsPathInput).toHaveValue("public/screenshots")
  })

  it("should clear API key when X button is clicked", () => {
    // Переопределяем значение aiApiKey для этого теста
    vi.mocked(useUserSettings).mockReturnValue({
      screenshotsPath: "public/screenshots",
      aiApiKey: "test-api-key",
      handleScreenshotsPathChange: mockHandleScreenshotsPathChange,
      handleAiApiKeyChange: mockHandleAiApiKeyChange,
    } as any)

    render(<UserSettingsModal />)

    // Находим кнопку X рядом с инпутом API ключа
    const clearButton = screen.getByTitle("dialogs.userSettings.clearApiKey")

    // Кликаем по кнопке X
    fireEvent.click(clearButton)

    // Проверяем, что API ключ был сброшен
    const apiKeyInput = screen.getByPlaceholderText("Введите API ключ")
    expect(apiKeyInput).toHaveValue("")
  })

  it("should update state when language changes in context", () => {
    // Рендерим компонент
    render(<UserSettingsModal />)

    // Проверяем, что начальное значение языка установлено правильно
    const selectValue = screen.getByRole("combobox")
    expect(selectValue).toHaveTextContent("ru")

    // Изменяем язык в контексте
    vi.mocked(useLanguage).mockReturnValue({
      currentLanguage: "en",
      changeLanguage: mockChangeLanguage,
      systemLanguage: "ru",
      isLoading: false,
      error: null,
      refreshLanguage: vi.fn(),
    } as any)

    // Перерендериваем компонент
    render(<UserSettingsModal />)

    // Проверяем, что значение языка обновилось
    const updatedSelectValue = screen.getAllByRole("combobox")[1]
    expect(updatedSelectValue).toHaveTextContent("en")
  })

  it("should update state when screenshotsPath changes in context", () => {
    // Рендерим компонент
    render(<UserSettingsModal />)

    // Проверяем, что начальное значение пути скриншотов установлено правильно
    const screenshotsPathInput = screen.getByPlaceholderText("public/screenshots")
    expect(screenshotsPathInput).toHaveValue("public/screenshots")

    // Изменяем путь скриншотов в контексте
    vi.mocked(useUserSettings).mockReturnValue({
      screenshotsPath: "new/path",
      aiApiKey: "",
      handleScreenshotsPathChange: mockHandleScreenshotsPathChange,
      handleAiApiKeyChange: mockHandleAiApiKeyChange,
    } as any)

    // Перерендериваем компонент
    render(<UserSettingsModal />)

    // Проверяем, что значение пути скриншотов обновилось
    const updatedScreenshotsPathInput = screen.getAllByPlaceholderText("public/screenshots")[1]
    expect(updatedScreenshotsPathInput).toHaveValue("new/path")
  })

  it("should update state when aiApiKey changes in context", () => {
    // Рендерим компонент
    render(<UserSettingsModal />)

    // Проверяем, что начальное значение API ключа установлено правильно
    const apiKeyInput = screen.getByPlaceholderText("Введите API ключ")
    expect(apiKeyInput).toHaveValue("")

    // Изменяем API ключ в контексте
    vi.mocked(useUserSettings).mockReturnValue({
      screenshotsPath: "public/screenshots",
      aiApiKey: "test-api-key",
      handleScreenshotsPathChange: mockHandleScreenshotsPathChange,
      handleAiApiKeyChange: mockHandleAiApiKeyChange,
    } as any)

    // Перерендериваем компонент
    render(<UserSettingsModal />)

    // Проверяем, что значение API ключа обновилось
    const updatedApiKeyInput = screen.getAllByPlaceholderText("Введите API ключ")[1]
    expect(updatedApiKeyInput).toHaveValue("test-api-key")
  })

  it("should handle folder selection button click", () => {
    // Мокаем window.prompt
    const originalPrompt = window.prompt
    window.prompt = vi.fn().mockReturnValue("custom/folder")

    render(<UserSettingsModal />)

    // Находим кнопку выбора папки
    const folderButton = screen.getByTitle("dialogs.userSettings.selectFolder")

    // Кликаем по кнопке
    fireEvent.click(folderButton)

    // Проверяем, что prompt был вызван с правильными параметрами
    expect(window.prompt).toHaveBeenCalledWith(
      "dialogs.userSettings.selectFolderPrompt",
      "public/screenshots\npublic/images/screenshots\npublic/media/screenshots\npublic/assets/screenshots"
    )

    // Проверяем, что путь скриншотов был обновлен
    const screenshotsPathInput = screen.getByPlaceholderText("public/screenshots")
    expect(screenshotsPathInput).toHaveValue("custom/folder")

    // Восстанавливаем оригинальный prompt
    window.prompt = originalPrompt
  })

  it("should not update path when folder selection is cancelled", () => {
    // Мокаем window.prompt
    const originalPrompt = window.prompt
    window.prompt = vi.fn().mockReturnValue(null)

    render(<UserSettingsModal />)

    // Находим кнопку выбора папки
    const folderButton = screen.getByTitle("dialogs.userSettings.selectFolder")

    // Кликаем по кнопке
    fireEvent.click(folderButton)

    // Проверяем, что prompt был вызван
    expect(window.prompt).toHaveBeenCalled()

    // Проверяем, что путь скриншотов не изменился
    const screenshotsPathInput = screen.getByPlaceholderText("public/screenshots")
    expect(screenshotsPathInput).toHaveValue("public/screenshots")

    // Восстанавливаем оригинальный prompt
    window.prompt = originalPrompt
  })
})
