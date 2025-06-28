import { screen } from "@testing-library/react"
import { vi } from "vitest"

import { render } from "@/test/test-utils"

import { PerformanceSettingsTab } from "../performance-settings-tab"

// Mock the GPU status component
vi.mock("@/features/video-compiler/components/gpu-status", () => ({
  GpuStatus: ({ showDetails }: { showDetails: boolean }) => (
    <div data-testid="gpu-status">GPU Status {showDetails ? "with details" : ""}</div>
  ),
}))

// Mock useUserSettings hook
vi.mock("../../../hooks/use-user-settings", () => ({
  useUserSettings: () => ({
    // GPU settings
    gpuAccelerationEnabled: true,
    preferredGpuEncoder: "auto",
    
    // Proxy settings
    proxyEnabled: false,
    proxyType: "http",
    proxyHost: "",
    proxyPort: "",
    proxyUsername: "",
    proxyPassword: "",
    
    // Performance settings
    maxConcurrentJobs: 2,
    renderQuality: "high",
    backgroundRenderingEnabled: true,
    renderDelay: 5,
    
    // Methods
    handleGpuAccelerationChange: vi.fn(),
    handlePreferredGpuEncoderChange: vi.fn(),
    handleProxyEnabledChange: vi.fn(),
    handleProxyTypeChange: vi.fn(),
    handleProxyHostChange: vi.fn(),
    handleProxyPortChange: vi.fn(),
    handleProxyUsernameChange: vi.fn(),
    handleProxyPasswordChange: vi.fn(),
    handleMaxConcurrentJobsChange: vi.fn(),
    handleRenderQualityChange: vi.fn(),
    handleBackgroundRenderingChange: vi.fn(),
    handleRenderDelayChange: vi.fn(),
  }),
}))

describe("PerformanceSettingsTab", () => {
  it("renders GPU acceleration section", () => {
    render(<PerformanceSettingsTab />)
    
    expect(screen.getByText("dialogs.userSettings.performance.gpuAcceleration")).toBeInTheDocument()
    expect(screen.getByTestId("gpu-status")).toBeInTheDocument()
  })

  it("renders rendering settings section", () => {
    render(<PerformanceSettingsTab />)
    
    expect(screen.getByText("dialogs.userSettings.performance.renderingSettings")).toBeInTheDocument()
    expect(screen.getByText("dialogs.userSettings.performance.renderQuality")).toBeInTheDocument()
    expect(screen.getByText("dialogs.userSettings.performance.backgroundRendering")).toBeInTheDocument()
  })

  it("renders proxy server section", () => {
    render(<PerformanceSettingsTab />)
    
    expect(screen.getByText("dialogs.userSettings.performance.proxyServer")).toBeInTheDocument()
  })

  it("shows GPU encoder selection when GPU acceleration is enabled", () => {
    render(<PerformanceSettingsTab />)
    
    expect(screen.getByText("dialogs.userSettings.performance.preferredGpuEncoder")).toBeInTheDocument()
  })
})