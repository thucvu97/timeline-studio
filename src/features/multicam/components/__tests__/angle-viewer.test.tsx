import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { renderWithTimeline } from "@/test/test-utils"
import { AngleViewer } from "../angle-viewer"
import type { MulticamAngle } from "../../hooks/use-multicam"

// Мокируем иконки lucide-react
vi.mock("lucide-react", () => ({
  Camera: ({ className, ...props }: any) => (
    <svg {...props} className={className} data-testid="camera-icon" data-icon="Camera">
      Camera
    </svg>
  ),
  Play: ({ className, ...props }: any) => (
    <svg {...props} className={className} data-testid="play-icon" data-icon="Play">
      Play
    </svg>
  ),
  Pause: ({ className, ...props }: any) => (
    <svg {...props} className={className} data-testid="pause-icon" data-icon="Pause">
      Pause
    </svg>
  ),
  Clock: ({ className, ...props }: any) => (
    <svg {...props} className={className} data-testid="clock-icon" data-icon="Clock">
      Clock
    </svg>
  ),
}))

// Моки
const mockMulticamReturn = {
  angles: [] as MulticamAngle[],
  activeAngleIndex: 0,
  activeAngle: null as MulticamAngle | null,
  isSync: false,
  syncOffsets: [] as number[],
  switchToAngle: vi.fn(),
  switchToNextAngle: vi.fn(),
  switchToPreviousAngle: vi.fn(),
  switchToAngleByClipId: vi.fn(),
  syncAngles: vi.fn(),
  setSyncOffset: vi.fn(),
  autoSyncByAudio: vi.fn(),
  autoSyncByTimecode: vi.fn(),
  addAngle: vi.fn(),
  removeAngle: vi.fn(),
  reorderAngles: vi.fn(),
  getAngleByClipId: vi.fn(),
  isMulticamClip: vi.fn(),
  hasMulticamSupport: false,
  syncStatus: "idle" as const,
  syncProgress: 0,
  syncError: null,
}

vi.mock("../hooks/use-multicam", () => ({
  useMulticam: () => mockMulticamReturn,
}))

// Мок для SyncControls
vi.mock("../components/sync-controls", () => ({
  SyncControls: ({ onSyncComplete }: { onSyncComplete?: () => void }) => (
    <div data-testid="sync-controls" onClick={onSyncComplete}>
      SyncControls
    </div>
  ),
}))

// Мок для видео элементов
const mockVideoPlay = vi.fn().mockResolvedValue(undefined)
const mockVideoPause = vi.fn()

describe("AngleViewer", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Сброс состояния моков
    mockMulticamReturn.angles = []
    mockMulticamReturn.activeAngleIndex = 0
    mockMulticamReturn.activeAngle = null
    mockMulticamReturn.isSync = false
    mockMulticamReturn.syncOffsets = []
    mockMulticamReturn.hasMulticamSupport = false

    // Мок для HTMLVideoElement
    HTMLVideoElement.prototype.play = mockVideoPlay
    HTMLVideoElement.prototype.pause = mockVideoPause
  })

  it("показывает сообщение, когда нет углов камер", () => {
    renderWithTimeline(<AngleViewer baseClipId="clip1" />)

    expect(screen.getByText("Нет доступных углов камер")).toBeInTheDocument()
    expect(screen.queryByTestId("sync-controls")).not.toBeInTheDocument()
  })

  it("рендерит сетку углов камер", () => {
    mockMulticamReturn.angles = [
      {
        id: "angle-1",
        name: "Camera 1",
        clipId: "clip1",
        clip: {} as any,
        syncOffset: 0,
        isActive: true,
      },
      {
        id: "angle-2",
        name: "Camera 2",
        clipId: "clip2",
        clip: {} as any,
        syncOffset: 0,
        isActive: false,
      },
    ]
    mockMulticamReturn.activeAngleIndex = 0
    mockMulticamReturn.activeAngle = mockMulticamReturn.angles[0]

    renderWithTimeline(<AngleViewer baseClipId="clip1" />)

    expect(screen.getByText("Camera 1")).toBeInTheDocument()
    expect(screen.getByText("Camera 2")).toBeInTheDocument()
    expect(screen.getByTestId("sync-controls")).toBeInTheDocument()
  })

  it("показывает активный угол с особым стилем", () => {
    mockMulticamReturn.angles = [
      {
        id: "angle-1",
        name: "Camera 1",
        clipId: "clip1",
        clip: {} as any,
        syncOffset: 0,
        isActive: true,
      },
      {
        id: "angle-2",
        name: "Camera 2",
        clipId: "clip2",
        clip: {} as any,
        syncOffset: 0,
        isActive: false,
      },
    ]

    renderWithTimeline(<AngleViewer baseClipId="clip1" />)

    // Проверяем активный угол
    const activeAngle = screen.getByText("Camera 1").closest("div")
    expect(activeAngle?.parentElement?.parentElement).toHaveClass("border-primary")

    // Проверяем неактивный угол
    const inactiveAngle = screen.getByText("Camera 2").closest("div")
    expect(inactiveAngle?.parentElement?.parentElement).toHaveClass("border-muted")
  })

  it("переключает углы при клике", async () => {
    const user = userEvent.setup()
    mockMulticamReturn.angles = [
      {
        id: "angle-1",
        name: "Camera 1",
        clipId: "clip1",
        clip: {} as any,
        syncOffset: 0,
        isActive: true,
      },
      {
        id: "angle-2",
        name: "Camera 2",
        clipId: "clip2",
        clip: {} as any,
        syncOffset: 0,
        isActive: false,
      },
    ]

    const onAngleClick = vi.fn()
    renderWithTimeline(<AngleViewer baseClipId="clip1" onAngleClick={onAngleClick} />)

    const camera2 = screen.getByText("Camera 2").parentElement?.parentElement
    await user.click(camera2!)

    expect(mockMulticamReturn.switchToAngle).toHaveBeenCalledWith(1)
    expect(onAngleClick).toHaveBeenCalledWith(mockMulticamReturn.angles[1], 1)
  })

  it("управляет воспроизведением видео", async () => {
    const user = userEvent.setup()
    mockMulticamReturn.angles = [
      {
        id: "angle-1",
        name: "Camera 1",
        clipId: "clip1",
        clip: {} as any,
        syncOffset: 0,
        isActive: true,
        mediaPath: "path/to/video1.mp4",
      },
    ]

    renderWithTimeline(<AngleViewer baseClipId="clip1" />)

    // Нажимаем кнопку воспроизведения
    const playButton = screen.getByRole("button", { name: "" })
    await user.click(playButton)

    await waitFor(() => {
      expect(mockVideoPlay).toHaveBeenCalled()
    })

    // Нажимаем кнопку паузы
    await user.click(playButton)

    expect(mockVideoPause).toHaveBeenCalled()
  })

  it("показывает метки камер, когда showLabels=true", () => {
    mockMulticamReturn.angles = [
      {
        id: "angle-1",
        name: "Camera 1",
        clipId: "clip1",
        clip: {} as any,
        syncOffset: 0,
        isActive: true,
      },
    ]

    renderWithTimeline(<AngleViewer baseClipId="clip1" showLabels={true} />)
    expect(screen.getByText("Camera 1")).toBeInTheDocument()
  })

  it("скрывает метки камер, когда showLabels=false", () => {
    mockMulticamReturn.angles = [
      {
        id: "angle-1",
        name: "Camera 1",
        clipId: "clip1",
        clip: {} as any,
        syncOffset: 0,
        isActive: true,
      },
    ]

    renderWithTimeline(<AngleViewer baseClipId="clip1" showLabels={false} />)
    expect(screen.queryByText("Camera 1")).not.toBeInTheDocument()
  })

  it("показывает таймкод, когда showTimecode=true", () => {
    mockMulticamReturn.angles = [
      {
        id: "angle-1",
        name: "Camera 1",
        clipId: "clip1",
        clip: {} as any,
        syncOffset: 0,
        isActive: true,
      },
    ]

    renderWithTimeline(<AngleViewer baseClipId="clip1" showTimecode={true} />)
    expect(screen.getByText("00:00:00")).toBeInTheDocument()
  })

  it("показывает индикатор синхронизации для смещенных углов", () => {
    mockMulticamReturn.angles = [
      {
        id: "angle-1",
        name: "Camera 1",
        clipId: "clip1",
        clip: {} as any,
        syncOffset: 0,
        isActive: true,
      },
      {
        id: "angle-2",
        name: "Camera 2",
        clipId: "clip2",
        clip: {} as any,
        syncOffset: 1.5,
        isActive: false,
      },
    ]
    mockMulticamReturn.isSync = true
    mockMulticamReturn.syncOffsets = [0, 1.5]

    renderWithTimeline(<AngleViewer baseClipId="clip1" />)
    expect(screen.getByText("+1.5s")).toBeInTheDocument()
  })

  it("рассчитывает оптимальное количество колонок", () => {
    // 2 камеры = 2 колонки
    mockMulticamReturn.angles = Array(2)
      .fill(null)
      .map((_, i) => ({
        id: `angle-${i}`,
        name: `Camera ${i + 1}`,
        clipId: `clip${i}`,
        clip: {} as any,
        syncOffset: 0,
        isActive: i === 0,
      }))

    renderWithTimeline(<AngleViewer baseClipId="clip1" />)
    let grid = screen.getByText("Camera 1").parentElement?.parentElement?.parentElement
    expect(grid).toHaveStyle({ gridTemplateColumns: "repeat(2, 1fr)" })

    // 5 камер = 3 колонки
    mockMulticamReturn.angles = Array(5)
      .fill(null)
      .map((_, i) => ({
        id: `angle-${i}`,
        name: `Camera ${i + 1}`,
        clipId: `clip${i}`,
        clip: {} as any,
        syncOffset: 0,
        isActive: i === 0,
      }))

    renderWithTimeline(<AngleViewer baseClipId="clip1" />)
    grid = screen.getByText("Camera 1").parentElement?.parentElement?.parentElement
    expect(grid).toHaveStyle({ gridTemplateColumns: "repeat(3, 1fr)" })
  })

  it("ограничивает максимальное количество колонок", () => {
    mockMulticamReturn.angles = Array(20)
      .fill(null)
      .map((_, i) => ({
        id: `angle-${i}`,
        name: `Camera ${i + 1}`,
        clipId: `clip${i}`,
        clip: {} as any,
        syncOffset: 0,
        isActive: i === 0,
      }))

    renderWithTimeline(<AngleViewer baseClipId="clip1" maxColumns={3} />)
    const grid = screen.getByText("Camera 1").parentElement?.parentElement?.parentElement
    expect(grid).toHaveStyle({ gridTemplateColumns: "repeat(3, 1fr)" })
  })

  it("применяет кастомный className", () => {
    mockMulticamReturn.angles = [
      {
        id: "angle-1",
        name: "Camera 1",
        clipId: "clip1",
        clip: {} as any,
        syncOffset: 0,
        isActive: true,
      },
    ]

    renderWithTimeline(<AngleViewer baseClipId="clip1" className="custom-class" />)
    const container = screen.getByText("Camera 1").closest(".custom-class")
    expect(container).toBeInTheDocument()
  })

  it("показывает заглушку при ошибке загрузки видео", async () => {
    mockMulticamReturn.angles = [
      {
        id: "angle-1",
        name: "Camera 1",
        clipId: "clip1",
        clip: {} as any,
        syncOffset: 0,
        isActive: true,
        mediaPath: "invalid/path.mp4",
      },
    ]

    renderWithTimeline(<AngleViewer baseClipId="clip1" />)

    const video = screen.getByText("Camera 1").parentElement?.parentElement?.querySelector("video") as HTMLVideoElement

    // Эмулируем ошибку загрузки видео
    video.dispatchEvent(new Event("error"))

    await waitFor(() => {
      const errorIcon = screen.getByText("Camera 1").parentElement?.parentElement?.querySelector(".bg-muted")
      expect(errorIcon).toBeInTheDocument()
    })
  })

  it("вызывает onSyncComplete при завершении синхронизации", async () => {
    const user = userEvent.setup()
    const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {})

    mockMulticamReturn.angles = [
      {
        id: "angle-1",
        name: "Camera 1",
        clipId: "clip1",
        clip: {} as any,
        syncOffset: 0,
        isActive: true,
      },
    ]

    renderWithTimeline(<AngleViewer baseClipId="clip1" />)

    const syncControls = screen.getByTestId("sync-controls")
    await user.click(syncControls)

    expect(consoleLogSpy).toHaveBeenCalledWith("[AngleViewer] Sync completed")

    consoleLogSpy.mockRestore()
  })
})
