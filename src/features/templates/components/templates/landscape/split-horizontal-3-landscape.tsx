import React from "react"

import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"

import { VideoPanelComponent } from "../../video-panel-component"
import { TemplateProps } from "../types"

/**
 * Шаблон "3 экрана по горизонтали" - ландшафтный формат
 * ID: split-horizontal-3-landscape
 */
export function SplitHorizontal3Landscape({ videos, activeVideoId, videoRefs, isResizable = true }: TemplateProps) {
  // Проверяем, что у нас есть видео с путями
  const validVideos = videos.filter((v) => v?.path)
  const videoCount = Math.min(validVideos.length, 3)

  // Если недостаточно видео, возвращаем пустой div
  if (videoCount < 3) {
    return <div className="h-full w-full bg-black" />
  }

  // Рендеринг в режиме без возможности изменения размеров
  if (!isResizable) {
    return (
      <div className="flex h-full w-full flex-col" style={{ border: "1px solid #35d1c1" }}>
        {/* Первое видео */}
        <div className="h-1/3 w-full">
          <VideoPanelComponent
            video={validVideos[0]}
            isActive={validVideos[0]?.id === activeVideoId}
            videoRefs={videoRefs}
            index={0}
          />
        </div>

        {/* Разделительная линия */}
        <div className="h-[1px] w-full bg-[#35d1c1]" />

        {/* Второе видео */}
        <div className="h-1/3 w-full">
          <VideoPanelComponent
            video={validVideos[1]}
            isActive={validVideos[1]?.id === activeVideoId}
            videoRefs={videoRefs}
            index={1}
          />
        </div>

        {/* Разделительная линия */}
        <div className="h-[1px] w-full bg-[#35d1c1]" />

        {/* Третье видео */}
        <div className="h-1/3 w-full">
          <VideoPanelComponent
            video={validVideos[2]}
            isActive={validVideos[2]?.id === activeVideoId}
            videoRefs={videoRefs}
            index={2}
          />
        </div>
      </div>
    )
  }

  // Рендеринг в режиме с возможностью изменения размеров
  return (
    <div className="h-full w-full" style={{ overflow: "visible", border: "1px solid #35d1c1" }}>
      <PanelGroup direction="vertical">
        {/* Первая секция */}
        <Panel defaultSize={33.33} minSize={10}>
          <VideoPanelComponent
            video={validVideos[0]}
            isActive={validVideos[0]?.id === activeVideoId}
            videoRefs={videoRefs}
            index={0}
          />
        </Panel>
        <PanelResizeHandle className="h-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
        {/* Вторая секция */}
        <Panel defaultSize={33.33} minSize={10}>
          <VideoPanelComponent
            video={validVideos[1]}
            isActive={validVideos[1]?.id === activeVideoId}
            videoRefs={videoRefs}
            index={1}
          />
        </Panel>
        <PanelResizeHandle className="h-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
        {/* Третья секция */}
        <Panel defaultSize={33.34} minSize={10}>
          <VideoPanelComponent
            video={validVideos[2]}
            isActive={validVideos[2]?.id === activeVideoId}
            videoRefs={videoRefs}
            index={2}
          />
        </Panel>
      </PanelGroup>
    </div>
  )
}
