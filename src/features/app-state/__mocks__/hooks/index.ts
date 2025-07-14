import { vi } from "vitest"

export const mockGetUserSettings = vi.fn()
export const mockUpdateUserSettings = vi.fn()
export const mockLoadUserSettings = vi.fn()
export const mockSaveUserSettings = vi.fn()
export const mockSetMediaFiles = vi.fn()
export const mockSetMusicFiles = vi.fn()
export const mockSetCurrentProject = vi.fn()
export const mockToggleFavorite = vi.fn()
export const mockUpdateBrowserState = vi.fn()

// Default mock implementation for useAppSettings
export const useAppSettings = vi.fn(() => ({
  getUserSettings: mockGetUserSettings,
  updateUserSettings: mockUpdateUserSettings,
  loadUserSettings: mockLoadUserSettings,
  saveUserSettings: mockSaveUserSettings,
  setMediaFiles: mockSetMediaFiles,
  setMusicFiles: mockSetMusicFiles,
  setCurrentProject: mockSetCurrentProject,
  toggleFavorite: mockToggleFavorite,
  updateBrowserState: mockUpdateBrowserState,
  isLoading: vi.fn(() => false),
  getError: vi.fn(() => null),
  state: {
    context: {
      currentProject: {
        isNew: false,
        path: "/test/project.json",
        name: "Test Project",
        isDirty: false,
      },
      mediaFiles: {
        allFiles: [],
        error: null,
        isLoading: false,
      },
      musicFiles: {
        allFiles: [],
        error: null,
        isLoading: false,
      },
    },
  },
}))

// Default return values
mockGetUserSettings.mockReturnValue({
  browserSettings: null,
  favorites: [],
  recentProjects: [],
})

// Other hooks exports
export { useCurrentProject } from "../../hooks/use-current-project"
export { useFavorites } from "../../hooks/use-favorites"
export { useMediaFiles } from "../../hooks/use-media-files"
export { useMusicFiles } from "../../hooks/use-music-files"
export { useRecentProjects } from "../../hooks/use-recent-projects"
