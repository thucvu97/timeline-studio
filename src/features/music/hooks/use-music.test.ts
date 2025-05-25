import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useMusic } from "./use-music";

// Мокаем React Context
const mockContextValue = {
  musicFiles: [],
  filteredFiles: [],
  searchQuery: "",
  sortBy: "name",
  sortOrder: "asc" as const,
  filterType: "all",
  viewMode: "list" as const,
  groupBy: "none" as const,
  availableExtensions: [],
  showFavoritesOnly: false,
  error: null,
  isPlaying: false,
  isLoading: false,
  isError: false,
  search: vi.fn(),
  sort: vi.fn(),
  filter: vi.fn(),
  changeOrder: vi.fn(),
  changeViewMode: vi.fn(),
  changeGroupBy: vi.fn(),
  toggleFavorites: vi.fn(),
  retry: vi.fn(),
  addMusicFiles: vi.fn(),
  updateMusicFiles: vi.fn(),
};

// Мокаем useContext
vi.mock("react", async () => {
  const actual = await vi.importActual("react");
  return {
    ...actual,
    useContext: vi.fn(),
  };
});

describe("useMusic", () => {
  it("should return context value when used within MusicProvider", () => {
    const { useContext } = await import("react");
    vi.mocked(useContext).mockReturnValue(mockContextValue);

    const { result } = renderHook(() => useMusic());

    expect(result.current).toBe(mockContextValue);
  });

  it("should throw error when used outside MusicProvider", () => {
    const { useContext } = await import("react");
    vi.mocked(useContext).mockReturnValue(null);

    const consoleError = console.error;
    console.error = vi.fn(); // Подавляем ошибки в консоли во время теста

    expect(() => renderHook(() => useMusic())).toThrow(
      "useMusic must be used within a MusicProvider"
    );

    console.error = consoleError; // Восстанавливаем console.error
  });
});
