import { describe, expect, it, vi } from "vitest";

import { renderWithBase, screen } from "@/test/test-utils";

import { AudioSettings } from "../../components/audio-settings";

// Мокаем ResizeObserver для компонентов со Slider
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

describe("AudioSettings", () => {
  it("should render audio settings component", () => {
    renderWithBase(<AudioSettings />);

    // Проверяем, что компонент рендерится
    expect(screen.getByTestId("audio-settings")).toBeInTheDocument();

    // Проверяем заголовок
    expect(screen.getByText("options.audio.title")).toBeInTheDocument();
  });

  it("should render all audio setting controls", () => {
    renderWithBase(<AudioSettings />);

    // Проверяем основные элементы управления
    expect(screen.getByText("options.audio.sampleRate")).toBeInTheDocument();
    expect(screen.getByText("options.audio.bitrate")).toBeInTheDocument();
    expect(screen.getByText("options.audio.channels")).toBeInTheDocument();
    expect(screen.getByText("options.audio.defaultVolume")).toBeInTheDocument();
    expect(screen.getByText("options.audio.codec")).toBeInTheDocument();
  });
});
