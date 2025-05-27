import React from "react"

import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"

import { VideoPanelComponent } from "../../video-panel-component"
import { TemplateProps } from "../types"

/**
 * Шаблон "5 экранов: вариант 1 (1 большой слева, 4 маленьких справа)" - ландшафтный формат
 * ID: split-custom-5-1-landscape
 */
export function SplitCustom51Landscape({ videos, activeVideoId, videoRefs, isResizable = true }: TemplateProps) {
  // Проверяем, что у нас есть видео с путями
  const validVideos = videos.filter((v) => v?.path)
  const videoCount = Math.min(validVideos.length, 5)

  // Если недостаточно видео, возвращаем пустой div
  if (videoCount < 5) {
    return <div className="h-full w-full bg-black" />
  }

  // Рендеринг в режиме без возможности изменения размеров
  if (!isResizable) {
    return (
      <div className="flex h-full w-full" style={{ border: "1px solid #35d1c1" }}>
        {/* Левая секция (большое видео) */}
        <div className="h-full w-1/2">
          <VideoPanelComponent
            video={validVideos[0]}
            isActive={validVideos[0]?.id === activeVideoId}
            videoRefs={videoRefs}
            index={0}
          />
        </div>

        {/* Разделительная линия */}
        <div className="h-full w-[1px] bg-[#35d1c1]" />

        {/* Правая секция (4 маленьких видео) */}
        <div className="flex h-full w-1/2 flex-col">
          {/* Верхняя правая секция */}
          <div className="h-1/2 w-full">
            <VideoPanelComponent
              video={validVideos[1]}
              isActive={validVideos[1]?.id === activeVideoId}
              videoRefs={videoRefs}
              index={1}
            />
          </div>

          {/* Горизонтальная разделительная линия */}
          <div className="h-[1px] w-full bg-[#35d1c1]" />

          {/* Нижняя правая секция */}
          <div className="flex h-1/2 w-full flex-col">
            {/* Верхняя часть нижней правой секции */}
            <div className="flex h-1/2 w-full">
              {/* Левое видео */}
              <div className="h-full w-1/2">
                <VideoPanelComponent
                  video={validVideos[2]}
                  isActive={validVideos[2]?.id === activeVideoId}
                  videoRefs={videoRefs}
                  index={2}
                />
              </div>

              {/* Вертикальная разделительная линия */}
              <div className="h-full w-[1px] bg-[#35d1c1]" />

              {/* Правое видео */}
              <div className="h-full w-1/2">
                <VideoPanelComponent
                  video={validVideos[3]}
                  isActive={validVideos[3]?.id === activeVideoId}
                  videoRefs={videoRefs}
                  index={3}
                />
              </div>
            </div>

            {/* Горизонтальная разделительная линия */}
            <div className="h-[1px] w-full bg-[#35d1c1]" />

            {/* Нижняя часть нижней правой секции */}
            <div className="h-1/2 w-full">
              <VideoPanelComponent
                video={validVideos[4]}
                isActive={validVideos[4]?.id === activeVideoId}
                videoRefs={videoRefs}
                index={4}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Рендеринг в режиме с возможностью изменения размеров
  return (
    <div className="h-full w-full" style={{ overflow: "visible", border: "1px solid #35d1c1" }}>
      <PanelGroup direction="horizontal">
        {/* Левая секция (большое видео) */}
        <Panel defaultSize={50} minSize={20}>
          <VideoPanelComponent
            video={validVideos[0]}
            isActive={validVideos[0]?.id === activeVideoId}
            videoRefs={videoRefs}
            index={0}
          />
        </Panel>
        <PanelResizeHandle className="w-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
        {/* Правая секция (4 маленьких видео) */}
        <Panel defaultSize={50} minSize={20}>
          <PanelGroup direction="vertical">
            {/* Верхняя правая секция */}
            <Panel defaultSize={50} minSize={20}>
              <VideoPanelComponent
                video={validVideos[1]}
                isActive={validVideos[1]?.id === activeVideoId}
                videoRefs={videoRefs}
                index={1}
              />
            </Panel>
            <PanelResizeHandle className="h-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
            {/* Нижняя правая секция */}
            <Panel defaultSize={50} minSize={20}>
              <PanelGroup direction="vertical">
                {/* Верхняя часть нижней правой секции */}
                <Panel defaultSize={50} minSize={10}>
                  <PanelGroup direction="horizontal">
                    {/* Левое видео */}
                    <Panel defaultSize={50} minSize={10}>
                      <VideoPanelComponent
                        video={validVideos[2]}
                        isActive={validVideos[2]?.id === activeVideoId}
                        videoRefs={videoRefs}
                        index={2}
                      />
                    </Panel>
                    <PanelResizeHandle className="w-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
                    {/* Правое видео */}
                    <Panel defaultSize={50} minSize={10}>
                      <VideoPanelComponent
                        video={validVideos[3]}
                        isActive={validVideos[3]?.id === activeVideoId}
                        videoRefs={videoRefs}
                        index={3}
                      />
                    </Panel>
                  </PanelGroup>
                </Panel>
                <PanelResizeHandle className="h-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
                {/* Нижняя часть нижней правой секции */}
                <Panel defaultSize={50} minSize={10}>
                  <VideoPanelComponent
                    video={validVideos[4]}
                    isActive={validVideos[4]?.id === activeVideoId}
                    videoRefs={videoRefs}
                    index={4}
                  />
                </Panel>
              </PanelGroup>
            </Panel>
          </PanelGroup>
        </Panel>
      </PanelGroup>
    </div>
  )
}
