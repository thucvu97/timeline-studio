import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { Browser } from "@/features/browser/components/browser"
import { Options } from "@/features/options"
import { Timeline } from "@/features/timeline/components/timeline"
import { useUserSettings } from "@/features/user-settings"
import { VideoPlayer } from "@/features/video-player/components/video-player"

function TopDefaultLayout() {
  const { isBrowserVisible, isOptionsVisible } = useUserSettings()

  if (!isBrowserVisible && !isOptionsVisible) {
    return (
      <div className="h-full flex-1">
        <VideoPlayer />
      </div>
    )
  }

  if (!isOptionsVisible) {
    return (
      <ResizablePanelGroup direction="horizontal" className="min-h-0 flex-grow" autoSaveId="default-layout-1">
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
      <ResizablePanelGroup direction="horizontal" className="min-h-0 flex-grow" autoSaveId="default-layout-2">
        <ResizablePanel defaultSize={65} minSize={20} maxSize={80}>
          <div className="relative h-full flex-1">
            <VideoPlayer />
          </div>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={35} minSize={20} maxSize={80}>
          <div className="h-full flex-1">
            <Options />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    )
  }

  return (
    <ResizablePanelGroup direction="horizontal" className="min-h-0 flex-grow" autoSaveId="default-layout-3">
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

      <ResizableHandle />
      <ResizablePanel defaultSize={20} minSize={20} maxSize={80}>
        <div className="h-full flex-1">
          <Options />
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}

export function DefaultLayout() {
  const { isTimelineVisible } = useUserSettings()

  return (
    <ResizablePanelGroup direction="vertical" className="min-h-0 flex-grow" autoSaveId="default-layout-main">
      <ResizablePanel defaultSize={50} minSize={20} maxSize={80}>
        <TopDefaultLayout />
      </ResizablePanel>
      {isTimelineVisible ? (
        <>
          <ResizableHandle />
          <ResizablePanel
            defaultSize={20}
            minSize={20}
            maxSize={100}
            style={{
              transition: "width 0.3s ease-in-out",
            }}
          >
            <div className="h-full flex-1">
              <Timeline />
            </div>
          </ResizablePanel>
        </>
      ) : null}
    </ResizablePanelGroup>
  )
}
