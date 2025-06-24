import { Tabs } from "@/components/ui/tabs"
import { BrowserStateProvider, useBrowserState } from "@/features/browser/services/browser-state-provider"

import { BrowserContentNew as BrowserContent } from "./browser-content-new"
import { BrowserTabs } from "./browser-tabs"
import { EffectsProvider } from "../providers/effects-provider"

// Внутренний компонент, который использует состояние браузера
function BrowserWithState() {
  const { activeTab, switchTab } = useBrowserState()

  const handleTabChange = (value: string) => {
    switchTab(value as any) // TODO: типизировать правильно
  }

  return (
    <div className="relative h-full w-full">
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        defaultValue="media"
        className="flex h-full w-full flex-col gap-0 dark:bg-[#2D2D2D]"
      >
        <BrowserTabs activeTab={activeTab} onTabChange={handleTabChange} />
        <BrowserContent />
      </Tabs>
    </div>
  )
}

// Клиентский компонент Browser
export function Browser() {
  return (
    <BrowserStateProvider>
      <EffectsProvider
        config={{
          initialSources: ["built-in"],
          backgroundLoadDelay: 1500,
          enableCaching: true,
          maxCacheSize: 50 * 1024 * 1024, // 50MB
        }}
        onError={(error) => {
          console.error("Browser EffectsProvider Error:", error)
        }}
      >
        <BrowserWithState />
      </EffectsProvider>
    </BrowserStateProvider>
  )
}
