import { describe, expect, it } from "vitest"

import { TimelineClip, TimelineProject, TimelineSection } from "@/features/timeline/types"

import { createDetailedTimelineContext, createTimelineContextPrompt } from "../../utils/timeline-context"

describe("timeline-context utils", () => {
  const mockProject: TimelineProject = {
    id: "project-1",
    name: "Мой проект",
    description: "Тестовый проект для видео",
    settings: {
      resolution: { width: 1920, height: 1080 },
      fps: 30,
      aspectRatio: "16:9",
    },
    sections: [
      {
        id: "section-1",
        name: "Вступление",
        startTime: 0,
        duration: 10,
        tracks: [
          {
            id: "track-1",
            name: "Видео 1",
            type: "video",
            clips: [
              {
                id: "clip-1",
                name: "intro.mp4",
                type: "video",
                startFrame: 0,
                endFrame: 150,
                sourceStartFrame: 0,
                sourceEndFrame: 150,
                effects: [],
              },
              {
                id: "clip-2",
                name: "title.mp4",
                type: "video",
                startFrame: 150,
                endFrame: 300,
                sourceStartFrame: 0,
                sourceEndFrame: 150,
                effects: [{ id: "effect-1", type: "blur" as any, params: {} }],
                transitionIn: { id: "trans-1", type: "fade", duration: 0.5 },
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
