import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { Browser } from "@/features/browser/components/browser"
import { useUserSettings } from "@/features/modals/features/user-settings/user-settings-provider"
import { Options } from "@/features/options/components/options"
import { Timeline } from "@/features/timeline/components/timeline"
import { VideoPlayer } from "@/features/video-player/components/video-player"

export function VerticalLayout() {
  const { isBrowserVisible } = useUserSettings()

  return (
    <ResizablePanelGroup direction="horizontal" className="min-h-0 flex-grow" autoSaveId="vertical-main-layout">
      <ResizablePanel defaultSize={67} minSize={50} maxSize={80}>
        <ResizablePanelGroup direction="vertical" autoSaveId="vertical-left-layout">
          <ResizablePanel defaultSize={50} minSize={30} maxSize={70}>
            <div className="h-full overflow-hidden p-0">
              <ResizablePanelGroup direction="horizontal" autoSaveId="vertical-top-layout">
                {isBrowserVisible ? (
                  <>
                    <ResizablePanel defaultSize={40} minSize={10} maxSize={80}>
                      <div className="relative h-full flex-1">
                        <Browser />
                      </div>
                    </ResizablePanel>
                    <ResizableHandle />
                  </>
                ) : null}
                <ResizablePanel defaultSize={isBrowserVisible ? 60 : 100} minSize={20} maxSize={100}>
                  <div className="h-full flex-1">
                    <Options />
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            </div>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={50}>
            <div className="h-full flex-1">
              <Timeline />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>

      <ResizableHandle />

      <ResizablePanel defaultSize={33}>
        <div className="relative h-full flex-1">
          <VideoPlayer />
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
