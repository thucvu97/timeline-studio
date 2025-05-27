import { describe, expect, it, vi } from "vitest";

import { renderWithBase, screen } from "@/test/test-utils";
import { MediaFile } from "@/types/media";

import { MediaInfo } from "../../components/media-info";

// Мокаем lucide-react иконки
vi.mock("lucide-react", () => ({
  FileVideo: () => <div data-testid="file-video-icon">FileVideo</div>,
  Upload: () => <div data-testid="upload-icon">Upload</div>,
  AlertTriangle: () => <div data-testid="alert-triangle-icon">AlertTriangle</div>,
}));

// Моковый медиафайл для тестов
const mockMediaFile: MediaFile = {
  id: "test-video-1",
  path: "/test/sample.mp4",
  name: "sample.mp4",
  size: 1000000,
  isVideo: true,
  isAudio: false,
  isImage: false,
  duration: 60,
  createdAt: "2024-01-15T10:30:00Z",
  isLoadingMetadata: false,
  probeData: {
    streams: [
      {
        index: 0,
        codec_name: "h264",
        codec_type: "video",
        width: 1920,
        height: 1080,
        r_frame_rate: "30/1",
        duration: "60.0",
        bit_rate: "5000000",
      },
    ],
    format: {
      filename: "/test/sample.mp4",
      nb_streams: 1,
      format_name: "mov,mp4,m4a,3gp,3g2,mj2",
      duration: 60,
      size: 1000000,
      bit_rate: 5000000,
    },
  },
};

describe("MediaInfo", () => {
  it("should render media info component", () => {
    renderWithBase(<MediaInfo />);

    // Проверяем, что компонент рендерится
    expect(screen.getByTestId("media-info")).toBeInTheDocument();

    // Проверяем заголовок
    expect(screen.getByText("options.info.title")).toBeInTheDocument();
  });

  it("should render file selection when no file is selected", () => {
    renderWithBase(<MediaInfo />);

    // Проверяем элементы выбора файла
    expect(screen.getByText("options.info.selectFile")).toBeInTheDocument();
    expect(screen.getByText("common.browse")).toBeInTheDocument();
  });

  it("should accept selectedMediaFile prop", () => {
    // Компонент должен рендериться без ошибок с переданным файлом
    expect(() => {
      renderWithBase(<MediaInfo selectedMediaFile={mockMediaFile} />);
    }).not.toThrow();

    // Проверяем, что компонент рендерится
    expect(screen.getByTestId("media-info")).toBeInTheDocument();
  });
});
