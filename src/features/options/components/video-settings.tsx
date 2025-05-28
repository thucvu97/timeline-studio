import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export function VideoSettings() {
  const { t } = useTranslation()

  return (
    <div className="space-y-6" data-testid="video-settings">
      <div>
        <h2 className="text-lg font-semibold mb-4">{t("options.video.title", "Настройки видео")}</h2>
        <Separator className="my-6" />

        {/* Кнопки действий */}
        <div className="flex gap-2">
          <Button variant="outline">{t("common.reset", "Сбросить")}</Button>
          <Button>{t("common.apply", "Применить")}</Button>
        </div>
      </div>
    </div>
  )
}
