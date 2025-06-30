import { fireEvent } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { mockUseTranslation } from "@/test/mocks/libraries/i18n"
import { renderWithProviders } from "@/test/test-utils"
import { setupAudioTestEnvironment } from "@/test/utils/tauri-audio-test-utils"

import { Fader } from "../../mixer/fader"

// Mock the automation hook and its dependencies FIRST
const mockWriteParameter = vi.fn()
const mockTouchParameter = vi.fn()
const mockReleaseParameter = vi.fn()

vi.mock("../../hooks/use-audio-engine", () => ({
  useAudioEngine: vi.fn(() => ({
    engine: null,
  })),
}))

vi.mock("../../hooks/use-automation", () => ({
  useAutomation: vi.fn(() => ({
    writeParameter: mockWriteParameter,
    touchParameter: mockTouchParameter,
    releaseParameter: mockReleaseParameter,
    automationEngine: null,
    registerParameter: vi.fn(),
    setMode: vi.fn(),
    startRecording: vi.fn(),
    stopRecording: vi.fn(),
    updateTime: vi.fn(),
    createLane: vi.fn(),
    getState: vi.fn(),
    exportAutomation: vi.fn(),
    importAutomation: vi.fn(),
  })),
}))

describe("Fader", () => {
  let testEnv: ReturnType<typeof setupAudioTestEnvironment>
  const mockOnChange = vi.fn()
  const mockOnMute = vi.fn()
  const mockOnSolo = vi.fn()

  const defaultProps = {
    value: 75,
    onChange: mockOnChange,
    onMute: mockOnMute,
    onSolo: mockOnSolo,
  }

  beforeEach(() => {
    testEnv = setupAudioTestEnvironment()
    vi.clearAllMocks()
    mockWriteParameter.mockClear()
    mockTouchParameter.mockClear()
    mockReleaseParameter.mockClear()

    // Mock translations
    mockUseTranslation.mockReturnValue({
      t: (key: string) => {
        const translations: Record<string, string> = {
          "fairlightAudio.mixer.fader.solo": "S",
          "fairlightAudio.mixer.fader.mute": "M",
          "fairlightAudio.mixer.fader.dbMarkers.zero": "0",
          "fairlightAudio.mixer.fader.dbMarkers.minus6": "-6",
          "fairlightAudio.mixer.fader.dbMarkers.minus12": "-12",
          "fairlightAudio.mixer.fader.dbMarkers.minus24": "-24",
          "fairlightAudio.mixer.fader.dbMarkers.infinity": "-∞",
        }
        return translations[key] || key
      },
      i18n: { language: "en" } as any,
      ready: true,
    })
  })

  afterEach(() => {
    testEnv?.cleanup()
  })

  describe("rendering", () => {
    it("renders solo and mute buttons", () => {
      const { getByText } = renderWithProviders(<Fader {...defaultProps} />)
      expect(getByText("S")).toBeInTheDocument()
      expect(getByText("M")).toBeInTheDocument()
    })

    it("renders fader handle at correct position", () => {
      const { container } = renderWithProviders(<Fader {...defaultProps} value={50} />)
      const handle = container.querySelector(".absolute.left-1\\/2")
      expect(handle).toHaveStyle({ top: "46%" }) // (1 - 50/100) * 92%
    })

    it("renders value track at correct height", () => {
      const { container } = renderWithProviders(<Fader {...defaultProps} value={75} />)
      const valueTrack = container.querySelector(".bg-blue-500")
      expect(valueTrack).toHaveStyle({ height: "69%" }) // (75/100) * 92%
    })

    it("displays dB value when dbScale is true", () => {
      const { getByText } = renderWithProviders(<Fader {...defaultProps} value={100} dbScale={true} />)
      expect(getByText("0.0 dB")).toBeInTheDocument()
    })

    it("displays percentage value when dbScale is false", () => {
      const { getByText } = renderWithProviders(<Fader {...defaultProps} value={75} dbScale={false} />)
      expect(getByText("75%")).toBeInTheDocument()
    })

    it("displays -∞ for 0 value in dB scale", () => {
      const { getByText } = renderWithProviders(<Fader {...defaultProps} value={0} dbScale={true} />)
      expect(getByText("-∞ dB")).toBeInTheDocument()
    })

    it("renders dB scale markers", () => {
      const { getByText } = renderWithProviders(<Fader {...defaultProps} dbScale={true} />)
      expect(getByText("0")).toBeInTheDocument()
      expect(getByText("-6")).toBeInTheDocument()
      expect(getByText("-12")).toBeInTheDocument()
      expect(getByText("-24")).toBeInTheDocument()
      expect(getByText("-∞")).toBeInTheDocument()
    })

    it("renders label when provided", () => {
      const { getByText } = renderWithProviders(<Fader {...defaultProps} label="Master" />)
      expect(getByText("Master")).toBeInTheDocument()
    })

    it("applies custom className", () => {
      const { container } = renderWithProviders(<Fader {...defaultProps} className="custom-class" />)
      const fader = container.querySelector(".custom-class")
      expect(fader).toBeInTheDocument()
    })
  })

  describe("interactions", () => {
    it("calls onSolo when solo button is clicked", () => {
      const { getByText } = renderWithProviders(<Fader {...defaultProps} />)
      const soloButton = getByText("S")
      fireEvent.click(soloButton)
      expect(mockOnSolo).toHaveBeenCalled()
    })

    it("calls onMute when mute button is clicked", () => {
      const { getByText } = renderWithProviders(<Fader {...defaultProps} />)
      const muteButton = getByText("M")
      fireEvent.click(muteButton)
      expect(mockOnMute).toHaveBeenCalled()
    })

    it("updates value when dragging fader", () => {
      const { container } = renderWithProviders(<Fader {...defaultProps} />)
      const faderArea = container.querySelector(".absolute.inset-0.cursor-pointer")!

      // Mock getBoundingClientRect
      vi.spyOn(faderArea, "getBoundingClientRect").mockReturnValue({
        top: 0,
        bottom: 100,
        height: 100,
        left: 0,
        right: 50,
        width: 50,
        x: 0,
        y: 0,
        toJSON: () => {},
      } as DOMRect)

      // Start drag at middle (50%)
      fireEvent.mouseDown(faderArea, { clientY: 50 })
      expect(mockOnChange).toHaveBeenCalledWith(50)
    })

    it("handles drag movement", () => {
      const { container } = renderWithProviders(<Fader {...defaultProps} />)
      const faderArea = container.querySelector(".absolute.inset-0.cursor-pointer")!

      vi.spyOn(faderArea, "getBoundingClientRect").mockReturnValue({
        top: 0,
        bottom: 100,
        height: 100,
        left: 0,
        right: 50,
        width: 50,
        x: 0,
        y: 0,
        toJSON: () => {},
      } as DOMRect)

      // Start drag
      fireEvent.mouseDown(faderArea, { clientY: 50 })
      mockOnChange.mockClear()

      // Move to 25%
      fireEvent.mouseMove(window, { clientY: 75 })
      expect(mockOnChange).toHaveBeenCalledWith(25)

      // Release
      fireEvent.mouseUp(window)
    })

    it("clamps values to 0-100 range", () => {
      const { container } = renderWithProviders(<Fader {...defaultProps} />)
      const faderArea = container.querySelector(".absolute.inset-0.cursor-pointer")!

      vi.spyOn(faderArea, "getBoundingClientRect").mockReturnValue({
        top: 0,
        bottom: 100,
        height: 100,
        left: 0,
        right: 50,
        width: 50,
        x: 0,
        y: 0,
        toJSON: () => {},
      } as DOMRect)

      // Try to drag above top
      fireEvent.mouseDown(faderArea, { clientY: -50 })
      expect(mockOnChange).toHaveBeenCalledWith(100)

      // Try to drag below bottom
      fireEvent.mouseDown(faderArea, { clientY: 150 })
      expect(mockOnChange).toHaveBeenCalledWith(0)
    })
  })

  describe("solo/mute button states", () => {
    it("applies solo active styles", () => {
      const { getByText } = renderWithProviders(<Fader {...defaultProps} solo={true} />)
      const soloButton = getByText("S")
      expect(soloButton).toHaveClass("bg-yellow-500")
      expect(soloButton).toHaveClass("text-black")
    })

    it("applies solo inactive styles", () => {
      const { getByText } = renderWithProviders(<Fader {...defaultProps} solo={false} />)
      const soloButton = getByText("S")
      expect(soloButton).toHaveClass("bg-zinc-700")
      expect(soloButton).toHaveClass("text-zinc-400")
    })

    it("applies mute active styles", () => {
      const { getByText } = renderWithProviders(<Fader {...defaultProps} muted={true} />)
      const muteButton = getByText("M")
      expect(muteButton).toHaveClass("bg-red-500")
      expect(muteButton).toHaveClass("text-white")
    })

    it("applies mute inactive styles", () => {
      const { getByText } = renderWithProviders(<Fader {...defaultProps} muted={false} />)
      const muteButton = getByText("M")
      expect(muteButton).toHaveClass("bg-zinc-700")
      expect(muteButton).toHaveClass("text-zinc-400")
    })
  })

  describe("dB conversion", () => {
    it("converts 100% to 0.0 dB", () => {
      const { getByText } = renderWithProviders(<Fader {...defaultProps} value={100} dbScale={true} />)
      expect(getByText("0.0 dB")).toBeInTheDocument()
    })

    it("converts 50% to -6.0 dB", () => {
      const { getByText } = renderWithProviders(<Fader {...defaultProps} value={50} dbScale={true} />)
      expect(getByText("-6.0 dB")).toBeInTheDocument()
    })

    it("converts 25% to -12.0 dB", () => {
      const { getByText } = renderWithProviders(<Fader {...defaultProps} value={25} dbScale={true} />)
      expect(getByText("-12.0 dB")).toBeInTheDocument()
    })

    it("converts 0% to -∞ dB", () => {
      const { getByText } = renderWithProviders(<Fader {...defaultProps} value={0} dbScale={true} />)
      expect(getByText("-∞ dB")).toBeInTheDocument()
    })
  })

  describe("automation integration", () => {
    it("renders without automation when no channelId provided", () => {
      // This should work since automation hooks won't be called
      const { container } = renderWithProviders(<Fader {...defaultProps} />)
      expect(container).toBeInTheDocument()
    })

    it("renders with automation props when channelId provided", () => {
      // Test that the component can render with automation props
      const { container } = renderWithProviders(<Fader {...defaultProps} channelId="ch1" parameterId="volume" />)
      expect(container).toBeInTheDocument()

      // Test that we can find the fader area
      const faderArea = container.querySelector(".absolute.inset-0.cursor-pointer")
      expect(faderArea).toBeInTheDocument()
    })

    it("does not call automation hooks when channelId is not provided", () => {
      const { container } = renderWithProviders(<Fader {...defaultProps} />)

      const faderArea = container.querySelector(".absolute.inset-0.cursor-pointer")!

      vi.spyOn(faderArea, "getBoundingClientRect").mockReturnValue({
        top: 0,
        bottom: 100,
        height: 100,
        left: 0,
        right: 50,
        width: 50,
        x: 0,
        y: 0,
        toJSON: () => {},
      } as DOMRect)

      // Clear any previous calls
      mockTouchParameter.mockClear()
      mockWriteParameter.mockClear()
      mockReleaseParameter.mockClear()

      // Start drag
      fireEvent.mouseDown(faderArea, { clientY: 50 })

      // Should not call automation hooks
      expect(mockTouchParameter).not.toHaveBeenCalled()
      expect(mockWriteParameter).not.toHaveBeenCalled()

      // Release
      fireEvent.mouseUp(window)
      expect(mockReleaseParameter).not.toHaveBeenCalled()
    })
  })

  describe("handle visual states", () => {
    it("applies dragging styles when dragging", () => {
      const { container } = renderWithProviders(<Fader {...defaultProps} />)
      const faderArea = container.querySelector(".absolute.inset-0.cursor-pointer")!
      const handle = container.querySelector(".absolute.left-1\\/2")!

      vi.spyOn(faderArea, "getBoundingClientRect").mockReturnValue({
        top: 0,
        bottom: 100,
        height: 100,
        left: 0,
        right: 50,
        width: 50,
        x: 0,
        y: 0,
        toJSON: () => {},
      } as DOMRect)

      // Before drag
      expect(handle).not.toHaveClass("scale-110")

      // Start drag
      fireEvent.mouseDown(faderArea, { clientY: 50 })

      // During drag, the handle should have scale-110
      const updatedHandle = container.querySelector(".absolute.left-1\\/2")!
      expect(updatedHandle).toHaveClass("scale-110")
    })
  })
})
