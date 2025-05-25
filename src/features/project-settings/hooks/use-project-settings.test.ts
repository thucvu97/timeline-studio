import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useProjectSettings } from "./use-project-settings";

// Мокаем React Context
const mockContextValue = {
  settings: {
    name: "Test Project",
    description: "Test Description",
    resolution: { width: 1920, height: 1080 },
    frameRate: 30,
    duration: 60,
    audioSampleRate: 44100,
    audioBitrate: 128,
    videoBitrate: 5000,
    videoCodec: "h264",
    audioCodec: "aac",
    outputFormat: "mp4",
  },
  updateSettings: vi.fn(),
  resetSettings: vi.fn(),
};

// Мокаем useContext
vi.mock("react", async () => {
  const actual = await vi.importActual("react");
  return {
    ...actual,
    useContext: vi.fn(),
  };
});

describe("useProjectSettings", () => {
  it("should return context value when used within ProjectSettingsProvider", () => {
    const { useContext } = require("react");
    vi.mocked(useContext).mockReturnValue(mockContextValue);

    const { result } = renderHook(() => useProjectSettings());

    expect(result.current).toBe(mockContextValue);
  });

  it("should throw error when used outside ProjectSettingsProvider", () => {
    const { useContext } = require("react");
    vi.mocked(useContext).mockReturnValue(null);

    const consoleError = console.error;
    console.error = vi.fn(); // Подавляем ошибки в консоли во время теста

    expect(() => renderHook(() => useProjectSettings())).toThrow(
      "useProjectSettings must be used within a ProjectSettingsProvider"
    );

    console.error = consoleError; // Восстанавливаем console.error
  });

  it("should provide updateSettings method", () => {
    const { useContext } = require("react");
    vi.mocked(useContext).mockReturnValue(mockContextValue);

    const { result } = renderHook(() => useProjectSettings());

    expect(result.current.updateSettings).toBe(mockContextValue.updateSettings);
    expect(typeof result.current.updateSettings).toBe("function");
  });

  it("should provide resetSettings method", () => {
    const { useContext } = require("react");
    vi.mocked(useContext).mockReturnValue(mockContextValue);

    const { result } = renderHook(() => useProjectSettings());

    expect(result.current.resetSettings).toBe(mockContextValue.resetSettings);
    expect(typeof result.current.resetSettings).toBe("function");
  });
});
