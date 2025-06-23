import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { AiServicesTab } from "../../../components/tabs/ai-services-tab"
import { useApiKeys } from "../../../hooks/use-api-keys"

vi.mock("../../../hooks/use-api-keys")
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
  }),
}))
vi.mock("lucide-react", () => ({
  ExternalLink: ({ className }: { className?: string }) => (
    <span className={className} role="img" aria-hidden="true">
      ExternalLink
    </span>
  ),
  Eye: ({ className }: { className?: string }) => (
    <span className={className} role="img" aria-hidden="true">
      Eye
    </span>
  ),
  EyeOff: ({ className }: { className?: string }) => (
    <span className={className} role="img" aria-hidden="true">
      EyeOff
    </span>
  ),
  Loader2: ({ className }: { className?: string }) => (
    <span className={className} role="img" aria-hidden="true">
      Loader2
    </span>
  ),
  X: ({ className }: { className?: string }) => (
    <span className={className} role="img" aria-hidden="true">
      X
    </span>
  ),
}))

vi.spyOn(console, "log").mockImplementation(() => {})
vi.spyOn(console, "error").mockImplementation(() => {})

describe("AiServicesTab", () => {
  const mockSaveSimpleApiKey = vi.fn()
  const mockGetApiKeyInfo = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(useApiKeys).mockImplementation(() => ({
      getApiKeyStatus: vi.fn().mockReturnValue("not_set"),
      getApiKeyInfo: mockGetApiKeyInfo,
      testApiKey: vi.fn(),
      saveSimpleApiKey: mockSaveSimpleApiKey,
      deleteApiKey: vi.fn(),
      loadApiKeysInfo: vi.fn(),
      saveOAuthCredentials: vi.fn(),
      generateOAuthUrl: vi.fn(),
      exchangeOAuthCode: vi.fn(),
      refreshOAuthToken: vi.fn(),
      getOAuthUserInfo: vi.fn(),
      parseOAuthCallbackUrl: vi.fn(),
      importFromEnv: vi.fn(),
      exportToEnvFormat: vi.fn(),
      apiKeysInfo: {},
      loadingStatuses: {},
    }))
  })

  it("should render correctly with all UI elements", () => {
    render(<AiServicesTab />)

    expect(screen.getByText("AI Сервисы")).toBeInTheDocument()
    expect(
      screen.getByText("Настройте API ключи для интеграции с AI ассистентами. Ключи безопасно хранятся локально."),
    ).toBeInTheDocument()

    expect(screen.getByText("OpenAI API ключ")).toBeInTheDocument()
    expect(
      screen.getByText(
        "Используется для ChatGPT интеграции и генерации контента. Получите ключ на platform.openai.com",
      ),
    ).toBeInTheDocument()

    expect(screen.getByText("Claude API ключ")).toBeInTheDocument()
    expect(
      screen.getByText(
        "Используется для Claude AI ассистента и продвинутого анализа контента. Получите ключ в консоли Anthropic",
      ),
    ).toBeInTheDocument()

    expect(screen.getByText("Примечание о безопасности")).toBeInTheDocument()
    expect(
      screen.getByText(
        "Все API ключи шифруются и хранятся локально на вашем устройстве. Они никогда не передаются третьим лицам.",
      ),
    ).toBeInTheDocument()

    const apiKeyInputs = screen.getAllByPlaceholderText("Введите API ключ")
    expect(apiKeyInputs).toHaveLength(2)

    const testButtons = screen.getAllByText("Тест")
    expect(testButtons).toHaveLength(2)

    const linkButtons = screen.getAllByText("Получить API ключ")
    expect(linkButtons).toHaveLength(2)
  })

  it("should load existing API keys on mount", () => {
    mockGetApiKeyInfo.mockReturnValueOnce({ has_value: true })
    mockGetApiKeyInfo.mockReturnValueOnce({ has_value: true })

    render(<AiServicesTab />)

    expect(mockGetApiKeyInfo).toHaveBeenCalledWith("openai")
    expect(mockGetApiKeyInfo).toHaveBeenCalledWith("claude")

    const apiKeyInputs = screen.getAllByPlaceholderText("Введите API ключ")
    expect(apiKeyInputs[0]).toHaveValue("••••••••••••••••••••••••••••••••••••••••••••••••••••")
    expect(apiKeyInputs[1]).toHaveValue("••••••••••••••••••••••••••••••••••••••••••••••••••••")
  })

  it("should handle OpenAI API key input changes", async () => {
    render(<AiServicesTab />)

    const apiKeyInputs = screen.getAllByPlaceholderText("Введите API ключ")
    const openAiInput = apiKeyInputs[0]

    act(() => {
      fireEvent.change(openAiInput, { target: { value: "sk-test-openai-key" } })
    })

    expect(openAiInput).toHaveValue("sk-test-openai-key")

    await waitFor(() => {
      expect(mockSaveSimpleApiKey).toHaveBeenCalledWith("openai", "sk-test-openai-key")
    })
  })

  it("should handle Claude API key input changes", async () => {
    render(<AiServicesTab />)

    const apiKeyInputs = screen.getAllByPlaceholderText("Введите API ключ")
    const claudeInput = apiKeyInputs[1]

    act(() => {
      fireEvent.change(claudeInput, { target: { value: "claude-test-key" } })
    })

    expect(claudeInput).toHaveValue("claude-test-key")

    await waitFor(() => {
      expect(mockSaveSimpleApiKey).toHaveBeenCalledWith("claude", "claude-test-key")
    })
  })

  it("should not save API key when it contains masked characters", () => {
    render(<AiServicesTab />)

    const apiKeyInputs = screen.getAllByPlaceholderText("Введите API ключ")
    const openAiInput = apiKeyInputs[0]

    act(() => {
      fireEvent.change(openAiInput, { target: { value: "••••••••••••" } })
    })

    expect(mockSaveSimpleApiKey).not.toHaveBeenCalled()
  })

  it("should not save empty API key", () => {
    render(<AiServicesTab />)

    const apiKeyInputs = screen.getAllByPlaceholderText("Введите API ключ")
    const openAiInput = apiKeyInputs[0]

    act(() => {
      fireEvent.change(openAiInput, { target: { value: "" } })
    })

    expect(mockSaveSimpleApiKey).not.toHaveBeenCalled()
  })

  it("should render API key inputs with correct service props", () => {
    render(<AiServicesTab />)

    const testButtons = screen.getAllByText("Тест")
    expect(testButtons).toHaveLength(2)

    const linkButtons = screen.getAllByText("Получить API ключ")
    expect(linkButtons).toHaveLength(2)

    const externalLinkButtons = screen.getAllByRole("button", { name: /Получить API ключ/i })
    expect(externalLinkButtons[0]).toBeInTheDocument()
    expect(externalLinkButtons[1]).toBeInTheDocument()
  })

  it("should handle link button clicks to open external URLs", () => {
    const mockWindowOpen = vi.spyOn(window, "open").mockImplementation(() => null)

    render(<AiServicesTab />)

    const linkButtons = screen.getAllByText("Получить API ключ")

    act(() => {
      fireEvent.click(linkButtons[0])
    })
    expect(mockWindowOpen).toHaveBeenCalledWith("https://platform.openai.com/api-keys", "_blank")

    act(() => {
      fireEvent.click(linkButtons[1])
    })
    expect(mockWindowOpen).toHaveBeenCalledWith("https://console.anthropic.com/settings/keys", "_blank")

    mockWindowOpen.mockRestore()
  })

  it("should load different values for different services", () => {
    mockGetApiKeyInfo.mockReturnValueOnce({ has_value: true }).mockReturnValueOnce({ has_value: false })

    render(<AiServicesTab />)

    const apiKeyInputs = screen.getAllByPlaceholderText("Введите API ключ")
    expect(apiKeyInputs[0]).toHaveValue("••••••••••••••••••••••••••••••••••••••••••••••••••••")
    expect(apiKeyInputs[1]).toHaveValue("")
  })

  it("should handle multiple quick changes correctly", async () => {
    render(<AiServicesTab />)

    const apiKeyInputs = screen.getAllByPlaceholderText("Введите API ключ")
    const openAiInput = apiKeyInputs[0]

    act(() => {
      fireEvent.change(openAiInput, { target: { value: "sk-test-1" } })
    })

    act(() => {
      fireEvent.change(openAiInput, { target: { value: "sk-test-12" } })
    })

    act(() => {
      fireEvent.change(openAiInput, { target: { value: "sk-test-123" } })
    })

    await waitFor(() => {
      expect(mockSaveSimpleApiKey).toHaveBeenLastCalledWith("openai", "sk-test-123")
    })
  })

  it("should display all separator elements", () => {
    render(<AiServicesTab />)

    const separators = document.querySelectorAll('[role="none"]')
    expect(separators).toHaveLength(2)
  })

  it("should maintain separate state for each API key input", async () => {
    render(<AiServicesTab />)

    const apiKeyInputs = screen.getAllByPlaceholderText("Введите API ключ")
    const openAiInput = apiKeyInputs[0]
    const claudeInput = apiKeyInputs[1]

    act(() => {
      fireEvent.change(openAiInput, { target: { value: "openai-key" } })
    })

    act(() => {
      fireEvent.change(claudeInput, { target: { value: "claude-key" } })
    })

    expect(openAiInput).toHaveValue("openai-key")
    expect(claudeInput).toHaveValue("claude-key")

    await waitFor(() => {
      expect(mockSaveSimpleApiKey).toHaveBeenCalledWith("openai", "openai-key")
      expect(mockSaveSimpleApiKey).toHaveBeenCalledWith("claude", "claude-key")
    })
  })
})
