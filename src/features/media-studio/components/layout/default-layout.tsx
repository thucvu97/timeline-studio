import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { Browser } from "@/features/browser/components/browser"
import { Options } from "@/features/options"
import { Timeline } from "@/features/timeline/components/timeline"
import { useUserSettings } from "@/features/user-settings"
import { VideoPlayer } from "@/features/video-player/components/video-player"

export function DefaultLayout() {
  const { isBrowserVisible } = useUserSettings()

  return (
    <ResizablePanelGroup direction="vertical" className="min-h-0 flex-grow" autoSaveId="default-layout">
      <ResizablePanel defaultSize={50} minSize={20} maxSize={80}>
        <ResizablePanelGroup direction="horizontal" autoSaveId="top-layout">
          {isBrowserVisible ? (
            <>
              <ResizablePanel
                defaultSize={30}
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
            </>
          ) : null}
          <ResizablePanel
            defaultSize={50}
            minSize={20}
            maxSize={100}
            style={{
              transition: "width 0.3s ease-in-out",
            }}
          >
            <div className="h-full w-full flex-1">
              <VideoPlayer />
            </div>
          </ResizablePanel>
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
              <Options />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
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
