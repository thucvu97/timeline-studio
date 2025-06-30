import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { MidiIndicator } from "../midi-indicator"

// Mock the useMidi hook with minimal implementation
vi.mock("../../hooks/use-midi", () => ({
  useMidi: () => ({
    onMidiMessage: () => () => {}, // Returns unsubscribe function
  }),
}))

// Mock Lucide React icons
vi.mock("lucide-react", () => ({
  Activity: ({ className }: { className: string }) => (
    <div data-testid="activity-icon" className={className}>
      Activity Icon
    </div>
  ),
}))

describe("MidiIndicator", () => {
  it("should render MIDI indicator", () => {
    render(<MidiIndicator />)

    expect(screen.getByTestId("activity-icon")).toBeInTheDocument()
    expect(screen.getByText("MIDI")).toBeInTheDocument()
  })

  it("should start with inactive state", () => {
    render(<MidiIndicator />)

    const activityIcon = screen.getByTestId("activity-icon")
    expect(activityIcon).toHaveClass("text-zinc-600")
    expect(activityIcon).not.toHaveClass("text-green-400")
  })

  it("should have correct CSS classes", () => {
    const { container } = render(<MidiIndicator />)

    const wrapperDiv = container.firstChild as HTMLElement
    expect(wrapperDiv).toHaveClass("flex", "items-center", "gap-2")

    const activityIcon = screen.getByTestId("activity-icon")
    expect(activityIcon).toHaveClass("w-4", "h-4", "transition-colors")

    const label = screen.getByText("MIDI")
    expect(label).toHaveClass("text-xs", "text-zinc-500")
  })

  it("should render without errors", () => {
    expect(() => render(<MidiIndicator />)).not.toThrow()
  })

  it("should use Activity icon from lucide-react", () => {
    render(<MidiIndicator />)

    const activityIcon = screen.getByTestId("activity-icon")
    expect(activityIcon).toBeInTheDocument()
    expect(activityIcon).toHaveTextContent("Activity Icon")
  })

  it("should apply transition classes for smooth animations", () => {
    render(<MidiIndicator />)

    const activityIcon = screen.getByTestId("activity-icon")
    expect(activityIcon).toHaveClass("transition-colors")
  })

  it("should display MIDI label", () => {
    render(<MidiIndicator />)

    const midiLabel = screen.getByText("MIDI")
    expect(midiLabel).toBeInTheDocument()
    expect(midiLabel.tagName).toBe("SPAN")
  })

  it("should have consistent component structure", () => {
    const { container } = render(<MidiIndicator />)

    // Should have wrapper div with flex layout
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.tagName).toBe("DIV")
    expect(wrapper).toHaveClass("flex")

    // Should contain exactly 2 children: icon and label
    expect(wrapper.children).toHaveLength(2)

    // First child should be the activity icon
    const iconElement = wrapper.children[0]
    expect(iconElement).toHaveAttribute("data-testid", "activity-icon")

    // Second child should be the MIDI label
    const labelElement = wrapper.children[1]
    expect(labelElement).toHaveTextContent("MIDI")
  })
})
