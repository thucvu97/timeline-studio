import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useAudioDevices } from "./use-audio-devices"

// Мокаем navigator.mediaDevices
const mockEnumerateDevices = vi.fn()

beforeEach(() => {
  vi.resetAllMocks()
  
  // Мокаем navigator.mediaDevices.enumerateDevices
  Object.defineProperty(global.navigator, "mediaDevices", {
    value: {
      enumerateDevices: mockEnumerateDevices,
    },
    writable: true,
  })
})

describe("useAudioDevices", () => {
  it("initializes with empty devices list", () => {
    const setErrorMessage = vi.fn()
    
    const { result } = renderHook(() => useAudioDevices({
      setErrorMessage
    }))
    
    expect(result.current.audioDevices).toEqual([])
    expect(result.current.selectedAudioDevice).toBe("")
    expect(typeof result.current.setSelectedAudioDevice).toBe("function")
    expect(typeof result.current.getDevices).toBe("function")
  })
  
  it("gets devices successfully", async () => {
    const setErrorMessage = vi.fn()
    
    // Мокаем успешный запрос enumerateDevices
    const mockDevices = [
      { kind: "audioinput", deviceId: "device-1", label: "Microphone 1" },
      { kind: "audioinput", deviceId: "device-2", label: "Microphone 2" },
      { kind: "videoinput", deviceId: "device-3", label: "Camera 1" },
    ]
    mockEnumerateDevices.mockResolvedValue(mockDevices)
    
    const { result } = renderHook(() => useAudioDevices({
      setErrorMessage
    }))
    
    let success = false
    await act(async () => {
      success = await result.current.getDevices()
    })
    
    expect(success).toBe(true)
    expect(result.current.audioDevices).toHaveLength(2)
    expect(result.current.audioDevices[0].deviceId).toBe("device-1")
    expect(result.current.audioDevices[1].deviceId).toBe("device-2")
    expect(result.current.selectedAudioDevice).toBe("device-1")
  })
  
  it("handles errors when getting devices", async () => {
    const setErrorMessage = vi.fn()
    
    // Мокаем ошибку при запросе enumerateDevices
    mockEnumerateDevices.mockRejectedValue(new Error("Enumeration error"))
    
    const { result } = renderHook(() => useAudioDevices({
      setErrorMessage
    }))
    
    let success = false
    await act(async () => {
      success = await result.current.getDevices()
    })
    
    expect(success).toBe(false)
    expect(setErrorMessage).toHaveBeenCalled()
    expect(result.current.audioDevices).toEqual([])
  })
  
  it("sets selected device", () => {
    const setErrorMessage = vi.fn()
    
    const { result } = renderHook(() => useAudioDevices({
      setErrorMessage
    }))
    
    act(() => {
      result.current.setSelectedAudioDevice("device-2")
    })
    
    expect(result.current.selectedAudioDevice).toBe("device-2")
  })
})
