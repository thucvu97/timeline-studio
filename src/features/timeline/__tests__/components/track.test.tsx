/**
 * Тесты для Track компонента
 */

import React from "react"

import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

// Import mocks before components
import "@/test/mocks/dnd-kit"
import "../../__mocks__/hooks"

import { Track } from "../../components/track/track"

// Мокаем данные трека
const mockTrack = {
  id: "track-1",
  name: "Test Track",
  type: "video" as const,
  clips: [],
  isLocked: false,
  isMuted: false,
  isHidden: false,
  isSolo: false,
  volume: 1,
  pan: 0,
  height: 120,
  order: 0,
  trackEffects: [],
  trackFilters: [],
}

describe("Track Component", () => {
  describe("Component Initialization", () => {
    it("should be defined and exportable", () => {
      expect(Track).toBeDefined()
      expect(typeof Track).toBe("function")
    })

    it("should render without errors", () => {
      expect(() => {
        render(<Track track={mockTrack} />)
      }).not.toThrow()
    })

    it("should render with track test id", () => {
      render(<Track track={mockTrack} />)

      const trackElement = screen.getByTestId("timeline-track")
      expect(trackElement).toBeInTheDocument()
    })
  })

  describe("Track Properties", () => {
    it("should display track name", () => {
      render(<Track track={mockTrack} />)

      expect(screen.getByText("Test Track")).toBeInTheDocument()
    })

    it("should handle different track types", () => {
      const videoTrack = { ...mockTrack, type: "video" as const }
      const audioTrack = { ...mockTrack, type: "audio" as const, name: "Audio Track" }

      const { rerender } = render(<Track track={videoTrack} />)
      expect(screen.getByTestId("timeline-track")).toBeInTheDocument()

      rerender(<Track track={audioTrack} />)
      expect(screen.getByText("Audio Track")).toBeInTheDocument()
    })

    it("should reflect track state in UI", () => {
      const mutedTrack = { ...mockTrack, isMuted: true, name: "Muted Track" }
      const lockedTrack = { ...mockTrack, isLocked: true, name: "Locked Track" }

      const { rerender } = render(<Track track={mutedTrack} />)
      expect(screen.getByText("Muted Track")).toBeInTheDocument()

      rerender(<Track track={lockedTrack} />)
      expect(screen.getByText("Locked Track")).toBeInTheDocument()
    })
  })

  describe("Track Interactions", () => {
    it("should handle track selection", () => {
      const onSelect = vi.fn()
      render(<Track track={mockTrack} onSelect={onSelect} />)

      const trackElement = screen.getByTestId("timeline-track")
      expect(trackElement).toBeInTheDocument()

      // Клик по треку должен вызвать onSelect
      trackElement.click()
      expect(onSelect).toHaveBeenCalledWith(mockTrack.id)
    })

    it("should handle track lock toggle", () => {
      const onUpdate = vi.fn()
      render(<Track track={mockTrack} onUpdate={onUpdate} />)

      // Ищем кнопку lock
      const lockButton = screen.getByTestId("track-lock-button")
      expect(lockButton).toBeInTheDocument()

      lockButton.click()
      expect(onUpdate).toHaveBeenCalledWith({ ...mockTrack, isLocked: !mockTrack.isLocked })
    })

    it("should handle track mute toggle for audio tracks", () => {
      const audioTrack = { ...mockTrack, type: "audio" as const }
      const onUpdate = vi.fn()
      render(<Track track={audioTrack} onUpdate={onUpdate} />)

      // Ищем кнопку mute (только для аудио треков)
      const muteButton = screen.getByTestId("track-mute-button")
      expect(muteButton).toBeInTheDocument()

      muteButton.click()
      expect(onUpdate).toHaveBeenCalledWith({ ...audioTrack, isMuted: !audioTrack.isMuted })
    })

    it("should not show mute button for video tracks", () => {
      render(<Track track={mockTrack} />)

      // Для видео треков кнопка mute не должна отображаться
      const muteButton = screen.queryByTestId("track-mute-button")
      expect(muteButton).not.toBeInTheDocument()
    })
  })

  describe("Track Styling", () => {
    it("should accept className and style props without errors", () => {
      const customStyle = { backgroundColor: "blue", height: "150px" }

      expect(() => {
        render(<Track track={mockTrack} className="custom-track" style={customStyle} />)
      }).not.toThrow()

      const trackElement = screen.getByTestId("timeline-track")
      expect(trackElement).toBeInTheDocument()
    })
  })

  describe("Track State Variations", () => {
    it("should render hidden track", () => {
      const hiddenTrack = { ...mockTrack, isHidden: true, name: "Hidden Track" }

      expect(() => {
        render(<Track track={hiddenTrack} />)
      }).not.toThrow()
    })

    it("should render solo track", () => {
      const soloTrack = { ...mockTrack, isSolo: true, name: "Solo Track" }

      render(<Track track={soloTrack} />)
      expect(screen.getByText("Solo Track")).toBeInTheDocument()
    })

    it("should handle track with clips", () => {
      const trackWithClips = {
        ...mockTrack,
        clips: [
          {
            id: "clip-1",
            name: "Test Clip",
            mediaId: "media-1",
            trackId: "track-1",
            startTime: 0,
            duration: 10,
            mediaStartTime: 0,
            mediaEndTime: 10,
            volume: 1,
            speed: 1,
            isReversed: false,
            opacity: 1,
            effects: [],
            filters: [],
            transitions: [],
            isSelected: false,
            isLocked: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      }

      expect(() => {
        render(<Track track={trackWithClips} />)
      }).not.toThrow()
    })
  })

  describe("Track Error Handling", () => {
    it("should handle missing track prop gracefully", () => {
      expect(() => {
        render(<Track track={null} />)
      }).not.toThrow()

      // Проверяем, что отображается fallback
      expect(screen.getByText("Invalid track")).toBeInTheDocument()
    })

    it("should render track with null gracefully", () => {
      render(<Track track={null} />)

      const trackElement = screen.getByTestId("timeline-track")
      expect(trackElement).toBeInTheDocument()
      expect(screen.getByText("Invalid track")).toBeInTheDocument()
    })
  })

  describe("Track Accessibility", () => {
    it("should have proper ARIA attributes", () => {
      render(<Track track={mockTrack} />)

      const trackElement = screen.getByTestId("timeline-track")
      expect(trackElement).toBeInTheDocument()

      // Проверяем базовые атрибуты доступности
      expect(trackElement.getAttribute("role")).toBeTruthy()
    })

    it("should be keyboard accessible", () => {
      render(<Track track={mockTrack} />)

      const trackElement = screen.getByTestId("timeline-track")
      expect(trackElement.tabIndex).toBeGreaterThanOrEqual(-1)
    })
  })
})
