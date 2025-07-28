import { describe, expect, it } from "vitest"

import { TimelineClip, TimelineProject, TimelineSection } from "@/features/timeline/types/timeline"

import { createDetailedTimelineContext, createTimelineContextPrompt } from "../../utils/timeline-context"

describe("timeline-context utils", () => {
  const mockProject: TimelineProject = {
    id: "project-1",
    name: "Мой проект",
    description: "Тестовый проект для видео",
    duration: 30,
    fps: 30,
    sampleRate: 48000,
    settings: {
      resolution: { width: 1920, height: 1080 },
      fps: 30,
      aspectRatio: "16:9",
      sampleRate: 48000,
      channels: 2,
      bitDepth: 24,
      timeFormat: "timecode" as const,
      snapToGrid: true,
      gridSize: 1,
      autoSave: true,
      autoSaveInterval: 60,
    },
    resources: {
      effects: [],
      filters: [],
      transitions: [],
      templates: [],
      styleTemplates: [],
      subtitleStyles: [],
      music: [],
      media: [],
    },
    globalTracks: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    version: "1.0.0",
    sections: [
      {
        id: "section-1",
        index: 0,
        name: "Вступление",
        startTime: 0,
        endTime: 10,
        duration: 10,
        isCollapsed: false,
        tracks: [
          {
            id: "track-1",
            name: "Видео 1",
            type: "video" as const,
            order: 0,
            isLocked: false,
            isMuted: false,
            isHidden: false,
            isSolo: false,
            volume: 1,
            pan: 0,
            height: 100,
            trackEffects: [],
            trackFilters: [],
            clips: [
              {
                id: "clip-1",
                name: "intro.mp4",
                mediaId: "media-1",
                trackId: "track-1",
                startTime: 0,
                duration: 5,
                mediaStartTime: 0,
                mediaEndTime: 5,
                offset: 0,
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
              {
                id: "clip-2",
                name: "title.mp4",
                mediaId: "media-2",
                trackId: "track-1",
                startTime: 5,
                duration: 5,
                mediaStartTime: 0,
                mediaEndTime: 5,
                offset: 0,
                volume: 1,
                speed: 1,
                isReversed: false,
                opacity: 1,
                effects: [
                  {
                    id: "effect-1",
                    effectId: "blur",
                    enabled: true,
                    order: 0,
                    customParams: { intensity: 0.5 },
                  },
                ],
                filters: [],
                transitions: [
                  {
                    id: "trans-1",
                    transitionId: "fade",
                    duration: 0.5,
                    type: "in" as const,
                    isEnabled: true,
                    customParams: {},
                  },
                ],
                isSelected: false,
                isLocked: false,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ],
          },
        ],
      },
    ],
  }

  const mockSection: TimelineSection = mockProject.sections[0]
  const mockClips: TimelineClip[] = mockProject.sections[0].tracks[0].clips

  describe("createTimelineContextPrompt", () => {
    it("должен создать базовый промпт без проекта", () => {
      const prompt = createTimelineContextPrompt(null)

      expect(prompt).toContain("AI ассистент в видеоредакторе Timeline Studio")
      expect(prompt).toContain("Проект не открыт")
    })

    it("должен создать промпт с информацией о проекте", () => {
      const prompt = createTimelineContextPrompt(mockProject)

      expect(prompt).toContain("Мой проект")
      expect(prompt).toContain("Тестовый проект для видео")
      expect(prompt).toContain("1920x1080")
      expect(prompt).toContain("30")
      expect(prompt).toContain("16:9")
    })

    it("должен включать статистику проекта", () => {
      const prompt = createTimelineContextPrompt(mockProject)

      expect(prompt).toContain("Длительность: 10с")
      expect(prompt).toContain("Количество секций: 1")
      expect(prompt).toContain("Количество треков: 1")
      expect(prompt).toContain("Количество клипов: 2")
      expect(prompt).toContain("Использовано эффектов: 1")
      expect(prompt).toContain("Использовано переходов: 1")
    })

    it("должен включать информацию об активной секции", () => {
      const prompt = createTimelineContextPrompt(mockProject, mockSection)

      expect(prompt).toContain("Активная секция:")
      expect(prompt).toContain("Вступление")
      expect(prompt).toContain("Длительность: 10с")
      expect(prompt).toContain("Количество треков: 1")
    })

    it("должен включать информацию о выбранных клипах", () => {
      const prompt = createTimelineContextPrompt(mockProject, mockSection, mockClips)

      expect(prompt).toContain("Выбранные клипы (2)")
      expect(prompt).toContain('"intro.mp4" (5с)')
      expect(prompt).toContain('"title.mp4" (5с) с 1 эффектами')
    })

    it("должен ограничивать количество отображаемых клипов", () => {
      const manyClips = Array(10)
        .fill(null)
        .map((_, i) => ({
          ...mockClips[0],
          id: `clip-${i}`,
          name: `clip-${i}.mp4`,
        }))

      const prompt = createTimelineContextPrompt(mockProject, mockSection, manyClips)

      expect(prompt).toContain("Выбранные клипы (10)")
      expect(prompt).toContain("... и еще 7 клипов")
    })
  })

  describe("createDetailedTimelineContext", () => {
    it("должен возвращать пустой контекст без проекта", () => {
      const context = createDetailedTimelineContext(null)

      expect(context.hasProject).toBe(false)
      expect(context.projectName).toBe(null)
      expect(context.projectStats).toBe(null)
      expect(context.activeSection).toBe(null)
      expect(context.selectedClips).toEqual([])
    })

    it("должен создавать подробный контекст с проектом", () => {
      const context = createDetailedTimelineContext(mockProject)

      expect(context.hasProject).toBe(true)
      expect(context.projectName).toBe("Мой проект")
      expect(context.projectDescription).toBe("Тестовый проект для видео")
      expect(context.projectSettings).toEqual({
        resolution: { width: 1920, height: 1080 },
        fps: 30,
        aspectRatio: "16:9",
      })
    })

    it("должен включать правильную статистику проекта", () => {
      const context = createDetailedTimelineContext(mockProject)

      expect(context.projectStats).toEqual({
        totalDuration: 10,
        sectionCount: 1,
        trackCount: 1,
        clipCount: 2,
        effectCount: 1,
        transitionCount: 1,
      })
    })

    it("должен включать информацию об активной секции", () => {
      const context = createDetailedTimelineContext(mockProject, mockSection)

      expect(context.activeSection).toEqual({
        name: "Вступление",
        duration: 10,
        trackCount: 1,
      })
    })

    it("должен включать информацию о выбранных клипах", () => {
      const context = createDetailedTimelineContext(mockProject, mockSection, mockClips)

      expect(context.selectedClips).toHaveLength(2)
      expect(context.selectedClips[0]).toEqual({
        name: "intro.mp4",
        duration: 5,
        effectCount: 0,
        hasTransitions: false,
      })
      expect(context.selectedClips[1]).toEqual({
        name: "title.mp4",
        duration: 5,
        effectCount: 1,
        hasTransitions: true,
      })
    })
  })

  describe("formatDuration", () => {
    it("должен форматировать секунды", () => {
      const prompt = createTimelineContextPrompt({
        ...mockProject,
        sections: [
          {
            ...mockSection,
            duration: 45,
          },
        ],
      })

      expect(prompt).toContain("45с")
    })

    it("должен форматировать минуты и секунды", () => {
      const prompt = createTimelineContextPrompt({
        ...mockProject,
        sections: [
          {
            ...mockSection,
            duration: 125,
          },
        ],
      })

      expect(prompt).toContain("2м 5с")
    })

    it("должен форматировать часы, минуты и секунды", () => {
      const prompt = createTimelineContextPrompt({
        ...mockProject,
        sections: [
          {
            ...mockSection,
            duration: 3665,
          },
        ],
      })

      expect(prompt).toContain("1ч 1м 5с")
    })
  })
})
