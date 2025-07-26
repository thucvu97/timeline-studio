import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

// Mock ClaudeService
vi.mock("../../services/claude-service", () => ({
  CLAUDE_MODELS: {
    CLAUDE_4_SONNET: "claude-4-sonnet-latest",
    CLAUDE_4_OPUS: "claude-4-opus-latest",
  },
  ClaudeService: {
    getInstance: vi.fn(),
  },
}))

// Mock ApiKeyLoader
vi.mock("../../services/api-key-loader", () => ({
  ApiKeyLoader: {
    getInstance: vi.fn(),
  },
}))

// Mock tools
vi.mock("../../tools/browser-tools", () => ({
  browserTools: [
    {
      name: "browser_tool",
      description: "Browser tool",
      input_schema: { type: "object", properties: {} },
    },
  ],
}))

vi.mock("../../tools/player-tools", () => ({
  playerTools: [
    {
      name: "player_tool",
      description: "Player tool",
      input_schema: { type: "object", properties: {} },
    },
  ],
}))

vi.mock("../../tools/resource-tools", () => ({
  resourceTools: [
    {
      name: "resource_tool",
      description: "Resource tool",
      input_schema: { type: "object", properties: {} },
    },
  ],
}))

vi.mock("../../tools/timeline-tools", () => ({
  timelineTools: [
    {
      name: "timeline_tool",
      description: "Timeline tool",
      input_schema: { type: "object", properties: {} },
    },
  ],
}))

vi.mock("../../tools/subtitle-tools", () => ({
  subtitleTools: Array.from({ length: 12 }, (_, i) => ({
    name: `subtitle_tool_${i + 1}`,
    description: "Subtitle tool",
    input_schema: { type: "object", properties: {} },
  })),
  executeSubtitleTool: vi.fn(),
}))

vi.mock("../../tools/video-analysis-tools", () => ({
  videoAnalysisTools: Array.from({ length: 15 }, (_, i) => ({
    name: `video_analysis_tool_${i + 1}`,
    description: "Video analysis tool",
    input_schema: { type: "object", properties: {} },
  })),
  executeVideoAnalysisTool: vi.fn(),
}))

vi.mock("../../tools/whisper-tools", () => ({
  whisperTools: Array.from({ length: 10 }, (_, i) => ({
    name: `whisper_tool_${i + 1}`,
    description: "Whisper tool",
    input_schema: { type: "object", properties: {} },
  })),
  executeWhisperTool: vi.fn(),
}))

vi.mock("../../tools/batch-processing-tools", () => ({
  batchProcessingTools: Array.from({ length: 12 }, (_, i) => ({
    name: `batch_tool_${i + 1}`,
    description: "Batch processing tool",
    input_schema: { type: "object", properties: {} },
  })),
  executeBatchProcessingTool: vi.fn(),
}))

vi.mock("../../tools/multimodal-analysis-tools", () => ({
  multimodalAnalysisTools: Array.from({ length: 10 }, (_, i) => ({
    name: `multimodal_tool_${i + 1}`,
    description: "Multimodal analysis tool",
    input_schema: { type: "object", properties: {} },
  })),
  executeMultimodalAnalysisTool: vi.fn(),
}))

vi.mock("../../tools/platform-optimization-tools", () => ({
  platformOptimizationTools: Array.from({ length: 10 }, (_, i) => ({
    name: `platform_tool_${i + 1}`,
    description: "Platform optimization tool",
    input_schema: { type: "object", properties: {} },
  })),
  executePlatformOptimizationTool: vi.fn(),
}))

vi.mock("../../tools/workflow-automation-tools", () => ({
  workflowAutomationTools: Array.from({ length: 9 }, (_, i) => ({
    name: `workflow_tool_${i + 1}`,
    description: "Workflow automation tool",
    input_schema: { type: "object", properties: {} },
  })),
  executeWorkflowAutomationTool: vi.fn(),
}))

import { VideoEffect } from "../../../effects/types"
import { VideoFilter } from "../../../filters/types/filters"
import { MediaFile } from "../../../media/types/media"
import {
  EffectResource,
  FilterResource,
  MediaResource,
  MusicResource,
  StyleTemplateResource,
  TemplateResource,
  TransitionResource,
} from "../../../resources/types"
import { TimelineProject } from "../../../timeline/types"
import { ApiKeyLoader } from "../../services/api-key-loader"
import { CLAUDE_MODELS, ClaudeService } from "../../services/claude-service"
import { TimelineAIService } from "../../services/timeline-ai-service"

import type { ResourcesContextType } from "../../../resources/services/resources-provider"

describe("TimelineAIService", () => {
  let service: TimelineAIService
  let mockClaudeService: any
  let mockResourcesProvider: ResourcesContextType
  let mockBrowserState: any
  let mockPlayerState: any
  let mockTimelineState: any

  // Helper function to create mock media file
  const createMockMediaFile = (id: string, name: string, duration = 10): MediaFile => ({
    id,
    name,
    path: `/media/${id}`,
    duration,
    size: 1000000,
    isVideo: true,
    isAudio: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })

  // Helper function to create mock effect
  const createMockEffect = (id: string, name: string): VideoEffect => ({
    id,
    name: { en: name, ru: name },
    description: { en: `${name} effect`, ru: `${name} эффект` },
    category: "color_correction" as const,
    scope: ["clip"],
    processingType: "realtime",
    version: "1.0.0",
    tags: [],
    parameters: [],
    presets: [],
    complexity: "low" as const,
    gpuAccelerated: false,
    processors: {},
  })

  // Helper function to create mock filter
  const createMockFilter = (id: string, name: string): VideoFilter => ({
    id,
    name,
    category: "color-correction" as const,
    complexity: "basic" as const,
    tags: [],
    description: { en: `${name} filter` },
    labels: { en: name },
    params: {},
  })

  // Helper function to create mock resources
  const createMockResources = () => ({
    mediaResources: [
      { id: "media-1", file: createMockMediaFile("media-1", "video1.mp4", 30) },
      { id: "media-2", file: createMockMediaFile("media-2", "video2.mp4", 45) },
    ] as MediaResource[],
    effectResources: [
      { id: "effect-1", effect: createMockEffect("effect-1", "Blur") },
      { id: "effect-2", effect: createMockEffect("effect-2", "Fade") },
    ] as EffectResource[],
    filterResources: [{ id: "filter-1", filter: createMockFilter("filter-1", "Vintage") }] as FilterResource[],
    transitionResources: [] as TransitionResource[],
    templateResources: [] as TemplateResource[],
    styleTemplateResources: [] as StyleTemplateResource[],
    musicResources: [{ id: "music-1", file: createMockMediaFile("music-1", "background.mp3", 120) }] as MusicResource[],
  })

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock ClaudeService instance
    mockClaudeService = {
      setApiKey: vi.fn(),
      sendRequestWithTools: vi.fn(),
    }
    vi.mocked(ClaudeService.getInstance).mockReturnValue(mockClaudeService)

    // Mock ResourcesProvider
    const resources = createMockResources()
    mockResourcesProvider = {
      ...resources,
      addResource: vi.fn(),
      addMedia: vi.fn(),
      addMusic: vi.fn(),
      addSubtitle: vi.fn(),
      addEffect: vi.fn(),
      addFilter: vi.fn(),
      addTransition: vi.fn(),
      addTemplate: vi.fn(),
      addStyleTemplate: vi.fn(),
      removeResource: vi.fn(),
      updateResource: vi.fn(),
      isAdded: vi.fn(),
      isMediaAdded: vi.fn(),
      isMusicAdded: vi.fn(),
      isSubtitleAdded: vi.fn(),
      isEffectAdded: vi.fn(),
      isFilterAdded: vi.fn(),
      isTransitionAdded: vi.fn(),
      isTemplateAdded: vi.fn(),
      isStyleTemplateAdded: vi.fn(),
      subtitleResources: [],
    } as any

    // Mock browser state
    mockBrowserState = {
      activeTab: "media",
      tabSettings: {
        media: {
          searchQuery: "test",
          filterType: "all",
          sortBy: "name",
          sortOrder: "asc",
        },
      },
    }

    // Mock player state
    mockPlayerState = {
      video: createMockMediaFile("current-video", "playing.mp4"),
      isPlaying: true,
      currentTime: 5.5,
      duration: 30,
      volume: 0.8,
      appliedEffects: ["blur"],
      appliedFilters: ["vintage"],
      appliedTemplate: null,
    }

    // Mock timeline state
    const mockProject: TimelineProject = {
      id: "project-1",
      name: "Test Project",
      duration: 0,
      fps: 30,
      sampleRate: 48000,
      sections: [],
      globalTracks: [],
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
      settings: {
        resolution: { width: 1920, height: 1080 },
        fps: 30,
        aspectRatio: "16:9",
        sampleRate: 48000,
        channels: 2,
        bitDepth: 16,
        timeFormat: "timecode" as const,
        snapToGrid: false,
        gridSize: 1,
        autoSave: true,
        autoSaveInterval: 300,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      version: "1.0.0",
    }
    mockTimelineState = {
      project: mockProject,
    }

    // Create service instance
    service = new TimelineAIService(mockResourcesProvider, mockBrowserState, mockPlayerState, mockTimelineState)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe("Initialization", () => {
    it("should create an instance of TimelineAIService", () => {
      expect(service).toBeInstanceOf(TimelineAIService)
    })

    it("should initialize ClaudeService singleton", () => {
      expect(ClaudeService.getInstance).toHaveBeenCalled()
    })
  })

  describe("initializeApiKey", () => {
    it("should initialize API key from secure storage", async () => {
      // Mock ApiKeyLoader
      const mockGetApiKey = vi.fn().mockResolvedValue("test-api-key-123")
      const mockUpdateCache = vi.fn()
      vi.mocked(ApiKeyLoader.getInstance).mockReturnValue({
        getApiKey: mockGetApiKey,
        clearCache: vi.fn(),
        updateCache: mockUpdateCache,
      } as any)

      const result = await service.initializeApiKey()

      expect(mockGetApiKey).toHaveBeenCalledWith("claude")
      expect(mockUpdateCache).toHaveBeenCalledWith("claude", "test-api-key-123")
      expect(result).toBe(true)
    })

    it("should return false when no API key is found", async () => {
      // Mock ApiKeyLoader
      const mockGetApiKey = vi.fn().mockResolvedValue(null)
      const mockUpdateCache = vi.fn()
      vi.mocked(ApiKeyLoader.getInstance).mockReturnValue({
        getApiKey: mockGetApiKey,
        clearCache: vi.fn(),
        updateCache: mockUpdateCache,
      } as any)

      const result = await service.initializeApiKey()

      expect(mockGetApiKey).toHaveBeenCalledWith("claude")
      expect(mockUpdateCache).not.toHaveBeenCalled()
      expect(result).toBe(false)
    })
  })

  describe("createTimelineFromPrompt", () => {
    it("should successfully create timeline from prompt", async () => {
      const mockResponse = {
        text: "Timeline created successfully",
        tool_use: {
          name: "create_timeline",
          input: { projectName: "New Project" },
        },
      }
      mockClaudeService.sendRequestWithTools.mockResolvedValueOnce(mockResponse)

      const result = await service.createTimelineFromPrompt("Create a timeline from my vacation videos")

      expect(mockClaudeService.sendRequestWithTools).toHaveBeenCalledWith(
        CLAUDE_MODELS.CLAUDE_4_SONNET,
        [{ role: "user", content: "Create a timeline from my vacation videos" }],
        (service as any).allTools,
        expect.objectContaining({
          system: expect.stringContaining("Timeline Studio"),
          temperature: 0.7,
          max_tokens: 4000,
        }),
      )

      expect(result).toMatchObject({
        success: true,
        message: "Timeline created successfully",
        executionTime: expect.any(Number),
      })
    })

    it("should handle errors when creating timeline", async () => {
      const error = new Error("Claude API error")
      mockClaudeService.sendRequestWithTools.mockRejectedValueOnce(error)

      const result = await service.createTimelineFromPrompt("Create timeline")

      expect(result).toMatchObject({
        success: false,
        message: "Ошибка при создании Timeline: Claude API error",
        errors: ["Claude API error"],
        executionTime: expect.any(Number),
      })
    })

    it("should include context information in system prompt", async () => {
      mockClaudeService.sendRequestWithTools.mockResolvedValueOnce({
        text: "Done",
      })

      await service.createTimelineFromPrompt("Test prompt")

      const callArgs = mockClaudeService.sendRequestWithTools.mock.calls[0]
      const systemPrompt = callArgs[3].system

      expect(systemPrompt).toContain("2 медиафайлов") // 2 media resources
      expect(systemPrompt).toContain("media") // active tab
      expect(systemPrompt).toContain("Test Project") // current project name
      expect(systemPrompt).toContain("воспроизводит playing.mp4") // playing video
    })
  })

  describe("analyzeAndSuggestResources", () => {
    it("should analyze resources and provide suggestions", async () => {
      const mockResponse = {
        text: "Analysis complete. I suggest adding transitions between clips.",
      }
      mockClaudeService.sendRequestWithTools.mockResolvedValueOnce(mockResponse)

      const result = await service.analyzeAndSuggestResources("Analyze my media and suggest improvements")

      expect(mockClaudeService.sendRequestWithTools).toHaveBeenCalledWith(
        CLAUDE_MODELS.CLAUDE_4_SONNET,
        [{ role: "user", content: "Analyze my media and suggest improvements" }],
        expect.arrayContaining([
          expect.objectContaining({ name: "resource_tool" }),
          expect.objectContaining({ name: "browser_tool" }),
        ]),
        expect.objectContaining({
          system: expect.stringContaining("анализа медиа ресурсов в Timeline Studio"),
          temperature: 0.5,
          max_tokens: 2000,
        }),
      )

      expect(result).toMatchObject({
        success: true,
        message: expect.stringContaining("Analysis complete"),
        executionTime: expect.any(Number),
      })
    })

    it("should handle analysis errors", async () => {
      const error = new Error("Analysis failed")
      mockClaudeService.sendRequestWithTools.mockRejectedValueOnce(error)

      const result = await service.analyzeAndSuggestResources("Analyze")

      expect(result).toMatchObject({
        success: false,
        message: "Ошибка при анализе ресурсов: Analysis failed",
        errors: ["Analysis failed"],
        executionTime: expect.any(Number),
      })
    })

    it("should include resource stats in analysis prompt", async () => {
      mockClaudeService.sendRequestWithTools.mockResolvedValueOnce({
        text: "Analysis done",
      })

      await service.analyzeAndSuggestResources("Test analysis")

      const callArgs = mockClaudeService.sendRequestWithTools.mock.calls[0]
      const systemPrompt = callArgs[3].system

      expect(systemPrompt).toContain("Медиафайлы: 2") // 2 media resources
      expect(systemPrompt).toContain("Эффекты: 2") // 2 effects
      expect(systemPrompt).toContain("анализа медиа ресурсов") // analysis prompt type
    })
  })

  describe("executeCommand", () => {
    it("should execute command with parameters", async () => {
      const mockResponse = {
        text: "Command executed successfully",
        tool_use: {
          name: "apply_effect",
          input: { effect: "blur", intensity: 0.5 },
        },
      }
      mockClaudeService.sendRequestWithTools.mockResolvedValueOnce(mockResponse)

      const params = { clipId: "clip-1", effect: "blur" }
      const result = await service.executeCommand("Apply blur effect", params)

      expect(mockClaudeService.sendRequestWithTools).toHaveBeenCalledWith(
        CLAUDE_MODELS.CLAUDE_4_SONNET,
        [
          {
            role: "user",
            content: expect.stringContaining("Apply blur effect"),
          },
        ],
        (service as any).allTools,
        expect.objectContaining({
          temperature: 0.6,
          max_tokens: 3000,
        }),
      )

      // Check that parameters are included in the prompt
      const promptContent = mockClaudeService.sendRequestWithTools.mock.calls[0][1][0].content
      expect(promptContent).toContain('"clipId": "clip-1"')
      expect(promptContent).toContain('"effect": "blur"')

      expect(result).toMatchObject({
        success: true,
        message: "Command executed successfully",
        executionTime: expect.any(Number),
      })
    })

    it("should handle command execution errors", async () => {
      const error = new Error("Command failed")
      mockClaudeService.sendRequestWithTools.mockRejectedValueOnce(error)

      const result = await service.executeCommand("Test command")

      expect(result).toMatchObject({
        success: false,
        message: "Ошибка при выполнении команды: Command failed",
        errors: ["Command failed"],
        executionTime: expect.any(Number),
      })
    })
  })

  describe("processClaudeResponse", () => {
    it("should process response without tool use", async () => {
      const response = {
        text: "Simple text response",
      }

      const result = await (service as any).processClaudeResponse(response, {} as any)

      expect(result).toEqual({
        success: true,
        message: "Simple text response",
        data: {},
      })
    })

    it("should process response with tool use", async () => {
      const response = {
        text: "Using tool to add effect",
        tool_use: {
          name: "add_effect",
          input: { effectId: "blur", target: "clip-1" },
        },
      }

      // Spy on executeToolFunction
      const executeToolSpy = vi.spyOn(service as any, "executeToolFunction")
      executeToolSpy.mockResolvedValueOnce({
        success: true,
        message: "Effect added",
        data: { addedEffect: "blur" },
      })

      const result = await (service as any).processClaudeResponse(response, {} as any)

      expect(executeToolSpy).toHaveBeenCalledWith(response.tool_use, {})
      expect(result).toEqual({
        success: true,
        message: "Using tool to add effect",
        data: { addedEffect: "blur" },
      })
    })

    it("should handle tool execution errors", async () => {
      const response = {
        text: "Trying to use tool",
        tool_use: {
          name: "failing_tool",
          input: {},
        },
      }

      const executeToolSpy = vi.spyOn(service as any, "executeToolFunction")
      executeToolSpy.mockRejectedValueOnce(new Error("Tool execution failed"))

      const result = await (service as any).processClaudeResponse(response, {} as any)

      expect(result).toEqual({
        success: false,
        message: "Trying to use tool",
        data: {},
        errors: ["Ошибка выполнения инструмента: Tool execution failed"],
      })
    })

    it("should merge data from tool execution", async () => {
      const response = {
        text: "Multiple operations",
        tool_use: {
          name: "complex_tool",
          input: {},
        },
      }

      const executeToolSpy = vi.spyOn(service as any, "executeToolFunction")
      executeToolSpy.mockResolvedValueOnce({
        success: true,
        message: "Complex operation complete",
        data: {
          createdProject: { id: "new-project" },
          addedResources: ["resource-1", "resource-2"],
        },
        warnings: ["Some warning"],
      })

      const result = await (service as any).processClaudeResponse(response, {} as any)

      expect(result).toEqual({
        success: true,
        message: "Multiple operations",
        data: {
          createdProject: { id: "new-project" },
          addedResources: ["resource-1", "resource-2"],
        },
      })
    })

    it("should handle tool execution failure with errors and warnings", async () => {
      const response = {
        text: "Attempting operation",
        tool_use: {
          name: "failing_tool",
          input: { action: "test" },
        },
      }

      const executeToolSpy = vi.spyOn(service as any, "executeToolFunction")
      executeToolSpy.mockResolvedValueOnce({
        success: false,
        message: "Tool operation failed",
        data: { partial: "data" },
        errors: ["Missing required parameter", "Invalid configuration"],
        warnings: ["Resource may be corrupted"],
      })

      const result = await (service as any).processClaudeResponse(response, {} as any)

      expect(result).toEqual({
        success: false,
        message: "Attempting operation",
        data: { partial: "data" },
        errors: ["Missing required parameter", "Invalid configuration"],
        warnings: ["Resource may be corrupted"],
      })
    })
  })

  describe("Context creation helpers", () => {
    describe("calculateTotalDuration", () => {
      it("should calculate total duration of media resources", () => {
        const duration = (service as any).calculateTotalDuration()
        expect(duration).toBe(75) // 30 + 45 (only media resources, not music)
      })

      it("should handle resources without duration", () => {
        mockResourcesProvider.mediaResources = [
          { id: "1", file: { ...createMockMediaFile("1", "video1.mp4"), duration: undefined } as any },
          { id: "2", file: { ...createMockMediaFile("2", "video2.mp4"), duration: "invalid" } as any },
          { id: "3", file: createMockMediaFile("3", "video3.mp4", 10) },
        ] as MediaResource[]

        const duration = (service as any).calculateTotalDuration()
        expect(duration).toBe(10) // Only valid duration
      })
    })

    describe("calculateTotalSize", () => {
      it("should calculate total size of media resources", () => {
        const size = (service as any).calculateTotalSize()
        expect(size).toBe(2000000) // 1MB * 2 media files (not music)
      })

      it("should handle resources without size", () => {
        mockResourcesProvider.mediaResources = [
          { id: "1", file: { ...createMockMediaFile("1", "video1.mp4"), size: undefined } as any },
          { id: "2", file: { ...createMockMediaFile("2", "video2.mp4"), size: 500000 } },
        ] as MediaResource[]

        const size = (service as any).calculateTotalSize()
        expect(size).toBe(500000)
      })
    })

    describe("calculateResourceTypeStats", () => {
      it("should return correct resource counts", () => {
        const stats = (service as any).calculateResourceTypeStats()
        expect(stats).toEqual({
          media: 2,
          effect: 2,
          filter: 1,
          transition: 0,
          template: 0,
          styleTemplate: 0,
          music: 1,
        })
      })
    })

    describe("getBrowserFilters", () => {
      it("should return filters for active tab", () => {
        const filters = (service as any).getBrowserFilters()
        expect(filters).toEqual({
          searchQuery: "test",
          filterType: "all",
          sortBy: "name",
          sortOrder: "asc",
        })
      })

      it("should return empty object when no tab settings", () => {
        mockBrowserState.tabSettings = undefined
        const filters = (service as any).getBrowserFilters()
        expect(filters).toEqual({})
      })
    })

    describe("calculateProjectStats", () => {
      it("should return empty stats when no project", () => {
        mockTimelineState.project = null
        const stats = (service as any).calculateProjectStats()
        expect(stats).toEqual({
          totalDuration: 0,
          totalClips: 0,
          totalTracks: 0,
          totalSections: 0,
          usedResources: {},
        })
      })

      it("should return stats placeholder when project exists", () => {
        const stats = (service as any).calculateProjectStats()
        expect(stats).toEqual({
          totalDuration: 0,
          totalClips: 0,
          totalTracks: 0,
          totalSections: 0,
          usedResources: {},
        })
      })
    })
  })

  describe("System prompts", () => {
    it("should create comprehensive system prompt", () => {
      const context = service.createContext()
      const prompt = service.createSystemPrompt(context)

      expect(prompt).toContain("AI ассистент для Timeline Studio")
      expect(prompt).toContain("2 медиафайлов")
      expect(prompt).toContain("media")
      expect(prompt).toContain("Test Project")
      expect(prompt).toContain("воспроизводит playing.mp4")
      expect(prompt).toContain("ПРИНЦИПЫ РАБОТЫ")
      expect(prompt).toContain("ИНСТРУМЕНТЫ")
    })

    it("should create analysis system prompt", () => {
      const context = service.createContext()
      const prompt = service.createAnalysisSystemPrompt(context)

      expect(prompt).toContain("анализа медиа ресурсов в Timeline Studio")
      expect(prompt).toContain("Медиафайлы: 2")
      expect(prompt).toContain("Эффекты: 2")
      expect(prompt).toContain("ПРИНЦИПЫ АНАЛИЗА")
    })

    it("should handle missing data in prompts", () => {
      mockTimelineState.project = null
      mockPlayerState.video = null
      mockBrowserState.activeTab = null

      const context = service.createContext()
      const prompt = service.createSystemPrompt(context)

      expect(prompt).toContain("отсутствует")
      expect(prompt).toContain("свободен")
      expect(prompt).not.toContain("null")
    })
  })

  describe("createContext", () => {
    it("should create complete context object", () => {
      const context = service.createContext()

      // Check resources context
      expect(context.resources.availableResources.media).toHaveLength(2)
      expect(context.resources.availableResources.effects).toHaveLength(2)
      expect(context.resources.availableResources.filters).toHaveLength(1)
      expect(context.resources.stats.totalMedia).toBe(2)
      expect(context.resources.stats.totalDuration).toBe(75)

      // Check browser context
      expect(context.browser.activeTab).toBe("media")
      expect(context.browser.currentFilters.searchQuery).toBe("test")

      // Check player context
      expect(context.player.currentVideo?.name).toBe("playing.mp4")
      expect(context.player.playbackState.isPlaying).toBe(true)
      expect(context.player.playbackState.currentTime).toBe(5.5)
      expect(context.player.previewEffects).toContain("blur")

      // Check timeline context
      expect(context.timeline.currentProject?.name).toBe("Test Project")

      // Check user preferences
      expect(context.userPreferences.defaultProjectSettings.resolution).toEqual({
        width: 1920,
        height: 1080,
      })
    })

    it("should handle missing state data", () => {
      // Clear all state
      mockBrowserState = {}
      mockPlayerState = {}
      mockTimelineState = {}

      const newService = new TimelineAIService(
        mockResourcesProvider,
        mockBrowserState,
        mockPlayerState,
        mockTimelineState,
      )

      const context = newService.createContext()

      expect(context.browser.activeTab).toBe("media")
      expect(context.browser.currentFilters).toEqual({})
      expect(context.player.currentVideo).toBeNull()
      expect(context.player.playbackState.isPlaying).toBe(false)
      expect(context.timeline.currentProject).toBeNull()
    })
  })

  describe("executeToolFunction", () => {
    it("should log tool execution", async () => {
      const consoleSpy = vi.spyOn(console, "log")

      const toolUse = {
        name: "test_tool",
        input: { param1: "value1", param2: 123 },
      }

      const result = await service.executeToolFunction(toolUse, {} as any)

      expect(consoleSpy).toHaveBeenCalledWith("Executing tool: test_tool with input:", {
        param1: "value1",
        param2: 123,
      })

      expect(result).toEqual({
        success: true,
        message: "Инструмент test_tool выполнен успешно",
        data: {
          toolName: "test_tool",
          input: toolUse.input,
          success: false,
          message: "Инструмент test_tool пока не реализован",
        },
      })
    })
  })

  describe("Integration scenarios", () => {
    it("should handle full timeline creation flow", async () => {
      // Mock a complex response with tool use
      mockClaudeService.sendRequestWithTools.mockResolvedValueOnce({
        text: "I'll create a timeline from your vacation videos",
        tool_use: {
          name: "create_timeline",
          input: {
            projectName: "Vacation 2024",
            clips: ["media-1", "media-2"],
            transitions: ["fade"],
          },
        },
      })

      const executeToolSpy = vi.spyOn(service as any, "executeToolFunction")
      executeToolSpy.mockResolvedValueOnce({
        success: true,
        message: "Timeline created",
        data: {
          createdProject: { id: "vacation-2024", name: "Vacation 2024" },
          placedClips: ["clip-1", "clip-2"],
          appliedEnhancements: ["color-correction", "stabilization"],
        },
      })

      const result = await service.createTimelineFromPrompt(
        "Create a timeline from my vacation videos with smooth transitions",
      )

      expect(result).toMatchObject({
        success: true,
        message: "I'll create a timeline from your vacation videos",
        data: {
          createdProject: { id: "vacation-2024", name: "Vacation 2024" },
          placedClips: ["clip-1", "clip-2"],
          appliedEnhancements: ["color-correction", "stabilization"],
        },
        executionTime: expect.any(Number),
      })
    })

    it("should handle resource analysis with multiple suggestions", async () => {
      mockClaudeService.sendRequestWithTools.mockResolvedValueOnce({
        text: "Analysis complete. Your media collection needs organization.",
        tool_use: {
          name: "analyze_resources",
          input: { detailed: true },
        },
      })

      const executeToolSpy = vi.spyOn(service as any, "executeToolFunction")
      executeToolSpy.mockResolvedValueOnce({
        success: true,
        message: "Analysis done",
        data: {
          analysis: {
            quality: "good",
            issues: ["Missing transitions", "Audio levels vary"],
            recommendations: ["Add fade transitions", "Normalize audio"],
          },
          suggestions: ["Group similar clips", "Create template library"],
        },
      })

      const result = await service.analyzeAndSuggestResources("Analyze my resources and suggest improvements")

      expect(result.data?.analysis).toBeDefined()
      expect(result.data?.suggestions).toHaveLength(2)
    })
  })

  describe("Error handling edge cases", () => {
    it("should handle non-Error exceptions", async () => {
      mockClaudeService.sendRequestWithTools.mockRejectedValueOnce("String error")

      const result = await service.createTimelineFromPrompt("Test")

      expect(result).toMatchObject({
        success: false,
        message: "Ошибка при создании Timeline: Неизвестная ошибка",
        errors: ["Неизвестная ошибка"],
      })
    })

    it("should handle tool execution with non-Error exceptions", async () => {
      const response = {
        text: "Using tool",
        tool_use: { name: "test", input: {} },
      }

      const executeToolSpy = vi.spyOn(service as any, "executeToolFunction")
      executeToolSpy.mockRejectedValueOnce("Tool string error")

      const result = await (service as any).processClaudeResponse(response, {} as any)

      expect(result.success).toBe(false)
      expect(result.errors).toContain("Ошибка выполнения инструмента: Неизвестная ошибка")
    })
  })

  describe("Placeholder methods", () => {
    it("should return appropriate data for service methods", () => {
      expect(service.getRecentlyAddedResources()).toEqual([])
      // getBrowserMedia теперь возвращает медиа файлы из ресурсов
      expect(service.getBrowserMedia()).toHaveLength(2)
      expect(service.getBrowserMedia()[0]).toEqual(
        expect.objectContaining({
          id: "media-1",
          name: "video1.mp4",
          isVideo: true,
        }),
      )
      expect(service.getFavoriteFiles()).toEqual([])
      expect(service.getRecentTimelineChanges()).toEqual([])
      expect(service.analyzeTimelineIssues()).toEqual([])
    })
  })
})
