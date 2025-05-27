import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useVoiceRecording } from "./use-voice-recording"

// Мокаем navigator.mediaDevices
const mockGetUserMedia = vi.fn()

beforeEach(() => {
  vi.resetAllMocks()

  // Мокаем navigator.mediaDevices.getUserMedia
  Object.defineProperty(global.navigator, "mediaDevices", {
    value: {
      getUserMedia: mockGetUserMedia,
    },
    writable: true,
  })

  // Мокаем MediaRecorder
  global.MediaRecorder = vi.fn().mockImplementation(() => ({
    start: vi.fn(),
    stop: vi.fn(),
    state: "inactive",
    ondataavailable: null,
    onstop: null,
  }))
})

describe("useVoiceRecording", () => {
  it("initializes with default values", () => {
    const setErrorMessage = vi.fn()
    const onSaveRecording = vi.fn()

    const { result } = renderHook(() =>
      useVoiceRecording({
        selectedAudioDevice: "device-1",
        isMuted: true,
        setErrorMessage,
        onSaveRecording,
      }),
    )

    expect(result.current.isRecording).toBe(false)
    expect(result.current.showCountdown).toBe(false)
    expect(result.current.recordingTime).toBe(0)
    expect(result.current.isDeviceReady).toBe(false)
    expect(result.current.countdown).toBe(3)
    expect(typeof result.current.formatTime).toBe("function")
    expect(typeof result.current.stopRecording).toBe("function")
    expect(typeof result.current.startCountdown).toBe("function")
    expect(typeof result.current.initAudio).toBe("function")
    expect(typeof result.current.cleanup).toBe("function")
  })

  it("formats time correctly", () => {
    const setErrorMessage = vi.fn()
    const onSaveRecording = vi.fn()

    const { result } = renderHook(() =>
      useVoiceRecording({
        selectedAudioDevice: "device-1",
        isMuted: true,
        setErrorMessage,
        onSaveRecording,
      }),
    )

    expect(result.current.formatTime(0)).toBe("00:00")
    expect(result.current.formatTime(61)).toBe("01:01")
    expect(result.current.formatTime(3661)).toBe("61:01")
  })

  it("initializes audio when initAudio is called", async () => {
    const setErrorMessage = vi.fn()
    const onSaveRecording = vi.fn()

    // Мокаем успешный запрос getUserMedia
    const mockStream = {
      getTracks: () => [{ stop: vi.fn() }],
    }
    mockGetUserMedia.mockResolvedValue(mockStream)

    const { result } = renderHook(() =>
      useVoiceRecording({
        selectedAudioDevice: "device-1",
        isMuted: true,
        setErrorMessage,
        onSaveRecording,
      }),
    )

    await act(async () => {
      await result.current.initAudio()
    })

    expect(mockGetUserMedia).toHaveBeenCalledWith({
      audio: {
        deviceId: { exact: "device-1" },
      },
    })
    expect(result.current.isDeviceReady).toBe(true)
  })

  it("handles errors when initializing audio", async () => {
    const setErrorMessage = vi.fn()
    const onSaveRecording = vi.fn()

    // Мокаем ошибку при запросе getUserMedia
    mockGetUserMedia.mockRejectedValue(new Error("Device error"))

    const { result } = renderHook(() =>
      useVoiceRecording({
        selectedAudioDevice: "device-1",
        isMuted: true,
        setErrorMessage,
        onSaveRecording,
      }),
    )

    await act(async () => {
      await result.current.initAudio()
    })

    expect(setErrorMessage).toHaveBeenCalled()
    expect(result.current.isDeviceReady).toBe(false)
  })

  it("cleans up resources when cleanup is called", async () => {
    const setErrorMessage = vi.fn()
    const onSaveRecording = vi.fn()

    // Мокаем успешный запрос getUserMedia
    const mockTrackStop = vi.fn()
    const mockStream = {
      getTracks: () => [{ stop: mockTrackStop }],
    }
    mockGetUserMedia.mockResolvedValue(mockStream)

    const { result } = renderHook(() =>
      useVoiceRecording({
        selectedAudioDevice: "device-1",
        isMuted: true,
        setErrorMessage,
        onSaveRecording,
      }),
    )

    // Инициализируем аудио
    await act(async () => {
      await result.current.initAudio()
    })

    // Очищаем ресурсы
    act(() => {
      result.current.cleanup()
    })

    expect(result.current.isDeviceReady).toBe(false)
  })
})
