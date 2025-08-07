/**
 * E2E тесты для полного workflow автоматизации субтитров
 * Тестируют интеграцию с UI компонентами и Timeline
 */

import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Мокаем зависимости для тестирования
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
  }),
}))

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

vi.mock("@/features/modals/services", () => ({
  useModal: () => ({
    modalData: {},
    closeModal: vi.fn(),
  }),
}))

vi.mock("@/features/timeline/hooks/use-timeline", () => ({
  useTimeline: () => ({
    project: {
      sections: [
        {
          tracks: [],
        },
      ],
    },
    send: vi.fn(),
  }),
}))

vi.mock("@/features/transcription/components/enhanced-transcription-panel", () => ({
  EnhancedTranscriptionPanel: ({ onAddToTimeline }: { onAddToTimeline: (segments: any[]) => void }) => {
    const handleAddMockSubtitles = () => {
      const mockSegments = [
        {
          id: "1",
          start: 1,
          end: 4,
          text: "Первый тестовый субтитр",
          confidence: 0.9,
        },
        {
          id: "2",
          start: 5,
          end: 8,
          text: "Второй тестовый субтитр",
          confidence: 0.85,
        },
      ]
      onAddToTimeline(mockSegments)
    }

    return (
      <div data-testid="enhanced-transcription-panel">
        <button onClick={handleAddMockSubtitles} data-testid="generate-subtitles-btn">
          Сгенерировать субтитры
        </button>
        <button onClick={handleAddMockSubtitles} data-testid="add-to-timeline-btn">
          Добавить в таймлайн
        </button>
      </div>
    )
  },
}))

// Импортируем тестируемый компонент
import { SubtitleAIToolsModal } from "../../../../subtitles/components/subtitle-ai-tools-modal"

describe("Subtitle Automation E2E Workflow", () => {
  let mockSend: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockSend = vi.fn()

    // Мокаем useTimeline с функцией send
    const { useTimeline } = require("@/features/timeline/hooks/use-timeline")
    vi.mocked(useTimeline).mockReturnValue({
      project: {
        sections: [
          {
            tracks: [],
          },
        ],
      },
      send: mockSend,
    })
  })

  describe("SubtitleAIToolsModal Integration", () => {
    it("должен рендерить модальное окно с Enhanced панелью", () => {
      render(<SubtitleAIToolsModal />)

      expect(screen.getByTestId("enhanced-transcription-panel")).toBeInTheDocument()
      expect(screen.getByTestId("generate-subtitles-btn")).toBeInTheDocument()
      expect(screen.getByTestId("add-to-timeline-btn")).toBeInTheDocument()
    })

    it("должен создавать трек субтитров и добавлять клипы при добавлении в таймлайн", async () => {
      render(<SubtitleAIToolsModal />)

      const addButton = screen.getByTestId("add-to-timeline-btn")

      await act(async () => {
        fireEvent.click(addButton)
      })

      await waitFor(() => {
        // Проверяем что был вызван send для создания трека
        expect(mockSend).toHaveBeenCalledWith(
          expect.objectContaining({
            type: "ADD_TRACK",
            track: expect.objectContaining({
              type: "subtitle",
              name: "subtitles.trackName",
            }),
          }),
        )

        // Проверяем что были вызваны send для добавления клипов
        expect(mockSend).toHaveBeenCalledWith(
          expect.objectContaining({
            type: "ADD_CLIP",
            clip: expect.objectContaining({
              type: "subtitle",
              text: "Первый тестовый субтитр",
              startTime: 1000, // 1 секунда в миллисекундах
              duration: 3000, // 3 секунды длительность
            }),
          }),
        )

        expect(mockSend).toHaveBeenCalledWith(
          expect.objectContaining({
            type: "ADD_CLIP",
            clip: expect.objectContaining({
              type: "subtitle",
              text: "Второй тестовый субтитр",
              startTime: 5000,
              duration: 3000,
            }),
          }),
        )
      })
    })

    it("должен корректно конвертировать время из секунд в миллисекунды", async () => {
      render(<SubtitleAIToolsModal />)

      await act(async () => {
        fireEvent.click(screen.getByTestId("add-to-timeline-btn"))
      })

      await waitFor(() => {
        const clipCalls = mockSend.mock.calls.filter((call) => call[0].type === "ADD_CLIP")

        expect(clipCalls).toHaveLength(2)

        // Первый клип: 1-4 секунды → 1000-4000 мс, длительность 3000 мс
        expect(clipCalls[0][0].clip.startTime).toBe(1000)
        expect(clipCalls[0][0].clip.duration).toBe(3000)

        // Второй клип: 5-8 секунд → 5000-8000 мс, длительность 3000 мс
        expect(clipCalls[1][0].clip.startTime).toBe(5000)
        expect(clipCalls[1][0].clip.duration).toBe(3000)
      })
    })

    it("должен применять стили субтитров по умолчанию", async () => {
      render(<SubtitleAIToolsModal />)

      await act(async () => {
        fireEvent.click(screen.getByTestId("add-to-timeline-btn"))
      })

      await waitFor(() => {
        const clipCalls = mockSend.mock.calls.filter((call) => call[0].type === "ADD_CLIP")

        clipCalls.forEach((call) => {
          expect(call[0].clip.style).toEqual({
            fontSize: 24,
            fontFamily: "Arial",
            color: "#FFFFFF",
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            position: "bottom",
          })
        })
      })
    })

    it("должен использовать существующий трек субтитров если он есть", async () => {
      // Мокаем проект с существующим треком субтитров
      const { useTimeline } = require("@/features/timeline/hooks/use-timeline")
      vi.mocked(useTimeline).mockReturnValue({
        project: {
          sections: [
            {
              tracks: [
                {
                  id: "existing-subtitle-track",
                  type: "subtitle",
                  name: "Существующие субтитры",
                },
              ],
            },
          ],
        },
        send: mockSend,
      })

      render(<SubtitleAIToolsModal />)

      await act(async () => {
        fireEvent.click(screen.getByTestId("add-to-timeline-btn"))
      })

      await waitFor(() => {
        // Не должен создавать новый трек
        const trackCalls = mockSend.mock.calls.filter((call) => call[0].type === "ADD_TRACK")
        expect(trackCalls).toHaveLength(0)

        // Должен добавить клипы в существующий трек
        const clipCalls = mockSend.mock.calls.filter((call) => call[0].type === "ADD_CLIP")
        expect(clipCalls).toHaveLength(2)
        expect(clipCalls[0][0].trackId).toBe("existing-subtitle-track")
      })
    })

    it("должен показывать уведомления об успехе", async () => {
      const { toast } = require("sonner")

      render(<SubtitleAIToolsModal />)

      await act(async () => {
        fireEvent.click(screen.getByTestId("add-to-timeline-btn"))
      })

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          "subtitles.ai.success",
          expect.objectContaining({
            description: expect.stringContaining("2"), // 2 субтитра
          }),
        )
      })
    })
  })

  describe("Enhanced Subtitle Automation Integration", () => {
    it("должен обрабатывать сегменты с дополнительными метаданными", async () => {
      // Создаем мок с расширенными данными
      const MockEnhancedPanelWithMetadata = ({ onAddToTimeline }: { onAddToTimeline: (segments: any[]) => void }) => {
        const handleAddEnhancedSubtitles = () => {
          const enhancedSegments = [
            {
              id: "enhanced-1",
              start: 2,
              end: 6,
              text: "Улучшенный субтитр с метаданными",
              confidence: 0.95,
              speaker: "Диктор 1",
            },
          ]
          onAddToTimeline(enhancedSegments)
        }

        return (
          <button onClick={handleAddEnhancedSubtitles} data-testid="add-enhanced-subtitles">
            Добавить улучшенные субтитры
          </button>
        )
      }

      // Перерендериваем с новым компонентом
      const { rerender } = render(<MockEnhancedPanelWithMetadata onAddToTimeline={() => {}} />)

      // Рендерим полный компонент
      rerender(<SubtitleAIToolsModal />)

      // Мокаем расширенную панель
      const { EnhancedTranscriptionPanel } = require("@/features/transcription/components/enhanced-transcription-panel")
      vi.mocked(EnhancedTranscriptionPanel).mockImplementation(MockEnhancedPanelWithMetadata as any)

      rerender(<SubtitleAIToolsModal />)

      const enhancedButton = screen.getByTestId("add-enhanced-subtitles")

      await act(async () => {
        fireEvent.click(enhancedButton)
      })

      await waitFor(() => {
        const clipCalls = mockSend.mock.calls.filter((call) => call[0].type === "ADD_CLIP")

        expect(clipCalls).toHaveLength(1)
        expect(clipCalls[0][0].clip).toEqual(
          expect.objectContaining({
            type: "subtitle",
            text: "Улучшенный субтитр с метаданными",
            speaker: "Диктор 1",
            confidence: 0.95,
            startTime: 2000,
            duration: 4000,
          }),
        )
      })
    })

    it("должен обрабатывать ошибки gracefully", async () => {
      const { toast } = require("sonner")

      // Мокаем ошибку в send
      mockSend.mockImplementation(() => {
        throw new Error("Timeline error")
      })

      render(<SubtitleAIToolsModal />)

      // Должен не крашиться при ошибке
      expect(() => {
        fireEvent.click(screen.getByTestId("add-to-timeline-btn"))
      }).not.toThrow()
    })
  })

  describe("Performance and Edge Cases", () => {
    it("должен обрабатывать большое количество субтитров", async () => {
      const MockManySubtitlesPanel = ({ onAddToTimeline }: { onAddToTimeline: (segments: any[]) => void }) => {
        const handleAddManySubtitles = () => {
          const manySegments = Array.from({ length: 50 }, (_, i) => ({
            id: `bulk-${i}`,
            start: i * 2,
            end: i * 2 + 1.5,
            text: `Субтитр ${i + 1}`,
            confidence: 0.8,
          }))
          onAddToTimeline(manySegments)
        }

        return (
          <button onClick={handleAddManySubtitles} data-testid="add-many-subtitles">
            Добавить много субтитров
          </button>
        )
      }

      const { EnhancedTranscriptionPanel } = require("@/features/transcription/components/enhanced-transcription-panel")
      vi.mocked(EnhancedTranscriptionPanel).mockImplementation(MockManySubtitlesPanel as any)

      render(<SubtitleAIToolsModal />)

      await act(async () => {
        fireEvent.click(screen.getByTestId("add-many-subtitles"))
      })

      await waitFor(
        () => {
          const clipCalls = mockSend.mock.calls.filter((call) => call[0].type === "ADD_CLIP")
          expect(clipCalls).toHaveLength(50)
        },
        { timeout: 5000 },
      ) // Увеличиваем таймаут для больших операций
    })

    it("должен обрабатывать пустые сегменты", async () => {
      const MockEmptyPanel = ({ onAddToTimeline }: { onAddToTimeline: (segments: any[]) => void }) => {
        return (
          <button onClick={() => onAddToTimeline([])} data-testid="add-empty-subtitles">
            Добавить пустые субтитры
          </button>
        )
      }

      const { EnhancedTranscriptionPanel } = require("@/features/transcription/components/enhanced-transcription-panel")
      vi.mocked(EnhancedTranscriptionPanel).mockImplementation(MockEmptyPanel as any)

      render(<SubtitleAIToolsModal />)

      await act(async () => {
        fireEvent.click(screen.getByTestId("add-empty-subtitles"))
      })

      // Не должно создавать трек или клипы для пустых сегментов
      await waitFor(() => {
        expect(mockSend).not.toHaveBeenCalled()
      })
    })

    it("должен корректно генерировать уникальные ID", async () => {
      render(<SubtitleAIToolsModal />)

      // Добавляем субтитры несколько раз
      await act(async () => {
        fireEvent.click(screen.getByTestId("add-to-timeline-btn"))
      })

      await act(async () => {
        fireEvent.click(screen.getByTestId("add-to-timeline-btn"))
      })

      await waitFor(() => {
        const clipCalls = mockSend.mock.calls.filter((call) => call[0].type === "ADD_CLIP")
        expect(clipCalls).toHaveLength(4) // 2 + 2 клипа

        // Все ID должны быть уникальными
        const ids = clipCalls.map((call) => call[0].clip.id)
        const uniqueIds = [...new Set(ids)]
        expect(uniqueIds).toHaveLength(ids.length)
      })
    })
  })
})
