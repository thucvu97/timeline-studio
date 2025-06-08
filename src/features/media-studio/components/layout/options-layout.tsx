import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { Browser } from "@/features/browser/components/browser"
import { Options } from "@/features/options"
import { Timeline } from "@/features/timeline/components/timeline"
import { useUserSettings } from "@/features/user-settings"
import { VideoPlayer } from "@/features/video-player/components/video-player"

function LeftLayout() {
  const { isTimelineVisible, isBrowserVisible } = useUserSettings()

  if (!isTimelineVisible && !isBrowserVisible) {
    return (
      <div className="h-full flex-1">
        <VideoPlayer />
      </div>
    )
  }

  if (!isTimelineVisible) {
    return (
      <ResizablePanelGroup direction="horizontal" className="min-h-0 flex-grow" autoSaveId="opts-layout-1">
        <ResizablePanel defaultSize={35} minSize={20} maxSize={80}>
          <div className="h-full flex-1">
            <Browser />
          </div>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={65} minSize={20} maxSize={80}>
          <div className="relative h-full flex-1">
            <VideoPlayer />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    )
  }

  if (!isBrowserVisible) {
    return (
      <ResizablePanelGroup direction="horizontal" className="min-h-0 flex-grow" autoSaveId="opts-layout-2">
        <ResizablePanel defaultSize={65} minSize={20} maxSize={80}>
          <div className="relative h-full flex-1">
            <VideoPlayer />
          </div>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={35} minSize={20} maxSize={80}>
          <div className="h-full flex-1">
            <Timeline />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    )
  }

  return (
    <ResizablePanelGroup direction="vertical" className="min-h-0 flex-grow" autoSaveId="opts-layout-3">
      <ResizablePanel defaultSize={50} minSize={20} maxSize={80}>
        <ResizablePanelGroup direction="horizontal" autoSaveId="opts-layout-4">
          <ResizablePanel defaultSize={30} minSize={20} maxSize={80}>
            <div className="h-full flex-1">
              <Browser />
            </div>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={50} minSize={20} maxSize={100}>
            <div className="relative h-full flex-1">
              <VideoPlayer />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>

      <ResizableHandle />
      <ResizablePanel defaultSize={20} minSize={20} maxSize={80}>
        <div className="h-full flex-1">
          <Timeline />
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}

export function OptionsLayout() {
  const { isOptionsVisible } = useUserSettings()

  return (
    <ResizablePanelGroup direction="horizontal" className="min-h-0 flex-grow" autoSaveId="opts-layout-main">
      <ResizablePanel defaultSize={70}>
        <LeftLayout />
      </ResizablePanel>
      <ResizableHandle />

      {isOptionsVisible && (
        <ResizablePanel defaultSize={30}>
          <div className="h-full flex-1">
            <Options />
          </div>
        </ResizablePanel>
      )}
    </ResizablePanelGroup>
  )
}
