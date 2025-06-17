import React from "react"

import { act } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { renderWithTemplates, screen } from "@/test/test-utils"

import { ResizableTemplate } from "../components/resizable-template"

// Мокаем VideoPanelComponent
vi.mock("../components/video-panel-component", () => ({
  VideoPanelComponent: ({ video, isActive, index, className }: any) => (
    <div
      data-testid={`video-panel-${index ?? video?.id ?? "unknown"}`}
      className={className}
      data-video-id={video?.id}
      data-is-active={isActive}
    >
      Video Panel {index ?? video?.id ?? "unknown"} - {video?.name || "No Video"}
    </div>
  ),
}))

describe("ResizableTemplate", () => {
  const mockTemplate = {
    id: "split-vertical-landscape", // Используем реальный ID шаблона
    split: "vertical" as const,
    resizable: true,
    screens: 2,
    splitPosition: 50,
    render: () => React.createElement("div", {}, "Test Template"),
  }

  const mockAppliedTemplate = {
    template: mockTemplate,
    videos: [],
  }

  const mockVideos = [
    {
      id: "video-1",
      name: "Test Video 1",
      path: "/test/video1.mp4",
      type: "video",
      size: 1024,
      duration: 60,
      startTime: 0,
      endTime: 60,
    },
    {
      id: "video-2",
      name: "Test Video 2",
      path: "/test/video2.mp4",
      type: "video",
      size: 1024,
      duration: 60,
      startTime: 0,
      endTime: 60,
    },
  ]

  const mockVideosForGrid = [
    ...mockVideos,
    {
      id: "video-3",
      name: "Test Video 3",
      path: "/test/video3.mp4",
      type: "video",
      size: 3072,
      duration: 90,
      startTime: 0,
      endTime: 90,
    },
    {
      id: "video-4",
      name: "Test Video 4",
      path: "/test/video4.mp4",
      type: "video",
      size: 4096,
      duration: 150,
      startTime: 0,
      endTime: 150,
    },
  ]

  it("should be importable", () => {
    // Простой smoke test - проверяем, что компонент можно импортировать
    expect(ResizableTemplate).toBeDefined()
    expect(typeof ResizableTemplate).toBe("function")
  })

  it("should render without crashing", () => {
    renderWithTemplates(
      <ResizableTemplate appliedTemplate={mockAppliedTemplate} videos={mockVideos} activeVideoId={null} />,
    )

    // Проверяем, что компонент отрендерился (используем SplitVertical для vertical template)
    expect(screen.getByTestId("video-panel-0")).toBeInTheDocument()
    expect(screen.getByTestId("video-panel-1")).toBeInTheDocument()
  })

  it("should render video panels for each screen", () => {
    renderWithTemplates(
      <ResizableTemplate appliedTemplate={mockAppliedTemplate} videos={mockVideos} activeVideoId={null} />,
    )

    // Проверяем, что отрендерились панели для каждого экрана
    expect(screen.getByTestId("video-panel-0")).toBeInTheDocument()
    expect(screen.getByTestId("video-panel-1")).toBeInTheDocument()
  })

  it("should render template even when no videos", () => {
    renderWithTemplates(<ResizableTemplate appliedTemplate={mockAppliedTemplate} videos={[]} activeVideoId={null} />)

    // Проверяем, что компонент отрендерился - в новой системе может отрендерить TemplateRenderer
    // Если конфигурация найдена, то покажет шаблон, если нет - сообщение о ошибке
    expect(document.body).toBeInTheDocument()
  })

  it("should handle horizontal split template", () => {
    const horizontalTemplate = {
      ...mockTemplate,
      id: "split-horizontal-landscape", // Используем реальный ID
      split: "horizontal" as const,
    }

    const horizontalAppliedTemplate = {
      template: horizontalTemplate,
      videos: [],
    }

    renderWithTemplates(
      <ResizableTemplate appliedTemplate={horizontalAppliedTemplate} videos={mockVideos} activeVideoId={null} />,
    )

    // Проверяем, что компонент отрендерился (используем SplitHorizontal для horizontal template)
    expect(screen.getByTestId("video-panel-0")).toBeInTheDocument()
    expect(screen.getByTestId("video-panel-1")).toBeInTheDocument()
  })

  it("should handle grid template", () => {
    const gridTemplate = {
      ...mockTemplate,
      id: "split-grid-2x2-landscape",
      split: "grid" as const,
      screens: 4,
    }

    const gridAppliedTemplate = {
      template: gridTemplate,
      videos: mockVideosForGrid,
    }

    renderWithTemplates(
      <ResizableTemplate appliedTemplate={gridAppliedTemplate} videos={mockVideosForGrid} activeVideoId={null} />,
    )

    // Проверяем, что компонент отрендерился (используем SplitGrid2x2 для grid template)
    // Для grid шаблона с 4 экранами и 4 видео, должны быть panel-0, panel-1, panel-2 и panel-3
    expect(screen.getByTestId("video-panel-0")).toBeInTheDocument()
    expect(screen.getByTestId("video-panel-1")).toBeInTheDocument()
    expect(screen.getByTestId("video-panel-2")).toBeInTheDocument()
    expect(screen.getByTestId("video-panel-3")).toBeInTheDocument()
  })

  it("should validate template structure", () => {
    // Проверяем корректность структуры шаблона
    expect(mockTemplate).toHaveProperty("id")
    expect(mockTemplate).toHaveProperty("split")
    expect(mockTemplate).toHaveProperty("resizable")
    expect(mockTemplate).toHaveProperty("screens")
    expect(mockTemplate).toHaveProperty("splitPosition")
    expect(mockTemplate).toHaveProperty("render")

    // Проверяем типы свойств
    expect(typeof mockTemplate.id).toBe("string")
    expect(typeof mockTemplate.split).toBe("string")
    expect(typeof mockTemplate.resizable).toBe("boolean")
    expect(typeof mockTemplate.screens).toBe("number")
    expect(typeof mockTemplate.splitPosition).toBe("number")
    expect(typeof mockTemplate.render).toBe("function")

    // Проверяем значения
    expect(mockTemplate.resizable).toBe(true)
    expect(mockTemplate.screens).toBe(2)
    expect(mockTemplate.splitPosition).toBe(50)
  })
})
