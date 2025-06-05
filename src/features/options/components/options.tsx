import { JSX, useEffect, useState } from "react"

import { AudioLines, Gauge, Info, Video } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TAB_TRIGGER_STYLES } from "@/features/browser"
import { MediaFile } from "@/features/media/types/media"
import { cn } from "@/lib/utils"

import { AudioSettings } from "./audio-settings"
import { MediaInfo } from "./media-info"
import { SpeedSettings } from "./speed-settings"
import { VideoSettings } from "./video-settings"

type OptionsTab = "video" | "audio" | "speed" | "info"

const TABS: Array<{ id: OptionsTab; labelKey: string; icon: JSX.Element }> = [
  { id: "video", labelKey: "options.tabs.video", icon: <Video /> },
  { id: "audio", labelKey: "options.tabs.audio", icon: <AudioLines /> },
  { id: "speed", labelKey: "options.tabs.speed", icon: <Gauge /> },
  { id: "info", labelKey: "options.tabs.info", icon: <Info /> },
]

export interface OptionsProps {
  selectedMediaFile?: MediaFile | null
}

export function Options({ selectedMediaFile }: OptionsProps) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<OptionsTab>(selectedMediaFile ? "info" : "video")

  // Автоматически переключаемся на вкладку "info" при выборе медиафайла
  useEffect(() => {
    if (selectedMediaFile) {
      setActiveTab("info")
    }
  }, [selectedMediaFile])

  const renderTabContent = () => {
    switch (activeTab) {
      case "video":
        return <VideoSettings />
      case "audio":
        return <AudioSettings />
      case "speed":
        return <SpeedSettings />
      case "info":
        return <MediaInfo />
      default:
        return <VideoSettings />
    }
  }

  return (
    <div className="flex h-full flex-col bg-background p-0 m-0" data-testid="options">
      <Tabs
        className="flex-shrink-0 justify-start border-none rounded-none m-0 p-0"
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as OptionsTab)}
        data-testid="options-tabs"
      >
        {/* Вкладки */}
        <TabsList
          className="grid w-full grid-cols-4 flex-shrink-0 border-none bg-[#252526] rounded-none m-0 p-0"
          data-testid="options-tabs-list"
        >
          {TABS.map((tab) => (
            <TabsTrigger
              className={cn(TAB_TRIGGER_STYLES, "h-[35px] flex-row items-center justify-center gap-2")}
              key={tab.id}
              value={tab.id}
              data-testid={`options-tab-${tab.id}`}
            >
              {tab.icon}
              <span className="">{t(tab.labelKey)}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Содержимое вкладок */}
        {TABS.map((tab) => (
          <TabsContent
            key={tab.id}
            value={tab.id}
            className="flex-1 h-full overflow-x-hidden overflow-y-auto p-4"
            data-testid={`options-content-${tab.id}`}
          >
            {activeTab === tab.id && <div data-testid={`options-${tab.id}-settings`}>{renderTabContent()}</div>}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
