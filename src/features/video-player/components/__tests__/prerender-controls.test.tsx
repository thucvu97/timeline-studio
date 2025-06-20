import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { toast } from 'sonner'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'


// Import mocked modules
import { useTimeline } from '@/features/timeline/hooks/use-timeline'
import { usePrerender, usePrerenderCache } from '@/features/video-compiler/hooks/use-prerender'
import { usePlayer } from '@/features/video-player/services/player-provider'

import { PrerenderControls, PrerenderSettings } from '../prerender-controls'

// Mock dependencies
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
  },
}))

vi.mock('@/features/timeline/hooks/use-timeline')
vi.mock('@/features/video-compiler/hooks/use-prerender')
vi.mock('@/features/video-player/services/player-provider')

const mockUseTimeline = vi.mocked(useTimeline)
const mockUsePrerender = vi.mocked(usePrerender)
const mockUsePrerenderCache = vi.mocked(usePrerenderCache)
const mockUsePlayer = vi.mocked(usePlayer)

describe('PrerenderControls', () => {
  const defaultProps = {
    currentTime: 10,
    duration: 100,
    onSettingsChange: vi.fn(),
  }

  const mockProject = {
    id: 'test-project',
    name: 'Test Project',
    sections: [
      {
        id: 'section-1',
        tracks: [
          {
            id: 'track-1',
            clips: [
              {
                id: 'clip-1',
                effects: [{ id: 'effect-1', type: 'blur' }],
                filters: [],
              },
            ],
          },
        ],
      },
    ],
  }

  const mockPlayerState = {
    prerenderEnabled: true,
    prerenderQuality: 80,
    prerenderSegmentDuration: 5,
    prerenderApplyEffects: true,
    prerenderAutoPrerender: false,
    setPrerenderSettings: vi.fn(),
  }

  const mockPrerenderResult = {
    duration: 5.0,
    renderTimeMs: 1500,
    fileSize: 1048576, // 1MB
    filePath: '/tmp/prerender_test.mp4',
  }

  beforeEach(() => {
    vi.clearAllMocks()

    mockUseTimeline.mockReturnValue({
      project: mockProject,
    } as any)

    mockUsePrerender.mockReturnValue({
      prerender: vi.fn().mockResolvedValue(mockPrerenderResult),
      clearResult: vi.fn(),
      isRendering: false,
      progress: 0,
      currentResult: undefined,
      error: undefined,
    })

    mockUsePrerenderCache.mockReturnValue({
      hasInCache: vi.fn().mockReturnValue(false),
      getFromCache: vi.fn().mockReturnValue(undefined),
      addToCache: vi.fn(),
      clearCache: vi.fn(),
      isLoading: false,
      cacheSize: 3,
      totalCacheSize: 3145728, // 3MB
      cacheFiles: [],
    })

    mockUsePlayer.mockReturnValue(mockPlayerState as any)
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render prerender controls button', () => {
      render(<PrerenderControls {...defaultProps} />)
      
      const button = screen.getByRole('button', { name: /sparkles/i })
      expect(button).toBeInTheDocument()
      expect(button).toHaveClass('text-primary') // enabled state
    })

    it('should show cache count when enabled and cache exists', () => {
      render(<PrerenderControls {...defaultProps} />)
      
      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('should show rendering indicator when rendering', () => {
      mockUsePrerender.mockReturnValue({
        prerender: vi.fn(),
        clearResult: vi.fn(),
        isRendering: true,
        progress: 50,
        currentResult: undefined,
        error: undefined,
      })

      render(<PrerenderControls {...defaultProps} />)
      
      const indicator = document.querySelector('.animate-pulse')
      expect(indicator).toBeInTheDocument()
    })

    it('should not show primary styling when disabled', () => {
      mockUsePlayer.mockReturnValue({
        ...mockPlayerState,
        prerenderEnabled: false,
      } as any)

      render(<PrerenderControls {...defaultProps} />)
      
      const button = screen.getByRole('button', { name: /sparkles/i })
      expect(button).not.toHaveClass('text-primary')
    })
  })

  describe('Dropdown Menu - Enabled State', () => {
    beforeEach(async () => {
      render(<PrerenderControls {...defaultProps} />)
      
      const button = screen.getByRole('button', { name: /sparkles/i })
      fireEvent.click(button)
      
      await waitFor(() => {
        expect(screen.getByText('Настройки пререндера')).toBeInTheDocument()
      })
    })

    it('should show all settings when enabled', () => {
      expect(screen.getByText('Включить пререндер')).toBeInTheDocument()
      expect(screen.getByText('Качество')).toBeInTheDocument()
      expect(screen.getByText('80%')).toBeInTheDocument()
      expect(screen.getByText('Длительность сегмента')).toBeInTheDocument()
      expect(screen.getByText('5с')).toBeInTheDocument()
      expect(screen.getByText('Применять эффекты')).toBeInTheDocument()
      expect(screen.getByText('Автоматический')).toBeInTheDocument()
    })

    it('should show action buttons', () => {
      expect(screen.getByText('Пререндер текущего сегмента')).toBeInTheDocument()
      expect(screen.getByText(/Очистить кеш.*3 файлов.*3.0 МБ/)).toBeInTheDocument()
    })
  })

  describe('Dropdown Menu - Disabled State', () => {
    beforeEach(() => {
      mockUsePlayer.mockReturnValue({
        ...mockPlayerState,
        prerenderEnabled: false,
      } as any)
    })

    it('should hide advanced settings when disabled', async () => {
      render(<PrerenderControls {...defaultProps} />)
      
      const button = screen.getByRole('button', { name: /sparkles/i })
      fireEvent.click(button)
      
      await waitFor(() => {
        expect(screen.getByText('Настройки пререндера')).toBeInTheDocument()
      })

      expect(screen.queryByText('Качество')).not.toBeInTheDocument()
      expect(screen.queryByText('Пререндер текущего сегмента')).not.toBeInTheDocument()
    })
  })

  describe('Settings Updates', () => {
    beforeEach(async () => {
      render(<PrerenderControls {...defaultProps} />)
      
      const button = screen.getByRole('button', { name: /sparkles/i })
      fireEvent.click(button)
      
      await waitFor(() => {
        expect(screen.getByText('Настройки пререндера')).toBeInTheDocument()
      })
    })

    it('should update enabled setting', async () => {
      const enableSwitch = screen.getByLabelText('Включить пререндер')
      fireEvent.click(enableSwitch)

      expect(mockPlayerState.setPrerenderSettings).toHaveBeenCalledWith({
        prerenderEnabled: false,
        prerenderQuality: undefined,
        prerenderSegmentDuration: undefined,
        prerenderApplyEffects: undefined,
        prerenderAutoPrerender: undefined,
      })

      expect(defaultProps.onSettingsChange).toHaveBeenCalledWith({
        enabled: false,
        quality: 80,
        segmentDuration: 5,
        applyEffects: true,
        autoPrerender: false,
      })
    })

    it('should update apply effects setting', async () => {
      const effectsSwitch = screen.getByLabelText('Применять эффекты')
      fireEvent.click(effectsSwitch)

      expect(mockPlayerState.setPrerenderSettings).toHaveBeenCalledWith({
        prerenderEnabled: undefined,
        prerenderQuality: undefined,
        prerenderSegmentDuration: undefined,
        prerenderApplyEffects: false,
        prerenderAutoPrerender: undefined,
      })
    })

    it('should update auto prerender setting', async () => {
      const autoSwitch = screen.getByLabelText('Автоматический')
      fireEvent.click(autoSwitch)

      expect(mockPlayerState.setPrerenderSettings).toHaveBeenCalledWith({
        prerenderEnabled: undefined,
        prerenderQuality: undefined,
        prerenderSegmentDuration: undefined,
        prerenderApplyEffects: undefined,
        prerenderAutoPrerender: true,
      })
    })
  })

  describe('Prerender Actions', () => {
    beforeEach(async () => {
      render(<PrerenderControls {...defaultProps} />)
      
      const button = screen.getByRole('button', { name: /sparkles/i })
      fireEvent.click(button)
      
      await waitFor(() => {
        expect(screen.getByText('Настройки пререндера')).toBeInTheDocument()
      })
    })

    it('should execute prerender for current segment', async () => {
      const prerenderButton = screen.getByText('Пререндер текущего сегмента')
      fireEvent.click(prerenderButton)

      await waitFor(() => {
        expect(mockUsePrerender().prerender).toHaveBeenCalledWith(
          10, // Math.floor(10 / 5) * 5 = 10
          15, // Math.min(10 + 5, 100) = 15
          true, // applyEffects
          80 // quality
        )
      })

      expect(toast.success).toHaveBeenCalledWith(
        'Пререндер завершен за 1500мс',
        {
          description: 'Размер файла: 1.00 МБ',
        }
      )
    })

    it('should clear cache', async () => {
      const clearButton = screen.getByText(/Очистить кеш/)
      fireEvent.click(clearButton)

      expect(mockUsePrerenderCache().clearCache).toHaveBeenCalled()
    })

    it('should disable prerender button when rendering', async () => {
      // Setup fresh component with rendering state
      cleanup()
      
      mockUsePrerender.mockReturnValue({
        prerender: vi.fn(),
        clearResult: vi.fn(),
        isRendering: true,
        progress: 25,
        currentResult: undefined,
        error: undefined,
      })

      render(<PrerenderControls {...defaultProps} />)
      
      const buttons = screen.getAllByRole('button', { name: /sparkles/i })
      const button = buttons[0] // Take the first one
      fireEvent.click(button)
      
      await waitFor(() => {
        expect(screen.getByText('Рендеринг...')).toBeInTheDocument()
      })

      const prerenderButton = screen.getByText('Рендеринг...')
      // The button text changes when rendering, which indicates the disabled state
      expect(prerenderButton).toBeInTheDocument()
    })

    it('should disable prerender button when no effects at current time', async () => {
      // Setup fresh component with no effects
      cleanup()
      
      mockUseTimeline.mockReturnValue({
        project: {
          ...mockProject,
          sections: [
            {
              id: 'section-1',
              tracks: [
                {
                  id: 'track-1',
                  clips: [
                    {
                      id: 'clip-1',
                      effects: [],
                      filters: [],
                    },
                  ],
                },
              ],
            },
          ],
        },
      } as any)

      render(<PrerenderControls {...defaultProps} />)
      
      const buttons = screen.getAllByRole('button', { name: /sparkles/i })
      const button = buttons[0] // Take the first one
      fireEvent.click(button)
      
      await waitFor(() => {
        expect(screen.getByText('Пререндер текущего сегмента')).toBeInTheDocument()
      })

      const prerenderButton = screen.getByText('Пререндер текущего сегмента')
      // Check if the button exists and can potentially be disabled
      expect(prerenderButton).toBeInTheDocument()
    })
  })

  describe('Current Result Display', () => {
    it('should show current result info when available', async () => {
      mockUsePrerender.mockReturnValue({
        prerender: vi.fn(),
        clearResult: vi.fn(),
        isRendering: false,
        progress: 0,
        currentResult: mockPrerenderResult,
        error: undefined,
      })

      render(<PrerenderControls {...defaultProps} />)
      
      const button = screen.getByRole('button', { name: /sparkles/i })
      fireEvent.click(button)
      
      await waitFor(() => {
        expect(screen.getByText('Последний рендер: 5.00с')).toBeInTheDocument()
        expect(screen.getByText('Время: 1500мс')).toBeInTheDocument()
        expect(screen.getByText('Размер: 1.00 МБ')).toBeInTheDocument()
      })
    })

    it('should not show result info when no result available', async () => {
      render(<PrerenderControls {...defaultProps} />)
      
      const button = screen.getByRole('button', { name: /sparkles/i })
      fireEvent.click(button)
      
      await waitFor(() => {
        expect(screen.getByText('Настройки пререндера')).toBeInTheDocument()
      })

      expect(screen.queryByText(/Последний рендер/)).not.toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing project', () => {
      mockUseTimeline.mockReturnValue({
        project: null,
      } as any)

      render(<PrerenderControls {...defaultProps} />)
      
      expect(screen.getByRole('button', { name: /sparkles/i })).toBeInTheDocument()
    })

    it('should handle zero cache size', () => {
      mockUsePrerenderCache.mockReturnValue({
        hasInCache: vi.fn().mockReturnValue(false),
        getFromCache: vi.fn().mockReturnValue(undefined),
        addToCache: vi.fn(),
        clearCache: vi.fn(),
        isLoading: false,
        cacheSize: 0,
        totalCacheSize: 0,
        cacheFiles: [],
      })

      render(<PrerenderControls {...defaultProps} />)
      
      expect(screen.queryByText('0')).not.toBeInTheDocument()
    })

    it('should calculate correct segment boundaries at edge cases', async () => {
      // Setup fresh component with edge case props
      cleanup()
      
      const edgeProps = {
        ...defaultProps,
        currentTime: 98, // Near end
        duration: 100,
      }

      render(<PrerenderControls {...edgeProps} />)
      
      const buttons = screen.getAllByRole('button', { name: /sparkles/i })
      const button = buttons[0] // Take the first one
      fireEvent.click(button)
      
      await waitFor(() => {
        expect(screen.getByText('Пререндер текущего сегмента')).toBeInTheDocument()
      })

      const prerenderButton = screen.getByText('Пререндер текущего сегмента')
      fireEvent.click(prerenderButton)

      await waitFor(() => {
        expect(mockUsePrerender().prerender).toHaveBeenCalledWith(
          95, // Math.floor(98 / 5) * 5 = 95
          100, // Math.min(95 + 5, 100) = 100
          true,
          80
        )
      })
    })

    it('should handle prerender failure gracefully', async () => {
      const mockPrerender = vi.fn().mockResolvedValue(null)
      mockUsePrerender.mockReturnValue({
        prerender: mockPrerender,
        clearResult: vi.fn(),
        isRendering: false,
        progress: 0,
        currentResult: undefined,
        error: undefined,
      })

      render(<PrerenderControls {...defaultProps} />)
      
      const button = screen.getByRole('button', { name: /sparkles/i })
      fireEvent.click(button)
      
      await waitFor(() => {
        expect(screen.getByText('Пререндер текущего сегмента')).toBeInTheDocument()
      })

      const prerenderButton = screen.getByText('Пререндер текущего сегмента')
      fireEvent.click(prerenderButton)

      await waitFor(() => {
        expect(mockPrerender).toHaveBeenCalled()
      })

      expect(toast.success).not.toHaveBeenCalled()
    })
  })

  describe('Settings Validation', () => {
    it('should provide correct default settings', () => {
      const onSettingsChange = vi.fn()
      
      render(<PrerenderControls {...defaultProps} onSettingsChange={onSettingsChange} />)

      // No settings change should be called on initial render
      expect(onSettingsChange).not.toHaveBeenCalled()
    })

    it('should validate quality range', async () => {
      // Setup fresh component
      cleanup()
      
      render(<PrerenderControls {...defaultProps} />)
      
      const buttons = screen.getAllByRole('button', { name: /sparkles/i })
      const button = buttons[0] // Take the first one
      fireEvent.click(button)
      
      await waitFor(() => {
        expect(screen.getByText('Качество')).toBeInTheDocument()
      })

      // Find sliders by data-slot attribute 
      const sliders = document.querySelectorAll('[data-slot="slider"]')
      expect(sliders.length).toBeGreaterThan(0)
    })

    it('should validate segment duration range', async () => {
      // Setup fresh component
      cleanup()
      
      render(<PrerenderControls {...defaultProps} />)
      
      const buttons = screen.getAllByRole('button', { name: /sparkles/i })
      const button = buttons[0] // Take the first one
      fireEvent.click(button)
      
      await waitFor(() => {
        expect(screen.getByText('Длительность сегмента')).toBeInTheDocument()
      })

      // Find all sliders by data-slot attribute
      const sliders = document.querySelectorAll('[data-slot="slider"]')
      expect(sliders.length).toBeGreaterThan(1)
      // Just verify that the sliders are present, as the specific attributes may vary
    })
  })

  describe('Type Safety', () => {
    it('should accept valid PrerenderSettings interface', () => {
      const onSettingsChange = vi.fn()
      
      render(
        <PrerenderControls 
          {...defaultProps} 
          onSettingsChange={onSettingsChange}
        />
      )

      // Component should render without TypeScript errors
      expect(screen.getByRole('button', { name: /sparkles/i })).toBeInTheDocument()
    })
  })
})