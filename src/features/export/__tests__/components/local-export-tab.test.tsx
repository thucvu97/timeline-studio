import { beforeEach, describe, expect, it, vi } from "vitest"

import { fireEvent, render, screen } from "@/test/test-utils"

import { LocalExportTab } from "../../components/local-export-tab"

describe("LocalExportTab", () => {
  const defaultProps = {
    settings: {
      fileName: "test-video",
      savePath: "/path/to/save",
      format: "Mp4" as const,
      quality: "good" as const,
      resolution: "1080" as const,
      frameRate: "30",
      enableGPU: true,
      advancedCompression: false,
      cloudBackup: false,
    },
    onSettingsChange: vi.fn(),
    onChooseFolder: vi.fn(),
    onExport: vi.fn(),
    onCancelExport: vi.fn(),
    onClose: vi.fn(),
    isRendering: false,
    renderProgress: null,
    hasProject: true,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should render all form fields", () => {
    render(<LocalExportTab {...defaultProps} />)

    expect(screen.getByDisplayValue("test-video")).toBeInTheDocument()
    expect(screen.getByDisplayValue("/path/to/save")).toBeInTheDocument()
    expect(screen.getByText("dialogs.export.format")).toBeInTheDocument()
    expect(screen.getByText("dialogs.export.quality")).toBeInTheDocument()
    expect(screen.getByText("dialogs.export.resolution")).toBeInTheDocument()
    expect(screen.getByText("dialogs.export.frameRate")).toBeInTheDocument()
  })

  it("should call onSettingsChange when file name changes", () => {
    render(<LocalExportTab {...defaultProps} />)

    const fileNameInput = screen.getByDisplayValue("test-video")
    fireEvent.change(fileNameInput, { target: { value: "new-video" } })

    expect(defaultProps.onSettingsChange).toHaveBeenCalledWith({ fileName: "new-video" })
  })

  it("should call onChooseFolder when folder button is clicked", () => {
    render(<LocalExportTab {...defaultProps} />)

    const folderButton = screen.getByRole("button", { name: "Folder" })
    fireEvent.click(folderButton)

    expect(defaultProps.onChooseFolder).toHaveBeenCalled()
  })

  it("should disable inputs when rendering", () => {
    render(<LocalExportTab {...defaultProps} isRendering={true} />)

    const fileNameInput = screen.getByDisplayValue("test-video")
    expect(fileNameInput).toBeDisabled()

    const folderButton = screen.getByRole("button", { name: "Folder" })
    expect(folderButton).toBeDisabled()
  })

  it("should show progress when rendering", () => {
    const renderProgress = {
      percentage: 50,
      message: "Rendering...",
    }

    render(<LocalExportTab {...defaultProps} isRendering={true} renderProgress={renderProgress} />)

    expect(screen.getByText("dialogs.export.progress")).toBeInTheDocument()
    expect(screen.getByText("50%")).toBeInTheDocument()
    expect(screen.getByText("Rendering...")).toBeInTheDocument()
  })

  it("should show export and close buttons when not rendering", () => {
    render(<LocalExportTab {...defaultProps} />)

    expect(screen.getByText("dialogs.export.export")).toBeInTheDocument()
    expect(screen.getByText("dialogs.export.close")).toBeInTheDocument()
  })

  it("should show cancel and rendering buttons when rendering", () => {
    render(<LocalExportTab {...defaultProps} isRendering={true} />)

    expect(screen.getByText("dialogs.export.cancel")).toBeInTheDocument()
    expect(screen.getByText("dialogs.export.rendering...")).toBeInTheDocument()
  })

  it("should disable export button when no save path", () => {
    const props = {
      ...defaultProps,
      settings: {
        ...defaultProps.settings,
        savePath: "",
      },
    }

    render(<LocalExportTab {...props} />)

    const exportButton = screen.getByText("dialogs.export.export")
    expect(exportButton).toBeDisabled()
  })

  it("should disable export button when no project", () => {
    render(<LocalExportTab {...defaultProps} hasProject={false} />)

    const exportButton = screen.getByText("dialogs.export.export")
    expect(exportButton).toBeDisabled()
  })

  it("should call onExport when export button is clicked", () => {
    render(<LocalExportTab {...defaultProps} />)

    const exportButton = screen.getByText("dialogs.export.export")
    fireEvent.click(exportButton)

    expect(defaultProps.onExport).toHaveBeenCalled()
  })

  it("should call onClose when close button is clicked", () => {
    render(<LocalExportTab {...defaultProps} />)

    const closeButton = screen.getByText("dialogs.export.close")
    fireEvent.click(closeButton)

    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  it("should call onCancelExport when cancel button is clicked", () => {
    render(<LocalExportTab {...defaultProps} isRendering={true} />)

    const cancelButton = screen.getByText("dialogs.export.cancel")
    fireEvent.click(cancelButton)

    expect(defaultProps.onCancelExport).toHaveBeenCalled()
  })

  it("should update quality settings", () => {
    render(<LocalExportTab {...defaultProps} />)

    // Найдем switch для "best" качества по его id
    const bestSwitch = screen.getByRole("switch", { name: "dialogs.export.best" })
    fireEvent.click(bestSwitch)

    expect(defaultProps.onSettingsChange).toHaveBeenCalledWith({ quality: "best" })
  })

  it("should update GPU encoding setting", () => {
    render(<LocalExportTab {...defaultProps} />)

    const switches = screen.getAllByRole("switch")
    const gpuSwitch = switches[switches.length - 1] // GPU switch is last
    fireEvent.click(gpuSwitch)

    expect(defaultProps.onSettingsChange).toHaveBeenCalledWith({ enableGPU: false })
  })
})
