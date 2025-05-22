import { useState } from "react"

import { Tabs } from "@/components/ui/tabs"

import { BrowserContent } from "./browser-content"
import { BrowserTabs } from "./browser-tabs"

// Клиентский компонент Browser
export function Browser() {
  const [activeTab, setActiveTab] = useState("media")

  const handleTabChange = (value: string) => {
    setActiveTab(value)
  }

  return (
    <div className="relative h-full w-full">
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        defaultValue="media"
        className="flex h-full w-full flex-col overflow-hidden gap-0 dark:bg-[#2D2D2D]"
      >
        <BrowserTabs activeTab={activeTab} onTabChange={handleTabChange} />
        <BrowserContent />
      </Tabs>
    </div>
  )
}
