import { beforeEach, describe, expect, it } from "vitest"

import { VideoEffect } from "@/features/effects/types"
import { VideoFilter } from "@/features/filters/types/filters"
import { MediaFile } from "@/features/media/types/media"
import { StyleTemplate } from "@/features/style-templates/types/style-template"
import { MediaTemplate } from "@/features/templates/lib/templates"
import { Transition } from "@/features/transitions/types/transitions"

import { ResourceManager } from "../../services/resource-manager"
import { TimelineProject } from "../../types/timeline"

describe("ResourceManager", () => {
  let mockProject: TimelineProject

  beforeEach(() => {
    mockProject = {
      id: "test-project",
      name: "Test Project",
      description: "",
      version: "0.0.1",
      creator: "Test User",
      createdDate: new Date().toISOString(),
      modifiedDate: new Date().toISOString(),
      framerate: 30,
      sections: [],
      duration: 0,
      width: 1920,
      height: 1080,
    }
  })

  describe("addEffectToResources", () => {
    const mockEffect: VideoEffect = {
      id: "effect-1",
      name: "Test Effect",
      type: "color",
      category: "basic",
      description: "Test effect description",
      preview: "preview.png",
      parameters: {},
      applyEffect: () => ({}),
    }

    it("should create resources object if not exists", () => {
      const result = ResourceManager.addEffectToResources(mockProject, mockEffect)

      expect(result.resources).toBeDefined()
      expect(result.resources?.effects).toHaveLength(1)
      expect(result.resources?.effects[0]).toBe(mockEffect)
    })

    it("should add effect to existing resources", () => {
      mockProject.resources = {
        effects: [],
        filters: [],
        transitions: [],
        templates: [],
        styleTemplates: [],
        subtitleStyles: [],
        music: [],
        media: [],
      }

      const result = ResourceManager.addEffectToResources(mockProject, mockEffect)

      expect(result.resources?.effects).toHaveLength(1)
      expect(result.resources?.effects[0]).toBe(mockEffect)
    })

    it("should not add duplicate effects", () => {
      mockProject.resources = {
        effects: [mockEffect],
        filters: [],
        transitions: [],
        templates: [],
        styleTemplates: [],
        subtitleStyles: [],
        music: [],
        media: [],
      }

      const result = ResourceManager.addEffectToResources(mockProject, mockEffect)

      expect(result.resources?.effects).toHaveLength(1)
    })
  })

  describe("addFilterToResources", () => {
    const mockFilter: VideoFilter = {
      id: "filter-1",
      name: "Test Filter",
      type: "blur",
      category: "basic",
      description: "Test filter description",
      preview: "preview.png",
      parameters: {},
      applyFilter: () => ({}),
    }

    it("should add filter to resources", () => {
      const result = ResourceManager.addFilterToResources(mockProject, mockFilter)

      expect(result.resources?.filters).toHaveLength(1)
      expect(result.resources?.filters[0]).toBe(mockFilter)
    })

    it("should not add duplicate filters", () => {
      mockProject.resources = {
        effects: [],
        filters: [mockFilter],
        transitions: [],
        templates: [],
        styleTemplates: [],
        subtitleStyles: [],
        music: [],
        media: [],
      }

      const result = ResourceManager.addFilterToResources(mockProject, mockFilter)

      expect(result.resources?.filters).toHaveLength(1)
    })
  })

  describe("addTransitionToResources", () => {
    const mockTransition: Transition = {
      id: "transition-1",
      name: "Test Transition",
      type: "fade",
      category: "basic",
      description: "Test transition description",
      preview: "preview.png",
      duration: 1000,
      parameters: {},
      applyTransition: () => ({}),
    }

    it("should add transition to resources", () => {
      const result = ResourceManager.addTransitionToResources(mockProject, mockTransition)

      expect(result.resources?.transitions).toHaveLength(1)
      expect(result.resources?.transitions[0]).toBe(mockTransition)
    })

    it("should not add duplicate transitions", () => {
      mockProject.resources = {
        effects: [],
        filters: [],
        transitions: [mockTransition],
        templates: [],
        styleTemplates: [],
        subtitleStyles: [],
        music: [],
        media: [],
      }

      const result = ResourceManager.addTransitionToResources(mockProject, mockTransition)

      expect(result.resources?.transitions).toHaveLength(1)
    })
  })

  describe("addTemplateToResources", () => {
    const mockTemplate: MediaTemplate = {
      id: "template-1",
      name: "Test Template",
      type: "grid",
      columns: 2,
      rows: 2,
      positions: [],
    }

    it("should add template to resources", () => {
      const result = ResourceManager.addTemplateToResources(mockProject, mockTemplate)

      expect(result.resources?.templates).toHaveLength(1)
      expect(result.resources?.templates[0]).toBe(mockTemplate)
    })

    it("should not add duplicate templates", () => {
      mockProject.resources = {
        effects: [],
        filters: [],
        transitions: [],
        templates: [mockTemplate],
        styleTemplates: [],
        subtitleStyles: [],
        music: [],
        media: [],
      }

      const result = ResourceManager.addTemplateToResources(mockProject, mockTemplate)

      expect(result.resources?.templates).toHaveLength(1)
    })
  })

  describe("addStyleTemplateToResources", () => {
    const mockStyleTemplate: StyleTemplate = {
      id: "style-template-1",
      name: "Test Style Template",
      category: "intro",
      description: "Test style template",
      preview: "preview.png",
      duration: 5000,
      hasAudio: false,
      parameters: {
        text: [],
        colors: [],
        media: [],
      },
    }

    it("should add style template to resources", () => {
      const result = ResourceManager.addStyleTemplateToResources(mockProject, mockStyleTemplate)

      expect(result.resources?.styleTemplates).toHaveLength(1)
      expect(result.resources?.styleTemplates[0]).toBe(mockStyleTemplate)
    })

    it("should not add duplicate style templates", () => {
      mockProject.resources = {
        effects: [],
        filters: [],
        transitions: [],
        templates: [],
        styleTemplates: [mockStyleTemplate],
        subtitleStyles: [],
        music: [],
        media: [],
      }

      const result = ResourceManager.addStyleTemplateToResources(mockProject, mockStyleTemplate)

      expect(result.resources?.styleTemplates).toHaveLength(1)
    })
  })

  describe("addMediaToResources", () => {
    const mockMedia: MediaFile = {
      id: "media-1",
      name: "test.mp4",
      path: "/path/to/test.mp4",
      size: 1000000,
      type: "video",
      format: "mp4",
      duration: 10,
      createdAt: new Date(),
    }

    it("should add media to resources", () => {
      const result = ResourceManager.addMediaToResources(mockProject, mockMedia)

      expect(result.resources?.media).toHaveLength(1)
      expect(result.resources?.media[0]).toBe(mockMedia)
    })

    it("should not add duplicate media", () => {
      mockProject.resources = {
        effects: [],
        filters: [],
        transitions: [],
        templates: [],
        styleTemplates: [],
        subtitleStyles: [],
        music: [],
        media: [mockMedia],
      }

      const result = ResourceManager.addMediaToResources(mockProject, mockMedia)

      expect(result.resources?.media).toHaveLength(1)
    })
  })

  describe("createAppliedEffect", () => {
    const mockEffect: VideoEffect = {
      id: "effect-1",
      name: "Test Effect",
      type: "color",
      category: "basic",
      description: "Test effect description",
      preview: "preview.png",
      parameters: {},
      applyEffect: () => ({}),
    }

    it("should create applied effect and add to resources", () => {
      const customParams = { intensity: 0.5 }
      const { project, appliedEffect } = ResourceManager.createAppliedEffect(mockProject, mockEffect, customParams)

      expect(project.resources?.effects).toHaveLength(1)
      expect(project.resources?.effects[0]).toBe(mockEffect)

      expect(appliedEffect.effectId).toBe(mockEffect.id)
      expect(appliedEffect.customParams).toEqual(customParams)
      expect(appliedEffect.isEnabled).toBe(true)
      expect(appliedEffect.order).toBe(0)
      expect(appliedEffect.id).toMatch(/^applied-effect-1-\d+$/)
    })
  })

  describe("createAppliedFilter", () => {
    const mockFilter: VideoFilter = {
      id: "filter-1",
      name: "Test Filter",
      type: "blur",
      category: "basic",
      description: "Test filter description",
      preview: "preview.png",
      parameters: {},
      applyFilter: () => ({}),
    }

    it("should create applied filter and add to resources", () => {
      const customParams = { radius: 10 }
      const { project, appliedFilter } = ResourceManager.createAppliedFilter(mockProject, mockFilter, customParams)

      expect(project.resources?.filters).toHaveLength(1)
      expect(project.resources?.filters[0]).toBe(mockFilter)

      expect(appliedFilter.filterId).toBe(mockFilter.id)
      expect(appliedFilter.customParams).toEqual(customParams)
      expect(appliedFilter.isEnabled).toBe(true)
      expect(appliedFilter.order).toBe(0)
      expect(appliedFilter.id).toMatch(/^applied-filter-1-\d+$/)
    })
  })

  describe("createAppliedTransition", () => {
    const mockTransition: Transition = {
      id: "transition-1",
      name: "Test Transition",
      type: "fade",
      category: "basic",
      description: "Test transition description",
      preview: "preview.png",
      duration: 1000,
      parameters: {},
      applyTransition: () => ({}),
    }

    it("should create applied transition and add to resources", () => {
      const customParams = { easing: "ease-in-out" }
      const { project, appliedTransition } = ResourceManager.createAppliedTransition(
        mockProject,
        mockTransition,
        500,
        "in",
        customParams,
      )

      expect(project.resources?.transitions).toHaveLength(1)
      expect(project.resources?.transitions[0]).toBe(mockTransition)

      expect(appliedTransition.transitionId).toBe(mockTransition.id)
      expect(appliedTransition.duration).toBe(500)
      expect(appliedTransition.type).toBe("in")
      expect(appliedTransition.customParams).toEqual(customParams)
      expect(appliedTransition.isEnabled).toBe(true)
      expect(appliedTransition.id).toMatch(/^applied-transition-1-\d+$/)
    })
  })

  describe("createAppliedStyleTemplate", () => {
    const mockStyleTemplate: StyleTemplate = {
      id: "style-template-1",
      name: "Test Style Template",
      category: "intro",
      description: "Test style template",
      preview: "preview.png",
      duration: 5000,
      hasAudio: false,
      parameters: {
        text: [],
        colors: [],
        media: [],
      },
    }

    it("should create applied style template and add to resources", () => {
      const customizations = {
        text: { title: "Custom Title" },
        colors: { primary: "#ff0000" },
      }
      const { project, appliedStyleTemplate } = ResourceManager.createAppliedStyleTemplate(
        mockProject,
        mockStyleTemplate,
        customizations,
      )

      expect(project.resources?.styleTemplates).toHaveLength(1)
      expect(project.resources?.styleTemplates[0]).toBe(mockStyleTemplate)

      expect(appliedStyleTemplate.styleTemplateId).toBe(mockStyleTemplate.id)
      expect(appliedStyleTemplate.customizations).toEqual(customizations)
      expect(appliedStyleTemplate.isEnabled).toBe(true)
      expect(appliedStyleTemplate.id).toMatch(/^applied-style-template-1-\d+$/)
    })
  })

  describe("cleanupUnusedResources", () => {
    it("should remove unused resources from project", () => {
      const usedEffect: VideoEffect = {
        id: "used-effect",
        name: "Used Effect",
        type: "color",
        category: "basic",
        description: "Used",
        preview: "preview.png",
        parameters: {},
        applyEffect: () => ({}),
      }

      const unusedEffect: VideoEffect = {
        id: "unused-effect",
        name: "Unused Effect",
        type: "color",
        category: "basic",
        description: "Unused",
        preview: "preview.png",
        parameters: {},
        applyEffect: () => ({}),
      }

      const usedMedia: MediaFile = {
        id: "used-media",
        name: "used.mp4",
        path: "/path/to/used.mp4",
        size: 1000000,
        type: "video",
        format: "mp4",
        duration: 10,
        createdAt: new Date(),
      }

      const unusedMedia: MediaFile = {
        id: "unused-media",
        name: "unused.mp4",
        path: "/path/to/unused.mp4",
        size: 1000000,
        type: "video",
        format: "mp4",
        duration: 10,
        createdAt: new Date(),
      }

      mockProject.resources = {
        effects: [usedEffect, unusedEffect],
        filters: [],
        transitions: [],
        templates: [],
        styleTemplates: [],
        subtitleStyles: [],
        music: [],
        media: [usedMedia, unusedMedia],
      }

      mockProject.sections = [
        {
          id: "section-1",
          name: "Section 1",
          start: 0,
          duration: 10,
          tracks: [
            {
              id: "track-1",
              name: "Track 1",
              type: "video",
              order: 0,
              height: 100,
              isLocked: false,
              isVisible: true,
              clips: [
                {
                  id: "clip-1",
                  trackId: "track-1",
                  mediaId: "used-media",
                  start: 0,
                  duration: 5,
                  offset: 0,
                  effects: [
                    {
                      id: "applied-effect-1",
                      effectId: "used-effect",
                      isEnabled: true,
                      order: 0,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ]

      const result = ResourceManager.cleanupUnusedResources(mockProject)

      expect(result.resources?.effects).toHaveLength(1)
      expect(result.resources?.effects[0].id).toBe("used-effect")
      expect(result.resources?.media).toHaveLength(1)
      expect(result.resources?.media[0].id).toBe("used-media")
    })

    it("should handle project without resources", () => {
      const result = ResourceManager.cleanupUnusedResources(mockProject)
      expect(result).toEqual(mockProject)
    })

    it("should handle global tracks", () => {
      const usedFilter: VideoFilter = {
        id: "used-filter",
        name: "Used Filter",
        type: "blur",
        category: "basic",
        description: "Used",
        preview: "preview.png",
        parameters: {},
        applyFilter: () => ({}),
      }

      mockProject.resources = {
        effects: [],
        filters: [usedFilter],
        transitions: [],
        templates: [],
        styleTemplates: [],
        subtitleStyles: [],
        music: [],
        media: [],
      }

      mockProject.globalTracks = [
        {
          id: "global-track-1",
          name: "Global Track 1",
          type: "audio",
          order: 0,
          height: 100,
          isLocked: false,
          isVisible: true,
          trackFilters: [
            {
              id: "applied-filter-1",
              filterId: "used-filter",
              isEnabled: true,
              order: 0,
            },
          ],
        },
      ]

      const result = ResourceManager.cleanupUnusedResources(mockProject)

      expect(result.resources?.filters).toHaveLength(1)
      expect(result.resources?.filters[0].id).toBe("used-filter")
    })
  })
})
