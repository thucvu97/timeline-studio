/**
 * Tests for AnalysisResults component
 */

import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { AnalysisResults } from "../analysis-results"

import type { IntelligentContent } from "../../../shared/types/pipeline"

describe("AnalysisResults", () => {
  const createMockIntelligentContent = (overrides?: Partial<IntelligentContent>): IntelligentContent => ({
    id: "test-id",
    projectId: "test-project",
    createdAt: new Date(),
    updatedAt: new Date(),
    analysis: {
      contentType: "video",
      technicalSpecs: {
        duration: 120,
        resolution: { width: 1920, height: 1080 },
      },
      qualityMetrics: {
        overall: 85,
      },
      scenes: [
        { id: "scene-1", type: "action", duration: 30 },
        { id: "scene-2", type: "dialogue", duration: 45 },
        { id: "scene-3", type: "landscape", duration: 45 },
      ],
      insights: {
        summary: "High-quality action video with good audio balance",
        suggestions: [
          { description: "Consider adding more close-up shots" },
          { description: "Audio levels could be normalized" },
          { description: "Color grading enhancement recommended" },
        ],
      },
    } as any,
    moments: [
      {
        id: "moment-1",
        timestamp: 30,
        duration: 5,
        type: "highlight",
        score: 0.9,
        description: "Key action sequence",
        tags: ["action"],
      },
      {
        id: "moment-2",
        timestamp: 75,
        duration: 3,
        type: "emotional",
        score: 0.8,
        description: "Emotional dialogue",
        tags: ["dialogue"],
      },
    ],
    classification: {
      primary: { category: "entertainment", confidence: 0.9 },
      secondary: [],
      confidence: 0.9,
      tags: ["action", "drama"],
    },
    metadata: {
      startTime: new Date(),
      endTime: new Date(),
      duration: 120000,
      config: {} as any,
      steps: [],
      resources: {
        cpuUsage: 50,
        memoryUsage: 1024,
        apiCalls: [],
        cacheHits: 10,
        cacheMisses: 2,
      },
    },
    ...overrides,
  })

  describe("Analysis Tab", () => {
    it("should render analysis content when activeTab is analysis", () => {
      const result = createMockIntelligentContent()
      render(<AnalysisResults result={result} activeTab="analysis" />)

      expect(screen.getByText("Content Analysis")).toBeInTheDocument()
      expect(screen.getByText("video")).toBeInTheDocument()
      expect(screen.getByText("2:00")).toBeInTheDocument() // Duration
      expect(screen.getByText("1920x1080")).toBeInTheDocument() // Resolution
      expect(screen.getByText("85/100")).toBeInTheDocument() // Quality
    })

    it("should display detected scenes", () => {
      const result = createMockIntelligentContent()
      render(<AnalysisResults result={result} activeTab="analysis" />)

      expect(screen.getByText("Scenes Detected")).toBeInTheDocument()
      expect(screen.getByText("Scene 1: action")).toBeInTheDocument()
      expect(screen.getByText("Scene 2: dialogue")).toBeInTheDocument()
      expect(screen.getByText("Scene 3: landscape")).toBeInTheDocument()
    })

    it("should display key moments when available", () => {
      const result = createMockIntelligentContent()
      render(<AnalysisResults result={result} activeTab="analysis" />)

      expect(screen.getByText("Key Moments")).toBeInTheDocument()
      expect(screen.getByText("highlight")).toBeInTheDocument()
      expect(screen.getByText("Key action sequence")).toBeInTheDocument()
      expect(screen.getByText("emotional")).toBeInTheDocument()
      expect(screen.getByText("Emotional dialogue")).toBeInTheDocument()
    })

    it("should display AI insights when available", () => {
      const result = createMockIntelligentContent()
      render(<AnalysisResults result={result} activeTab="analysis" />)

      expect(screen.getByText("AI Insights")).toBeInTheDocument()
      expect(screen.getByText("High-quality action video with good audio balance")).toBeInTheDocument()
      expect(screen.getByText("Consider adding more close-up shots")).toBeInTheDocument()
      expect(screen.getByText("Audio levels could be normalized")).toBeInTheDocument()
    })

    it("should hide key moments section when no moments", () => {
      const result = createMockIntelligentContent({ moments: [] })
      render(<AnalysisResults result={result} activeTab="analysis" />)

      expect(screen.queryByText("Key Moments")).not.toBeInTheDocument()
    })

    it("should hide insights section when no insights", () => {
      const result = createMockIntelligentContent({
        analysis: {
          ...createMockIntelligentContent().analysis,
          insights: undefined,
        } as any,
      })
      render(<AnalysisResults result={result} activeTab="analysis" />)

      expect(screen.queryByText("AI Insights")).not.toBeInTheDocument()
    })

    it("should show more scenes indicator when over 5 scenes", () => {
      const manyScenes = Array.from({ length: 8 }, (_, i) => ({
        id: `scene-${i + 1}`,
        type: "action",
        duration: 15,
      }))

      const result = createMockIntelligentContent({
        analysis: {
          ...createMockIntelligentContent().analysis,
          scenes: manyScenes,
        } as any,
      })

      render(<AnalysisResults result={result} activeTab="analysis" />)
      expect(screen.getByText("+3 more scenes")).toBeInTheDocument()
    })
  })

  describe("Script Tab", () => {
    it("should show empty state when no script available", () => {
      const result = createMockIntelligentContent({ script: undefined })
      render(<AnalysisResults result={result} activeTab="script" />)

      expect(screen.getByText("No script generated yet")).toBeInTheDocument()
      expect(screen.getByText("Run full pipeline with script generation enabled")).toBeInTheDocument()
    })

    it("should display script content when available", () => {
      const result = createMockIntelligentContent({
        script: {
          id: "script-1",
          title: "Epic Action Sequence",
          description: "A thrilling action movie",
          genre: ["action", "thriller"],
          duration: 120,
          structure: { type: "three-act" },
          scenes: [
            {
              id: "scene-1",
              title: "Opening Chase",
              description: "High-speed car chase through the city",
              duration: 30,
            },
            {
              id: "scene-2",
              title: "Character Introduction",
              description: "Meet our hero",
              duration: 20,
            },
          ],
        } as any,
      })

      render(<AnalysisResults result={result} activeTab="script" />)

      expect(screen.getByText("Epic Action Sequence")).toBeInTheDocument()
      expect(screen.getByText("action, thriller")).toBeInTheDocument()
      expect(screen.getByText("three-act")).toBeInTheDocument()
      expect(screen.getByText("2")).toBeInTheDocument() // Number of scenes
      expect(screen.getByText("Opening Chase")).toBeInTheDocument()
      expect(screen.getByText("High-speed car chase through the city")).toBeInTheDocument()
    })

    it("should limit displayed scenes to 5", () => {
      const manyScenes = Array.from({ length: 10 }, (_, i) => ({
        id: `scene-${i + 1}`,
        title: `Scene ${i + 1}`,
        description: `Description ${i + 1}`,
        duration: 15,
      }))

      const result = createMockIntelligentContent({
        script: {
          id: "script-1",
          title: "Long Movie",
          genre: ["drama"],
          duration: 180,
          structure: { type: "five-act" },
          scenes: manyScenes,
        } as any,
      })

      render(<AnalysisResults result={result} activeTab="script" />)

      // Should show first 5 scenes
      expect(screen.getByText("Scene 1")).toBeInTheDocument()
      expect(screen.getByText("Scene 5")).toBeInTheDocument()
      // Should not show 6th scene
      expect(screen.queryByText("Scene 6")).not.toBeInTheDocument()
    })
  })

  describe("Platforms Tab", () => {
    it("should show empty state when no platform content", () => {
      const result = createMockIntelligentContent({ platformContent: undefined })
      render(<AnalysisResults result={result} activeTab="platforms" />)

      expect(screen.getByText("No platform adaptations yet")).toBeInTheDocument()
      expect(screen.getByText("Run full pipeline with platform adaptation enabled")).toBeInTheDocument()
    })

    it("should show empty state when platform content array is empty", () => {
      const result = createMockIntelligentContent({ platformContent: [] })
      render(<AnalysisResults result={result} activeTab="platforms" />)

      expect(screen.getByText("No platform adaptations yet")).toBeInTheDocument()
    })

    it("should display platform adaptations when available", () => {
      const result = createMockIntelligentContent({
        platformContent: [
          {
            id: "platform-1",
            platform: "youtube",
            originalContent: { duration: 120 },
            adaptations: {
              video: {
                resolution: { width: 1920, height: 1080 },
                aspectRatio: { ratio: "16:9" },
              },
              text: {
                hashtags: ["#action", "#movie", "#epic"],
              },
            },
            metadata: {
              language: "en",
            },
          } as any,
          {
            id: "platform-2",
            platform: "tiktok",
            originalContent: { duration: 60 },
            adaptations: {
              video: {
                resolution: { width: 1080, height: 1920 },
                aspectRatio: { ratio: "9:16" },
              },
              text: {
                hashtags: ["#short", "#viral"],
              },
            },
            metadata: {
              language: "en",
            },
          } as any,
        ],
      })

      render(<AnalysisResults result={result} activeTab="platforms" />)

      expect(screen.getByText("YouTube")).toBeInTheDocument()
      expect(screen.getByText("TikTok")).toBeInTheDocument()
      expect(screen.getByText("1920x1080")).toBeInTheDocument()
      expect(screen.getByText("1080x1920")).toBeInTheDocument()
      expect(screen.getByText("16:9")).toBeInTheDocument()
      expect(screen.getByText("9:16")).toBeInTheDocument()
      expect(screen.getByText("#action")).toBeInTheDocument()
      expect(screen.getByText("#movie")).toBeInTheDocument()
      expect(screen.getByText("#short")).toBeInTheDocument()
    })

    it("should not display hashtags section when no hashtags", () => {
      const result = createMockIntelligentContent({
        platformContent: [
          {
            id: "platform-1",
            platform: "youtube",
            originalContent: { duration: 120 },
            adaptations: {
              video: {
                resolution: { width: 1920, height: 1080 },
                aspectRatio: { ratio: "16:9" },
              },
              text: {
                hashtags: [],
              },
            },
            metadata: {
              language: "en",
            },
          } as any,
        ],
      })

      render(<AnalysisResults result={result} activeTab="platforms" />)

      expect(screen.queryByText("Hashtags:")).not.toBeInTheDocument()
    })
  })

  describe("Utility Functions", () => {
    it("should format duration correctly", () => {
      const result = createMockIntelligentContent({
        analysis: {
          ...createMockIntelligentContent().analysis,
          technicalSpecs: {
            duration: 3665, // 1 hour, 1 minute, 5 seconds
            resolution: { width: 1920, height: 1080 },
          },
        } as any,
      })

      render(<AnalysisResults result={result} activeTab="analysis" />)
      expect(screen.getByText("1:01:05")).toBeInTheDocument()
    })

    it("should apply custom className", () => {
      const result = createMockIntelligentContent()
      const customClass = "custom-analysis-results"
      const { container } = render(<AnalysisResults result={result} activeTab="analysis" className={customClass} />)

      const element = container.firstElementChild
      expect(element).toHaveClass(customClass)
    })
  })

  describe("Tab Switching", () => {
    it("should only render content for active tab", () => {
      const result = createMockIntelligentContent({
        script: {
          id: "script-1",
          title: "Test Script",
          genre: ["test"],
          duration: 60,
          structure: { type: "simple" },
          scenes: [],
        } as any,
      })

      const { rerender } = render(<AnalysisResults result={result} activeTab="analysis" />)

      expect(screen.getByText("Content Analysis")).toBeInTheDocument()
      expect(screen.queryByText("Test Script")).not.toBeInTheDocument()

      rerender(<AnalysisResults result={result} activeTab="script" />)

      expect(screen.queryByText("Content Analysis")).not.toBeInTheDocument()
      expect(screen.getByText("Test Script")).toBeInTheDocument()
    })
  })
})
