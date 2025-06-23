import { Tabs } from "@/components/ui/tabs"
import { BrowserStateProvider, useBrowserState } from "@/features/browser/services/browser-state-provider"

// import { BrowserContent } from "./browser-content"
import { BrowserContentNew as BrowserContent } from "./browser-content-new" // Временно используем новую версию для тестирования
import { BrowserTabs } from "./browser-tabs"

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
      <BrowserWithState />
    </BrowserStateProvider>
  )
}
