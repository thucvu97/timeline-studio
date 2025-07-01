import { memo } from "react"

import { Blend, Clapperboard, FlipHorizontal2, Music, Sparkles, Sticker, Type, Video } from "lucide-react"
import { useTranslation } from "react-i18next"

import { TabsList, TabsTrigger } from "@/components/ui/tabs"

export const TAB_TRIGGER_STYLES =
  "h-[50px] text-xs text-gray-600 dark:bg-[#2D2D2D] border-none " +
  "hover:text-gray-900 dark:text-gray-400 dark:hover:bg-background dark:hover:text-gray-100 " +
  "dark:data-[state=active]:bg-background data-[state=active]:text-teal dark:data-[state=active]:text-[#35d1c1] " +
  "flex flex-col items-center justify-center gap-1 py-2 " +
  "[&>svg]:data-[state=active]:text-[#38dacac3] cursor-pointer data-[state=active]:cursor-default rounded-none"

interface BrowserTabsProps {
  activeTab: string
}

export const BrowserTabs = memo(({ activeTab }: BrowserTabsProps) => {
  const { t } = useTranslation()

  console.log("BrowserTabs rendered, activeTab:", activeTab)

  return (
    <TabsList className="h-[50px] flex-shrink-0 justify-start border-none rounded-none dark:bg-[#2D2D2D] m-0 p-0">
      <TabsTrigger
        value="media"
        className={TAB_TRIGGER_STYLES}
        data-testid="media-tab"
      >
        <Clapperboard className="h-4 w-4" />
        <span>{t("browser.tabs.media")}</span>
      </TabsTrigger>
      <TabsTrigger
        value="music"
        className={TAB_TRIGGER_STYLES}
        data-testid="music-tab"
      >
        <Music className="h-4 w-4" />
        <span>{t("browser.tabs.music")}</span>
      </TabsTrigger>
      <TabsTrigger
        value="subtitles"
        className={TAB_TRIGGER_STYLES}
        data-testid="subtitles-tab"
      >
        <Type className="h-4 w-4" />
        <span>{t("browser.tabs.subtitles")}</span>
      </TabsTrigger>
      <TabsTrigger
        value="effects"
        className={TAB_TRIGGER_STYLES}
        data-testid="effects-tab"
      >
        <Sparkles className="h-4 w-4" />
        <span>{t("browser.tabs.effects")}</span>
      </TabsTrigger>
      <TabsTrigger
        value="filters"
        className={TAB_TRIGGER_STYLES}
        data-testid="filters-tab"
      >
        <Blend className="h-4 w-4" />
        <span>{t("browser.tabs.filters")}</span>
      </TabsTrigger>
      <TabsTrigger
        value="transitions"
        className={TAB_TRIGGER_STYLES}
        data-testid="transitions-tab"
      >
        <FlipHorizontal2 className="h-4 w-4" />
        <span>{t("browser.tabs.transitions")}</span>
      </TabsTrigger>
      <TabsTrigger
        value="templates"
        className={TAB_TRIGGER_STYLES}
        data-testid="templates-tab"
      >
        <Video className="h-4 w-4" />
        <span>{t("browser.tabs.templates")}</span>
      </TabsTrigger>
      <TabsTrigger
        value="style-templates"
        className={TAB_TRIGGER_STYLES}
        data-testid="style-templates-tab"
      >
        <Sticker className="h-4 w-4" />
        <span>{t("browser.tabs.styleTemplates")}</span>
      </TabsTrigger>
    </TabsList>
  )
})

BrowserTabs.displayName = "BrowserTabs"
