import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Browser } from "@/features/browser/components/browser";
import { useUserSettings } from "@/features/modals/features/user-settings/user-settings-provider";
import { Timeline } from "@/features/timeline/components/timeline";
import { VideoPlayer } from "@/features/video-player/components/video-player";

export function DefaultLayout() {
  const { isBrowserVisible } = useUserSettings();

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
          <div className="relative h-full w-full">
            <VideoPlayer />
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
  );
}
