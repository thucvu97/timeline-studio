/**
 * Integration test for new architecture
 *
 * Тестирует базовую функциональность новой архитектуры state management
 */

import { act } from "react"

import { render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useTimeline } from "../../../timeline/hooks/use-timeline"
import { TimelineProvider } from "../../../timeline/services/timeline-provider"
import { PlayerProvider, usePlayer } from "../../../video-player/services/player-provider"
import { AppProvider, useApp } from "../../services/app-provider"

// Mock backend sync module completely
vi.mock("../../services/backend-sync", () => {
  const mockBackendSyncInstance = {
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn(),
    executeCommand: vi.fn().mockResolvedValue({ success: true, data: {} }),
    onStateChange: vi.fn().mockReturnValue(() => {}),
    onEvent: vi.fn().mockReturnValue(() => {}),
  }

  return {
    getBackendSync: () => mockBackendSyncInstance,
    BackendSync: vi.fn(() => mockBackendSyncInstance),
  }
})

// Mock user settings
vi.mock("../../../user-settings", () => ({
  useUserSettings: () => ({
    playerVolume: 50,
    handlePlayerVolumeChange: vi.fn(),
  }),
}))

// Test component that uses new architecture
function TestComponent() {
  const app = useApp()
  const timeline = useTimeline()
  const player = usePlayer()

  const handleCreateProject = async () => {
    try {
      await timeline.createProject("Test Project")
    } catch (error) {
      console.error("Create project failed:", error)
    }
  }

  const handlePlay = async () => {
    try {
      await player.play()
    } catch (error) {
      console.error("Play failed:", error)
    }
  }

  return (
    <div>
      <div data-testid="connection-status">{app.isConnected ? "Connected" : "Disconnected"}</div>
      <div data-testid="project-name">{timeline.project?.metadata.name || "No Project"}</div>
      <div data-testid="playback-status">{player.isPlaying ? "Playing" : "Paused"}</div>
      <div data-testid="current-time">{player.currentTime}</div>
      <button data-testid="create-project" onClick={handleCreateProject}>
        Create Project
      </button>
      <button data-testid="play-button" onClick={handlePlay}>
        Play
      </button>
      <div data-testid="timeline-scale">{timeline.timeScale}</div>
      <button data-testid="set-scale" onClick={() => timeline.setTimeScale(2)}>
        Set Scale
      </button>
    </div>
  )
}

function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <TimelineProvider>
        <PlayerProvider>{children}</PlayerProvider>
      </TimelineProvider>
    </AppProvider>
  )
}

describe("New Architecture Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should render all providers without errors", async () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>,
    )

    // Проверяем что компонент отрендерился
    expect(screen.getByTestId("connection-status")).toBeInTheDocument()
    expect(screen.getByTestId("project-name")).toBeInTheDocument()
    expect(screen.getByTestId("playback-status")).toBeInTheDocument()
  })

  it("should show initial state correctly", async () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>,
    )

    // Проверяем начальное состояние
    expect(screen.getByTestId("project-name")).toHaveTextContent("No Project")
    expect(screen.getByTestId("playback-status")).toHaveTextContent("Paused")
    expect(screen.getByTestId("current-time")).toHaveTextContent("0")
    expect(screen.getByTestId("timeline-scale")).toHaveTextContent("1")
  })

  it("should handle UI commands locally (timeline scale)", async () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>,
    )

    const setScaleButton = screen.getByTestId("set-scale")

    // Кликаем на кнопку изменения масштаба
    await act(async () => {
      setScaleButton.click()
    })

    // Проверяем что масштаб изменился локально (без backend)
    expect(screen.getByTestId("timeline-scale")).toHaveTextContent("2")
  })

  it("should handle backend commands (create project)", async () => {
    const { getBackendSync } = await import("../../services/backend-sync")
    const mockBackendSync = getBackendSync()

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>,
    )

    const createProjectButton = screen.getByTestId("create-project")

    // Кликаем на создание проекта
    await act(async () => {
      createProjectButton.click()
    })

    // Проверяем что вызвана backend команда
    await waitFor(() => {
      expect(mockBackendSync.executeCommand).toHaveBeenCalledWith({
        type: "CreateProject",
        params: { name: "Test Project", settings: {} },
      })
    })
  })

  it("should handle player commands (play)", async () => {
    const { getBackendSync } = await import("../../services/backend-sync")
    const mockBackendSync = getBackendSync()

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>,
    )

    const playButton = screen.getByTestId("play-button")

    // Кликаем на воспроизведение
    await act(async () => {
      playButton.click()
    })

    // Проверяем что вызвана backend команда
    await waitFor(() => {
      expect(mockBackendSync.executeCommand).toHaveBeenCalledWith({
        type: "Play",
        params: {},
      })
    })
  })

  it("should maintain separation between UI and backend state", async () => {
    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>,
    )

    // UI команды должны выполняться мгновенно
    const setScaleButton = screen.getByTestId("set-scale")
    await act(async () => {
      setScaleButton.click()
    })
    expect(screen.getByTestId("timeline-scale")).toHaveTextContent("2")

    // Backend команды требуют асинхронного выполнения
    const createProjectButton = screen.getByTestId("create-project")
    await act(async () => {
      createProjectButton.click()
    })

    // Проект должен быть создан через backend (mock не изменяет состояние)
    expect(screen.getByTestId("project-name")).toHaveTextContent("No Project")
  })
})
