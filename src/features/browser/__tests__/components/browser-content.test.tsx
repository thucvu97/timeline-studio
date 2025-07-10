import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { factories } from '@/test/utils/factories'

import { BrowserContent } from '../../components/browser-content'

/**
 * Тесты для компонента BrowserContent
 * 
 * Покрытие:
 * - Рендеринг основных компонентов и классов
 * - Обработчики событий тулбара (поиск, сортировка, фильтрация, группировка)
 * - Зум функциональность (увеличение/уменьшение превью)
 * - Работа с адаптерами для всех типов вкладок
 * - Обработка выбора элементов для каждого типа контента
 * - Интеграция с фабриками данных
 */

// Создаем моки функций для browser state
const mockSetSearchQuery = vi.fn()
const mockToggleFavorites = vi.fn()
const mockSetSort = vi.fn()
const mockSetGroupBy = vi.fn()
const mockSetFilter = vi.fn()
const mockSetViewMode = vi.fn()
const mockSetPreviewSize = vi.fn()

// Мокаем все зависимости
const mockBrowserState = {
  activeTab: 'media',
  currentTabSettings: {
    searchQuery: '',
    showFavoritesOnly: false,
    viewMode: 'grid',
    sortBy: 'name',
    filterType: 'all',
    groupBy: null,
    sortOrder: 'asc',
    previewSizeIndex: 1
  },
  setSearchQuery: mockSetSearchQuery,
  toggleFavorites: mockToggleFavorites,
  setSort: mockSetSort,
  setGroupBy: mockSetGroupBy,
  setFilter: mockSetFilter,
  setViewMode: mockSetViewMode,
  setPreviewSize: mockSetPreviewSize
}

vi.mock('../../services/browser-state-provider', () => ({
  useBrowserState: () => mockBrowserState
}))

// Создаем моки для timeline actions
const mockAddMediaToTimeline = vi.fn()
const mockAddSingleMediaToTimeline = vi.fn()

vi.mock('@/features/timeline/hooks', () => ({
  useTimelineActions: () => ({
    addMediaToTimeline: mockAddMediaToTimeline,
    addSingleMediaToTimeline: mockAddSingleMediaToTimeline
  })
}))

// Создаем мок для MediaToolbar с возможностью вызова колбэков
vi.mock('../../components/media-toolbar', () => ({
  MediaToolbar: ({ 
    onSearch,
    onSort,
    onFilter,
    onChangeOrder,
    onChangeViewMode,
    onChangeGroupBy,
    onToggleFavorites,
    onZoomIn,
    onZoomOut
  }: any) => (
    <div data-testid="media-toolbar">
      <button data-testid="search-btn" onClick={() => onSearch?.('test query')}>Search</button>
      <button data-testid="sort-btn" onClick={() => onSort?.('size')}>Sort</button>
      <button data-testid="filter-btn" onClick={() => onFilter?.('video')}>Filter</button>
      <button data-testid="order-btn" onClick={() => onChangeOrder?.()}>Order</button>
      <button data-testid="view-btn" onClick={() => onChangeViewMode?.('list')}>View</button>
      <button data-testid="group-btn" onClick={() => onChangeGroupBy?.('type')}>Group</button>
      <button data-testid="fav-btn" onClick={() => onToggleFavorites?.()}>Favorites</button>
      <button data-testid="zoom-in-btn" onClick={() => onZoomIn?.()}>Zoom In</button>
      <button data-testid="zoom-out-btn" onClick={() => onZoomOut?.()}>Zoom Out</button>
    </div>
  )
}))

vi.mock('../../components/media-toolbar-configs', () => ({
  getToolbarConfigForContent: () => ({
    sortOptions: ['name', 'size', 'duration'],
    groupOptions: ['type', 'date'],
    filterOptions: ['all', 'video', 'audio'],
    viewModes: ['grid', 'list'],
    showGroupBy: true,
    showZoom: true
  })
}))

vi.mock('../../components/browser-loading-indicator', () => ({
  BrowserLoadingIndicator: () => <div data-testid="loading-indicator">Loading</div>
}))

// Мок для UniversalList с поддержкой onItemSelect
vi.mock('../../components/universal-list', () => ({
  UniversalList: ({ adapter, onItemSelect }: any) => (
    <div data-testid="universal-list">
      <div data-testid="adapter-type">{adapter?.type || 'no-adapter'}</div>
      <button 
        data-testid="item-select-btn" 
        onClick={() => onItemSelect?.({ id: '1', name: 'test-item.mp4', path: '/test/path' })}
      >
        Select Item
      </button>
    </div>
  )
}))

vi.mock('@/components/ui/tabs', () => ({
  TabsContent: ({ children, className }: any) => (
    <div className={className} data-testid="tabs-content">
      {children}
    </div>
  )
}))


// Создаем простые моки адаптеров
const mockMediaAdapter = { type: 'media', importHandlers: { importFile: vi.fn() } }
const mockMusicAdapter = { type: 'music' }
const mockEffectsAdapter = { type: 'effects' }
const mockFiltersAdapter = { type: 'filters' }
const mockTransitionsAdapter = { type: 'transitions' }
const mockSubtitlesAdapter = { type: 'subtitles' }
const mockTemplatesAdapter = { type: 'templates' }
const mockStyleTemplatesAdapter = { type: 'style-templates' }

// Переменная для управления тем, какой адаптер возвращается
const currentAdapters = {
  media: mockMediaAdapter,
  music: mockMusicAdapter,
  effects: mockEffectsAdapter,
  filters: mockFiltersAdapter,
  transitions: mockTransitionsAdapter,
  subtitles: mockSubtitlesAdapter,
  templates: mockTemplatesAdapter,
  styleTemplates: mockStyleTemplatesAdapter
}

// Мокаем адаптеры
vi.mock('../../adapters/use-media-adapter', () => ({
  useMediaAdapter: () => currentAdapters.media
}))
vi.mock('../../adapters/use-music-adapter', () => ({
  useMusicAdapter: () => currentAdapters.music
}))
vi.mock('../../adapters/use-effects-adapter', () => ({
  useEffectsAdapter: () => currentAdapters.effects
}))
vi.mock('../../adapters/use-filters-adapter', () => ({
  useFiltersAdapter: () => currentAdapters.filters
}))
vi.mock('../../adapters/use-transitions-adapter', () => ({
  useTransitionsAdapter: () => currentAdapters.transitions
}))
vi.mock('../../adapters/use-subtitles-adapter', () => ({
  useSubtitlesAdapter: () => currentAdapters.subtitles
}))
vi.mock('../../adapters/use-templates-adapter', () => ({
  useTemplatesAdapter: () => currentAdapters.templates
}))
vi.mock('../../adapters/use-style-templates-adapter', () => ({
  useStyleTemplatesAdapter: () => currentAdapters.styleTemplates
}))

vi.mock('@tauri-apps/plugin-shell', () => ({
  open: vi.fn()
}))

vi.mock('@/features/media/utils/preview-sizes', () => ({
  PREVIEW_SIZES: [
    { key: 'small', width: 160, height: 90 },
    { key: 'medium', width: 240, height: 135 },
    { key: 'large', width: 320, height: 180 }
  ]
}))

describe('BrowserContent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Сбрасываем состояние к дефолтному
    mockBrowserState.activeTab = 'media'
    mockBrowserState.currentTabSettings.sortOrder = 'asc'
    mockBrowserState.currentTabSettings.previewSizeIndex = 1
  })

  describe('Рендеринг', () => {
    it('должен рендерить основные компоненты', () => {
      render(<BrowserContent />)
      
      expect(screen.getByTestId('media-toolbar')).toBeInTheDocument()
      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument()
      expect(screen.getByTestId('tabs-content')).toBeInTheDocument()
      expect(screen.getByTestId('universal-list')).toBeInTheDocument()
    })

    it('должен применять правильные классы к контенту', () => {
      render(<BrowserContent />)
      
      const content = screen.getByTestId('tabs-content')
      expect(content).toHaveClass('bg-background m-0 flex-1 overflow-auto')
    })

    it('должен показывать сообщение об отсутствии адаптера для неизвестной вкладки', () => {
      // Устанавливаем неизвестную вкладку
      mockBrowserState.activeTab = 'unknown' as any
      currentAdapters.media = undefined as any

      render(<BrowserContent />)
      
      expect(screen.getByText('Адаптер для "unknown" не найден')).toBeInTheDocument()
    })
  })

  describe('Обработчики событий тулбара', () => {
    it('должен вызывать setSearchQuery при поиске', () => {
      render(<BrowserContent />)
      
      const searchBtn = screen.getByTestId('search-btn')
      fireEvent.click(searchBtn)
      
      expect(mockSetSearchQuery).toHaveBeenCalledWith('test query', 'media')
    })

    it('должен вызывать setSort при сортировке', () => {
      render(<BrowserContent />)
      
      const sortBtn = screen.getByTestId('sort-btn')
      fireEvent.click(sortBtn)
      
      expect(mockSetSort).toHaveBeenCalledWith('size', 'asc', 'media')
    })

    it('должен вызывать setFilter при фильтрации', () => {
      render(<BrowserContent />)
      
      const filterBtn = screen.getByTestId('filter-btn')
      fireEvent.click(filterBtn)
      
      expect(mockSetFilter).toHaveBeenCalledWith('video', 'media')
    })

    it('должен переключать порядок сортировки', () => {
      render(<BrowserContent />)
      
      const orderBtn = screen.getByTestId('order-btn')
      fireEvent.click(orderBtn)
      
      expect(mockSetSort).toHaveBeenCalledWith('name', 'desc', 'media')
    })

    it('должен переключать порядок сортировки с desc на asc', () => {
      mockBrowserState.currentTabSettings.sortOrder = 'desc'
      render(<BrowserContent />)
      
      const orderBtn = screen.getByTestId('order-btn')
      fireEvent.click(orderBtn)
      
      expect(mockSetSort).toHaveBeenCalledWith('name', 'asc', 'media')
    })

    it('должен вызывать setViewMode при изменении режима отображения', () => {
      render(<BrowserContent />)
      
      const viewBtn = screen.getByTestId('view-btn')
      fireEvent.click(viewBtn)
      
      expect(mockSetViewMode).toHaveBeenCalledWith('list', 'media')
    })

    it('должен вызывать setGroupBy при группировке', () => {
      render(<BrowserContent />)
      
      const groupBtn = screen.getByTestId('group-btn')
      fireEvent.click(groupBtn)
      
      expect(mockSetGroupBy).toHaveBeenCalledWith('type', 'media')
    })

    it('должен вызывать toggleFavorites при переключении избранного', () => {
      render(<BrowserContent />)
      
      const favBtn = screen.getByTestId('fav-btn')
      fireEvent.click(favBtn)
      
      expect(mockToggleFavorites).toHaveBeenCalledWith('media')
    })
  })

  describe('Зум функциональность', () => {
    it('должен увеличивать размер превью при zoom in', () => {
      render(<BrowserContent />)
      
      const zoomInBtn = screen.getByTestId('zoom-in-btn')
      fireEvent.click(zoomInBtn)
      
      expect(mockSetPreviewSize).toHaveBeenCalledWith(2, 'media')
    })

    it('должен уменьшать размер превью при zoom out', () => {
      render(<BrowserContent />)
      
      const zoomOutBtn = screen.getByTestId('zoom-out-btn')
      fireEvent.click(zoomOutBtn)
      
      expect(mockSetPreviewSize).toHaveBeenCalledWith(0, 'media')
    })

    it('не должен увеличивать размер превью больше максимального', () => {
      mockBrowserState.currentTabSettings.previewSizeIndex = 2 // максимальный индекс
      render(<BrowserContent />)
      
      const zoomInBtn = screen.getByTestId('zoom-in-btn')
      fireEvent.click(zoomInBtn)
      
      expect(mockSetPreviewSize).not.toHaveBeenCalled()
    })

    it('не должен уменьшать размер превью меньше минимального', () => {
      mockBrowserState.currentTabSettings.previewSizeIndex = 0 // минимальный индекс
      render(<BrowserContent />)
      
      const zoomOutBtn = screen.getByTestId('zoom-out-btn')
      fireEvent.click(zoomOutBtn)
      
      expect(mockSetPreviewSize).not.toHaveBeenCalled()
    })
  })

  describe('Работа с адаптерами для разных вкладок', () => {
    it('должен использовать media адаптер для media вкладки', () => {
      mockBrowserState.activeTab = 'media'
      currentAdapters.media = mockMediaAdapter // Убеждаемся что адаптер есть
      render(<BrowserContent />)
      
      const adapterType = screen.getByTestId('adapter-type')
      expect(adapterType.textContent).toBe('media')
    })

    it('должен использовать music адаптер для music вкладки', () => {
      mockBrowserState.activeTab = 'music'
      render(<BrowserContent />)
      
      const adapterType = screen.getByTestId('adapter-type')
      expect(adapterType.textContent).toBe('music')
    })

    it('должен использовать effects адаптер для effects вкладки', () => {
      mockBrowserState.activeTab = 'effects'
      render(<BrowserContent />)
      
      const adapterType = screen.getByTestId('adapter-type')
      expect(adapterType.textContent).toBe('effects')
    })

    it('должен использовать filters адаптер для filters вкладки', () => {
      mockBrowserState.activeTab = 'filters'
      render(<BrowserContent />)
      
      const adapterType = screen.getByTestId('adapter-type')
      expect(adapterType.textContent).toBe('filters')
    })

    it('должен использовать transitions адаптер для transitions вкладки', () => {
      mockBrowserState.activeTab = 'transitions'
      render(<BrowserContent />)
      
      const adapterType = screen.getByTestId('adapter-type')
      expect(adapterType.textContent).toBe('transitions')
    })

    it('должен использовать subtitles адаптер для subtitles вкладки', () => {
      mockBrowserState.activeTab = 'subtitles'
      render(<BrowserContent />)
      
      const adapterType = screen.getByTestId('adapter-type')
      expect(adapterType.textContent).toBe('subtitles')
    })

    it('должен использовать templates адаптер для templates вкладки', () => {
      mockBrowserState.activeTab = 'templates'
      render(<BrowserContent />)
      
      const adapterType = screen.getByTestId('adapter-type')
      expect(adapterType.textContent).toBe('templates')
    })

    it('должен использовать style-templates адаптер для style-templates вкладки', () => {
      mockBrowserState.activeTab = 'style-templates'
      render(<BrowserContent />)
      
      const adapterType = screen.getByTestId('adapter-type')
      expect(adapterType.textContent).toBe('style-templates')
    })
  })

  describe('Обработка выбора элементов', () => {
    it('должен добавлять медиафайл на таймлайн при выборе', () => {
      mockBrowserState.activeTab = 'media'
      currentAdapters.media = mockMediaAdapter // Убеждаемся что адаптер есть
      render(<BrowserContent />)
      
      const selectBtn = screen.getByTestId('item-select-btn')
      fireEvent.click(selectBtn)
      
      expect(mockAddSingleMediaToTimeline).toHaveBeenCalledWith({
        id: '1',
        name: 'test-item.mp4',
        path: '/test/path'
      })
    })

    it('должен логировать выбор музыкального файла', () => {
      const consoleSpy = vi.spyOn(console, 'log')
      mockBrowserState.activeTab = 'music'
      render(<BrowserContent />)
      
      const selectBtn = screen.getByTestId('item-select-btn')
      fireEvent.click(selectBtn)
      
      expect(consoleSpy).toHaveBeenCalledWith('Музыкальный файл выбран:', 'test-item.mp4')
    })

    it('должен логировать выбор эффекта', () => {
      const consoleSpy = vi.spyOn(console, 'log')
      mockBrowserState.activeTab = 'effects'
      render(<BrowserContent />)
      
      const selectBtn = screen.getByTestId('item-select-btn')
      fireEvent.click(selectBtn)
      
      expect(consoleSpy).toHaveBeenCalledWith('Эффект выбран:', 'test-item.mp4')
    })

    it('должен логировать выбор фильтра', () => {
      const consoleSpy = vi.spyOn(console, 'log')
      mockBrowserState.activeTab = 'filters'
      render(<BrowserContent />)
      
      const selectBtn = screen.getByTestId('item-select-btn')
      fireEvent.click(selectBtn)
      
      expect(consoleSpy).toHaveBeenCalledWith('Фильтр выбран:', 'test-item.mp4')
    })

    it('должен логировать выбор перехода', () => {
      const consoleSpy = vi.spyOn(console, 'log')
      mockBrowserState.activeTab = 'transitions'
      render(<BrowserContent />)
      
      const selectBtn = screen.getByTestId('item-select-btn')
      fireEvent.click(selectBtn)
      
      expect(consoleSpy).toHaveBeenCalledWith('Переход выбран:', 'test-item.mp4')
    })

    it('должен логировать выбор стиля субтитров', () => {
      const consoleSpy = vi.spyOn(console, 'log')
      mockBrowserState.activeTab = 'subtitles'
      render(<BrowserContent />)
      
      const selectBtn = screen.getByTestId('item-select-btn')
      fireEvent.click(selectBtn)
      
      expect(consoleSpy).toHaveBeenCalledWith('Стиль субтитров выбран:', 'test-item.mp4')
    })

    it('должен логировать выбор шаблона', () => {
      const consoleSpy = vi.spyOn(console, 'log')
      mockBrowserState.activeTab = 'templates'
      render(<BrowserContent />)
      
      const selectBtn = screen.getByTestId('item-select-btn')
      fireEvent.click(selectBtn)
      
      expect(consoleSpy).toHaveBeenCalledWith('Шаблон выбран:', '1')
    })

    it('должен логировать выбор стилистического шаблона', () => {
      const consoleSpy = vi.spyOn(console, 'log')
      mockBrowserState.activeTab = 'style-templates'
      render(<BrowserContent />)
      
      const selectBtn = screen.getByTestId('item-select-btn')
      fireEvent.click(selectBtn)
      
      expect(consoleSpy).toHaveBeenCalledWith('Стилистический шаблон выбран:', undefined)
    })

  })

  describe('Интеграция с фабриками данных', () => {
    it('должен создавать корректные тестовые данные с помощью фабрик', () => {
      // Создаем тестовые данные с помощью фабрик
      const mockMediaFile = factories.mediaFile({ name: 'test-video.mp4' })
      const mockAudioFile = factories.audioFile({ name: 'test-audio.mp3' })
      
      // Проверяем что фабрики создают правильные данные
      expect(mockMediaFile).toHaveProperty('name', 'test-video.mp4')
      expect(mockMediaFile).toHaveProperty('width', 1920)
      expect(mockMediaFile).toHaveProperty('height', 1080)
      
      expect(mockAudioFile).toHaveProperty('name', 'test-audio.mp3')
      expect(mockAudioFile.width).toBeUndefined()
      expect(mockAudioFile.height).toBeUndefined()
    })
  })
})