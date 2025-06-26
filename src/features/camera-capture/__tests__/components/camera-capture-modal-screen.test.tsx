import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { ModalProvider } from "@/features/modals"

import { CameraCaptureModal } from "../../components/camera-capture-modal"

// Мокаем хуки
vi.mock("../../hooks", () => ({
  useCameraPermissions: vi.fn(() => ({
    permissionStatus: "granted",
    errorMessage: null,
    requestPermissions: vi.fn(),
  })),
  useCameraStream: vi.fn(() => ({
    isDeviceReady: true,
    setIsDeviceReady: vi.fn(),
    initCamera: vi.fn(),
    streamRef: { current: null },
  })),
  useDeviceCapabilities: vi.fn(() => ({
    availableResolutions: ["1920x1080", "1280x720"],
    supportedResolutions: ["1920x1080", "1280x720"],
    supportedFrameRates: [30, 60],
    isLoadingCapabilities: false,
    getDeviceCapabilities: vi.fn(),
  })),
  useDevices: vi.fn(() => ({
    devices: [{ deviceId: "camera1", label: "Camera 1" }],
    audioDevices: [{ deviceId: "mic1", label: "Mic 1" }],
    selectedDevice: "camera1",
    selectedAudioDevice: "mic1",
    setSelectedDevice: vi.fn(),
    setSelectedAudioDevice: vi.fn(),
    getDevices: vi.fn(),
  })),
  useRecording: vi.fn(() => ({
    isRecording: false,
    recordingTime: 0,
    showCountdown: false,
    countdown: 3,
    setCountdown: vi.fn(),
    startCountdown: vi.fn(),
    stopRecording: vi.fn(),
    formatRecordingTime: vi.fn((time: number) => `00:${time.toString().padStart(2, "0")}`),
  })),
  useScreenCapture: vi.fn(() => ({
    screenStream: null,
    isScreenSharing: false,
    error: null,
    startScreenCapture: vi.fn(),
    stopScreenCapture: vi.fn(),
    getSourceInfo: vi.fn(() => null),
  })),
}))

vi.mock("@/features/modals", () => ({
  useModal: vi.fn(() => ({
    isOpen: true,
    closeModal: vi.fn(),
  })),
  ModalProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      if (typeof options === "string") {
        return options // default value
      }

      const translations: Record<string, string> = {
        "cameraCapture.cameraMode": "Camera",
        "cameraCapture.screenMode": "Screen",
        "cameraCapture.screenSettings": "Screen Recording Settings",
        "cameraCapture.screenInfo": "Select a window, tab, or entire screen to record",
        "cameraCapture.microphone": "Microphone",
        "cameraCapture.noAudio": "No Audio",
        "cameraCapture.countdown": "Countdown",
        "cameraCapture.noCountdown": "No countdown",
        "cameraCapture.seconds": "seconds",
        "dialogs.cameraCapture.device": "Camera",
        "dialogs.cameraCapture.quality": "Quality",
        "dialogs.cameraCapture.supportedResolutions": "{{count}} supported resolutions",
        "common.ok": "OK",
      }

      let result = translations[key] || key

      // Handle interpolation
      if (options && typeof options === "object") {
        Object.entries(options).forEach(([k, v]) => {
          result = result.replace(`{{${k}}}`, String(v))
        })
      }

      return result
    },
  }),
}))

describe("CameraCaptureModal - Screen Recording", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should render mode switch buttons", () => {
    render(
      <ModalProvider>
        <CameraCaptureModal />
      </ModalProvider>,
    )

    expect(screen.getByText("Camera")).toBeInTheDocument()
    expect(screen.getByText("Screen")).toBeInTheDocument()
  })

  it("should switch to screen mode when Screen button is clicked", async () => {
    const mockStartScreenCapture = vi.fn()
    const mockStopScreenCapture = vi.fn()

    const { useScreenCapture } = await import("../../hooks")
    vi.mocked(useScreenCapture).mockReturnValue({
      screenStream: null,
      isScreenSharing: false,
      error: null,
      startScreenCapture: mockStartScreenCapture,
      stopScreenCapture: mockStopScreenCapture,
      getSourceInfo: vi.fn(() => null),
    })

    render(
      <ModalProvider>
        <CameraCaptureModal />
      </ModalProvider>,
    )

    const screenButton = screen.getByText("Screen")
    fireEvent.click(screenButton)

    await waitFor(() => {
      expect(mockStartScreenCapture).toHaveBeenCalledWith({
        video: true,
        audio: true,
      })
    })
  })

  it("should show screen settings when in screen mode", async () => {
    render(
      <ModalProvider>
        <CameraCaptureModal />
      </ModalProvider>,
    )

    const screenButton = screen.getByText("Screen")
    fireEvent.click(screenButton)

    await waitFor(() => {
      expect(screen.getByText("Screen Recording Settings")).toBeInTheDocument()
      expect(screen.getByText("Select a window, tab, or entire screen to record")).toBeInTheDocument()
    })
  })

  it("should hide camera settings when in screen mode", async () => {
    render(
      <ModalProvider>
        <CameraCaptureModal />
      </ModalProvider>,
    )

    // Сначала проверяем что настройки камеры видны (ищем элемент по роли)
    expect(screen.getAllByRole("combobox").length).toBeGreaterThan(2) // Камера, микрофон, разрешение и т.д.

    const screenButton = screen.getByText("Screen")
    fireEvent.click(screenButton)

    await waitFor(() => {
      // В режиме экрана должно быть меньше combobox элементов (только микрофон и обратный отсчет)
      expect(screen.getAllByRole("combobox").length).toBeLessThan(3)
    })
  })

  it("should stop screen capture when switching back to camera", async () => {
    const mockStopScreenCapture = vi.fn()

    const { useScreenCapture } = await import("../../hooks")
    vi.mocked(useScreenCapture).mockReturnValue({
      screenStream: new MediaStream(),
      isScreenSharing: true,
      error: null,
      startScreenCapture: vi.fn(),
      stopScreenCapture: mockStopScreenCapture,
      getSourceInfo: vi.fn(() => ({
        width: 1920,
        height: 1080,
        frameRate: 30,
        displaySurface: 'monitor',
        cursor: 'always',
      })),
    })

    render(
      <ModalProvider>
        <CameraCaptureModal />
      </ModalProvider>,
    )

    // Переключаемся на экран
    const screenButton = screen.getByText("Screen")
    fireEvent.click(screenButton)

    // Переключаемся обратно на камеру
    const cameraButton = screen.getByText("Camera")
    fireEvent.click(cameraButton)

    await waitFor(() => {
      expect(mockStopScreenCapture).toHaveBeenCalled()
    })
  })

  it("should show error message if screen capture fails", async () => {
    const { useScreenCapture } = await import("../../hooks")
    vi.mocked(useScreenCapture).mockReturnValue({
      screenStream: null,
      isScreenSharing: false,
      error: "Permission denied",
      startScreenCapture: vi.fn().mockRejectedValue(new Error("Permission denied")),
      stopScreenCapture: vi.fn(),
      getSourceInfo: vi.fn(() => null),
    })

    render(
      <ModalProvider>
        <CameraCaptureModal />
      </ModalProvider>,
    )

    const screenButton = screen.getByText("Screen")
    fireEvent.click(screenButton)

    await waitFor(() => {
      expect(screen.getByText("Permission denied")).toBeInTheDocument()
    })
  })

  it("should disable mode switch buttons when recording", async () => {
    const { useRecording } = await import("../../hooks")
    vi.mocked(useRecording).mockReturnValue({
      isRecording: true,
      recordingTime: 10,
      showCountdown: false,
      countdown: 3,
      setCountdown: vi.fn(),
      startCountdown: vi.fn(),
      stopRecording: vi.fn(),
      formatRecordingTime: vi.fn((time: number) => `00:${time.toString().padStart(2, "0")}`),
    })

    render(
      <ModalProvider>
        <CameraCaptureModal />
      </ModalProvider>,
    )

    const cameraButton = screen.getByText("Camera")
    const screenButton = screen.getByText("Screen")

    expect(cameraButton).toBeDisabled()
    expect(screenButton).toBeDisabled()
  })
})
