import { vi } from "vitest"

export class MockStore {
  private data = new Map<string, any>()

  async get<T>(key: string): Promise<T | null> {
    return this.data.get(key) ?? null
  }

  async set(key: string, value: any): Promise<void> {
    this.data.set(key, value)
  }

  async has(key: string): Promise<boolean> {
    return this.data.has(key)
  }

  async delete(key: string): Promise<void> {
    this.data.delete(key)
  }

  async clear(): Promise<void> {
    this.data.clear()
  }

  async save(): Promise<void> {
    // No-op in tests
  }

  async load(): Promise<void> {
    // No-op in tests
  }

  async keys(): Promise<string[]> {
    return Array.from(this.data.keys())
  }

  async values(): Promise<any[]> {
    return Array.from(this.data.values())
  }

  async entries(): Promise<[string, any][]> {
    return Array.from(this.data.entries())
  }

  async length(): Promise<number> {
    return this.data.size
  }

  // Test helpers
  getAll() {
    return Object.fromEntries(this.data)
  }

  reset() {
    this.data.clear()
  }

  setData(data: Record<string, any>) {
    this.data.clear()
    Object.entries(data).forEach(([key, value]) => {
      this.data.set(key, value)
    })
  }
}

export const mockStore = new MockStore()

vi.mock("@tauri-apps/plugin-store", () => ({
  Store: vi.fn(() => mockStore),
  load: vi.fn().mockResolvedValue(mockStore),
}))

// Helper functions for common store operations
export const storePresets = {
  empty: () => mockStore.reset(),

  withUserSettings: (settings: any = {}) => {
    mockStore.setData({
      "user-settings": {
        theme: "light",
        language: "en",
        ...settings,
      },
    })
  },

  withAppSettings: (settings: any = {}) => {
    mockStore.setData({
      "app-settings": {
        autoSave: true,
        backupInterval: 300,
        ...settings,
      },
    })
  },

  withProjectData: (project: any = {}) => {
    mockStore.setData({
      "current-project": {
        id: "test-project",
        name: "Test Project",
        path: "/test/project.json",
        ...project,
      },
    })
  },
}

// Helper to reset store mocks
export function resetStoreMocks() {
  mockStore.reset()
  vi.clearAllMocks()
}
