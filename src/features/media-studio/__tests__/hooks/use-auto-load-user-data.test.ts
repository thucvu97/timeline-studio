import { renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  getMediaExtensions,
  getMusicExtensions,
  processBatch,
  useAutoLoadUserData,
  validateEffect,
  validateFilter,
  validateStyleTemplate,
  validateSubtitleStyle,
  validateTemplate,
  validateTransition,
} from "../../hooks"

// Мокаем зависимости
vi.mock("@/features/app-state/hooks", () => ({
  useMediaFiles: () => ({
    updateMediaFiles: vi.fn(),
  }),
  useMusicFiles: () => ({
    updateMusicFiles: vi.fn(),
  }),
}))

vi.mock("@/features/resources", () => ({
  useResources: () => ({
    addEffect: vi.fn(),
    addFilter: vi.fn(),
    addTransition: vi.fn(),
    addSubtitle: vi.fn(),
    addStyleTemplate: vi.fn(),
  }),
}))

vi.mock("@/features/app-state/services", () => ({
  appDirectoriesService: {
    createAppDirectories: vi.fn().mockResolvedValue({
      media_dir: "/app/media",
      projects_dir: "/app/projects",
    }),
    getAppDirectories: vi.fn().mockResolvedValue({
      media_dir: "/app/media",
      projects_dir: "/app/projects",
    }),
    getMediaSubdirectory: vi.fn((type: string) => `/app/media/${type}`),
  },
}))

// Мокаем Tauri FS API
const mockExists = vi.fn()
const mockReadDir = vi.fn()

vi.mock("@tauri-apps/plugin-fs", () => ({
  exists: mockExists,
  readDir: mockReadDir,
}))

// Мокаем fetch для загрузки JSON файлов
global.fetch = vi.fn()

describe("useAutoLoadUserData", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // По умолчанию директории не существуют
    mockExists.mockResolvedValue(false)
    mockReadDir.mockResolvedValue([])

    // Сбрасываем fetch mock
    vi.mocked(fetch).mockReset()
  })

  it("должен инициализироваться с начальным состоянием", () => {
    // Мокаем window.__TAURI_INTERNALS__ для эмуляции Tauri окружения
    ;(window as any).__TAURI_INTERNALS__ = {
      invoke: vi.fn(),
    }

    const { result } = renderHook(() => useAutoLoadUserData())

    expect(result.current.isLoading).toBe(true) // Начинает загрузку сразу
    expect(result.current.error).toBe(null)
    expect(result.current.loadedData).toEqual({
      media: [],
      music: [],
      effects: [],
      transitions: [],
      filters: [],
      subtitles: [],
      templates: [],
      styleTemplates: [],
    })
  })

  it("должен работать в веб-браузере без Tauri", async () => {
    // Удаляем Tauri из window
    ;(window as any).__TAURI_INTERNALS__ = undefined

    const { result } = renderHook(() => useAutoLoadUserData())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // В веб-браузере не должно быть загружено файлов
    expect(result.current.loadedData.media).toHaveLength(0)
    expect(result.current.loadedData.music).toHaveLength(0)
    expect(result.current.error).toBe(null)
  })

  it("должен обрабатывать валидацию эффектов", () => {
    // Валидный эффект
    const validEffect = {
      id: "blur",
      name: "Blur Effect",
      type: "blur",
      duration: 1000,
      category: "artistic",
      complexity: "basic",
      ffmpegCommand: "blur command",
    }

    expect(validateEffect(validEffect)).toEqual(validEffect)

    // Невалидный эффект (отсутствует name)
    const invalidEffect = {
      id: "blur",
      type: "blur",
    }

    expect(validateEffect(invalidEffect)).toBeNull()

    // Невалидный эффект (неправильный тип)
    expect(validateEffect(null)).toBeNull()
    expect(validateEffect("string")).toBeNull()
  })

  it("должен обрабатывать валидацию фильтров", () => {
    // Валидный фильтр
    const validFilter = {
      id: "vintage",
      name: "Vintage Filter",
      category: "artistic",
      complexity: "basic",
      params: { brightness: 0.8 },
    }

    expect(validateFilter(validFilter)).toEqual(validFilter)

    // Невалидный фильтр (отсутствует params)
    const invalidFilter = {
      id: "vintage",
      name: "Vintage Filter",
    }

    expect(validateFilter(invalidFilter)).toBeNull()
  })

  it("должен обрабатывать валидацию переходов", () => {
    // Валидный переход
    const validTransition = {
      id: "fade",
      type: "fade",
      name: "Fade",
      duration: { min: 500, max: 2000, default: 1000 },
      category: "basic",
      complexity: "basic",
      ffmpegCommand: "fade command",
    }

    expect(validateTransition(validTransition)).toEqual(validTransition)

    // Невалидный переход (неправильный duration)
    const invalidTransition = {
      id: "fade",
      type: "fade",
      name: "Fade",
      duration: 1000, // Должен быть объект
      category: "basic",
      complexity: "basic",
      ffmpegCommand: "fade command",
    }

    expect(validateTransition(invalidTransition)).toBeNull()
  })

  it("должен обрабатывать валидацию стилей субтитров", () => {
    // Валидный стиль
    const validStyle = {
      id: "modern",
      name: "Modern",
      category: "modern",
      complexity: "basic",
      style: { fontSize: "16px", color: "#FFFFFF" },
    }

    expect(validateSubtitleStyle(validStyle)).toEqual(validStyle)

    // Невалидный стиль (отсутствует style объект)
    const invalidStyle = {
      id: "modern",
      name: "Modern",
      category: "modern",
      complexity: "basic",
    }

    expect(validateSubtitleStyle(invalidStyle)).toBeNull()
  })

  it("должен обрабатывать валидацию стилистических шаблонов", () => {
    // Валидный шаблон
    const validTemplate = {
      id: "intro",
      name: { en: "Intro", ru: "Интро" },
      category: "intro",
      style: "modern",
      aspectRatio: "16:9",
      duration: 3,
      elements: [],
    }

    expect(validateStyleTemplate(validTemplate)).toEqual(validTemplate)

    // Невалидный шаблон (elements не массив)
    const invalidTemplate = {
      id: "intro",
      name: { en: "Intro", ru: "Интро" },
      category: "intro",
      style: "modern",
      aspectRatio: "16:9",
      duration: 3,
      elements: "not an array",
    }

    expect(validateStyleTemplate(invalidTemplate)).toBeNull()
  })

  it("должен определять расширения файлов", () => {
    const mediaExt = getMediaExtensions()
    expect(mediaExt).toContain(".mp4")
    expect(mediaExt).toContain(".jpg")
    expect(mediaExt).toContain(".png")

    const musicExt = getMusicExtensions()
    expect(musicExt).toContain(".mp3")
    expect(musicExt).toContain(".wav")
    expect(musicExt).toContain(".ogg")
  })

  it("должен обрабатывать пакетную загрузку", async () => {
    const files = ["file1", "file2", "file3", "file4", "file5"]
    const processor = vi.fn().mockResolvedValue("processed")

    const results = await processBatch(files, 2, processor)

    expect(processor).toHaveBeenCalledTimes(5)
    expect(results).toHaveLength(5)
    expect(results).toEqual(["processed", "processed", "processed", "processed", "processed"])
  })

  it("должен экспортировать необходимые функции", () => {
    // Проверяем, что все функции валидации экспортированы для тестирования
    expect(validateEffect).toBeDefined()
    expect(validateFilter).toBeDefined()
    expect(validateTransition).toBeDefined()
    expect(validateSubtitleStyle).toBeDefined()
    expect(validateStyleTemplate).toBeDefined()
    expect(getMediaExtensions).toBeDefined()
    expect(getMusicExtensions).toBeDefined()
    expect(processBatch).toBeDefined()
  })
})
