import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { setupAudioTestEnvironment } from "@/test/utils/tauri-audio-test-utils"

import { useAudioEngine } from "../use-audio-engine"

// Mock the AudioEngine service using vi.hoisted
const { mockAudioEngine } = vi.hoisted(() => ({
  mockAudioEngine: {
    initialize: vi.fn(),
    dispose: vi.fn(),
    connectMediaElement: vi.fn(),
    updateChannelVolume: vi.fn(),
    updateChannelPan: vi.fn(),
    muteChannel: vi.fn(),
    soloChannel: vi.fn(),
    updateMasterVolume: vi.fn(),
    enableLimiter: vi.fn(),
    setLimiterThreshold: vi.fn(),
    createChannel: vi.fn(),
    getChannelAnalyser: vi.fn(),
    getMasterAnalyser: vi.fn(),
  },
}))

vi.mock("../services/audio-engine", () => ({
  AudioEngine: vi.fn(() => mockAudioEngine),
}))

describe.skip("useAudioEngine", () => {
  let testEnv: ReturnType<typeof setupAudioTestEnvironment>

  beforeEach(() => {
    testEnv = setupAudioTestEnvironment()
    vi.clearAllMocks()

    // Setup default mock returns
    mockAudioEngine.initialize.mockResolvedValue(undefined)
    mockAudioEngine.createChannel.mockReturnValue({ id: "test-channel" })
    mockAudioEngine.getChannelAnalyser.mockReturnValue(testEnv.webAudio.AudioContext().createAnalyser())
    mockAudioEngine.getMasterAnalyser.mockReturnValue(testEnv.webAudio.AudioContext().createAnalyser())
  })

  afterEach(() => {
    testEnv?.cleanup()
  })

  describe("initialization", () => {
    it("initializes AudioEngine on mount", () => {
      renderHook(() => useAudioEngine())

      expect(mockAudioEngine.initialize).toHaveBeenCalledOnce()
    })

    it("starts with isInitialized false", () => {
      const { result } = renderHook(() => useAudioEngine())

      expect(result.current.isInitialized).toBe(false)
    })

    it("sets isInitialized to true after engine initializes", async () => {
      const { result } = renderHook(() => useAudioEngine())

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true)
      })
    })

    it("provides engine reference after initialization", async () => {
      const { result } = renderHook(() => useAudioEngine())

      await waitFor(() => {
        expect(result.current.engine).toBe(mockAudioEngine)
      })
    })

    it("disposes engine on unmount", () => {
      const { unmount } = renderHook(() => useAudioEngine())

      unmount()

      expect(mockAudioEngine.dispose).toHaveBeenCalledOnce()
    })

    it("resets state on unmount", () => {
      const { result, unmount } = renderHook(() => useAudioEngine())

      unmount()

      expect(result.current.engine).toBe(null)
      expect(result.current.isInitialized).toBe(false)
    })
  })

  describe("connectMediaElement", () => {
    it("calls engine connectMediaElement when initialized", async () => {
      const { result } = renderHook(() => useAudioEngine())
      const mockMediaElement = document.createElement("audio")

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true)
      })

      act(() => {
        result.current.connectMediaElement("ch1", mockMediaElement)
      })

      expect(mockAudioEngine.connectMediaElement).toHaveBeenCalledWith("ch1", mockMediaElement)
    })

    it("does nothing when not initialized", () => {
      const { result } = renderHook(() => useAudioEngine())
      const mockMediaElement = document.createElement("audio")

      act(() => {
        result.current.connectMediaElement("ch1", mockMediaElement)
      })

      expect(mockAudioEngine.connectMediaElement).not.toHaveBeenCalled()
    })
  })

  describe("updateChannelVolume", () => {
    it("calls engine updateChannelVolume when initialized", async () => {
      const { result } = renderHook(() => useAudioEngine())

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true)
      })

      act(() => {
        result.current.updateChannelVolume("ch1", 0.8)
      })

      expect(mockAudioEngine.updateChannelVolume).toHaveBeenCalledWith("ch1", 0.8)
    })

    it("does nothing when not initialized", () => {
      const { result } = renderHook(() => useAudioEngine())

      act(() => {
        result.current.updateChannelVolume("ch1", 0.8)
      })

      expect(mockAudioEngine.updateChannelVolume).not.toHaveBeenCalled()
    })
  })

  describe("updateChannelPan", () => {
    it("calls engine updateChannelPan when initialized", async () => {
      const { result } = renderHook(() => useAudioEngine())

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true)
      })

      act(() => {
        result.current.updateChannelPan("ch1", -0.5)
      })

      expect(mockAudioEngine.updateChannelPan).toHaveBeenCalledWith("ch1", -0.5)
    })

    it("does nothing when not initialized", () => {
      const { result } = renderHook(() => useAudioEngine())

      act(() => {
        result.current.updateChannelPan("ch1", -0.5)
      })

      expect(mockAudioEngine.updateChannelPan).not.toHaveBeenCalled()
    })
  })

  describe("muteChannel", () => {
    it("calls engine muteChannel when initialized", async () => {
      const { result } = renderHook(() => useAudioEngine())

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true)
      })

      act(() => {
        result.current.muteChannel("ch1", true)
      })

      expect(mockAudioEngine.muteChannel).toHaveBeenCalledWith("ch1", true)
    })

    it("does nothing when not initialized", () => {
      const { result } = renderHook(() => useAudioEngine())

      act(() => {
        result.current.muteChannel("ch1", true)
      })

      expect(mockAudioEngine.muteChannel).not.toHaveBeenCalled()
    })
  })

  describe("soloChannel", () => {
    it("calls engine soloChannel when initialized", async () => {
      const { result } = renderHook(() => useAudioEngine())

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true)
      })

      act(() => {
        result.current.soloChannel("ch1", true)
      })

      expect(mockAudioEngine.soloChannel).toHaveBeenCalledWith("ch1", true)
    })

    it("does nothing when not initialized", () => {
      const { result } = renderHook(() => useAudioEngine())

      act(() => {
        result.current.soloChannel("ch1", true)
      })

      expect(mockAudioEngine.soloChannel).not.toHaveBeenCalled()
    })
  })

  describe("updateMasterVolume", () => {
    it("calls engine updateMasterVolume when initialized", async () => {
      const { result } = renderHook(() => useAudioEngine())

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true)
      })

      act(() => {
        result.current.updateMasterVolume(0.9)
      })

      expect(mockAudioEngine.updateMasterVolume).toHaveBeenCalledWith(0.9)
    })

    it("does nothing when not initialized", () => {
      const { result } = renderHook(() => useAudioEngine())

      act(() => {
        result.current.updateMasterVolume(0.9)
      })

      expect(mockAudioEngine.updateMasterVolume).not.toHaveBeenCalled()
    })
  })

  describe("enableLimiter", () => {
    it("calls engine enableLimiter when initialized", async () => {
      const { result } = renderHook(() => useAudioEngine())

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true)
      })

      act(() => {
        result.current.enableLimiter(true)
      })

      expect(mockAudioEngine.enableLimiter).toHaveBeenCalledWith(true)
    })

    it("does nothing when not initialized", () => {
      const { result } = renderHook(() => useAudioEngine())

      act(() => {
        result.current.enableLimiter(true)
      })

      expect(mockAudioEngine.enableLimiter).not.toHaveBeenCalled()
    })
  })

  describe("setLimiterThreshold", () => {
    it("calls engine setLimiterThreshold when initialized", async () => {
      const { result } = renderHook(() => useAudioEngine())

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true)
      })

      act(() => {
        result.current.setLimiterThreshold(-6)
      })

      expect(mockAudioEngine.setLimiterThreshold).toHaveBeenCalledWith(-6)
    })

    it("does nothing when not initialized", () => {
      const { result } = renderHook(() => useAudioEngine())

      act(() => {
        result.current.setLimiterThreshold(-6)
      })

      expect(mockAudioEngine.setLimiterThreshold).not.toHaveBeenCalled()
    })
  })

  describe("createChannel", () => {
    it("calls engine createChannel when initialized", async () => {
      const { result } = renderHook(() => useAudioEngine())

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true)
      })

      let channelResult: any
      act(() => {
        channelResult = result.current.createChannel("ch1")
      })

      expect(mockAudioEngine.createChannel).toHaveBeenCalledWith("ch1")
      expect(channelResult).toEqual({ id: "test-channel" })
    })

    it("returns null when not initialized", () => {
      const { result } = renderHook(() => useAudioEngine())

      let channelResult: any
      act(() => {
        channelResult = result.current.createChannel("ch1")
      })

      expect(mockAudioEngine.createChannel).not.toHaveBeenCalled()
      expect(channelResult).toBe(null)
    })
  })

  describe("getChannelAnalyser", () => {
    it("calls engine getChannelAnalyser when initialized", async () => {
      const { result } = renderHook(() => useAudioEngine())

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true)
      })

      let analyser: any
      act(() => {
        analyser = result.current.getChannelAnalyser("ch1")
      })

      expect(mockAudioEngine.getChannelAnalyser).toHaveBeenCalledWith("ch1")
      expect(analyser).toBeDefined()
    })

    it("returns null when not initialized", () => {
      const { result } = renderHook(() => useAudioEngine())

      let analyser: any
      act(() => {
        analyser = result.current.getChannelAnalyser("ch1")
      })

      expect(mockAudioEngine.getChannelAnalyser).not.toHaveBeenCalled()
      expect(analyser).toBe(null)
    })
  })

  describe("getMasterAnalyser", () => {
    it("calls engine getMasterAnalyser when initialized", async () => {
      const { result } = renderHook(() => useAudioEngine())

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true)
      })

      let analyser: any
      act(() => {
        analyser = result.current.getMasterAnalyser()
      })

      expect(mockAudioEngine.getMasterAnalyser).toHaveBeenCalledOnce()
      expect(analyser).toBeDefined()
    })

    it("returns null when not initialized", () => {
      const { result } = renderHook(() => useAudioEngine())

      let analyser: any
      act(() => {
        analyser = result.current.getMasterAnalyser()
      })

      expect(mockAudioEngine.getMasterAnalyser).not.toHaveBeenCalled()
      expect(analyser).toBe(null)
    })
  })

  describe("function stability", () => {
    it("returns stable function references", async () => {
      const { result, rerender } = renderHook(() => useAudioEngine())

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true)
      })

      const firstRender = result.current

      rerender()

      const secondRender = result.current

      // Functions should be the same reference (stable)
      expect(secondRender.connectMediaElement).toBe(firstRender.connectMediaElement)
      expect(secondRender.updateChannelVolume).toBe(firstRender.updateChannelVolume)
      expect(secondRender.updateChannelPan).toBe(firstRender.updateChannelPan)
      expect(secondRender.muteChannel).toBe(firstRender.muteChannel)
      expect(secondRender.soloChannel).toBe(firstRender.soloChannel)
      expect(secondRender.updateMasterVolume).toBe(firstRender.updateMasterVolume)
      expect(secondRender.enableLimiter).toBe(firstRender.enableLimiter)
      expect(secondRender.setLimiterThreshold).toBe(firstRender.setLimiterThreshold)
      expect(secondRender.createChannel).toBe(firstRender.createChannel)
      expect(secondRender.getChannelAnalyser).toBe(firstRender.getChannelAnalyser)
      expect(secondRender.getMasterAnalyser).toBe(firstRender.getMasterAnalyser)
    })
  })

  describe("error handling", () => {
    it("handles initialization errors gracefully", async () => {
      mockAudioEngine.initialize.mockRejectedValue(new Error("Audio context error"))

      const { result } = renderHook(() => useAudioEngine())

      // Should not throw and remain uninitialized
      await new Promise((resolve) => setTimeout(resolve, 100))
      expect(result.current.isInitialized).toBe(false)
    })
  })
})
