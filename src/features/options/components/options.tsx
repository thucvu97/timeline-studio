import { useEffect, useState } from "react";

import { useTranslation } from "react-i18next";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MediaFile } from "@/types/media";

import { AudioSettings } from "./audio-settings";
import { MediaInfo } from "./media-info";
import { SpeedSettings } from "./speed-settings";
import { VideoSettings } from "./video-settings";

type OptionsTab = "video" | "audio" | "speed" | "info";

const TABS: Array<{ id: OptionsTab; labelKey: string }> = [
  { id: "video", labelKey: "options.tabs.video" },
  { id: "audio", labelKey: "options.tabs.audio" },
  { id: "speed", labelKey: "options.tabs.speed" },
  { id: "info", labelKey: "options.tabs.info" },
];

export interface OptionsProps {
  selectedMediaFile?: MediaFile | null;
  onMediaFileSelect?: (file: MediaFile) => void;
}

export function Options({ selectedMediaFile, onMediaFileSelect }: OptionsProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<OptionsTab>(
    selectedMediaFile ? "info" : "video"
  );

  // Автоматически переключаемся на вкладку "info" при выборе медиафайла
  useEffect(() => {
    if (selectedMediaFile) {
      setActiveTab("info");
    }
  }, [selectedMediaFile]);

  const renderTabContent = () => {
    switch (activeTab) {
      case "video":
        return <VideoSettings />;
      case "audio":
        return <AudioSettings />;
      case "speed":
        return <SpeedSettings />;
      case "info":
        return <MediaInfo selectedMediaFile={selectedMediaFile} />;
      default:
        return <VideoSettings />;
    }
  };

  return (
    <div className="flex h-full flex-col bg-background" data-testid="options">
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as OptionsTab)}
        data-testid="options-tabs"
      >
        {/* Вкладки */}
        <TabsList className="grid w-full grid-cols-4" data-testid="options-tabs-list">
          {TABS.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              data-testid={`options-tab-${tab.id}`}
            >
              {t(tab.labelKey)}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Содержимое вкладок */}
        {TABS.map((tab) => (
          <TabsContent
            key={tab.id}
            value={tab.id}
            className="flex-1 overflow-auto p-4"
            data-testid={`options-content-${tab.id}`}
          >
            {activeTab === tab.id && (
              <div data-testid={`options-${tab.id}-settings`}>
                {renderTabContent()}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
