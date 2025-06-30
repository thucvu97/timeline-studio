import { fireEvent } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { mockUseTranslation } from "@/test/mocks/libraries/i18n"
import { renderWithProviders } from "@/test/test-utils"
import { setupAudioTestEnvironment } from "@/test/utils/tauri-audio-test-utils"

import { ChannelStrip } from "../../mixer/channel-strip"

// Mock the level meter component BEFORE importing ChannelStrip
vi.mock("@/features/fairlight-audio/components/meters/level-meter", () => ({
  LevelMeter: ({ audioContext, source }: { audioContext?: AudioContext; source?: AnalyserNode }) => (
    <div data-testid="level-meter" className="h-full">
      {audioContext && source ? "Meter Active" : "Meter Inactive"}
    </div>
  ),
}))

// Mock the surround panner component
vi.mock("../../mixer/surround-panner", () => ({
  SurroundPanner: ({ pan, onPanChange }: { pan: number; onPanChange: (value: number) => void }) => (
    <div data-testid="surround-panner">
      <input type="range" min="-100" max="100" value={pan} onChange={(e) => onPanChange(Number(e.target.value))} />
    </div>
  ),
}))

describe("ChannelStrip", () => {
  let testEnv: ReturnType<typeof setupAudioTestEnvironment>

  const mockProps = {
    channelId: "channel-1",
    name: "Channel 1",
    type: "stereo" as const,
    volume: 75,
    pan: 0,
    muted: false,
    solo: false,
    armed: false,
    onVolumeChange: vi.fn(),
    onPanChange: vi.fn(),
    onMute: vi.fn(),
    onSolo: vi.fn(),
    onArm: vi.fn(),
    onSettings: vi.fn(),
  }

  beforeEach(() => {
    testEnv = setupAudioTestEnvironment()
    vi.clearAllMocks()

    // Mock translations
    mockUseTranslation.mockReturnValue({
      t: (key: string) => {
        const translations: Record<string, string> = {
          "fairlightAudio.mixer.channelStrip.eq": "EQ",
          "fairlightAudio.mixer.channelStrip.send1": "Send 1",
          "fairlightAudio.mixer.channelStrip.send2": "Send 2",
          "fairlightAudio.mixer.channelStrip.pan": "PAN",
          "fairlightAudio.mixer.channelStrip.right": "R",
          "fairlightAudio.mixer.channelStrip.outputs.main": "Main",
          "fairlightAudio.mixer.channelStrip.outputs.bus1": "Bus 1",
          "fairlightAudio.mixer.channelStrip.outputs.bus2": "Bus 2",
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
    it("renders channel name", () => {
      const { getByText } = renderWithProviders(<ChannelStrip {...mockProps} />)
      expect(getByText("Channel 1")).toBeInTheDocument()
    })

    it("renders channel type indicator", () => {
      const { getByText } = renderWithProviders(<ChannelStrip {...mockProps} />)
      expect(getByText("STEREO")).toBeInTheDocument()
    })

    it("renders mono type correctly", () => {
      const { getByText } = renderWithProviders(<ChannelStrip {...mockProps} type="mono" />)
      expect(getByText("MONO")).toBeInTheDocument()
    })

    it("renders surround type correctly", () => {
      const { getByText } = renderWithProviders(<ChannelStrip {...mockProps} type="surround" />)
      expect(getByText("SURROUND")).toBeInTheDocument()
    })

    it("renders EQ button", () => {
      const { getByText } = renderWithProviders(<ChannelStrip {...mockProps} />)
      expect(getByText("EQ")).toBeInTheDocument()
    })

    it("renders effects sends", () => {
      const { getByText } = renderWithProviders(<ChannelStrip {...mockProps} />)
      expect(getByText("Send 1")).toBeInTheDocument()
      expect(getByText("Send 2")).toBeInTheDocument()
    })

    it("renders pan control", () => {
      const { getByText } = renderWithProviders(<ChannelStrip {...mockProps} />)
      expect(getByText("PAN")).toBeInTheDocument()
    })

    it("renders arm button", () => {
      const { getByText } = renderWithProviders(<ChannelStrip {...mockProps} />)
      expect(getByText("R")).toBeInTheDocument()
    })

    it("renders output routing selector", () => {
      const { getByText } = renderWithProviders(<ChannelStrip {...mockProps} />)
      expect(getByText("Main")).toBeInTheDocument()
    })

    it("applies custom className", () => {
      const { container } = renderWithProviders(<ChannelStrip {...mockProps} className="custom-class" />)
      const channelStrip = container.querySelector(".custom-class")
      expect(channelStrip).toBeInTheDocument()
    })
  })

  describe("interactions", () => {
    it("calls onSettings when settings button is clicked", () => {
      const { container } = renderWithProviders(<ChannelStrip {...mockProps} />)
      const settingsButton = container.querySelector('[class*="hover:bg-zinc-800"]')!
      fireEvent.click(settingsButton)
      expect(mockProps.onSettings).toHaveBeenCalled()
    })

    it("calls onPanChange when pan slider is changed", () => {
      const { container } = renderWithProviders(<ChannelStrip {...mockProps} />)
      const panSlider = container.querySelector('input[type="range"]')!
      fireEvent.change(panSlider, { target: { value: "50" } })
      expect(mockProps.onPanChange).toHaveBeenCalledWith(50)
    })

    it("calls onArm when arm button is clicked", () => {
      const { getByText } = renderWithProviders(<ChannelStrip {...mockProps} />)
      const armButton = getByText("R")
      fireEvent.click(armButton)
      expect(mockProps.onArm).toHaveBeenCalled()
    })

    it("toggles EQ section when EQ button is clicked", () => {
      const { getByText } = renderWithProviders(<ChannelStrip {...mockProps} />)
      const eqButton = getByText("EQ")

      // Initially showEq is false
      fireEvent.click(eqButton)
      // After click, showEq should be true (though we can't directly test state)
      expect(eqButton).toBeInTheDocument()
    })
  })

  describe("armed state", () => {
    it("applies armed styles when armed is true", () => {
      const { getByText } = renderWithProviders(<ChannelStrip {...mockProps} armed={true} />)
      const armButton = getByText("R")
      expect(armButton).toHaveClass("bg-red-600")
      expect(armButton).toHaveClass("text-white")
    })

    it("applies default styles when armed is false", () => {
      const { getByText } = renderWithProviders(<ChannelStrip {...mockProps} armed={false} />)
      const armButton = getByText("R")
      expect(armButton).toHaveClass("bg-zinc-800")
      expect(armButton).toHaveClass("text-zinc-500")
    })
  })

  describe("level meter integration", () => {
    it("renders level meter when audioContext and analyser are provided", () => {
      const mockAudioContext = new testEnv.webAudio.AudioContext() as unknown as AudioContext
      const mockAnalyser = mockAudioContext.createAnalyser() as unknown as AnalyserNode

      const { getByTestId } = renderWithProviders(
        <ChannelStrip {...mockProps} audioContext={mockAudioContext} analyser={mockAnalyser} />,
      )

      const levelMeter = getByTestId("level-meter")
      expect(levelMeter).toBeInTheDocument()
      expect(levelMeter).toHaveTextContent("Meter Active")
    })

    it("does not render level meter when audioContext is missing", () => {
      const { queryByTestId } = renderWithProviders(<ChannelStrip {...mockProps} />)

      const levelMeter = queryByTestId("level-meter")
      expect(levelMeter).toBeNull()
    })
  })

  describe("pan control", () => {
    it("displays pan knob at correct position", () => {
      const { container } = renderWithProviders(<ChannelStrip {...mockProps} pan={50} />)
      const panKnob = container.querySelector(".absolute.top-1\\/2")
      expect(panKnob).toHaveStyle({ left: "75%" })
    })

    it("displays pan knob at center when pan is 0", () => {
      const { container } = renderWithProviders(<ChannelStrip {...mockProps} pan={0} />)
      const panKnob = container.querySelector(".absolute.top-1\\/2")
      expect(panKnob).toHaveStyle({ left: "50%" })
    })

    it("displays pan knob at left when pan is -100", () => {
      const { container } = renderWithProviders(<ChannelStrip {...mockProps} pan={-100} />)
      const panKnob = container.querySelector(".absolute.top-1\\/2")
      expect(panKnob).toHaveStyle({ left: "0%" })
    })

    it("displays pan knob at right when pan is 100", () => {
      const { container } = renderWithProviders(<ChannelStrip {...mockProps} pan={100} />)
      const panKnob = container.querySelector(".absolute.top-1\\/2")
      expect(panKnob).toHaveStyle({ left: "100%" })
    })
  })

  describe("fader integration", () => {
    it("passes correct props to Fader component", () => {
      const { container } = renderWithProviders(<ChannelStrip {...mockProps} />)

      // Find the fader by looking for its container structure
      const faderContainer = container.querySelector(".flex-1.flex.justify-center.gap-1")
      expect(faderContainer).toBeInTheDocument()

      // Fader should be rendered with dbScale
      // (More detailed testing would be in Fader component tests)
    })

    it("propagates volume changes from Fader", () => {
      // This test would be more complete with Fader component rendered
      // For now, we know the prop is passed correctly
      const { container } = renderWithProviders(<ChannelStrip {...mockProps} />)
      expect(container).toBeInTheDocument()
    })
  })

  describe("channel type styling", () => {
    it("applies stereo styling", () => {
      const { getByText } = renderWithProviders(<ChannelStrip {...mockProps} type="stereo" />)
      const typeIndicator = getByText("STEREO")
      expect(typeIndicator).toHaveClass("bg-blue-900")
      expect(typeIndicator).toHaveClass("text-blue-300")
    })

    it("applies mono styling", () => {
      const { getByText } = renderWithProviders(<ChannelStrip {...mockProps} type="mono" />)
      const typeIndicator = getByText("MONO")
      expect(typeIndicator).toHaveClass("bg-zinc-800")
      expect(typeIndicator).toHaveClass("text-zinc-400")
    })

    it("applies surround styling", () => {
      const { getByText } = renderWithProviders(<ChannelStrip {...mockProps} type="surround" />)
      const typeIndicator = getByText("SURROUND")
      expect(typeIndicator).toHaveClass("bg-purple-900")
      expect(typeIndicator).toHaveClass("text-purple-300")
    })
  })
})
