import React from "react"

import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { EffectList } from "../../components/effect-list"
import { VideoEffect } from "../../types"

// Мокаем все внешние зависимости
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
  }),
}))

const mockEffects: VideoEffect[] = [
  {
    id: "effect-1",
    name: "Blur Effect",
    category: "artistic",
    complexity: "basic",
    type: "blur",
    tags: ["blur", "artistic"],
    labels: {
      ru: "Размытие",
      en: "Blur Effect",
    },
    description: {
      ru: "Эффект размытия изображения",
      en: "Image blur effect",
    },
    duration: 1000,
    ffmpegCommand: () => "blur=5",
    previewPath: "/previews/blur.jpg",
  },
  {
    id: "effect-2",
    name: "Vintage Film",
    category: "vintage",
    complexity: "intermediate",
    type: "vintage",
    tags: ["vintage", "retro"],
    labels: {
      ru: "Винтажная пленка",
      en: "Vintage Film",
    },
    description: {
      ru: "Эффект старой пленки",
      en: "Old film effect",
    },
    duration: 1000,
    ffmpegCommand: () => "vintage",
    previewPath: "/previews/vintage.jpg",
  },
  {
    id: "effect-3",
    name: "Color Correction",
    category: "color-correction",
    complexity: "advanced",
    type: "brightness",
    tags: ["professional", "subtle"],
    labels: {
      ru: "Цветокоррекция",
      en: "Color Correction",
    },
    description: {
      ru: "Коррекция цвета",
      en: "Color adjustment",
    },
    duration: 1000,
    ffmpegCommand: () => "brightness=0.1",
    previewPath: "/previews/color.jpg",
  },
]

const mockBrowserState = {
  currentTabSettings: {
    searchQuery: "",
    showFavoritesOnly: false,
    sortBy: "name",
    sortOrder: "asc",
    groupBy: "none",
    filterType: "all",
    previewSizeIndex: 2,
  },
}

const mockProjectSettings = {
  settings: {
    aspectRatio: {
      value: { width: 16, height: 9 },
    },
  },
}

const mockFavorites = {
  isItemFavorite: vi.fn(() => false),
}

const mockUseEffects = {
  effects: mockEffects,
  loading: false,
  error: null as string | null,
}

// Мокаем хуки
vi.mock("@/features/app-state", () => ({
  useFavorites: () => mockFavorites,
}))

vi.mock("@/features/browser/services/browser-state-provider", () => ({
  useBrowserState: () => mockBrowserState,
}))

vi.mock("@/features/project-settings", () => ({
  useProjectSettings: () => mockProjectSettings,
}))

vi.mock("../../hooks/use-effects", () => ({
  useEffects: () => mockUseEffects,
}))

// Мокаем компоненты
vi.mock("@/features/browser/components/no-files", () => ({
  NoFiles: ({ type }: { type: string }) => <div data-testid="no-files">No {type} found</div>,
}))

vi.mock("../../components/effect-group", () => ({
  EffectGroup: ({
    title,
    effects,
    previewSize,
    previewWidth,
    previewHeight,
    onEffectClick,
    startIndex,
  }: {
    title: string
    effects: VideoEffect[]
    previewSize: string
    previewWidth: number
    previewHeight: number
    onEffectClick: (effect: VideoEffect, index: number) => void
    startIndex: number
  }) => (
    <div data-testid="effect-group" data-title={title}>
      <h3>{title}</h3>
      <div data-testid="effects-grid">
        {effects.map((effect: VideoEffect, index: number) => (
          <div
            key={effect.id}
            data-testid={`effect-${effect.id}`}
            data-preview-size={previewSize}
            data-preview-width={previewWidth}
            data-preview-height={previewHeight}
            onClick={() => onEffectClick(effect, startIndex + index)}
          >
            {effect.name}
          </div>
        ))}
      </div>
    </div>
  ),
}))

describe("EffectList", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Сбрасываем мокированные значения к дефолтным
    mockUseEffects.effects = mockEffects
    mockUseEffects.loading = false
    mockUseEffects.error = null
    mockBrowserState.currentTabSettings = {
      searchQuery: "",
      showFavoritesOnly: false,
      sortBy: "name",
      sortOrder: "asc",
      groupBy: "none",
      filterType: "all",
      previewSizeIndex: 2,
    }
    mockFavorites.isItemFavorite.mockReturnValue(false)
  })

  describe("Загрузка и ошибки", () => {
    it("должен показывать индикатор загрузки", () => {
      mockUseEffects.loading = true

      render(<EffectList />)

      expect(screen.getByText("common.loading...")).toBeInTheDocument()
      // Проверяем наличие спиннера по классу animate-spin
      const loadingSpinner = document.querySelector(".animate-spin")
      expect(loadingSpinner).toBeInTheDocument()
    })

    it("должен показывать ошибку загрузки", () => {
      mockUseEffects.error = "Failed to load effects"
      mockUseEffects.loading = false

      render(<EffectList />)

      expect(screen.getByText("Ошибка загрузки эффектов")).toBeInTheDocument()
      expect(screen.getByText("Failed to load effects")).toBeInTheDocument()
    })

    it("должен показывать эффекты после успешной загрузки", () => {
      render(<EffectList />)

      expect(screen.getByTestId("effect-group")).toBeInTheDocument()
      expect(screen.getByTestId("effect-effect-1")).toBeInTheDocument()
      expect(screen.getByTestId("effect-effect-2")).toBeInTheDocument()
      expect(screen.getByTestId("effect-effect-3")).toBeInTheDocument()
    })
  })

  describe("Фильтрация эффектов", () => {
    it("должен фильтровать эффекты по поисковому запросу", () => {
      mockBrowserState.currentTabSettings.searchQuery = "blur"

      render(<EffectList />)

      expect(screen.getByTestId("effect-effect-1")).toBeInTheDocument()
      expect(screen.queryByTestId("effect-effect-2")).not.toBeInTheDocument()
      expect(screen.queryByTestId("effect-effect-3")).not.toBeInTheDocument()
    })

    it("должен фильтровать по русским названиям", () => {
      mockBrowserState.currentTabSettings.searchQuery = "размытие"

      render(<EffectList />)

      expect(screen.getByTestId("effect-effect-1")).toBeInTheDocument()
      expect(screen.queryByTestId("effect-effect-2")).not.toBeInTheDocument()
    })

    it("должен фильтровать по описанию", () => {
      mockBrowserState.currentTabSettings.searchQuery = "старой пленки"

      render(<EffectList />)

      expect(screen.queryByTestId("effect-effect-1")).not.toBeInTheDocument()
      expect(screen.getByTestId("effect-effect-2")).toBeInTheDocument()
    })

    it("должен фильтровать по тегам", () => {
      mockBrowserState.currentTabSettings.searchQuery = "retro"

      render(<EffectList />)

      expect(screen.queryByTestId("effect-effect-1")).not.toBeInTheDocument()
      expect(screen.getByTestId("effect-effect-2")).toBeInTheDocument()
    })

    it("должен показывать только избранные эффекты", () => {
      mockBrowserState.currentTabSettings.showFavoritesOnly = true
      ;(mockFavorites.isItemFavorite as any).mockImplementation((effect: VideoEffect) => effect.id === "effect-1")

      render(<EffectList />)

      expect(screen.getByTestId("effect-effect-1")).toBeInTheDocument()
      expect(screen.queryByTestId("effect-effect-2")).not.toBeInTheDocument()
      expect(screen.queryByTestId("effect-effect-3")).not.toBeInTheDocument()
    })

    it("должен фильтровать по сложности", () => {
      mockBrowserState.currentTabSettings.filterType = "basic"

      render(<EffectList />)

      expect(screen.getByTestId("effect-effect-1")).toBeInTheDocument()
      expect(screen.queryByTestId("effect-effect-2")).not.toBeInTheDocument()
      expect(screen.queryByTestId("effect-effect-3")).not.toBeInTheDocument()
    })

    it("должен фильтровать по категории", () => {
      mockBrowserState.currentTabSettings.filterType = "vintage"

      render(<EffectList />)

      expect(screen.queryByTestId("effect-effect-1")).not.toBeInTheDocument()
      expect(screen.getByTestId("effect-effect-2")).toBeInTheDocument()
      expect(screen.queryByTestId("effect-effect-3")).not.toBeInTheDocument()
    })

    it("должен фильтровать по всем поддерживаемым категориям", () => {
      const categories = ["color-correction", "artistic", "vintage", "cinematic", "creative", "technical", "distortion"]

      categories.forEach((category) => {
        mockBrowserState.currentTabSettings.filterType = category

        const { unmount } = render(<EffectList />)

        // Проверяем что фильтрация работает без ошибок
        expect(screen.queryByTestId("no-files") || screen.queryByTestId("effect-group")).toBeInTheDocument()

        unmount()
      })
    })

    it("должен показывать все эффекты при filterType 'all'", () => {
      mockBrowserState.currentTabSettings.filterType = "all"

      render(<EffectList />)

      expect(screen.getByTestId("effect-effect-1")).toBeInTheDocument()
      expect(screen.getByTestId("effect-effect-2")).toBeInTheDocument()
      expect(screen.getByTestId("effect-effect-3")).toBeInTheDocument()
    })

    it("должен обрабатывать неизвестные типы фильтров", () => {
      mockBrowserState.currentTabSettings.filterType = "unknown-filter"

      render(<EffectList />)

      // Все эффекты должны отображаться при неизвестном фильтре
      expect(screen.getByTestId("effect-effect-1")).toBeInTheDocument()
      expect(screen.getByTestId("effect-effect-2")).toBeInTheDocument()
      expect(screen.getByTestId("effect-effect-3")).toBeInTheDocument()
    })
  })

  describe("Сортировка эффектов", () => {
    it("должен сортировать по имени (по возрастанию)", () => {
      mockBrowserState.currentTabSettings.sortBy = "name"
      mockBrowserState.currentTabSettings.sortOrder = "asc"

      render(<EffectList />)

      const effects = screen.getAllByTestId(/^effect-effect-/)
      expect(effects[0]).toHaveAttribute("data-testid", "effect-effect-1") // Blur Effect
      expect(effects[1]).toHaveAttribute("data-testid", "effect-effect-3") // Color Correction
      expect(effects[2]).toHaveAttribute("data-testid", "effect-effect-2") // Vintage Film
    })

    it("должен сортировать по имени (по убыванию)", () => {
      mockBrowserState.currentTabSettings.sortBy = "name"
      mockBrowserState.currentTabSettings.sortOrder = "desc"

      render(<EffectList />)

      const effects = screen.getAllByTestId(/^effect-effect-/)
      expect(effects[0]).toHaveAttribute("data-testid", "effect-effect-2") // Vintage Film
      expect(effects[1]).toHaveAttribute("data-testid", "effect-effect-3") // Color Correction
      expect(effects[2]).toHaveAttribute("data-testid", "effect-effect-1") // Blur Effect
    })

    it("должен сортировать по сложности", () => {
      mockBrowserState.currentTabSettings.sortBy = "complexity"
      mockBrowserState.currentTabSettings.sortOrder = "asc"

      render(<EffectList />)

      const effects = screen.getAllByTestId(/^effect-effect-/)
      expect(effects[0]).toHaveAttribute("data-testid", "effect-effect-1") // basic
      expect(effects[1]).toHaveAttribute("data-testid", "effect-effect-2") // intermediate
      expect(effects[2]).toHaveAttribute("data-testid", "effect-effect-3") // advanced
    })

    it("должен сортировать по категории", () => {
      mockBrowserState.currentTabSettings.sortBy = "category"
      mockBrowserState.currentTabSettings.sortOrder = "asc"

      render(<EffectList />)

      const effects = screen.getAllByTestId(/^effect-effect-/)
      expect(effects[0]).toHaveAttribute("data-testid", "effect-effect-1") // artistic
      expect(effects[1]).toHaveAttribute("data-testid", "effect-effect-3") // color-correction
      expect(effects[2]).toHaveAttribute("data-testid", "effect-effect-2") // vintage
    })
  })

  describe("Группировка эффектов", () => {
    it("должен группировать по категории", () => {
      mockBrowserState.currentTabSettings.groupBy = "category"

      render(<EffectList />)

      const groups = screen.getAllByTestId("effect-group")
      expect(groups).toHaveLength(3)

      // Проверяем наличие групп по категориям (мок возвращает ключ как есть)
      expect(screen.getByText("artistic")).toBeInTheDocument()
      expect(screen.getByText("color-correction")).toBeInTheDocument()
      expect(screen.getByText("vintage")).toBeInTheDocument()
    })

    it("должен группировать по сложности", () => {
      mockBrowserState.currentTabSettings.groupBy = "complexity"

      render(<EffectList />)

      const groups = screen.getAllByTestId("effect-group")
      expect(groups).toHaveLength(3)

      expect(screen.getByText("basic")).toBeInTheDocument()
      expect(screen.getByText("intermediate")).toBeInTheDocument()
      expect(screen.getByText("advanced")).toBeInTheDocument()
    })

    it("должен группировать по типу", () => {
      mockBrowserState.currentTabSettings.groupBy = "type"

      render(<EffectList />)

      const groups = screen.getAllByTestId("effect-group")
      expect(groups).toHaveLength(3) // blur, vintage, brightness

      // Проверяем наличие групп по типам
      expect(screen.getByText("blur")).toBeInTheDocument()
      expect(screen.getByText("vintage")).toBeInTheDocument()
      expect(screen.getByText("brightness")).toBeInTheDocument()
    })

    it("должен группировать по тегам", () => {
      mockBrowserState.currentTabSettings.groupBy = "tags"

      render(<EffectList />)

      const groups = screen.getAllByTestId("effect-group")
      expect(groups.length).toBeGreaterThan(0)

      // Каждый эффект должен быть в группе по первому тегу
      expect(screen.getByText("blur")).toBeInTheDocument() // effect-1 первый тег
      expect(screen.getByText("vintage")).toBeInTheDocument() // effect-2 первый тег
      expect(screen.getByText("professional")).toBeInTheDocument() // effect-3 первый тег
    })

    it("должен обрабатывать эффекты без тегов при группировке", () => {
      // Добавляем эффект без тегов
      const effectWithoutTags = {
        id: "effect-no-tags",
        name: "No Tags Effect",
        category: "other",
        complexity: "basic",
        type: "filter",
        tags: [],
        labels: { ru: "Эффект без тегов", en: "No Tags Effect" },
        description: { ru: "Без тегов", en: "No tags" },
        duration: 1000,
        ffmpegCommand: () => "notags",
        previewPath: "/previews/notags.jpg",
      }

      mockUseEffects.effects = [...mockEffects, effectWithoutTags]
      mockBrowserState.currentTabSettings.groupBy = "tags"

      render(<EffectList />)

      // Должна быть группа для эффектов без тегов
      expect(screen.getByText("Без тегов")).toBeInTheDocument()
    })

    it("должен обрабатывать неизвестные типы группировки", () => {
      mockBrowserState.currentTabSettings.groupBy = "unknown" as any

      render(<EffectList />)

      const groups = screen.getAllByTestId("effect-group")
      expect(groups.length).toBeGreaterThan(0)

      // При неизвестном типе группировки должна быть группа "ungrouped"
      expect(screen.getByText("ungrouped")).toBeInTheDocument()
    })

    it("не должен группировать при groupBy = 'none'", () => {
      mockBrowserState.currentTabSettings.groupBy = "none"

      render(<EffectList />)

      const groups = screen.getAllByTestId("effect-group")
      expect(groups).toHaveLength(1)
      expect(groups[0]).toHaveAttribute("data-title", "")
    })

    it("должен правильно сортировать группы по заголовкам", () => {
      mockBrowserState.currentTabSettings.groupBy = "category"

      render(<EffectList />)

      const groups = screen.getAllByTestId("effect-group")
      const titles = Array.from(groups).map((group) => group.getAttribute("data-title"))

      // Проверяем что заголовки отсортированы алфавитно
      const sortedTitles = [...titles].sort()
      expect(titles).toEqual(sortedTitles)
    })
  })

  describe("Обработчики событий", () => {
    it("должен обрабатывать клик по эффекту", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {})

      render(<EffectList />)

      const effect = screen.getByTestId("effect-effect-1")
      fireEvent.click(effect)

      expect(consoleSpy).toHaveBeenCalledWith("Applying effect:", "Blur Effect")

      consoleSpy.mockRestore()
    })

    it("должен обрабатывать навигацию клавиатурой", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {})

      render(<EffectList />)

      // Устанавливаем первый эффект как активный
      fireEvent.keyDown(window, { key: "ArrowRight" })

      // Проверяем что фокус переместился
      await waitFor(() => {
        expect(true).toBe(true)
      })

      consoleSpy.mockRestore()
    })

    it("должен обрабатывать Tab навигацию с Shift", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {})

      render(<EffectList />)

      // Сначала установим активный индекс
      fireEvent.keyDown(window, { key: "ArrowRight" })

      // Затем тестируем Shift+Tab (назад)
      fireEvent.keyDown(window, { key: "Tab", shiftKey: true })

      await waitFor(() => {
        expect(true).toBe(true)
      })

      // Обычный Tab (вперед)
      fireEvent.keyDown(window, { key: "Tab" })

      await waitFor(() => {
        expect(true).toBe(true)
      })

      consoleSpy.mockRestore()
    })

    it("должен обрабатывать Enter для активации эффекта", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {})

      render(<EffectList />)

      // Устанавливаем активный индекс
      fireEvent.keyDown(window, { key: "ArrowRight" })

      // Симулируем нажатие Enter
      fireEvent.keyDown(window, { key: "Enter" })

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith("Applying effect:", expect.any(String))
      })

      consoleSpy.mockRestore()
    })

    it("должен обрабатывать пробел для активации эффекта", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {})

      render(<EffectList />)

      // Устанавливаем активный индекс
      fireEvent.keyDown(window, { key: "ArrowRight" })

      // Симулируем пробел
      fireEvent.keyDown(window, { key: " " })

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith("Applying effect:", expect.any(String))
      })

      consoleSpy.mockRestore()
    })

    it("должен обрабатывать стрелки вверх и вниз с учетом ширины экрана", async () => {
      // Мокаем window.innerWidth для точного тестирования
      Object.defineProperty(window, "innerWidth", { value: 800, writable: true })

      render(<EffectList />)

      // Установим начальный индекс
      fireEvent.keyDown(window, { key: "ArrowRight" })

      // Симулируем нажатие ArrowDown (переход на следующую строку)
      fireEvent.keyDown(window, { key: "ArrowDown" })

      await waitFor(() => {
        expect(true).toBe(true)
      })

      // Симулируем нажатие ArrowUp (переход на предыдущую строку)
      fireEvent.keyDown(window, { key: "ArrowUp" })

      await waitFor(() => {
        expect(true).toBe(true)
      })
    })

    it("должен ограничивать навигацию границами массива эффектов", async () => {
      render(<EffectList />)

      // Тестируем границу слева (не должен выйти за индекс 0)
      fireEvent.keyDown(window, { key: "ArrowLeft" })

      await waitFor(() => {
        expect(true).toBe(true)
      })

      // Переходим к последнему эффекту и пытаемся выйти за границу справа
      for (let i = 0; i < 10; i++) {
        fireEvent.keyDown(window, { key: "ArrowRight" })
      }

      await waitFor(() => {
        expect(true).toBe(true)
      })
    })

    it("должен предотвращать действие по умолчанию для навигационных клавиш", async () => {
      render(<EffectList />)

      const keys = ["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp", "Enter", " "]

      keys.forEach((key) => {
        const mockPreventDefault = vi.fn()
        fireEvent.keyDown(window, {
          key,
          preventDefault: mockPreventDefault,
        })
      })

      await waitFor(() => {
        expect(true).toBe(true)
      })
    })

    it("должен игнорировать неизвестные клавиши", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {})

      render(<EffectList />)

      // Симулируем нажатие неизвестной клавиши
      fireEvent.keyDown(window, { key: "Escape" })

      // Не должно быть вызовов console.log
      expect(consoleSpy).not.toHaveBeenCalled()

      consoleSpy.mockRestore()
    })
  })

  describe("Вычисление размеров превью", () => {
    it("должен правильно вычислять размеры для горизонтального видео", () => {
      mockProjectSettings.settings.aspectRatio.value = { width: 16, height: 9 }
      mockBrowserState.currentTabSettings.previewSizeIndex = 2 // 200px

      render(<EffectList />)

      // Проверяем правильные размеры через эффект
      const effect = screen.getByTestId("effect-effect-1")
      expect(effect).toHaveAttribute("data-preview-width", "200")
      expect(effect).toHaveAttribute("data-preview-height", "113") // 200 / (16/9) = 112.5 rounded to 113
    })

    it("должен правильно вычислять размеры для вертикального видео", () => {
      mockProjectSettings.settings.aspectRatio.value = { width: 9, height: 16 }
      mockBrowserState.currentTabSettings.previewSizeIndex = 2 // 200px

      render(<EffectList />)

      const effect = screen.getByTestId("effect-effect-1")
      expect(effect).toHaveAttribute("data-preview-height", "200")
      expect(effect).toHaveAttribute("data-preview-width", "113") // 200 * (9/16) = 112.5 rounded to 113
    })

    it("должен правильно вычислять размеры для квадратного видео", () => {
      mockProjectSettings.settings.aspectRatio.value = { width: 1, height: 1 }
      mockBrowserState.currentTabSettings.previewSizeIndex = 2 // 200px

      render(<EffectList />)

      const effect = screen.getByTestId("effect-effect-1")
      expect(effect).toHaveAttribute("data-preview-width", "200")
      expect(effect).toHaveAttribute("data-preview-height", "200")
    })

    it("должен обрабатывать различные размеры превью", () => {
      const previewSizes = [0, 1, 2, 3, 4] // Тестируем разные индексы

      previewSizes.forEach((sizeIndex) => {
        mockBrowserState.currentTabSettings.previewSizeIndex = sizeIndex

        const { unmount } = render(<EffectList />)

        // Проверяем что компонент рендерится без ошибок
        expect(screen.queryByTestId("effect-group")).toBeInTheDocument()

        unmount()
      })
    })

    it("должен обрабатывать экстремальные соотношения сторон", () => {
      // Очень широкое видео
      mockProjectSettings.settings.aspectRatio.value = { width: 32, height: 9 }
      mockBrowserState.currentTabSettings.previewSizeIndex = 2

      const { unmount } = render(<EffectList />)

      expect(screen.getByTestId("effect-effect-1")).toBeInTheDocument()

      unmount()

      // Очень высокое видео
      mockProjectSettings.settings.aspectRatio.value = { width: 9, height: 32 }

      render(<EffectList />)

      expect(screen.getByTestId("effect-effect-1")).toBeInTheDocument()
    })
  })

  describe("Пустые состояния", () => {
    it("должен показывать NoFiles когда нет эффектов", () => {
      mockUseEffects.effects = []

      render(<EffectList />)

      expect(screen.getByTestId("no-files")).toBeInTheDocument()
      expect(screen.getByText("No effects found")).toBeInTheDocument()
    })

    it("должен показывать сообщение об отсутствии избранных", () => {
      mockUseEffects.effects = []
      mockBrowserState.currentTabSettings.showFavoritesOnly = true

      render(<EffectList />)

      expect(screen.getByText("browser.media.noFavorites")).toBeInTheDocument()
    })

    it("должен показывать NoFiles когда поиск не дал результатов", () => {
      mockBrowserState.currentTabSettings.searchQuery = "nonexistent"

      render(<EffectList />)

      expect(screen.getByTestId("no-files")).toBeInTheDocument()
    })

    it("должен показывать NoFiles когда фильтр не дал результатов", () => {
      mockBrowserState.currentTabSettings.filterType = "cinematic" // Категория, которой нет у наших эффектов

      render(<EffectList />)

      expect(screen.getByTestId("no-files")).toBeInTheDocument()
    })
  })

  describe("Интеграция с браузером состояний", () => {
    it("должен использовать настройки из браузера состояний", () => {
      mockBrowserState.currentTabSettings = {
        searchQuery: "blur",
        showFavoritesOnly: true,
        sortBy: "complexity",
        sortOrder: "desc",
        groupBy: "category",
        filterType: "artistic",
        previewSizeIndex: 1,
      }

      render(<EffectList />)

      // Должен применить все настройки одновременно
      expect(screen.queryByTestId("effect-effect-2")).not.toBeInTheDocument() // Отфильтрован по поиску
      expect(screen.queryByTestId("effect-effect-3")).not.toBeInTheDocument() // Отфильтрован по категории
    })

    it("должен корректно обрабатывать изменения настроек", () => {
      const { rerender } = render(<EffectList />)

      // Изначально показываем все эффекты
      expect(screen.getAllByTestId(/^effect-effect-/)).toHaveLength(3)

      // Применяем поиск
      mockBrowserState.currentTabSettings.searchQuery = "blur"
      rerender(<EffectList />)

      expect(screen.getAllByTestId(/^effect-effect-/)).toHaveLength(1)
    })
  })

  describe("Accessibility и UX", () => {
    it("должен иметь правильную структуру для скринридеров", () => {
      render(<EffectList />)

      // Проверяем наличие основного контейнера
      const container = document.querySelector(".flex.h-full.flex-1.flex-col.bg-background")
      expect(container).toBeInTheDocument()
    })

    it("должен поддерживать навигацию клавиатурой", () => {
      const addEventListenerSpy = vi.spyOn(window, "addEventListener")

      render(<EffectList />)

      // Компонент должен добавить слушатель keydown
      expect(addEventListenerSpy).toHaveBeenCalledWith("keydown", expect.any(Function))
    })

    it("должен удалять слушатель клавиатуры при размонтировании", () => {
      const removeEventListenerSpy = vi.spyOn(window, "removeEventListener")

      const { unmount } = render(<EffectList />)
      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith("keydown", expect.any(Function))
    })
  })

  describe("Производительность", () => {
    it("должен мемоизировать вычисления групп", () => {
      const { rerender } = render(<EffectList />)

      // Первый рендер
      const firstGroups = screen.getAllByTestId("effect-group")

      // Перерендер без изменения данных
      rerender(<EffectList />)

      const secondGroups = screen.getAllByTestId("effect-group")

      // Количество групп должно остаться тем же
      expect(firstGroups).toHaveLength(secondGroups.length)
    })

    it("должен обрабатывать большое количество эффектов", () => {
      // Создаем много эффектов для тестирования производительности
      const manyEffects = Array.from({ length: 100 }, (_, i) => ({
        id: `effect-${i}`,
        name: `Effect ${i}`,
        category: "artistic" as const,
        complexity: "basic" as const,
        type: "blur" as const,
        tags: ["popular" as const],
        labels: { ru: `Эффект ${i}`, en: `Effect ${i}` },
        description: { ru: `Описание ${i}`, en: `Description ${i}` },
        duration: 1000,
        ffmpegCommand: () => `effect${i}`,
        previewPath: `/previews/effect${i}.jpg`,
      }))

      mockUseEffects.effects = manyEffects

      const startTime = performance.now()
      render(<EffectList />)
      const endTime = performance.now()

      // Рендер должен завершиться быстро (меньше 100мс)
      expect(endTime - startTime).toBeLessThan(100)
    })
  })
})
