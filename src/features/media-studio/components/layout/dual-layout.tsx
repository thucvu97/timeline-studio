import { useEffect } from "react"

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { Browser } from "@/features/browser/components/browser"
import { Options } from "@/features/options/components/options"
import { Timeline } from "@/features/timeline/components/timeline"
import { useUserSettings } from "@/features/user-settings"
import { VideoPlayer } from "@/features/video-player/components/video-player"

import { useMultiDisplay } from "../../hooks/use-multi-display"
import { useSecondWindow } from "../../hooks/use-second-window"

export function DualLayout() {
  const { isBrowserVisible, isOptionsVisible, isTimelineVisible } = useUserSettings()
  const { createWindow, closeWindow, isCreated, error } = useSecondWindow()
  const { hasMultipleDisplays, isFirstDisplay } = useMultiDisplay()

  // Создаем второе окно только если есть второй дисплей
  useEffect(() => {
    if (isFirstDisplay && !isCreated && hasMultipleDisplays) {
      void createWindow()
    }
  }, [isFirstDisplay, isCreated, createWindow, hasMultipleDisplays])

  // Если нет второго дисплея, показываем сообщение
  if (!hasMultipleDisplays) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-center">
          <h3 className="mb-2 text-lg font-semibold">Требуется второй дисплей</h3>
          <p className="text-sm text-muted-foreground">
            Для использования двухэкранного режима подключите второй монитор
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      {isFirstDisplay ?? (
        <ResizablePanel defaultSize={50} minSize={30} maxSize={70}>
          <ResizablePanelGroup direction="horizontal" autoSaveId="dual-top-layout">
            <ResizablePanel defaultSize={70} minSize={50} maxSize={85}>
              <div className="relative h-full flex-1">
                <VideoPlayer />
              </div>
            </ResizablePanel>
            <ResizableHandle />
            {isOptionsVisible ?? (
              <ResizablePanel defaultSize={30} minSize={15} maxSize={50}>
                <div className="h-full flex-1">
                  <Options />
                </div>
              </ResizablePanel>
            )}
          </ResizablePanelGroup>
        </ResizablePanel>
      )}
      {!isFirstDisplay && (
        <ResizablePanel defaultSize={50} minSize={30} maxSize={70}>
          <ResizablePanelGroup direction="vertical" autoSaveId="dual-bottom-layout">
            {isBrowserVisible ?? (
              <ResizablePanel defaultSize={40} minSize={20} maxSize={60}>
                <div className="relative h-full flex-1">
                  <Browser />
                </div>
              </ResizablePanel>
            )}
            <ResizableHandle />
            {isTimelineVisible ?? (
              <ResizablePanel defaultSize={isBrowserVisible ? 60 : 100} minSize={40} maxSize={100}>
                <div className="h-full flex-1">
                  <Timeline />
                </div>
              </ResizablePanel>
            )}
          </ResizablePanelGroup>
        </ResizablePanel>
      )}
    </>
  )
}
