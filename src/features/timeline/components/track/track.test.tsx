import { describe, expect, it, vi } from "vitest";

import { render, screen } from "@/test/test-utils";

import { Track } from "./track";
import { createTimelineClip, createTimelineTrack } from "../../types";


describe("Track", () => {
  const mockTrack = createTimelineTrack("Test Track", "video");
  const mockClip = createTimelineClip("media-1", mockTrack.id, 0, 10);

  // Добавляем клип к треку
  mockTrack.clips = [mockClip];

  const defaultProps = {
    track: mockTrack,
    timeScale: 50, // 50 пикселей на секунду
    currentTime: 5,
    onSelect: vi.fn(),
    onUpdate: vi.fn(),
  };

  it("should render track with header and content", () => {
    render(<Track {...defaultProps} />);

    // Проверяем что трек отображается
    expect(screen.getByText("Test Track")).toBeInTheDocument();
    expect(screen.getByText("video")).toBeInTheDocument(); // lowercase, как в компоненте
  });

  it("should show selected state", () => {
    render(<Track {...defaultProps} isSelected={true} />);

    // Проверяем что заголовок трека выделен (имеет соответствующие классы)
    const headerElement = screen.getByText("Test Track").closest("div")
      ?.parentElement?.parentElement;
    expect(headerElement).toHaveClass("bg-accent/20");
  });

  it("should call onSelect when clicked", () => {
    const onSelect = vi.fn();
    render(<Track {...defaultProps} onSelect={onSelect} />);

    // Кликаем на трек
    const trackElement = screen
      .getByText("Test Track")
      .closest("div")?.parentElement;
    trackElement?.click();

    expect(onSelect).toHaveBeenCalledWith(mockTrack.id);
  });

  it("should show track controls", () => {
    render(<Track {...defaultProps} />);

    // Проверяем наличие кнопок управления (используем правильные title из компонента)
    expect(screen.getByTitle("Скрыть трек")).toBeInTheDocument();
    expect(screen.getByTitle("Заблокировать трек")).toBeInTheDocument();
  });
});
