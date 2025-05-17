import React from "react"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { AiChat } from "@/features/chat/components/ai-chat"

export function Timeline() {
  return (
    <ResizablePanelGroup direction="horizontal" className="h-full">
      {/* Левая панель - Ресурсы */}
      <ResizablePanel defaultSize={15} minSize={5} maxSize={30}>
        <div />
      </ResizablePanel>
      <ResizableHandle />

      {/* Средняя панель (основная часть) */}
      <ResizablePanel defaultSize={65} minSize={40}>
        <div className="flex h-full w-full flex-col">
          {/* Фиксированная верхняя панель */}
          <div className="flex-shrink-0">
            <div className="min-h-[50px] flex-shrink-0 border-b">
              <div className="h-full p-4">{/* Скомбинированная дорожка */}</div>
            </div>
          </div>
        </div>
      </ResizablePanel>

      <ResizableHandle />

      <ResizablePanel
        defaultSize={20}
        minSize={10}
        maxSize={50}
        className="flex-shrink-0"
      >
        <AiChat />
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
