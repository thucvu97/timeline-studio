import { describe, expect, it } from "vitest";

import { renderWithBase, screen } from "@/test/test-utils";

import { VideoSettings } from "../../components/video-settings";

describe("VideoSettings", () => {
  it("should render video settings component", () => {
    renderWithBase(<VideoSettings />);

    // Проверяем, что компонент рендерится
    expect(screen.getByTestId("video-settings")).toBeInTheDocument();

    // Проверяем заголовок
    expect(screen.getByText("options.video.title")).toBeInTheDocument();
  });

  it("should render all video setting controls", () => {
    renderWithBase(<VideoSettings />);

    // Проверяем основные элементы управления
    expect(screen.getByText("options.video.resolution")).toBeInTheDocument();
    expect(screen.getByText("options.video.fps")).toBeInTheDocument();
    expect(screen.getByText("options.video.aspectRatio")).toBeInTheDocument();
    expect(
      screen.getByText("options.video.previewQuality"),
    ).toBeInTheDocument();
    expect(screen.getByText("options.video.defaultCodec")).toBeInTheDocument();
  });
});
