import { act, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { MediaFile } from "@/features/media/types/media"
import { useResources } from "@/features/resources"

import { AddMediaButton } from "../../../components/layout/add-media-button"

vi.mock("@/features/resources", () => ({
  useResources: vi.fn().mockReturnValue({
    addResource: vi.fn(),
    removeResource: vi.fn(),
    isAdded: vi.fn(),
    addMedia: vi.fn(),
    addMusic: vi.fn(),
    addSubtitle: vi.fn(),
    addEffect: vi.fn(),
    addFilter: vi.fn(),
    addTransition: vi.fn(),
    addTemplate: vi.fn(),
    removeMedia: vi.fn(),
    removeMusic: vi.fn(),
    removeSubtitle: vi.fn(),
    removeEffect: vi.fn(),
    removeFilter: vi.fn(),
    removeTransition: vi.fn(),
    removeTemplate: vi.fn(),
    clear: vi.fn(),
    getResource: vi.fn(),
    getResources: vi.fn(),
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
    replaceAll: vi.fn(),
    resourceIds: [],
    mediaResources: [],
    musicResources: [],
    subtitleResources: [],
    effectResources: [],
    filterResources: [],
    transitionResources: [],
    templateResources: [],
  }),
}))

// Мокаем react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "browser.media.add": "Add to timeline",
        "browser.media.added": "Added to timeline",
        "browser.media.remove": "Remove from timeline",
      }
      return translations[key] || key
    },
  }),
}))

// Мокаем Lucide иконки
vi.mock("lucide-react", () => ({
  Plus: ({ className, strokeWidth }: any) => (
    <div data-testid="plus-icon" className={className} data-stroke-width={strokeWidth}>
      Plus Icon
    </div>
  ),
  Check: ({ className, strokeWidth }: any) => (
    <div data-testid="check-icon" className={className} data-stroke-width={strokeWidth}>
      Check Icon
    </div>
  ),
  X: ({ className, strokeWidth }: any) => (
    <div data-testid="x-icon" className={className} data-stroke-width={strokeWidth}>
      X Icon
    </div>
  ),
}))

describe("AddMediaButton", () => {
  // Создаем тестовый медиа ресурс
  const testMediaFile: MediaFile = {
    id: "test-file-id",
    name: "test-file.mp4",
    path: "/path/to/test-file.mp4",
    isVideo: true,
    isAudio: false,
    isImage: false,
    size: 1024,
    duration: 60,
  }

  const testResource = {
    id: "test-resource-id",
    type: "media" as const,
    name: "test-file.mp4",
    resourceId: testMediaFile.id,
    addedAt: Date.now(),
    file: testMediaFile,
  }

  // Мокаем функции обратного вызова
  const onAddMedia = vi.fn()
  const onRemoveMedia = vi.fn()

  // Очищаем моки перед каждым тестом
  beforeEach(() => {
    vi.clearAllMocks()
    // Мокаем setTimeout и clearTimeout
    vi.useFakeTimers()
  })

  // Восстанавливаем оригинальные функции после тестов
  afterEach(() => {
    vi.useRealTimers()
  })

  it("should render add button when isAdded is false", () => {
    // Рендерим компонент
    render(<AddMediaButton resource={testResource} type="media" size={150} />)

    // Проверяем, что отображается иконка Plus
    expect(screen.getByTestId("plus-icon")).toBeInTheDocument()

    // Проверяем, что кнопка имеет правильный title
    expect(screen.getByTitle("Add to timeline")).toBeInTheDocument()

    // Проверяем, что кнопка имеет класс invisible (скрыта по умолчанию)
    const button = screen.getByTitle("Add to timeline")
    expect(button.className).toContain("invisible")
    expect(button.className).toContain("group-hover:visible")
  })

  it("should render check icon when isAdded is true", () => {
    // Рендерим компонент
    const { addResource, removeResource, isAdded } = vi.mocked(useResources())
    isAdded.mockReturnValue(true)

    render(<AddMediaButton resource={testResource} type="media" size={150} />)

    // Проверяем, что отображается иконка Check
    expect(screen.getByTestId("check-icon")).toBeInTheDocument()

    // Проверяем, что кнопка имеет правильный title
    expect(screen.getByTitle("Added to timeline")).toBeInTheDocument()

    // Проверяем, что кнопка имеет класс visible
    const button = screen.getByTitle("Added to timeline")
    expect(button.className).toContain("visible")
  })

  it.skip("should call addResource when clicked and not added", () => {
    const { isAdded, addResource } = vi.mocked(useResources())
    isAdded.mockReturnValue(false)

    // Рендерим компонент
    render(<AddMediaButton resource={testResource} type="media" size={150} />)

    // Кликаем на кнопку
    act(() => {
      fireEvent.click(screen.getByTitle("Add to timeline"))
    })

    // Проверяем, что addResource был вызван с правильными аргументами
    expect(addResource).toHaveBeenCalledTimes(1)
    expect(addResource).toHaveBeenCalledWith(testResource.id, "media")
  })

  it("should show remove icon on hover when isAdded is true and not recently added", () => {
    const { isAdded } = vi.mocked(useResources())
    isAdded.mockReturnValue(true)

    // Рендерим компонент
    render(<AddMediaButton resource={testResource} type="media" size={150} />)

    // Проверяем, что изначально отображается иконка Check
    expect(screen.getByTestId("check-icon")).toBeInTheDocument()

    // Продвигаем таймеры вперед, чтобы сбросить флаг isRecentlyAdded
    act(() => {
      vi.advanceTimersByTime(2000)
    })

    // Получаем кнопку
    const button = screen.getByTitle("Added to timeline")

    // Симулируем наведение на кнопку
    act(() => {
      fireEvent.mouseEnter(button)
    })

    // Проверяем, что title изменился
    expect(screen.getByTitle("Remove from timeline")).toBeInTheDocument()

    // Проверяем, что отображается иконка X
    expect(screen.getByTestId("x-icon")).toBeInTheDocument()
  })

  it.skip("should call removeResource when clicked on remove icon", () => {
    const { isAdded, removeResource } = vi.mocked(useResources())
    isAdded.mockReturnValue(true)

    // Рендерим компонент
    render(<AddMediaButton resource={testResource} type="media" size={150} />)

    // Продвигаем таймеры вперед, чтобы сбросить флаг isRecentlyAdded
    act(() => {
      vi.advanceTimersByTime(2000)
    })

    // Получаем кнопку
    const button = screen.getByTitle("Added to timeline")

    // Симулируем наведение на кнопку и клик на кнопку удаления
    act(() => {
      fireEvent.mouseEnter(button)
      fireEvent.click(screen.getByTitle("Remove from timeline"))
    })

    // Проверяем, что removeResource был вызван с правильными аргументами
    expect(removeResource).toHaveBeenCalledTimes(1)
    expect(removeResource).toHaveBeenCalledWith(testResource.id, "media")
  })
})
