import { describe, expect, it, vi } from "vitest"

import { renderWithModal } from "@/test/test-utils"

import { VoiceRecordModal } from "../../components/voice-recording-modal"

// Мокаем хуки
vi.mock("../../hooks/use-audio-permissions", () => ({
  useAudioPermissions: () => ({
    permissionStatus: "granted",
    errorMessage: "",
    requestPermissions: vi.fn().mockResolvedValue(true),
    setErrorMessage: vi.fn(),
  }),
}))

vi.mock("../../hooks/use-audio-devices", () => ({
  useAudioDevices: () => ({
    audioDevices: [
      { deviceId: "device-1", label: "Microphone 1" },
      { deviceId: "device-2", label: "Microphone 2" },
    ],
    selectedAudioDevice: "device-1",
    setSelectedAudioDevice: vi.fn(),
    getDevices: vi.fn().mockResolvedValue(true),
  }),
}))

vi.mock("../../hooks/use-voice-recording", () => ({
  useVoiceRecording: () => ({
    isRecording: false,
    showCountdown: false,
    recordingTime: 0,
    isDeviceReady: true,
    countdown: 3,
    setCountdown: vi.fn(),
    audioRef: { current: null },
    formatTime: (seconds: number) => `00:${seconds.toString().padStart(2, "0")}`,
    stopRecording: vi.fn(),
    startCountdown: vi.fn(),
    initAudio: vi.fn(),
    cleanup: vi.fn(),
  }),
}))

describe("VoiceRecordModal", () => {
  it("renders the component", () => {
    const renderResult = renderWithModal(<VoiceRecordModal />)
    expect(renderResult.container.firstChild).not.toBeNull()
  })
})
