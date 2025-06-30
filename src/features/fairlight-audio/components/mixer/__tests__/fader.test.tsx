import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { Fader } from "../fader"

// Mock hooks
const mockWriteParameter = vi.fn()
const mockTouchParameter = vi.fn()
const mockReleaseParameter = vi.fn()

vi.mock("../../hooks/use-automation", () => ({
  useAutomation: () => ({
    writeParameter: mockWriteParameter,
    touchParameter: mockTouchParameter,
    releaseParameter: mockReleaseParameter,
  }),
}))

// Mock i18n
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
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
  }),
}))

describe("Fader", () => {
  const defaultProps = {
    value: 75,
    onChange: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should render fader with default props", () => {
    render(<Fader {...defaultProps} />)

    expect(screen.getByRole("button", { name: "S" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "M" })).toBeInTheDocument()
  })

  it("should display value in dB by default", () => {
    render(<Fader {...defaultProps} />)

    // 75% should convert to specific dB value
    expect(screen.getByText(/-2\.5 dB/)).toBeInTheDocument()
  })

  it("should display value in percentage when dbScale is false", () => {
    render(<Fader {...defaultProps} dbScale={false} />)

    expect(screen.getByText("75%")).toBeInTheDocument()
  })

  it("should show -∞ for 0 value", () => {
    render(<Fader {...defaultProps} value={0} />)

    expect(screen.getByText("-∞ dB")).toBeInTheDocument()
  })

  it("should call onChange when fader is clicked", () => {
    const onChange = vi.fn()
    const { container } = render(<Fader {...defaultProps} onChange={onChange} />)

    const faderTrack = container.querySelector(".cursor-pointer")!
    // Mock getBoundingClientRect
    vi.spyOn(faderTrack, "getBoundingClientRect").mockReturnValue({
      top: 0,
      left: 0,
      right: 48,
      bottom: 160,
      width: 48,
      height: 160,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })

    fireEvent.mouseDown(faderTrack, { clientY: 80 }) // Middle of fader

    expect(onChange).toHaveBeenCalled()
  })

  it("should call onMute when mute button is clicked", () => {
    const onMute = vi.fn()
    render(<Fader {...defaultProps} onMute={onMute} />)

    const muteButton = screen.getByRole("button", { name: "M" })
    fireEvent.click(muteButton)

    expect(onMute).toHaveBeenCalled()
  })

  it("should call onSolo when solo button is clicked", () => {
    const onSolo = vi.fn()
    render(<Fader {...defaultProps} onSolo={onSolo} />)

    const soloButton = screen.getByRole("button", { name: "S" })
    fireEvent.click(soloButton)

    expect(onSolo).toHaveBeenCalled()
  })

  it("should apply muted styles when muted", () => {
    render(<Fader {...defaultProps} muted />)

    const muteButton = screen.getByRole("button", { name: "M" })
    expect(muteButton).toHaveClass("bg-red-500", "text-white")
  })

  it("should apply solo styles when solo is active", () => {
    render(<Fader {...defaultProps} solo />)

    const soloButton = screen.getByRole("button", { name: "S" })
    expect(soloButton).toHaveClass("bg-yellow-500", "text-black")
  })

  it("should display label when provided", () => {
    render(<Fader {...defaultProps} label="Channel 1" />)

    expect(screen.getByText("Channel 1")).toBeInTheDocument()
  })

  it("should render dB scale markers when dbScale is true", () => {
    render(<Fader {...defaultProps} dbScale />)

    expect(screen.getByText("0")).toBeInTheDocument()
    expect(screen.getByText("-6")).toBeInTheDocument()
    expect(screen.getByText("-12")).toBeInTheDocument()
    expect(screen.getByText("-24")).toBeInTheDocument()
    expect(screen.getByText("-∞")).toBeInTheDocument()
  })

  it("should not render dB scale markers when dbScale is false", () => {
    render(<Fader {...defaultProps} dbScale={false} />)

    expect(screen.queryByText("-6")).not.toBeInTheDocument()
    expect(screen.queryByText("-12")).not.toBeInTheDocument()
  })

  it("should apply custom className", () => {
    const { container } = render(<Fader {...defaultProps} className="custom-class" />)

    expect(container.firstChild).toHaveClass("custom-class")
  })

  describe("Automation Integration", () => {
    it("should render with automation props without errors", () => {
      expect(() => render(<Fader {...defaultProps} channelId="channel-1" parameterId="volume" />)).not.toThrow()
    })

    it("should render without automation props", () => {
      expect(() => render(<Fader {...defaultProps} />)).not.toThrow()
    })

    it("should use default parameterId when not provided", () => {
      expect(() => render(<Fader {...defaultProps} channelId="channel-1" />)).not.toThrow()
    })
  })

  describe("Value Conversion", () => {
    it("should convert percentage to dB correctly", () => {
      // Test specific dB conversions
      render(<Fader value={100} onChange={vi.fn()} />)
      expect(screen.getByText("0.0 dB")).toBeInTheDocument()
    })

    it("should handle edge cases in conversion", () => {
      render(<Fader value={0} onChange={vi.fn()} />)
      expect(screen.getByText("-∞ dB")).toBeInTheDocument()
    })
  })

  describe("Interaction States", () => {
    it("should show inactive state by default", () => {
      const { container } = render(<Fader {...defaultProps} />)

      const muteButton = screen.getByRole("button", { name: "M" })
      const soloButton = screen.getByRole("button", { name: "S" })

      expect(muteButton).toHaveClass("bg-zinc-700", "text-zinc-400")
      expect(soloButton).toHaveClass("bg-zinc-700", "text-zinc-400")
    })

    it("should position fader handle based on value", () => {
      const { container } = render(<Fader {...defaultProps} value={75} />)

      const faderHandle = container.querySelector(".bg-zinc-300")
      expect(faderHandle).toBeInTheDocument()
      // The handle should be positioned based on the value (calculated in component)
      expect(faderHandle).toHaveAttribute("style")
    })

    it("should clamp values to valid range", () => {
      const onChange = vi.fn()
      const { container } = render(<Fader {...defaultProps} onChange={onChange} />)

      const faderTrack = container.querySelector(".cursor-pointer")!
      vi.spyOn(faderTrack, "getBoundingClientRect").mockReturnValue({
        top: 0,
        left: 0,
        right: 48,
        bottom: 160,
        width: 48,
        height: 160,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      })

      // Click above fader (should clamp to 100)
      fireEvent.mouseDown(faderTrack, { clientY: -10 })

      expect(onChange).toHaveBeenCalledWith(100)
    })
  })
})
