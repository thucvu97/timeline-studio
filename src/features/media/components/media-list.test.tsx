import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MediaFile } from "@/types/media";

import { MediaList } from "./media-list";

// Мокаем useTranslation
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Мокаем i18n
vi.mock("@/i18n", () => ({
  default: {
    language: "en",
    t: (key: string) => key,
  },
}));

// Мокаем useMedia
const mockAllMediaFiles = [
  {
    id: "video-file",
    name: "video-file.mp4",
    path: "/path/to/video-file.mp4",
    isVideo: true,
    isAudio: false,
    isImage: false,
    size: 1000,
    creationTime: "2023-01-01T00:00:00.000Z",
    startTime: 1672531200,
    probeData: {
      streams: [{ codec_type: "video" }],
      format: { size: 1000, duration: 120 },
    },
  },
  {
    id: "audio-file",
    name: "audio-file.mp3",
    path: "/path/to/audio-file.mp3",
    isVideo: false,
    isAudio: true,
    isImage: false,
    size: 500,
    creationTime: "2023-01-02T00:00:00.000Z",
    startTime: 1672617600,
    probeData: {
      streams: [{ codec_type: "audio" }],
      format: { size: 500, duration: 180 },
    },
  },
];

vi.mock("@/features/browser", () => ({
  useMedia: () => ({
    allMediaFiles: mockAllMediaFiles,
    includedFiles: [],
    isLoading: false,
    error: null,
    isFileAdded: vi.fn((file) => file.id === "added-file"),
    isItemFavorite: vi.fn(() => false),
  }),
}));

// Мокаем useMediaList
vi.mock("../services/media-list-provider", () => ({
  useMediaList: () => ({
    searchQuery: "",
    showFavoritesOnly: false,
    viewMode: "list",
    sortBy: "date",
    filterType: "all",
    groupBy: "none",
    sortOrder: "desc",
    previewSize: 100,
    retry: vi.fn(),
  }),
}));

// Мокаем MediaToolbar
vi.mock("./media-toolbar", () => ({
  MediaToolbar: () => <div data-testid="media-toolbar">Media Toolbar</div>,
}));

// Мокаем MediaContent
vi.mock("./media-content", () => {
  type GroupedFilesType = { files: MediaFile[]; title: string }[];
  interface MediaContentProps {
    groupedFiles: GroupedFilesType;
    viewMode: string;
    previewSize: number;
    isLoading: boolean;
    error?: string | null;
    addFilesToTimeline: (files: MediaFile[]) => void;
    onRetry: () => void;
  }
  const MediaContent = ({
    groupedFiles,
    viewMode,
    previewSize,
    isLoading,
    error,
    addFilesToTimeline,
    onRetry,
  }: MediaContentProps) => (
    <div
      data-testid="media-content"
      data-groups-count={groupedFiles.length}
      data-files-count={groupedFiles.reduce(
        (acc: number, group: { files: MediaFile[] }) =>
          acc + group.files.length,
        0,
      )}
      data-view-mode={viewMode}
      data-preview-size={previewSize}
      data-is-loading={isLoading}
      data-error={error}
    >
      Media Content
    </div>
  );
  return { MediaContent };
});

// Мокаем StatusBar
vi.mock("../../browser/components/layout/status-bar", () => ({
  StatusBar: ({ media, sortedDates, addedFiles }) => (
    <div
      data-testid="status-bar"
      data-media-count={media.length}
      data-added-files-count={addedFiles.length}
      data-sorted-dates-count={Object.keys(sortedDates).length}
    >
      Status Bar
    </div>
  ),
}));

// Мокаем вспомогательные функции
vi.mock("@/lib/media-files", () => ({
  getFileType: (file: { isVideo: any; isAudio: any }) => {
    if (file.isVideo) return "video";
    if (file.isAudio) return "audio";
    return "image";
  },
  groupFilesByDate: () => ({ "2023-01-01": [], "2023-01-02": [] }),
}));

// Мокаем форматирование даты
vi.mock("@/i18n/constants", () => ({
  formatDateByLanguage: () => "January 1, 2023",
}));

describe("MediaList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Мокируем console.log и console.error
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("should render MediaToolbar, MediaContent and StatusBar", () => {
    render(<MediaList />);

    // Проверяем, что компоненты отрендерились
    expect(screen.getByTestId("media-toolbar")).toBeInTheDocument();
    expect(screen.getByTestId("media-content")).toBeInTheDocument();
    expect(screen.getByTestId("status-bar")).toBeInTheDocument();
  });

  it("should pass correct props to MediaContent", () => {
    render(<MediaList />);

    // Проверяем, что MediaContent получает правильные пропсы
    const mediaContent = screen.getByTestId("media-content");
    expect(mediaContent.dataset.viewMode).toBe("list");
    expect(mediaContent.dataset.previewSize).toBe("100");
    expect(mediaContent.dataset.isLoading).toBe("false");
    // Проверяем, что error либо пустая строка, либо undefined
    expect(mediaContent.dataset.error ?? "").toBe("");
    expect(mediaContent.dataset.groupsCount).toBe("1"); // По умолчанию одна группа без заголовка
    expect(mediaContent.dataset.filesCount).toBe("2"); // Два файла из mockAllMediaFiles
  });

  it("should pass correct props to StatusBar", () => {
    render(<MediaList />);

    // Проверяем, что StatusBar получает правильные пропсы
    const statusBar = screen.getByTestId("status-bar");
    expect(statusBar.dataset.mediaCount).toBe("2"); // Два файла из mockAllMediaFiles
    expect(statusBar.dataset.addedFilesCount).toBe("0"); // Нет добавленных файлов
    expect(statusBar.dataset.sortedDatesCount).toBe("2"); // Две даты из мока groupFilesByDate
  });
});
