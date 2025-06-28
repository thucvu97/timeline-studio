import React, { useState } from "react"

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { AiChat } from "@/features/ai-chat/components/ai-chat"
import { ResourcesPanel } from "@/features/resources"
import { cn } from "@/lib/utils"

import { AudioMixerView } from "./audio-mixer-view"
import { TimelineContent } from "./timeline-content"
import { TimelineWorkspaceTabs, WorkspaceView } from "./timeline-workspace-tabs"

interface TimelineProps {
  className?: string
  style?: React.CSSProperties
  noChat?: boolean
}

/**
 * Timeline component that displays the main timeline interface with resources, content, and AI chat panels.
 *
 * @param className Optional additional class names for the root element.
 * @param style Optional inline styles for the root element.
 */
export function Timeline({ className, style, noChat = false }: TimelineProps = {}) {
  const [activeView, setActiveView] = useState<WorkspaceView>("timeline")

  return (
    <ResizablePanelGroup
      direction="horizontal"
      className={cn("h-full timeline", className)}
      data-testid="timeline"
      style={style}
    >
      {/* Левая панель - Ресурсы (только для timeline view) */}
      {activeView === "timeline" && (
        <>
          <ResizablePanel defaultSize={15} minSize={5} maxSize={30}>
            <ResourcesPanel />
          </ResizablePanel>
          <ResizableHandle />
        </>
      )}

      {/* Средняя панель (основная часть) */}
      <ResizablePanel defaultSize={activeView === "timeline" ? 65 : 80} minSize={40}>
        <div className="flex h-full w-full flex-col">
          {/* Вкладки для переключения видов */}
          <div className="flex-shrink-0">
            <TimelineWorkspaceTabs activeView={activeView} onViewChange={setActiveView} />
          </div>

          {/* Основная часть - Timeline контент или Audio Mixer */}
          <div className="w-full flex-grow overflow-hidden">
            {activeView === "timeline" ? <TimelineContent /> : <AudioMixerView />}
          </div>
        </div>
      </ResizablePanel>

      <ResizableHandle />

      {!noChat && (
        <ResizablePanel defaultSize={20} minSize={10} maxSize={50} className="flex-shrink-0">
          <AiChat />
        </ResizablePanel>
      )}
    </ResizablePanelGroup>
  )
}
