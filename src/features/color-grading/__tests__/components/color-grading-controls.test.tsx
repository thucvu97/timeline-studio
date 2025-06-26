import { render, screen, waitFor } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { ColorGradingControls } from "../../components/controls/color-grading-controls"
import { BUILT_IN_PRESETS } from "../../types/presets"

// Мокаем lucide-react иконки
vi.mock("lucide-react", () => ({
  ChevronDown: () => <span>ChevronDown</span>,
  Eye: () => <span>Eye</span>,
  EyeOff: () => <span>EyeOff</span>,
  RotateCcw: () => <span>RotateCcw</span>,
  Save: () => <span>Save</span>,
  Wand2: () => <span>Wand2</span>,
}))

// Мокаем хук useTranslation
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
  }),
}))

// Мокаем UI компоненты
vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, disabled, title, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} title={title} {...props}>
      {children}
    </button>
  ),
}))

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open }: any) => (open ? <div data-testid="dialog">{children}</div> : null),
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
  DialogDescription: ({ children }: any) => <p>{children}</p>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
}))

vi.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: any) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children, asChild }: any) => <div data-testid="dropdown-trigger">{children}</div>,
  DropdownMenuContent: ({ children }: any) => (
    <div data-testid="dropdown-content" data-state="open">
      {children}
    </div>
  ),
  DropdownMenuItem: ({ children, onClick }: any) => (
    <div onClick={onClick} role="menuitem">
      {children}
    </div>
  ),
  DropdownMenuLabel: ({ children }: any) => <div>{children}</div>,
  DropdownMenuSeparator: () => <hr />,
}))

vi.mock("@/components/ui/input", () => ({
  Input: ({ value, onChange, placeholder, id }: any) => (
    <input id={id} value={value} onChange={onChange} placeholder={placeholder} />
  ),
}))

vi.mock("@/components/ui/label", () => ({
  Label: ({ children, htmlFor }: any) => <label htmlFor={htmlFor}>{children}</label>,
}))

// Мокаем ColorGradingContext
const mockContextValue = {
  state: {
    previewEnabled: true,
    selectedClip: null,
  },
  hasChanges: false,
  resetAll: vi.fn(),
  togglePreview: vi.fn(),
  applyToClip: vi.fn(),
  loadPreset: vi.fn(),
  savePreset: vi.fn(),
  autoCorrect: vi.fn(),
  availablePresets: BUILT_IN_PRESETS,
  dispatch: vi.fn(),
}

const mockUseColorGradingContext = vi.fn(() => mockContextValue)

vi.mock("../../services/color-grading-provider", () => ({
  useColorGradingContext: () => mockUseColorGradingContext(),
}))

describe("ColorGradingControls", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseColorGradingContext.mockReturnValue(mockContextValue)
  })

  it("should render color grading controls", () => {
    render(<ColorGradingControls />)

    expect(screen.getByTestId("color-grading-controls")).toBeInTheDocument()
  })

  it("should render all control buttons", () => {
    render(<ColorGradingControls />)

    expect(screen.getByText("Reset All")).toBeInTheDocument()
    expect(screen.getByText("Auto")).toBeInTheDocument()
    expect(screen.getByText("Load Preset")).toBeInTheDocument()
    expect(screen.getByText("Save Preset")).toBeInTheDocument()
    expect(screen.getByText("Preview")).toBeInTheDocument()
    expect(screen.getByText("Apply to Clip")).toBeInTheDocument()
  })

  it("should disable reset button when no changes", () => {
    render(<ColorGradingControls />)

    const resetButton = screen.getByText("Reset All")
    expect(resetButton).toBeDisabled()
  })

  it("should enable reset button when has changes", () => {
    const contextWithChanges = {
      ...mockContextValue,
      hasChanges: true,
    }
    mockUseColorGradingContext.mockReturnValueOnce(contextWithChanges)

    render(<ColorGradingControls />)

    const resetButton = screen.getByText("Reset All")
    expect(resetButton).not.toBeDisabled()
  })

  it("should call resetAll when reset button clicked", async () => {
    const contextWithChanges = {
      ...mockContextValue,
      hasChanges: true,
    }
    mockUseColorGradingContext.mockReturnValueOnce(contextWithChanges)

    const user = userEvent.setup()
    render(<ColorGradingControls />)

    await user.click(screen.getByText("Reset All"))

    expect(mockContextValue.resetAll).toHaveBeenCalled()
  })

  it("should call autoCorrect when auto button clicked", async () => {
    const user = userEvent.setup()
    render(<ColorGradingControls />)

    await user.click(screen.getByText("Auto"))

    expect(mockContextValue.autoCorrect).toHaveBeenCalled()
  })

  it("should render preset dropdown", async () => {
    render(<ColorGradingControls />)

    const dropdownTrigger = screen.getByText("Load Preset")
    expect(dropdownTrigger).toBeInTheDocument()

    // Check dropdown content
    const dropdownContent = screen.getByTestId("dropdown-content")
    expect(dropdownContent).toBeInTheDocument()

    // Check that presets are rendered
    const firstPreset = BUILT_IN_PRESETS[0]
    expect(screen.getByText(firstPreset.name)).toBeInTheDocument()
  })

  it("should call loadPreset when preset clicked", async () => {
    const user = userEvent.setup()
    render(<ColorGradingControls />)

    const firstPreset = BUILT_IN_PRESETS[0]
    await user.click(screen.getByText(firstPreset.name))

    expect(mockContextValue.loadPreset).toHaveBeenCalledWith(firstPreset.id)
  })

  it("should disable save preset button when no changes", () => {
    render(<ColorGradingControls />)

    const saveButton = screen.getByText("Save Preset")
    expect(saveButton).toBeDisabled()
  })

  it("should open save dialog when save preset clicked", async () => {
    const contextWithChanges = {
      ...mockContextValue,
      hasChanges: true,
    }
    mockUseColorGradingContext.mockReturnValueOnce(contextWithChanges)

    const user = userEvent.setup()
    render(<ColorGradingControls />)

    await user.click(screen.getByText("Save Preset"))

    expect(screen.getByTestId("dialog")).toBeInTheDocument()
    expect(screen.getByText("Save Color Grading Preset")).toBeInTheDocument()
  })

  it("should save preset with entered name", async () => {
    const contextWithChanges = {
      ...mockContextValue,
      hasChanges: true,
    }
    mockUseColorGradingContext.mockReturnValueOnce(contextWithChanges)

    const user = userEvent.setup()
    render(<ColorGradingControls />)

    // Open dialog
    await user.click(screen.getByText("Save Preset"))

    // Enter preset name
    const input = screen.getByPlaceholderText("My Preset")
    await user.type(input, "Custom Preset")

    // Save
    const saveButton = screen.getAllByText("Save")[1] // Second "Save" is in dialog
    await user.click(saveButton)

    expect(mockContextValue.savePreset).toHaveBeenCalledWith("Custom Preset")
  })

  it("should toggle preview", async () => {
    const user = userEvent.setup()
    render(<ColorGradingControls />)

    await user.click(screen.getByText("Preview"))

    expect(mockContextValue.togglePreview).toHaveBeenCalledWith(false)
  })

  it("should show different icon based on preview state", () => {
    // Preview enabled
    const { unmount } = render(<ColorGradingControls />)
    expect(screen.getByText("Eye")).toBeInTheDocument()
    expect(screen.queryByText("EyeOff")).not.toBeInTheDocument()

    unmount()

    // Preview disabled
    const contextWithPreviewOff = {
      ...mockContextValue,
      state: {
        ...mockContextValue.state,
        previewEnabled: false,
      },
    }
    mockUseColorGradingContext.mockReturnValueOnce(contextWithPreviewOff)

    render(<ColorGradingControls />)

    expect(screen.getByText("EyeOff")).toBeInTheDocument()
    expect(screen.queryByText("Eye")).not.toBeInTheDocument()
  })

  it("should disable apply to clip when no clip selected", () => {
    render(<ColorGradingControls />)

    const applyButton = screen.getByText("Apply to Clip")
    expect(applyButton).toBeDisabled()
  })

  it("should enable apply to clip when clip selected and has changes", () => {
    const contextWithClipAndChanges = {
      ...mockContextValue,
      state: {
        ...mockContextValue.state,
        selectedClip: { id: "clip1" },
      },
      hasChanges: true,
    }
    mockUseColorGradingContext.mockReturnValueOnce(contextWithClipAndChanges)

    render(<ColorGradingControls />)

    const applyButton = screen.getByText("Apply to Clip")
    expect(applyButton).not.toBeDisabled()
  })

  it("should call applyToClip when button clicked", async () => {
    const contextWithClipAndChanges = {
      ...mockContextValue,
      state: {
        ...mockContextValue.state,
        selectedClip: { id: "clip1" },
      },
      hasChanges: true,
    }
    mockUseColorGradingContext.mockReturnValueOnce(contextWithClipAndChanges)

    const user = userEvent.setup()
    render(<ColorGradingControls />)

    await user.click(screen.getByText("Apply to Clip"))

    expect(mockContextValue.applyToClip).toHaveBeenCalled()
  })

  it("should close save dialog on cancel", async () => {
    const contextWithChanges = {
      ...mockContextValue,
      hasChanges: true,
    }
    mockUseColorGradingContext.mockReturnValueOnce(contextWithChanges)

    const user = userEvent.setup()
    render(<ColorGradingControls />)

    // Open dialog
    await user.click(screen.getByText("Save Preset"))
    expect(screen.getByTestId("dialog")).toBeInTheDocument()

    // Cancel
    await user.click(screen.getByText("Cancel"))

    // Dialog should close
    await waitFor(() => {
      expect(screen.queryByTestId("dialog")).not.toBeInTheDocument()
    })
  })

  it("should disable save button in dialog when name is empty", async () => {
    const contextWithChanges = {
      ...mockContextValue,
      hasChanges: true,
    }
    mockUseColorGradingContext.mockReturnValueOnce(contextWithChanges)

    const user = userEvent.setup()
    render(<ColorGradingControls />)

    // Open dialog
    await user.click(screen.getByText("Save Preset"))

    const saveButton = screen.getAllByText("Save")[1]
    expect(saveButton).toBeDisabled()

    // Type something
    const input = screen.getByPlaceholderText("My Preset")
    await user.type(input, "Test")

    expect(saveButton).not.toBeDisabled()
  })

  it("should group presets by category", () => {
    render(<ColorGradingControls />)

    // Check that category labels are rendered
    const categories = ["cinematic", "vintage", "modern", "blackwhite", "creative", "correction", "custom"]
    categories.forEach((category) => {
      const categoryText = screen.queryByText(category)
      if (categoryText) {
        expect(categoryText).toBeInTheDocument()
      }
    })

    // Verify at least some categories are present
    expect(screen.getByText("cinematic")).toBeInTheDocument()
    expect(screen.getByText("vintage")).toBeInTheDocument()
  })

  it("should show preset descriptions", () => {
    render(<ColorGradingControls />)

    // Find a preset with description
    const presetWithDescription = BUILT_IN_PRESETS.find((p) => p.description)
    if (presetWithDescription) {
      expect(screen.getByText(presetWithDescription.description!)).toBeInTheDocument()
    }
  })
})
