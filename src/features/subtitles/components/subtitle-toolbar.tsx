import { Separator } from "@/components/ui/separator"

import { SubtitleAITools } from "./subtitle-ai-tools"
import { SubtitleSyncTools } from "./subtitle-sync-tools"
import { SubtitleTools } from "./subtitle-tools"

/**
 * Панель инструментов для работы с субтитрами
 * Объединяет все инструменты субтитров в одном месте
 */
export function SubtitleToolbar() {
  return (
    <div className="flex items-center gap-2 rounded-md border bg-background p-2">
      <SubtitleTools />
      <Separator orientation="vertical" className="h-6" />
      <SubtitleSyncTools />
      <Separator orientation="vertical" className="h-6" />
      <SubtitleAITools />
    </div>
  )
}
