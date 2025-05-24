import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MediaGroup } from "./media-group";

// Мокаем useTranslation
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "browser.media.add": "Add",
        "browser.media.added": "Added",
      };
      return translations[key] || key;
    },
  }),
}));

// Мокаем useMedia
vi.mock("@/features/browser/media", () => ({
  useMedia: () => ({
    isFileAdded: vi.fn((file) => file.id === "added-file"),
    areAllFilesAdded: vi.fn((files) =>
      files.every((file) => file.id === "added-file"),
    ),
  }),
}));

// Мокаем MediaItem
vi.mock("./media-item", () => ({
  MediaItem: ({ file, index, viewMode, previewSize, onAddMedia }) => (
    <div
      data-testid="media-item"
      data-file-id={file.id}
      data-index={index}
      data-view-mode={viewMode}
      data-preview-size={previewSize}
      onClick={() => onAddMedia(file)}
    >
      Media Item: {file.name}
    </div>
  ),
}));

describe("MediaGroup", () => {
  const mockFiles = [
    {
      id: "test-file-1",
      name: "test-file-1.mp4",
      path: "/path/to/test-file-1.mp4",
      isVideo: true,
      isImage: false,
      size: 1000,
      creationTime: "2023-01-01T00:00:00.000Z",
    },
    {
      id: "test-file-2",
      name: "test-file-2.mp4",
      path: "/path/to/test-file-2.mp4",
      isVideo: true,
      isImage: false,
      size: 1000,
      creationTime: "2023-01-01T00:00:00.000Z",
    },
  ];

  const mockAddedFiles = [
    {
      id: "added-file",
      name: "added-file.mp4",
      path: "/path/to/added-file.mp4",
      isVideo: true,
      isImage: false,
      size: 1000,
      creationTime: "2023-01-01T00:00:00.000Z",
    },
  ];

  const mockImageFiles = [
    {
      id: "image-file",
      name: "image-file.jpg",
      path: "/path/to/image-file.jpg",
      isVideo: false,
      isImage: true,
      size: 1000,
      creationTime: "2023-01-01T00:00:00.000Z",
    },
  ];

  const mockAddFilesToTimeline = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render null when files array is empty", () => {
    const { container } = render(
      <MediaGroup
        title="Test Group"
        files={[]}
        viewMode="list"
        previewSize={100}
        addFilesToTimeline={mockAddFilesToTimeline}
      />,
    );

    // Проверяем, что компонент не отрендерился
    expect(container.firstChild).toBeNull();
  });

  it("should render without title when title is empty", () => {
    render(
      <MediaGroup
        title=""
        files={mockFiles}
        viewMode="list"
        previewSize={100}
        addFilesToTimeline={mockAddFilesToTimeline}
      />,
    );

    // Проверяем, что компоненты MediaItem отрендерились
    expect(screen.getAllByTestId("media-item")).toHaveLength(2);

    // Проверяем, что заголовок не отрендерился
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });

  it("should render with title and add button", () => {
    render(
      <MediaGroup
        title="Test Group"
        files={mockFiles}
        viewMode="list"
        previewSize={100}
        addFilesToTimeline={mockAddFilesToTimeline}
      />,
    );

    // Проверяем, что заголовок отрендерился
    expect(screen.getByText("Test Group")).toBeInTheDocument();

    // Проверяем, что кнопка Add отрендерилась
    expect(screen.getByText("Add")).toBeInTheDocument();

    // Проверяем, что компоненты MediaItem отрендерились
    expect(screen.getAllByTestId("media-item")).toHaveLength(2);
  });

  it("should call addFilesToTimeline when add button is clicked", () => {
    render(
      <MediaGroup
        title="Test Group"
        files={mockFiles}
        viewMode="list"
        previewSize={100}
        addFilesToTimeline={mockAddFilesToTimeline}
      />,
    );

    // Кликаем на кнопку Add
    fireEvent.click(screen.getByText("Add"));

    // Проверяем, что вызвана функция addFilesToTimeline с правильными параметрами
    expect(mockAddFilesToTimeline).toHaveBeenCalledWith(mockFiles);
  });

  it("should disable add button when all files are added", () => {
    render(
      <MediaGroup
        title="Test Group"
        files={mockAddedFiles}
        viewMode="list"
        previewSize={100}
        addFilesToTimeline={mockAddFilesToTimeline}
      />,
    );

    // Проверяем, что кнопка Add отображается как "Added" и имеет класс opacity-50
    const addButton = screen.getByText("Added").closest("button");
    expect(addButton).toHaveClass("opacity-50");
    expect(addButton).toHaveClass("cursor-not-allowed");
    expect(addButton).toBeDisabled();
  });

  it("should filter out image files when adding to timeline", () => {
    const mixedFiles = [...mockFiles, ...mockImageFiles];

    render(
      <MediaGroup
        title="Test Group"
        files={mixedFiles}
        viewMode="list"
        previewSize={100}
        addFilesToTimeline={mockAddFilesToTimeline}
      />,
    );

    // Кликаем на кнопку Add
    fireEvent.click(screen.getByText("Add"));

    // Проверяем, что вызвана функция addFilesToTimeline только с видео файлами
    expect(mockAddFilesToTimeline).toHaveBeenCalledWith(mockFiles);
  });

  it("should call handleAddMedia when MediaItem is clicked", () => {
    render(
      <MediaGroup
        title="Test Group"
        files={mockFiles}
        viewMode="list"
        previewSize={100}
        addFilesToTimeline={mockAddFilesToTimeline}
      />,
    );

    // Кликаем на первый MediaItem
    fireEvent.click(screen.getAllByTestId("media-item")[0]);

    // Проверяем, что вызвана функция addFilesToTimeline с правильными параметрами
    expect(mockAddFilesToTimeline).toHaveBeenCalledWith([mockFiles[0]]);
  });

  it("should not call addFilesToTimeline for already added files", () => {
    render(
      <MediaGroup
        title="Test Group"
        files={mockAddedFiles}
        viewMode="list"
        previewSize={100}
        addFilesToTimeline={mockAddFilesToTimeline}
      />,
    );

    // Кликаем на MediaItem
    fireEvent.click(screen.getByTestId("media-item"));

    // Проверяем, что функция addFilesToTimeline не была вызвана
    expect(mockAddFilesToTimeline).not.toHaveBeenCalled();
  });

  it("should not call addFilesToTimeline for image files", () => {
    render(
      <MediaGroup
        title="Test Group"
        files={mockImageFiles}
        viewMode="list"
        previewSize={100}
        addFilesToTimeline={mockAddFilesToTimeline}
      />,
    );

    // Кликаем на MediaItem
    fireEvent.click(screen.getByTestId("media-item"));

    // Проверяем, что функция addFilesToTimeline не была вызвана
    expect(mockAddFilesToTimeline).not.toHaveBeenCalled();
  });
});
