import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { ProjectSettingsModal } from "../project-settings-modal"

// Mock the hooks and dependencies
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, params?: any) => {
      // Simple mock translation that handles interpolation
      if (params) {
        let result = key
        Object.entries(params).forEach(([paramKey, paramValue]) => {
          result = result.replace(`{{${paramKey}}}`, String(paramValue))
        })
        return result
      }
      return key
    },
  }),
}))

// Mock modal provider
const mockCloseModal = vi.fn()
vi.mock("@/features/modals/services/modal-provider", () => ({
  useModal: () => ({
    closeModal: mockCloseModal,
  }),
}))

// Mock project settings hook
const mockUpdateSettings = vi.fn()
const mockSettings = {
  aspectRatio: {
    label: "16:9",
    value: { width: 1920, height: 1080 },
    textLabel: "widescreen",
  },
  resolution: "1920x1080",
  frameRate: "30" as const,
  colorSpace: "sRGB" as const,
}

vi.mock("../../hooks/use-project-settings", () => ({
  useProjectSettings: () => ({
    settings: mockSettings,
    updateSettings: mockUpdateSettings,
  }),
}))

// Mock utils
vi.mock("../../utils", () => ({
  getAspectRatioLabel: (label: string) => label,
  getAspectRatioString: (width: number, height: number) => {
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))
    const divisor = gcd(width, height)
    return `${width / divisor}:${height / divisor}`
  },
}))

describe("ProjectSettingsModal", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should render all form fields", () => {
    render(<ProjectSettingsModal />)

    // Check for aspect ratio select
    expect(screen.getByText("dialogs.projectSettings.aspectRatio")).toBeInTheDocument()
    const comboboxes = screen.getAllByRole("combobox")
    expect(comboboxes.length).toBeGreaterThanOrEqual(4) // At least 4 selects

    // Check for resolution select
    expect(screen.getByText("dialogs.projectSettings.resolution")).toBeInTheDocument()

    // Check for custom size inputs
    expect(screen.getByText("dialogs.projectSettings.customSize")).toBeInTheDocument()
    const numberInputs = screen.getAllByRole("spinbutton")
    expect(numberInputs).toHaveLength(2) // width and height

    // Check for frame rate select
    expect(screen.getByText("dialogs.projectSettings.frameRate")).toBeInTheDocument()

    // Check for color space select
    expect(screen.getByText("dialogs.projectSettings.colorSpace")).toBeInTheDocument()

    // Check for action buttons
    expect(screen.getByText("dialogs.projectSettings.cancel")).toBeInTheDocument()
    expect(screen.getByText("dialogs.projectSettings.save")).toBeInTheDocument()
  })

  it("should display current settings values", () => {
    render(<ProjectSettingsModal />)

    // Check that current values are displayed
    const aspectRatioCombobox = screen.getAllByRole("combobox")[0]
    expect(aspectRatioCombobox).toHaveTextContent("16:9")

    // Check custom size inputs have correct values
    const [widthInput, heightInput] = screen.getAllByRole("spinbutton")
    expect(widthInput).toHaveValue(1920)
    expect(heightInput).toHaveValue(1080)
  })

  it("should handle aspect ratio change", async () => {
    const user = userEvent.setup()
    render(<ProjectSettingsModal />)

    // Click on aspect ratio select
    const aspectRatioButton = screen.getAllByRole("combobox")[0]
    await user.click(aspectRatioButton)

    // Wait for the dropdown to appear and select a different aspect ratio
    await waitFor(() => {
      const option = screen.getByRole("option", { name: /1:1/ })
      expect(option).toBeInTheDocument()
    })

    const option = screen.getByRole("option", { name: /1:1/ })
    await user.click(option)

    // Check that updateSettings was called
    expect(mockUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        aspectRatio: expect.objectContaining({
          label: "1:1",
        }),
      })
    )
  })

  it("should handle custom width change with locked aspect ratio", async () => {
    const user = userEvent.setup()
    render(<ProjectSettingsModal />)

    // Get width input
    const [widthInput] = screen.getAllByRole("spinbutton")

    // Clear and type new value
    await user.clear(widthInput)
    await user.type(widthInput, "3840")

    // Check that updateSettings was called with proportional height
    await waitFor(() => {
      expect(mockUpdateSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          aspectRatio: expect.objectContaining({
            value: expect.objectContaining({
              width: 3840,
              height: 2160, // Proportional to 16:9
            }),
          }),
        })
      )
    })
  })

  it("should handle custom height change with locked aspect ratio", async () => {
    const user = userEvent.setup()
    render(<ProjectSettingsModal />)

    // Get height input
    const [, heightInput] = screen.getAllByRole("spinbutton")

    // Clear and type new value
    await user.clear(heightInput)
    await user.type(heightInput, "2160")

    // Check that updateSettings was called with proportional width
    await waitFor(() => {
      expect(mockUpdateSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          aspectRatio: expect.objectContaining({
            value: expect.objectContaining({
              width: 3840, // Proportional to 16:9
              height: 2160,
            }),
          }),
        })
      )
    })
  })

  it("should toggle aspect ratio lock", async () => {
    const user = userEvent.setup()
    render(<ProjectSettingsModal />)

    // Find lock button
    const lockButton = screen.getByRole("button", { name: /lock aspect ratio/i })
    expect(lockButton).toBeInTheDocument()

    // Click to unlock
    await user.click(lockButton)

    // Button should now show unlock icon
    expect(screen.getByTitle(/dialogs.projectSettings.lockAspectRatio/)).toBeInTheDocument()
  })

  it("should handle frame rate change", async () => {
    const user = userEvent.setup()
    render(<ProjectSettingsModal />)

    // Find frame rate select (it's the 4th combobox)
    const comboboxes = screen.getAllByRole("combobox")
    const frameRateButton = comboboxes[3]
    await user.click(frameRateButton)

    // Wait for the dropdown to appear
    await waitFor(() => {
      const option = screen.getByRole("option", { name: /60 fps/ })
      expect(option).toBeInTheDocument()
    })

    // Select a different frame rate
    const option = screen.getByRole("option", { name: /60 fps/ })
    await user.click(option)

    // Check that updateSettings was called
    expect(mockUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        frameRate: "60",
      })
    )
  })

  it("should handle color space change", async () => {
    const user = userEvent.setup()
    render(<ProjectSettingsModal />)

    // Find color space select (it's the 5th combobox)
    const comboboxes = screen.getAllByRole("combobox")
    const colorSpaceButton = comboboxes[4]
    await user.click(colorSpaceButton)

    // Wait for the dropdown to appear
    await waitFor(() => {
      const option = screen.getByRole("option", { name: /Rec\. 709/ })
      expect(option).toBeInTheDocument()
    })

    // Select a different color space
    const option = screen.getByRole("option", { name: /Rec\. 709/ })
    await user.click(option)

    // Check that updateSettings was called
    expect(mockUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        colorSpace: "rec709",
      })
    )
  })

  it("should close modal on cancel", async () => {
    const user = userEvent.setup()
    render(<ProjectSettingsModal />)

    const cancelButton = screen.getByText("dialogs.projectSettings.cancel")
    await user.click(cancelButton)

    expect(mockCloseModal).toHaveBeenCalled()
    expect(mockUpdateSettings).not.toHaveBeenCalled()
  })

  it("should save settings and close modal on save", async () => {
    const user = userEvent.setup()
    render(<ProjectSettingsModal />)

    const saveButton = screen.getByText("dialogs.projectSettings.save")
    await user.click(saveButton)

    // Check that settings were updated
    expect(mockUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        aspectRatio: expect.any(Object),
        resolution: expect.any(String),
        frameRate: expect.any(String),
        colorSpace: expect.any(String),
      })
    )

    // Wait for timeout and check modal was closed
    await waitFor(() => {
      expect(mockCloseModal).toHaveBeenCalled()
    }, { timeout: 200 })
  })

  it("should dispatch resize event on save", async () => {
    const user = userEvent.setup()
    const dispatchEventSpy = vi.spyOn(window, "dispatchEvent")

    render(<ProjectSettingsModal />)

    const saveButton = screen.getByText("dialogs.projectSettings.save")
    await user.click(saveButton)

    // Wait for the resize event to be dispatched
    await waitFor(() => {
      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "resize",
        })
      )
    }, { timeout: 200 })

    dispatchEventSpy.mockRestore()
  })

  it("should handle custom aspect ratio", async () => {
    const user = userEvent.setup()
    
    // Update mock settings to have custom aspect ratio
    mockSettings.aspectRatio.label = "custom"
    
    render(<ProjectSettingsModal />)

    // Check that resolution select shows custom
    const resolutionCombobox = screen.getAllByRole("combobox")[1]
    expect(resolutionCombobox).toHaveTextContent("dialogs.projectSettings.aspectRatioLabels.custom")

    // Check that we can't change resolution when aspect ratio is custom
    await user.click(resolutionCombobox)
    
    // Wait for dropdown to appear
    await waitFor(() => {
      // Should only have one option - custom
      const options = screen.getAllByRole("option")
      expect(options).toHaveLength(1)
      expect(options[0]).toHaveTextContent("dialogs.projectSettings.aspectRatioLabels.custom")
    })

    // Reset mock settings
    mockSettings.aspectRatio.label = "16:9"
  })

  it("should validate input ranges", async () => {
    const user = userEvent.setup()
    render(<ProjectSettingsModal />)

    const [widthInput, heightInput] = screen.getAllByRole("spinbutton")

    // Check min/max attributes
    expect(widthInput).toHaveAttribute("min", "320")
    expect(widthInput).toHaveAttribute("max", "7680")
    expect(heightInput).toHaveAttribute("min", "240")
    expect(heightInput).toHaveAttribute("max", "4320")
  })

  it("should display aspect ratio info with lock status", () => {
    render(<ProjectSettingsModal />)

    // Should show locked aspect ratio info
    expect(screen.getByText(/dialogs.projectSettings.aspectRatioLocked/)).toBeInTheDocument()
  })

  it("should handle invalid input gracefully", async () => {
    const user = userEvent.setup()
    render(<ProjectSettingsModal />)

    const [widthInput] = screen.getAllByRole("spinbutton")

    // Try to enter invalid value
    await user.clear(widthInput)
    await user.type(widthInput, "-100")

    // updateSettings should not be called with invalid value
    expect(mockUpdateSettings).not.toHaveBeenCalledWith(
      expect.objectContaining({
        aspectRatio: expect.objectContaining({
          value: expect.objectContaining({
            width: -100,
          }),
        }),
      })
    )
  })
})