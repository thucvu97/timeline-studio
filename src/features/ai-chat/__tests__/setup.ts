import { vi } from "vitest"

// Mock the @xstate/react module
vi.mock("@xstate/react", () => ({
  useActor: vi.fn().mockImplementation(() => [
    {
      context: {
        chatMessages: [],
        selectedAgentId: "openai",
        isProcessing: false,
        error: null,
      },
      send: vi.fn(),
    },
    vi.fn(),
  ]),
}))
