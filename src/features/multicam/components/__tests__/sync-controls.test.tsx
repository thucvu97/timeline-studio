import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { SyncControls } from "../sync-controls"

// Моки
const mockMulticamReturn = {
  angles: [],
  activeAngleIndex: 0,
  activeAngle: null,
  isSync: false,
  syncOffsets: [],
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

// Мок для AudioSyncDialog
vi.mock("../audio-sync-dialog", () => ({
  AudioSyncDialog: ({ 
    isOpen, 
    onClose, 
    onSync 
  }: { 
    isOpen: boolean
    onClose: () => void
    onSync: () => Promise<any>
  }) => 
    isOpen ? (
      <div data-testid="audio-sync-dialog">
        <button onClick={onClose}>Close Audio Sync</button>
        <button onClick={async () => {
          await onSync()
          onClose()
        }}>
          Run Audio Sync
        </button>
      </div>
    ) : null,
}))

describe("SyncControls", () => {
  const mockOnSyncComplete = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    
    // Сброс состояния моков
    mockMulticamReturn.angles = []
    mockMulticamReturn.activeAngleIndex = 0
    mockMulticamReturn.activeAngle = null
    mockMulticamReturn.isSync = false
    mockMulticamReturn.syncOffsets = []
    mockMulticamReturn.hasMulticamSupport = false
    mockMulticamReturn.autoSyncByAudio.mockResolvedValue([])
    mockMulticamReturn.autoSyncByTimecode.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("не рендерится, если нет поддержки мультикамеры", () => {
    mockMulticamReturn.hasMulticamSupport = false
    
    const { container } = render(
      <SyncControls baseClipId="clip1" onSyncComplete={mockOnSyncComplete} />
    )
    
    expect(container.firstChild).toBeNull()
  })

  it("показывает кнопку синхронизации", () => {
    mockMulticamReturn.hasMulticamSupport = true
    
    render(<SyncControls baseClipId="clip1" onSyncComplete={mockOnSyncComplete} />)
    
    expect(screen.getByRole("button", { name: /Синхронизация/i })).toBeInTheDocument()
  })

  it("открывает меню с опциями синхронизации", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    mockMulticamReturn.hasMulticamSupport = true
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
    
    render(<SyncControls baseClipId="clip1" onSyncComplete={mockOnSyncComplete} />)
    
    await user.click(screen.getByRole("button", { name: /Синхронизация/i }))
    
    expect(screen.getByText("Синхронизация по таймкоду")).toBeInTheDocument()
    expect(screen.getByText("Синхронизация по аудио")).toBeInTheDocument()
    expect(screen.getByText("Ручная синхронизация")).toBeInTheDocument()
  })

  it("выполняет синхронизацию по таймкоду", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    mockMulticamReturn.hasMulticamSupport = true
    
    render(<SyncControls baseClipId="clip1" onSyncComplete={mockOnSyncComplete} />)
    
    await user.click(screen.getByRole("button", { name: /Синхронизация/i }))
    await user.click(screen.getByText("Синхронизация по таймкоду"))
    
    // Проверяем, что показывается статус синхронизации
    await waitFor(() => {
      expect(screen.getByText("Синхронизация по таймкоду...")).toBeInTheDocument()
    })
    
    // Ждем завершения таймаута
    vi.advanceTimersByTime(500)
    
    await waitFor(() => {
      expect(mockMulticamReturn.autoSyncByTimecode).toHaveBeenCalled()
      expect(mockOnSyncComplete).toHaveBeenCalled()
    })
    
    // Проверяем статус успеха
    expect(screen.getByText("Синхронизировано!")).toBeInTheDocument()
    
    // Проверяем сброс статуса через 3 секунды
    vi.advanceTimersByTime(3000)
    
    await waitFor(() => {
      expect(screen.getByText("Синхронизация")).toBeInTheDocument()
    })
  })

  it("открывает диалог аудио синхронизации", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    mockMulticamReturn.hasMulticamSupport = true
    
    render(<SyncControls baseClipId="clip1" onSyncComplete={mockOnSyncComplete} />)
    
    await user.click(screen.getByRole("button", { name: /Синхронизация/i }))
    await user.click(screen.getByText("Синхронизация по аудио"))
    
    expect(screen.getByTestId("audio-sync-dialog")).toBeInTheDocument()
  })

  it("выполняет аудио синхронизацию", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    mockMulticamReturn.hasMulticamSupport = true
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
    
    render(<SyncControls baseClipId="clip1" onSyncComplete={mockOnSyncComplete} />)
    
    // Открываем меню и выбираем аудио синхронизацию
    await user.click(screen.getByRole("button", { name: /Синхронизация/i }))
    await user.click(screen.getByText("Синхронизация по аудио"))
    
    // Запускаем синхронизацию в диалоге
    await user.click(screen.getByText("Run Audio Sync"))
    
    await waitFor(() => {
      expect(mockMulticamReturn.autoSyncByAudio).toHaveBeenCalled()
      expect(mockOnSyncComplete).toHaveBeenCalled()
    })
  })

  it("показывает углы для ручной синхронизации", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    mockMulticamReturn.hasMulticamSupport = true
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
    mockMulticamReturn.syncOffsets = [0, 1.5]
    mockMulticamReturn.activeAngleIndex = 0
    
    render(<SyncControls baseClipId="clip1" onSyncComplete={mockOnSyncComplete} />)
    
    await user.click(screen.getByRole("button", { name: /Синхронизация/i }))
    
    // Проверяем, что показаны углы с их смещениями
    expect(screen.getByText(/Camera 1/)).toBeInTheDocument()
    expect(screen.getByText(/Camera 2.*\+1\.50s/)).toBeInTheDocument()
  })

  it("открывает диалог ручной синхронизации", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    mockMulticamReturn.hasMulticamSupport = true
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
    
    render(<SyncControls baseClipId="clip1" onSyncComplete={mockOnSyncComplete} />)
    
    await user.click(screen.getByRole("button", { name: /Синхронизация/i }))
    await user.click(screen.getByText("Camera 2"))
    
    // Проверяем, что открылся диалог ручной синхронизации
    expect(screen.getByText("Ручная синхронизация")).toBeInTheDocument()
    expect(screen.getByText(/Настройте смещение для камеры "Camera 2"/)).toBeInTheDocument()
  })

  it("применяет ручную синхронизацию", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    mockMulticamReturn.hasMulticamSupport = true
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
    mockMulticamReturn.syncOffsets = [0, 0]
    
    render(<SyncControls baseClipId="clip1" onSyncComplete={mockOnSyncComplete} />)
    
    // Открываем меню и выбираем Camera 2
    await user.click(screen.getByRole("button", { name: /Синхронизация/i }))
    await user.click(screen.getByText("Camera 2"))
    
    // Применяем синхронизацию
    await user.click(screen.getByRole("button", { name: "Применить" }))
    
    expect(mockMulticamReturn.setSyncOffset).toHaveBeenCalledWith(1, 0)
    expect(mockMulticamReturn.syncAngles).toHaveBeenCalled()
    expect(mockOnSyncComplete).toHaveBeenCalled()
  })

  it("отключает активный угол в меню ручной синхронизации", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    mockMulticamReturn.hasMulticamSupport = true
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
    
    render(<SyncControls baseClipId="clip1" onSyncComplete={mockOnSyncComplete} />)
    
    await user.click(screen.getByRole("button", { name: /Синхронизация/i }))
    
    // Проверяем, что Camera 1 отключена (она активная)
    const camera1Item = screen.getByText("Camera 1").closest('[role="menuitem"]')
    expect(camera1Item).toHaveAttribute("aria-disabled", "true")
    
    // Camera 2 должна быть доступна
    const camera2Item = screen.getByText("Camera 2").closest('[role="menuitem"]')
    expect(camera2Item).not.toHaveAttribute("aria-disabled", "true")
  })

  it("показывает статус ошибки при неудачной синхронизации", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    mockMulticamReturn.hasMulticamSupport = true
    mockMulticamReturn.autoSyncByTimecode.mockRejectedValue(new Error("Sync failed"))
    
    render(<SyncControls baseClipId="clip1" onSyncComplete={mockOnSyncComplete} />)
    
    await user.click(screen.getByRole("button", { name: /Синхронизация/i }))
    await user.click(screen.getByText("Синхронизация по таймкоду"))
    
    // Ждем обработки ошибки
    vi.advanceTimersByTime(500)
    
    await waitFor(() => {
      expect(screen.getByText("Ошибка синхронизации")).toBeInTheDocument()
    })
    
    consoleSpy.mockRestore()
  })

  it("блокирует кнопки во время синхронизации", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    mockMulticamReturn.hasMulticamSupport = true
    
    render(<SyncControls baseClipId="clip1" onSyncComplete={mockOnSyncComplete} />)
    
    await user.click(screen.getByRole("button", { name: /Синхронизация/i }))
    await user.click(screen.getByText("Синхронизация по таймкоду"))
    
    // Проверяем, что кнопка заблокирована
    expect(screen.getByRole("button", { name: /Синхронизация по таймкоду.../i })).toBeDisabled()
  })

  it("применяет кастомный className", () => {
    mockMulticamReturn.hasMulticamSupport = true
    
    render(
      <SyncControls 
        baseClipId="clip1" 
        className="custom-class" 
        onSyncComplete={mockOnSyncComplete} 
      />
    )
    
    expect(screen.getByRole("button", { name: /Синхронизация/i })).toHaveClass("custom-class")
  })

  it("отменяет диалог ручной синхронизации", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    mockMulticamReturn.hasMulticamSupport = true
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
    
    render(<SyncControls baseClipId="clip1" onSyncComplete={mockOnSyncComplete} />)
    
    // Открываем диалог
    await user.click(screen.getByRole("button", { name: /Синхронизация/i }))
    await user.click(screen.getByText("Camera 2"))
    
    // Отменяем
    await user.click(screen.getByRole("button", { name: "Отмена" }))
    
    // Проверяем, что диалог закрылся
    expect(screen.queryByText("Ручная синхронизация")).not.toBeInTheDocument()
    expect(mockMulticamReturn.setSyncOffset).not.toHaveBeenCalled()
  })

  it("показывает подсказку в диалоге ручной синхронизации", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    mockMulticamReturn.hasMulticamSupport = true
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
    
    render(<SyncControls baseClipId="clip1" onSyncComplete={mockOnSyncComplete} />)
    
    await user.click(screen.getByRole("button", { name: /Синхронизация/i }))
    await user.click(screen.getByText("Camera 2"))
    
    expect(
      screen.getByText(/Используйте положительные значения, чтобы сдвинуть клип вперед/)
    ).toBeInTheDocument()
  })
})