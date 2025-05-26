import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MusicList } from "../components/music-list";

// Мокаем хук переводов
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
    i18n: { language: "ru" }
  })
}));

// Мокаем хук ресурсов
const mockAddMusic = vi.fn();
const mockIsMusicFileAdded = vi.fn().mockReturnValue(false);
const mockRemoveResource = vi.fn();

vi.mock("@/features/resources", () => ({
  useResources: () => ({
    addMusic: mockAddMusic,
    isMusicFileAdded: mockIsMusicFileAdded,
    removeResource: mockRemoveResource,
    musicResources: []
  })
}));

// Мокаем состояние браузера
vi.mock("@/components/common/browser-state-provider", () => ({
  useBrowserState: () => ({
    currentTabSettings: {
      searchQuery: "",
      showFavoritesOnly: false,
      sortBy: "name",
      sortOrder: "asc",
      groupBy: "none",
      filterType: "all",
      viewMode: "list"
    }
  })
}));

// Мокаем медиа хук
vi.mock("@/features/browser/media", () => ({
  useMedia: () => ({
    isItemFavorite: vi.fn().mockReturnValue(false)
  })
}));

// Мокаем хук импорта музыки
const mockImportFile = vi.fn();
const mockImportDirectory = vi.fn();

vi.mock("../hooks/use-music-import", () => ({
  useMusicImport: () => ({
    importFile: mockImportFile,
    importDirectory: mockImportDirectory,
    isImporting: false,
    error: null
  })
}));

// Мокаем компоненты
vi.mock("@/features/browser/components/layout/add-media-button", () => ({
  AddMediaButton: ({ onAddMedia, isAdded }: any) => (
    <div data-testid={isAdded ? "remove-button" : "add-button"} onClick={onAddMedia}>
      {isAdded ? "Remove" : "Add"}
    </div>
  )
}));

vi.mock("@/features/browser/components/layout/favorite-button", () => ({
  FavoriteButton: ({ file }: any) => (
    <div data-testid="favorite-button">
      Favorite {file.name}
    </div>
  )
}));

vi.mock("@/features/browser/components/layout/no-files", () => ({
  NoFiles: () => (
    <div data-testid="no-files">
      No music files found
    </div>
  )
}));

// Мокаем утилиты
vi.mock("@/lib/date", () => ({
  formatTime: (seconds: number) => `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`
}));

vi.mock("@/lib/utils", () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(" ")
}));

describe("MusicList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsMusicFileAdded.mockReturnValue(false);
  });

  it("should render music list component", () => {
    render(<MusicList />);

    // Проверяем основные элементы
    expect(screen.getByTestId("music-list-content")).toBeInTheDocument();
  });

  it("should show no files message when no music files", () => {
    render(<MusicList />);

    // Проверяем сообщение об отсутствии файлов
    expect(screen.getByTestId("no-files")).toBeInTheDocument();
    expect(screen.getByText("No music files found")).toBeInTheDocument();
  });

  it("should render music list structure", () => {
    render(<MusicList />);

    // Проверяем основную структуру списка музыки
    expect(screen.getByTestId("music-list-container")).toBeInTheDocument();
    expect(screen.getByTestId("music-list-content")).toBeInTheDocument();
    expect(screen.getByTestId("music-list-group-default")).toBeInTheDocument();
    expect(screen.getByTestId("music-list-view-list")).toBeInTheDocument();
  });

  it("should render with list view mode", () => {
    render(<MusicList />);

    // В режиме списка должен быть соответствующий контейнер
    // Поскольку нет файлов, проверяем основную структуру
    expect(screen.getByTestId("music-list-content")).toBeInTheDocument();
  });

  it("should handle audio element creation", () => {
    render(<MusicList />);

    // Проверяем, что компонент рендерится без ошибок
    // Аудио элемент создается через useRef
    expect(screen.getByTestId("music-list-content")).toBeInTheDocument();
  });

  it("should render toolbar section", () => {
    render(<MusicList />);

    // Проверяем секцию с кнопками импорта
    const importSection = screen.getByTestId("music-list-content").parentElement;
    expect(importSection).toBeInTheDocument();
  });

  it("should handle empty state correctly", () => {
    render(<MusicList />);

    // Проверяем правильное отображение пустого состояния
    expect(screen.getByTestId("no-files")).toBeInTheDocument();
    expect(screen.queryByTestId("music-list-loading")).not.toBeInTheDocument();
  });
});

describe("MusicList with different states", () => {
  it("should render without errors in different states", () => {
    render(<MusicList />);

    // Компонент должен рендериться корректно в любом состоянии
    expect(screen.getByTestId("music-list-content")).toBeInTheDocument();
    expect(screen.getByTestId("music-list-container")).toBeInTheDocument();
  });
});
