/**
 * Version control integration tests
 * Basic tests for version control functionality
 */

import { renderHook, act } from "@testing-library/react"
import { describe, it, expect, beforeEach, vi } from "vitest"

import { useVersionControl } from "@/features/app-state/hooks/use-version-control"
import { getBackendSync } from "@/features/app-state/services/backend-sync"

// Mock the backend sync
vi.mock("@/features/app-state/services/backend-sync", () => ({
  getBackendSync: vi.fn(() => ({
    createSnapshot: vi.fn(),
    restoreVersion: vi.fn(),
    getVersionHistory: vi.fn(),
    compareVersions: vi.fn(),
    createBranch: vi.fn(),
    switchBranch: vi.fn(),
    setAutoSaveInterval: vi.fn(),
    enableAutoSave: vi.fn(),
    getProjectState: vi.fn(),
    onEvent: vi.fn(() => () => {}),
  })),
}))

// Mock toast
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}))

describe("Version Control Integration", () => {
  const mockBackendSync = {
    createSnapshot: vi.fn(),
    restoreVersion: vi.fn(),
    getVersionHistory: vi.fn(),
    getProjectState: vi.fn(),
    onEvent: vi.fn(() => () => {}),
    setAutoSaveInterval: vi.fn(),
    enableAutoSave: vi.fn(),
    createBranch: vi.fn(),
    switchBranch: vi.fn(),
    compareVersions: vi.fn(),
    mergeBranch: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getBackendSync).mockReturnValue(mockBackendSync)
    
    // Mock default project state
    mockBackendSync.getProjectState.mockResolvedValue({
      version_info: {
        current_version_id: "initial",
        branch_name: "main", 
        has_uncommitted_changes: false,
        last_snapshot_time: new Date().toISOString(),
        auto_save_enabled: true,
        auto_save_interval_seconds: 30,
      },
    })
  })

  it("should initialize with default state", async () => {
    const { result } = renderHook(() => useVersionControl())

    expect(result.current.currentVersionId).toBe("initial")
    expect(result.current.branchName).toBe("main")
    expect(result.current.autoSaveEnabled).toBe(true)
    expect(result.current.autoSaveIntervalSeconds).toBe(30)
  })

  it("should create snapshot successfully", async () => {
    mockBackendSync.createSnapshot.mockResolvedValue({
      success: true,
      error: null,
      data: { version_id: "snap-123" },
    })

    const { result } = renderHook(() => useVersionControl())

    await act(async () => {
      const success = await result.current.createSnapshot("Test snapshot")
      expect(success).toBe(true)
    })

    expect(mockBackendSync.createSnapshot).toHaveBeenCalledWith("Test snapshot")
  })

  it("should handle snapshot creation failure", async () => {
    mockBackendSync.createSnapshot.mockResolvedValue({
      success: false,
      error: "Failed to create snapshot",
      data: null,
    })

    const { result } = renderHook(() => useVersionControl())

    await act(async () => {
      const success = await result.current.createSnapshot("Test snapshot")
      expect(success).toBe(false)
    })

    expect(result.current.error).toBe("Failed to create snapshot")
  })

  it("should restore version successfully", async () => {
    mockBackendSync.restoreVersion.mockResolvedValue({
      success: true,
      error: null,
      data: { restored_at: new Date().toISOString() },
    })

    const { result } = renderHook(() => useVersionControl())

    await act(async () => {
      const success = await result.current.restoreVersion("version-123")
      expect(success).toBe(true)
    })

    expect(mockBackendSync.restoreVersion).toHaveBeenCalledWith("version-123")
  })

  it("should get version history", async () => {
    const mockVersions = [
      {
        id: "version-1",
        timestamp: new Date().toISOString(),
        author: "user",
        message: "Initial version",
        branch_name: "main",
      },
      {
        id: "version-2", 
        timestamp: new Date().toISOString(),
        author: "user",
        message: "Second version",
        branch_name: "main",
      },
    ]

    mockBackendSync.getVersionHistory.mockResolvedValue({
      success: true,
      error: null,
      data: { versions: mockVersions },
    })

    const { result } = renderHook(() => useVersionControl())

    await act(async () => {
      const versions = await result.current.getVersionHistory(10)
      expect(versions).toEqual(mockVersions)
    })

    expect(mockBackendSync.getVersionHistory).toHaveBeenCalledWith(10)
  })

  it("should create branch successfully", async () => {
    mockBackendSync.createBranch.mockResolvedValue({
      success: true,
      error: null,
      data: { branch_name: "feature-branch" },
    })

    const { result } = renderHook(() => useVersionControl())

    await act(async () => {
      const success = await result.current.createBranch("feature-branch")
      expect(success).toBe(true)
    })

    expect(mockBackendSync.createBranch).toHaveBeenCalledWith("feature-branch", undefined)
  })

  it("should update auto-save settings", async () => {
    mockBackendSync.setAutoSaveInterval.mockResolvedValue({
      success: true,
      error: null,
      data: { auto_save_interval_seconds: 60 },
    })

    mockBackendSync.enableAutoSave.mockResolvedValue({
      success: true,
      error: null,
      data: { auto_save_enabled: false },
    })

    const { result } = renderHook(() => useVersionControl())

    await act(async () => {
      const success1 = await result.current.setAutoSaveInterval(60)
      const success2 = await result.current.enableAutoSave(false)
      
      expect(success1).toBe(true)
      expect(success2).toBe(true)
    })

    expect(mockBackendSync.setAutoSaveInterval).toHaveBeenCalledWith(60)
    expect(mockBackendSync.enableAutoSave).toHaveBeenCalledWith(false)
  })

  it("should handle loading states correctly", async () => {
    // Mock slow operation
    mockBackendSync.createSnapshot.mockImplementation(
      () => new Promise((resolve) => 
        setTimeout(() => resolve({
          success: true,
          error: null,
          data: { version_id: "slow-snap" },
        }), 100)
      )
    )

    const { result } = renderHook(() => useVersionControl())

    // Start operation
    act(() => {
      void result.current.createSnapshot("Slow snapshot")
    })

    // Should be loading
    expect(result.current.isLoading).toBe(true)

    // Wait for completion
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 150))
    })

    // Should not be loading anymore
    expect(result.current.isLoading).toBe(false)
  })
})