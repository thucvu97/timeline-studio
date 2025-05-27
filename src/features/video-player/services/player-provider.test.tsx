import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { PlayerProvider } from "./player-provider"

// Мокаем useUserSettings
vi.mock("@/features/user-settings", () => ({
  useUserSettings: () => ({
    playerVolume: 100,
    handlePlayerVolumeChange: vi.fn(),
  }),
}))

// Мокаем useMachine из @xstate/react
vi.mock("@xstate/react", () => ({
  useMachine: vi.fn(() => [
    {
      context: {
        video: null,
        currentTime: 0,
        isPlaying: false,
        isSeeking: false,
        isChangingCamera: false,
        isRecording: false,
        isVideoLoading: false,
        isVideoReady: false,
        isResizableMode: true,
        duration: 0,
        volume: 100,
      },
    },
    vi.fn(), // mock для send
  ]),
}))

// Мокаем playerMachine
vi.mock("./player-machine", () => ({
  playerMachine: {
    id: "player",
    initial: "idle",
    context: {
      video: null,
      currentTime: 0,
      isPlaying: false,
      isSeeking: false,
      isChangingCamera: false,
      isRecording: false,
      isVideoLoading: false,
      isVideoReady: false,
      isResizableMode: true,
      duration: 0,
      volume: 100,
    },
  },
  PlayerContextType: {},
}))

// Мокаем console.log для проверки вызова
beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, "log").mockImplementation(() => {})
})

describe("PlayerProvider", () => {
  it("should render without errors", () => {
    // Рендерим провайдер с тестовым содержимым
    render(
      <PlayerProvider>
        <div data-testid="test-content">Test Content</div>
      </PlayerProvider>,
    )

    // Проверяем, что содержимое отрендерилось
    expect(screen.getByTestId("test-content")).toBeInTheDocument()
    expect(screen.getByTestId("test-content").textContent).toBe("Test Content")
  })
})
