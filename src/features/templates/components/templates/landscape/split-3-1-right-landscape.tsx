import React from "react"

import { useTranslation } from "react-i18next"
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"

import { VideoPanelComponent } from "../../video-panel-component"
import { TemplateProps } from "../types"

/**
 * Шаблон "3 слева + 1 справа" - ландшафтный формат
 * ID: split-3-1-right-landscape
 */
export function Split31RightLandscape({ videos, activeVideoId, videoRefs, isResizable = true }: TemplateProps) {
  // Используем хук для локализации
  const { t, i18n } = useTranslation()

  // Проверяем, что у нас есть видео с путями
  const validVideos = videos.filter((v) => v?.path)
  const videoCount = Math.min(validVideos.length, 4)

  // Получаем локализованное название шаблона
  const templateName = t("templates.split_3_1_right")

  console.log(`[Split31RightLandscape] Рендеринг шаблона (${templateName}) с параметрами:`, {
    isResizable,
    language: i18n.language,
  })

  // Если недостаточно видео, возвращаем пустой div
  if (videoCount < 4) {
    return <div className="h-full w-full bg-black" />
  }

  // Рендеринг в режиме без возможности изменения размеров
  if (!isResizable) {
    return (
      <div className="flex h-full w-full" style={{ border: "1px solid #35d1c1" }}>
        {/* Левая секция (3 маленьких видео) */}
        <div className="flex h-full w-1/2 flex-col">
          {/* Верхнее видео */}
          <div className="h-1/3 w-full">
            <VideoPanelComponent
              video={validVideos[0]}
              isActive={validVideos[0]?.id === activeVideoId}
              videoRefs={videoRefs}
              index={0}
            />
          </div>

          {/* Горизонтальная разделительная линия */}
          <div className="h-[1px] w-full bg-[#35d1c1]" />

          {/* Среднее видео */}
          <div className="h-1/3 w-full">
            <VideoPanelComponent
              video={validVideos[1]}
              isActive={validVideos[1]?.id === activeVideoId}
              videoRefs={videoRefs}
              index={1}
            />
          </div>

          {/* Горизонтальная разделительная линия */}
          <div className="h-[1px] w-full bg-[#35d1c1]" />

          {/* Нижнее видео */}
          <div className="h-1/3 w-full">
            <VideoPanelComponent
              video={validVideos[2]}
              isActive={validVideos[2]?.id === activeVideoId}
              videoRefs={videoRefs}
              index={2}
            />
          </div>
        </div>

        {/* Разделительная линия */}
        <div className="h-full w-[1px] bg-[#35d1c1]" />

        {/* Правая секция (большое видео) */}
        <div className="h-full w-1/2">
          <VideoPanelComponent
            video={validVideos[3]}
            isActive={validVideos[3]?.id === activeVideoId}
            videoRefs={videoRefs}
            index={3}
          />
        </div>
      </div>
    )
  }

  // Рендеринг в режиме с возможностью изменения размеров
  return (
    <div className="h-full w-full" style={{ overflow: "visible", border: "1px solid #35d1c1" }}>
      <PanelGroup direction="horizontal">
        {/* Левая секция (3 маленьких видео) */}
        <Panel defaultSize={50} minSize={20}>
          <PanelGroup direction="vertical">
            {/* Верхнее видео */}
            <Panel defaultSize={33.33} minSize={10}>
              <VideoPanelComponent
                video={validVideos[0]}
                isActive={validVideos[0]?.id === activeVideoId}
                videoRefs={videoRefs}
                index={0}
              />
            </Panel>
            <PanelResizeHandle className="h-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
            {/* Среднее видео */}
            <Panel defaultSize={33.33} minSize={10}>
              <VideoPanelComponent
                video={validVideos[1]}
                isActive={validVideos[1]?.id === activeVideoId}
                videoRefs={videoRefs}
                index={1}
              />
            </Panel>
            <PanelResizeHandle className="h-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
            {/* Нижнее видео */}
            <Panel defaultSize={33.34} minSize={10}>
              <VideoPanelComponent
                video={validVideos[2]}
                isActive={validVideos[2]?.id === activeVideoId}
                videoRefs={videoRefs}
                index={2}
              />
            </Panel>
          </PanelGroup>
        </Panel>
        <PanelResizeHandle className="w-1 bg-[#35d1c1] hover:bg-[#35d1c1]" />
        {/* Правая секция (большое видео) */}
        <Panel defaultSize={50} minSize={20}>
          <VideoPanelComponent
            video={validVideos[3]}
            isActive={validVideos[3]?.id === activeVideoId}
            videoRefs={videoRefs}
            index={3}
          />
        </Panel>
      </PanelGroup>
    </div>
  )
}
