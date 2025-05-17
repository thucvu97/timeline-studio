import { useState } from "react"

import {
  Blend,
  FlipHorizontal2,
  Grid2X2,
  Image,
  Music,
  Sparkles,
} from "lucide-react"
import { useTranslation } from "react-i18next"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export const TAB_TRIGGER_STYLES =
  "text-xs text-gray-800 dark:bg-[#1b1a1f] border-none " +
  "bg-gray-200 data-[state=active]:bg-secondary data-[state=active]:text-[#38dacac3] " +
  "dark:data-[state=active]:bg-secondary dark:data-[state=active]:text-[#35d1c1] " +
  "hover:text-gray-800 dark:text-gray-400 dark:hover:bg-secondary dark:hover:text-gray-100 " +
  "border-1 border-transparent flex flex-col items-center justify-center gap-1 py-2 " +
  "[&>svg]:data-[state=active]:text-[#38dacac3] cursor-pointer data-[state=active]:cursor-default rounded-none"

// Клиентский компонент Browser
export function Browser() {
  const [activeTab, setActiveTab] = useState("media")
  const { t } = useTranslation()

  const handleTabChange = (value: string) => {
    setActiveTab(value)
  }

  return (
    <div className="relative h-full w-full">
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        defaultValue="media"
        className="flex h-full w-full flex-col items-stretch overflow-hidden"
      >
        <TabsList className="h-[50px] flex-shrink-0 justify-start border-none bg-transparent p-0">
          <TabsTrigger value="media" className={TAB_TRIGGER_STYLES}>
            <Image className="h-4 w-4" />
            <span>{t("browser.tabs.media")}</span>
          </TabsTrigger>
          <TabsTrigger value="music" className={TAB_TRIGGER_STYLES}>
            <Music className="h-4 w-4" />
            <span>{t("browser.tabs.music")}</span>
          </TabsTrigger>
          <TabsTrigger value="effects" className={TAB_TRIGGER_STYLES}>
            <Sparkles className="h-4 w-4" />
            <span>{t("browser.tabs.effects")}</span>
          </TabsTrigger>
          <TabsTrigger value="filters" className={TAB_TRIGGER_STYLES}>
            <Blend className="h-4 w-4" />
            <span>{t("browser.tabs.filters")}</span>
          </TabsTrigger>
          {/* <TabsTrigger value="subtitles" className={TAB_TRIGGER_STYLES}>
              <Type className="h-4 w-4" />
              <span>{t("titles.add")}</span>
            </TabsTrigger> */}
          <TabsTrigger value="transitions" className={TAB_TRIGGER_STYLES}>
            <FlipHorizontal2 className="h-4 w-4" />
            <span>{t("browser.tabs.transitions")}</span>
          </TabsTrigger>
          <TabsTrigger value="templates" className={TAB_TRIGGER_STYLES}>
            <Grid2X2 className="h-4 w-4" />
            <span>{t("browser.tabs.templates")}</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent
          value="media"
          className="bg-secondary m-0 flex-1 overflow-auto"
        >
          <div />
        </TabsContent>
        <TabsContent
          value="music"
          className="bg-secondary m-0 flex-1 overflow-auto"
        >
          <div />
        </TabsContent>
        <TabsContent
          value="transitions"
          className="bg-secondary m-0 flex-1 overflow-auto"
        >
          <div />
        </TabsContent>
        <TabsContent
          value="effects"
          className="bg-secondary m-0 flex-1 overflow-auto"
        >
          <div />
        </TabsContent>
        <TabsContent
          value="subtitles"
          className="bg-secondary m-0 flex-1 overflow-auto"
        >
          <div />
        </TabsContent>
        <TabsContent
          value="filters"
          className="bg-secondary m-0 flex-1 overflow-auto"
        >
          <div />
        </TabsContent>
        <TabsContent
          value="templates"
          className="bg-secondary m-0 flex-1 overflow-auto"
        >
          <div />
        </TabsContent>
      </Tabs>
    </div>
  )
}
