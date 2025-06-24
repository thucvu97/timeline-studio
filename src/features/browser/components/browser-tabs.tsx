import { memo, useCallback } from "react"

import { Blend, Clapperboard, FlipHorizontal2, Music, Sparkles, Sticker, Type, Video } from "lucide-react"
import { useTranslation } from "react-i18next"

import { TabsList, TabsTrigger } from "@/components/ui/tabs"

import { BrowserTabLoadingBadge } from "./browser-loading-indicator"

export const TAB_TRIGGER_STYLES =
  "h-[50px] text-xs text-gray-600 dark:bg-[#2D2D2D] border-none " +
  "hover:text-gray-900 dark:text-gray-400 dark:hover:bg-background dark:hover:text-gray-100 " +
  "dark:data-[state=active]:bg-background data-[state=active]:text-teal dark:data-[state=active]:text-[#35d1c1] " +
  "flex flex-col items-center justify-center gap-1 py-2 " +
  "[&>svg]:data-[state=active]:text-[#38dacac3] cursor-pointer data-[state=active]:cursor-default rounded-none"

interface BrowserTabsProps {
  activeTab: string
  onTabChange: (value: string) => void
}

export const BrowserTabs = memo(({ activeTab, onTabChange }: BrowserTabsProps) => {
  const { t } = useTranslation()

  console.log("BrowserTabs rendered, activeTab:", activeTab)

  // Мемоизируем обработчики кликов
  const handleTabChange = useCallback(
    (tabValue: string) => {
      onTabChange(tabValue)
    },
    [onTabChange],
  )

  return (
    <TabsList className="h-[50px] flex-shrink-0 justify-start border-none rounded-none dark:bg-[#2D2D2D] m-0 p-0">
      <TabsTrigger
        value="media"
        className={TAB_TRIGGER_STYLES}
        onClick={() => handleTabChange("media")}
        data-state={activeTab === "media" ? "active" : "inactive"}
        data-testid="media-tab"
      >
        <Clapperboard className="h-4 w-4" />
        <span>{t("browser.tabs.media")}</span>
      </TabsTrigger>
      <TabsTrigger
        value="music"
        className={TAB_TRIGGER_STYLES}
        onClick={() => handleTabChange("music")}
        data-state={activeTab === "music" ? "active" : "inactive"}
      >
        <Music className="h-4 w-4" />
        <span>{t("browser.tabs.music")}</span>
      </TabsTrigger>
      <TabsTrigger
        value="subtitles"
        className={TAB_TRIGGER_STYLES}
        onClick={() => handleTabChange("subtitles")}
        data-state={activeTab === "subtitles" ? "active" : "inactive"}
      >
        <Type className="h-4 w-4" />
        <span>{t("browser.tabs.subtitles")}</span>
      </TabsTrigger>
      <TabsTrigger
        value="effects"
        className={TAB_TRIGGER_STYLES}
        onClick={() => handleTabChange("effects")}
        data-state={activeTab === "effects" ? "active" : "inactive"}
      >
        <Sparkles className="h-4 w-4" />
        <span className="flex items-center gap-1">
          {t("browser.tabs.effects")}
          <BrowserTabLoadingBadge resourceType="effects" />
        </span>
      </TabsTrigger>
      <TabsTrigger
        value="filters"
        className={TAB_TRIGGER_STYLES}
        onClick={() => handleTabChange("filters")}
        data-state={activeTab === "filters" ? "active" : "inactive"}
      >
        <Blend className="h-4 w-4" />
        <span className="flex items-center gap-1">
          {t("browser.tabs.filters")}
          <BrowserTabLoadingBadge resourceType="filters" />
        </span>
      </TabsTrigger>
      <TabsTrigger
        value="transitions"
        className={TAB_TRIGGER_STYLES}
        onClick={() => handleTabChange("transitions")}
        data-state={activeTab === "transitions" ? "active" : "inactive"}
      >
        <FlipHorizontal2 className="h-4 w-4" />
        <span className="flex items-center gap-1">
          {t("browser.tabs.transitions")}
          <BrowserTabLoadingBadge resourceType="transitions" />
        </span>
      </TabsTrigger>
      <TabsTrigger
        value="templates"
        className={TAB_TRIGGER_STYLES}
        onClick={() => handleTabChange("templates")}
        data-state={activeTab === "templates" ? "active" : "inactive"}
      >
        <Video className="h-4 w-4" />
        <span>{t("browser.tabs.templates")}</span>
      </TabsTrigger>
      <TabsTrigger
        value="style-templates"
        className={TAB_TRIGGER_STYLES}
        onClick={() => handleTabChange("style-templates")}
        data-state={activeTab === "style-templates" ? "active" : "inactive"}
      >
        <Sticker className="h-4 w-4" />
        <span>{t("browser.tabs.styleTemplates")}</span>
      </TabsTrigger>
    </TabsList>
  )
})

BrowserTabs.displayName = "BrowserTabs"
