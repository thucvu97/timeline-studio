import { useState } from "react"

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { Browser } from "@/features/browser/components/browser"
import { VideoPlayer } from "@/features/video-player/components/video-player"
import { Timeline } from "@/features/timeline/components/timeline"

export function DefaultMediaEditor() {
  const [isBrowserVisible, setIsBrowserVisible] = useState(true)

  return (
    <ResizablePanelGroup
      direction="vertical"
      className="min-h-0 flex-grow"
      autoSaveId="default-layout"
    >
      <ResizablePanel defaultSize={50} minSize={20} maxSize={80}>
        {isBrowserVisible ? (
          // Если браузер видим, показываем обычный макет с двумя панелями
          <ResizablePanelGroup direction="horizontal" autoSaveId="top-layout">
            <ResizablePanel
              defaultSize={40}
              minSize={10}
              maxSize={80}
              style={{
                transition: "width 0.3s ease-in-out",
                overflow: "hidden",
              }}
            >
              <div className="relative h-full flex-1">
                <Browser />
              </div>
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel
              defaultSize={60}
              minSize={20}
              maxSize={100}
              style={{
                transition: "width 0.3s ease-in-out",
              }}
            >
              <div className="h-full flex-1">
                <VideoPlayer />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          // Если браузер скрыт, показываем только медиаплеер на всю ширину
          <div className="relative h-full w-full">
            <Browser />
            <div className="h-full w-full">
              <VideoPlayer />
            </div>
          </div>
        )}
      </ResizablePanel>

      <ResizableHandle />

      <ResizablePanel defaultSize={50}>
        <div className="h-full flex-1">
          <Timeline />
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
