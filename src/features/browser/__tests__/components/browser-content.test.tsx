import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { factories } from '@/test/utils/factories'

import { BrowserContent } from '../../components/browser-content'

// Мокаем все зависимости
vi.mock('../../services/browser-state-provider', () => ({
  useBrowserState: () => ({
    activeTab: 'media',
    currentTabSettings: {
      searchQuery: '',
      showFavorites: false,
      sort: 'name',
      groupBy: null,
      filter: {},
      viewMode: 'grid',
      previewSize: 'medium'
    },
    setSearchQuery: vi.fn(),
    toggleFavorites: vi.fn(),
    setSort: vi.fn(),
    setGroupBy: vi.fn(),
    setFilter: vi.fn(),
    setViewMode: vi.fn(),
    setPreviewSize: vi.fn()
  })
}))

vi.mock('../../components/media-toolbar', () => ({
  MediaToolbar: () => <div data-testid="media-toolbar">Toolbar</div>
}))

vi.mock('../../components/media-toolbar-configs', () => ({
  getToolbarConfigForContent: () => ({})
}))

vi.mock('../../components/browser-loading-indicator', () => ({
  BrowserLoadingIndicator: () => <div data-testid="loading-indicator">Loading</div>
}))

vi.mock('../../components/universal-list', () => ({
  UniversalList: ({ adapter }: any) => (
    <div data-testid="universal-list">
      <div data-testid="adapter-type">{adapter?.type || 'no-adapter'}</div>
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

vi.mock('@/features/timeline/hooks', () => ({
  useTimelineActions: () => ({
    addMediaToTimeline: vi.fn(),
    addSingleMediaToTimeline: vi.fn()
  })
}))

// Создаем простой мок адаптера
const mockAdapter = {
  type: 'media',
  id: 'media',
  getItems: () => [],
  getGroups: () => [],
  getSortOptions: () => [],
  getFilterOptions: () => [],
  getGroupOptions: () => [],
  getViewModes: () => ['grid', 'list'],
  getDefaultViewMode: () => 'grid',
  supportsFavorites: () => true,
  supportsSearch: () => true,
  supportsFileInfo: () => true,
  getEmptyMessage: () => 'Нет медиафайлов',
  getLoadingMessage: () => 'Загрузка медиафайлов...',
  getSearchPlaceholder: () => 'Искать медиафайлы...'
}

// Мокаем адаптеры
vi.mock('../../adapters/use-media-adapter', () => ({
  useMediaAdapter: () => mockAdapter
}))
vi.mock('../../adapters/use-music-adapter', () => ({
  useMusicAdapter: () => null
}))
vi.mock('../../adapters/use-effects-adapter', () => ({
  useEffectsAdapter: () => null
}))
vi.mock('../../adapters/use-filters-adapter', () => ({
  useFiltersAdapter: () => null
}))
vi.mock('../../adapters/use-transitions-adapter', () => ({
  useTransitionsAdapter: () => null
}))
vi.mock('../../adapters/use-subtitles-adapter', () => ({
  useSubtitlesAdapter: () => null
}))
vi.mock('../../adapters/use-templates-adapter', () => ({
  useTemplatesAdapter: () => null
}))
vi.mock('../../adapters/use-style-templates-adapter', () => ({
  useStyleTemplatesAdapter: () => null
}))

vi.mock('@tauri-apps/plugin-shell', () => ({
  open: vi.fn()
}))

describe('BrowserContent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
  })

  describe('Работа с адаптерами', () => {
    it('должен использовать правильный адаптер для текущей вкладки', () => {
      render(<BrowserContent />)
      
      const adapterType = screen.getByTestId('adapter-type')
      expect(adapterType.textContent).toBe('media')
    })

    it('должен показывать universal-list с адаптером', () => {
      render(<BrowserContent />)
      
      expect(screen.getByTestId('universal-list')).toBeInTheDocument()
      expect(screen.getByTestId('adapter-type')).toHaveTextContent('media')
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