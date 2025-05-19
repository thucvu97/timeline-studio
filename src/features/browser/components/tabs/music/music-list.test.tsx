import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { MusicList } from "./music-list"

// Мокаем хук useMusicMachine
vi.mock("./use-music-machine", () => ({
  useMusicMachine: () => ({
    filteredFiles: [
      {
        id: "1",
        name: "test1.mp3",
        path: "/test/test1.mp3",
        type: "audio",
        probeData: {
          format: {
            duration: 120,
            size: 1000,
            tags: {
              title: "Test Song 1",
              artist: "Test Artist 1",
              genre: "Rock",
              date: "2021-01-01",
            },
          },
        },
      },
      {
        id: "2",
        name: "test2.mp3",
        path: "/test/test2.mp3",
        type: "audio",
        probeData: {
          format: {
            duration: 180,
            size: 2000,
            tags: {
              title: "Test Song 2",
              artist: "Test Artist 2",
              genre: "Pop",
              date: "2022-01-01",
            },
          },
        },
      },
    ],
    sortBy: "date",
    sortOrder: "desc",
    groupBy: "none",
    viewMode: "thumbnails",
    isLoading: false,
    isLoaded: true,
    isError: false,
  }),
}))

// Мокаем хук useMedia
vi.mock("@/features/browser/media", () => ({
  useMedia: () => ({
    isItemFavorite: vi.fn().mockReturnValue(false),
    toggleFavorite: vi.fn(),
    currentAudio: null,
    isPlaying: false,
    playAudio: vi.fn(),
    pauseAudio: vi.fn(),
  }),
}))

// Мокаем хук useTranslation
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      // Возвращаем ключи для тестирования
      const translations: Record<string, string> = {
        "browser.loading": "Loading...",
        "browser.error_loading": "Error loading",
        "browser.no_music_files": "No music files",
        "browser.duration": "Duration",
        "browser.play": "Play",
        "browser.add_to_favorites": "Add to favorites",
      }
      return translations[key] || key
    },
  }),
}))

// Мокаем функцию sortFiles
vi.mock("./music-utils", () => ({
  sortFiles: vi.fn((files) => files),
}))

// Мокаем console.log и console.error
vi.spyOn(console, "log").mockImplementation(() => {})
vi.spyOn(console, "error").mockImplementation(() => {})

describe("MusicList", () => {
  beforeEach(() => {
    // Очищаем моки перед каждым тестом
    vi.clearAllMocks()
  })

  it("should render correctly", () => {
    // Рендерим компонент
    render(<MusicList />)

    // Проверяем, что компонент отрендерился с правильными данными
    expect(screen.getByText("Test Song 1")).toBeInTheDocument()
    expect(screen.getByText("Test Song 2")).toBeInTheDocument()
    expect(screen.getByText("Test Artist 1")).toBeInTheDocument()
    expect(screen.getByText("Test Artist 2")).toBeInTheDocument()
  })

  it("should render loading state", () => {
    // Переопределяем мок хука useMusicMachine для тестирования состояния загрузки
    vi.mocked(require("./use-music-machine").useMusicMachine).mockReturnValue({
      filteredFiles: [],
      sortBy: "date",
      sortOrder: "desc",
      groupBy: "none",
      viewMode: "thumbnails",
      isLoading: true,
      isLoaded: false,
      isError: false,
    })

    // Рендерим компонент
    render(<MusicList />)

    // Проверяем, что отображается индикатор загрузки
    expect(screen.getByText("Loading...")).toBeInTheDocument()
  })

  it("should render error state", () => {
    // Переопределяем мок хука useMusicMachine для тестирования состояния ошибки
    vi.mocked(require("./use-music-machine").useMusicMachine).mockReturnValue({
      filteredFiles: [],
      sortBy: "date",
      sortOrder: "desc",
      groupBy: "none",
      viewMode: "thumbnails",
      isLoading: false,
      isLoaded: false,
      isError: true,
      error: "Test error",
    })

    // Рендерим компонент
    render(<MusicList />)

    // Проверяем, что отображается сообщение об ошибке
    expect(screen.getByText("Error loading")).toBeInTheDocument()
    expect(screen.getByText("Test error")).toBeInTheDocument()
  })

  it("should render empty state", () => {
    // Переопределяем мок хука useMusicMachine для тестирования пустого состояния
    vi.mocked(require("./use-music-machine").useMusicMachine).mockReturnValue({
      filteredFiles: [],
      sortBy: "date",
      sortOrder: "desc",
      groupBy: "none",
      viewMode: "thumbnails",
      isLoading: false,
      isError: false,
    })

    // Рендерим компонент
    render(<MusicList />)

    // Проверяем, что отображается сообщение о пустом списке
    expect(screen.getByText("No music files")).toBeInTheDocument()
  })

  it("should play audio when play button is clicked", () => {
    // Рендерим компонент
    render(<MusicList />)

    // Находим кнопку воспроизведения и кликаем по ней
    const playButtons = screen.getAllByLabelText("Play")
    fireEvent.click(playButtons[0])

    // Получаем мок хука useMedia
    const { useMedia } = require("@/features/browser/media")
    const { playAudio } = useMedia()

    // Проверяем, что playAudio был вызван с правильными параметрами
    expect(playAudio).toHaveBeenCalled()
  })

  it("should toggle favorite when favorite button is clicked", () => {
    // Рендерим компонент
    render(<MusicList />)

    // Находим кнопку избранного и кликаем по ней
    const favoriteButtons = screen.getAllByLabelText("Add to favorites")
    fireEvent.click(favoriteButtons[0])

    // Получаем мок хука useMedia
    const { useMedia } = require("@/features/browser/media")
    const { toggleFavorite } = useMedia()

    // Проверяем, что toggleFavorite был вызван с правильными параметрами
    expect(toggleFavorite).toHaveBeenCalled()
  })

  it("should render list view when viewMode is list", () => {
    // Переопределяем мок хука useMusicMachine для тестирования режима списка
    vi.mocked(require("./use-music-machine").useMusicMachine).mockReturnValue({
      filteredFiles: [
        {
          id: "1",
          name: "test1.mp3",
          path: "/test/test1.mp3",
          type: "audio",
          probeData: {
            format: {
              duration: 120,
              size: 1000,
              tags: {
                title: "Test Song 1",
                artist: "Test Artist 1",
                genre: "Rock",
                date: "2021-01-01",
              },
            },
          },
        },
      ],
      sortBy: "date",
      sortOrder: "desc",
      groupBy: "none",
      viewMode: "list",
      isLoading: false,
      isError: false,
    })

    // Рендерим компонент
    render(<MusicList />)

    // Проверяем, что отображается режим списка
    expect(screen.getByText("Test Song 1")).toBeInTheDocument()
    expect(screen.getByText("Test Artist 1")).toBeInTheDocument()
    expect(screen.getByText("Duration")).toBeInTheDocument()
  })

  it("should render grouped view when groupBy is not none", () => {
    // Переопределяем мок хука useMusicMachine для тестирования группировки
    vi.mocked(require("./use-music-machine").useMusicMachine).mockReturnValue({
      filteredFiles: [
        {
          id: "1",
          name: "test1.mp3",
          path: "/test/test1.mp3",
          type: "audio",
          probeData: {
            format: {
              duration: 120,
              size: 1000,
              tags: {
                title: "Test Song 1",
                artist: "Test Artist 1",
                genre: "Rock",
                date: "2021-01-01",
              },
            },
          },
        },
        {
          id: "2",
          name: "test2.mp3",
          path: "/test/test2.mp3",
          type: "audio",
          probeData: {
            format: {
              duration: 180,
              size: 2000,
              tags: {
                title: "Test Song 2",
                artist: "Test Artist 1", // Тот же исполнитель для группировки
                genre: "Pop",
                date: "2022-01-01",
              },
            },
          },
        },
      ],
      sortBy: "date",
      sortOrder: "desc",
      groupBy: "artist",
      viewMode: "thumbnails",
      isLoading: false,
      isError: false,
    })

    // Рендерим компонент
    render(<MusicList />)

    // Проверяем, что отображается группировка
    expect(screen.getByText("Test Artist 1")).toBeInTheDocument()
    expect(screen.getAllByText("Test Song 1")).toHaveLength(1)
    expect(screen.getAllByText("Test Song 2")).toHaveLength(1)
  })
})
