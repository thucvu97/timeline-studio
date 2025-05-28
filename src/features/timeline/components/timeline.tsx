import React from "react"

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { AiChat } from "@/features/ai-chat/components/ai-chat"
import { ResourcesPanel } from "@/features/resources"
import { cn } from "@/lib/utils"

import { TimelineContent } from "./timeline-content"
import { TimelineTopPanel } from "./timeline-top-panel"

interface TimelineProps {
  className?: string
  style?: React.CSSProperties
}

/**
 * Timeline component that displays the main timeline interface with resources, content, and AI chat panels.
 *
 * @param className Optional additional class names for the root element.
 * @param style Optional inline styles for the root element.
 */
export function Timeline({ className, style }: TimelineProps = {}) {
  return (
    <ResizablePanelGroup
      direction="horizontal"
      className={cn("h-full timeline", className)}
      data-testid="timeline"
      style={style}
    >
      {/* Левая панель - Ресурсы */}
      <ResizablePanel defaultSize={15} minSize={5} maxSize={30}>
        <ResourcesPanel />
      </ResizablePanel>

      <ResizableHandle />

      {/* Средняя панель (основная часть) */}
      <ResizablePanel defaultSize={65} minSize={40}>
        <div className="flex h-full w-full flex-col">
          {/* Фиксированная верхняя панель */}
          <div className="flex-shrink-0">
            <TimelineTopPanel />
          </div>

          {/* Основная часть - Timeline контент */}
          <div className="w-full flex-grow overflow-hidden">
            <TimelineContent />
          </div>
        </div>
      </ResizablePanel>

      <ResizableHandle />

      <ResizablePanel defaultSize={20} minSize={10} maxSize={50} className="flex-shrink-0">
        <AiChat />
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
