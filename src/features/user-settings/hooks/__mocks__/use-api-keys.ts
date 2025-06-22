import { vi } from "vitest"

/**
 * Mock для хука useApiKeys
 */
export const useApiKeys = vi.fn(() => ({
  // Методы для работы с API ключами
  saveSimpleApiKey: vi.fn().mockResolvedValue({ success: true }),
  getApiKeyInfo: vi.fn().mockReturnValue({
    exists: true,
    status: "valid",
    keyType: "openai",
    createdAt: new Date().toISOString(),
    lastValidated: new Date().toISOString(),
  }),
  testApiKey: vi.fn().mockResolvedValue({ isValid: true }),
  deleteApiKey: vi.fn().mockResolvedValue({ success: true }),

  // OAuth методы
  saveOAuthCredentials: vi.fn().mockResolvedValue({ success: true }),
  generateOAuthUrl: vi.fn().mockResolvedValue({ url: "https://oauth.example.com" }),
  exchangeOAuthCode: vi.fn().mockResolvedValue({ success: true }),

  // Состояния
  loadingStatuses: {},
  apiKeysInfo: {
    openai: {
      key_type: "openai",
      has_value: true,
      is_oauth: false,
      has_access_token: false,
      is_valid: true,
    },
    claude: {
      key_type: "claude",
      has_value: true,
      is_oauth: false,
      has_access_token: false,
      is_valid: true,
    },
  },

  // Вспомогательные методы
  getApiKeyStatus: vi.fn().mockReturnValue("valid"),
  loadApiKeysInfo: vi.fn(),
  importFromEnv: vi.fn().mockResolvedValue({ success: true }),
  exportToEnv: vi.fn().mockResolvedValue("# API Keys\n"),
}))
