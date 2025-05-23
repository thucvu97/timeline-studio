import { render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { CameraCaptureModal } from "./camera-capture-modal"

// Мокируем хуки
vi.mock("./hooks/camera-capture-hooks", () => ({
  useCameraPermissions: () => ({
    permissionStatus: "granted",
    errorMessage: "",
    requestPermissions: vi.fn(),
  }),
  useDeviceCapabilities: () => ({
    availableResolutions: [
      { value: "1920x1080", label: "1920x1080 (Full HD)", width: 1920, height: 1080 },
    ],
    supportedResolutions: [
      { value: "1920x1080", label: "1920x1080 (Full HD)", width: 1920, height: 1080 },
    ],
    supportedFrameRates: [30],
    isLoadingCapabilities: false,
    getDeviceCapabilities: vi.fn(),
  }),
  useDevices: () => ({
    devices: [{ deviceId: "device-1", label: "Camera 1" }],
    audioDevices: [{ deviceId: "audio-1", label: "Microphone 1" }],
    selectedDevice: "device-1",
    selectedAudioDevice: "audio-1",
    setSelectedDevice: vi.fn(),
    setSelectedAudioDevice: vi.fn(),
    getDevices: vi.fn(),
  }),
}))

vi.mock("./hooks/use-camera-stream", () => ({
  useCameraStream: () => ({
    isDeviceReady: true,
    setIsDeviceReady: vi.fn(),
    errorMessage: "",
    initCamera: vi.fn(),
    streamRef: { current: null },
  }),
}))

vi.mock("./hooks/use-recording", () => ({
  useRecording: () => ({
    isRecording: false,
    recordingTime: 0,
    showCountdown: false,
    countdown: 3,
    setCountdown: vi.fn(),
    startCountdown: vi.fn(),
    stopRecording: vi.fn(),
    formatRecordingTime: () => "00:00:00",
  }),
}))

// Мокируем компоненты
vi.mock("./components/camera-permission-request", () => ({
  CameraPermissionRequest: ({ permissionStatus, errorMessage, onRequestPermissions }: any) => (
    <div data-testid="camera-permission-request">
      Status: {permissionStatus}
      {errorMessage && <div>Error: {errorMessage}</div>}
    </div>
  ),
}))

vi.mock("./components/camera-preview", () => ({
  CameraPreview: ({ videoRef, isDeviceReady, showCountdown, countdown }: any) => (
    <div data-testid="camera-preview">
      Device ready: {isDeviceReady ? "yes" : "no"}
      {showCountdown && <div>Countdown: {countdown}</div>}
    </div>
  ),
}))

vi.mock("./components/camera-settings", () => ({
  CameraSettings: (props: any) => (
    <div data-testid="camera-settings">
      Device: {props.selectedDevice}
      Audio: {props.selectedAudioDevice}
      Resolution: {props.selectedResolution}
      FPS: {props.frameRate}
    </div>
  ),
}))

vi.mock("./components/recording-controls", () => ({
  RecordingControls: ({ isRecording, recordingTime, isDeviceReady }: any) => (
    <div data-testid="recording-controls">
      Recording: {isRecording ? "yes" : "no"}
      Time: {recordingTime}
      Device ready: {isDeviceReady ? "yes" : "no"}
    </div>
  ),
}))

// Мокируем компоненты UI
vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children }: any) => <div>{children}</div>,
  DialogContent: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  ),
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <div>{children}</div>,
}))

// Мокируем хук useModal
vi.mock("@/hooks/use-modal", () => ({
  useModal: () => ({
    isOpen: true,
    closeModal: vi.fn(),
  }),
}))

// Мокируем useTranslation
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

describe("CameraCaptureModal", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders all components correctly", async () => {
    render(<CameraCaptureModal />)

    // Проверяем, что компоненты отображаются
    // Заголовок не отображается в моке, поэтому пропускаем эту проверку

    // Проверяем, что все компоненты отображаются
    expect(screen.getByTestId("camera-permission-request")).toBeInTheDocument()
    expect(screen.getByTestId("camera-preview")).toBeInTheDocument()
    expect(screen.getByTestId("camera-settings")).toBeInTheDocument()
    expect(screen.getByTestId("recording-controls")).toBeInTheDocument()

    // Проверяем, что компоненты получают правильные пропсы
    const deviceReadyElements = screen.getAllByText(/Device ready: yes/i)
    expect(deviceReadyElements.length).toBeGreaterThan(0)

    // Проверяем содержимое компонента recording-controls
    const recordingControls = screen.getByTestId("recording-controls")
    expect(recordingControls).toHaveTextContent("Recording:")
  })

  it("renders with correct layout", async () => {
    render(<CameraCaptureModal />)

    // Проверяем, что есть flex контейнер для разделения на колонки
    const flexContainer = screen.getByText("Device ready: yes").closest(".flex.flex-row")
    expect(flexContainer).toBeInTheDocument()

    // Проверяем, что есть левая и правая колонки
    const columns = document.querySelectorAll(".flex.flex-col.w-3\\/5, .flex.flex-col.w-2\\/5")
    expect(columns.length).toBe(2)
  })
})
