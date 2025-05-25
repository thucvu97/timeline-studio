import { useContext } from "react";

import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useAppSettings } from "./use-app-settings";

// Мокаем React Context
const mockContextValue = {
  state: {
    context: {
      userSettings: {},
      recentProjects: [],
      favorites: {},
      currentProject: { path: "", name: "", isNew: false, isDirty: false },
      mediaFiles: [],
      isLoading: false,
      error: null,
    },
    matches: vi.fn(),
    can: vi.fn(),
  },
  updateUserSettings: vi.fn(),
  addRecentProject: vi.fn(),
  removeRecentProject: vi.fn(),
  clearRecentProjects: vi.fn(),
  updateFavorites: vi.fn(),
  addToFavorites: vi.fn(),
  removeFromFavorites: vi.fn(),
  reloadSettings: vi.fn(),
  createNewProject: vi.fn(),
  openProject: vi.fn(),
  saveProject: vi.fn(),
  setProjectDirty: vi.fn(),
  updateMediaFiles: vi.fn(),
  getUserSettings: vi.fn(),
  getRecentProjects: vi.fn(),
  getFavorites: vi.fn(),
  getCurrentProject: vi.fn(),
  getMediaFiles: vi.fn(),
  isLoading: vi.fn(),
  getError: vi.fn(),
};

// Мокаем useContext
vi.mock("react", async () => {
  const actual = await vi.importActual("react");
  return {
    ...actual,
    useContext: vi.fn(),
  };
});

describe("useAppSettings", () => {
  it("should return context value when used within AppSettingsProvider", () => {
    vi.mocked(useContext).mockReturnValue(mockContextValue);

    const { result } = renderHook(() => useAppSettings());

    expect(result.current).toBe(mockContextValue);
  });

  it("should throw error when used outside AppSettingsProvider", () => {
    vi.mocked(useContext).mockReturnValue(null);

    const consoleError = console.error;
    console.error = vi.fn(); // Подавляем ошибки в консоли во время теста

    expect(() => renderHook(() => useAppSettings())).toThrow(
      "useAppSettings must be used within an AppSettingsProvider"
    );

    console.error = consoleError; // Восстанавливаем console.error
  });
});
