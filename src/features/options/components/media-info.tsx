import { useTranslation } from "react-i18next"

import { Label } from "@/components/ui/label"

export function MediaInfo() {
  const { t } = useTranslation()

  return (
    <div className="space-y-6" data-testid="media-info">
      <div>
        {/* Выбор файла */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t("options.info.selectFile", "Выберите файл для анализа")}</Label>
          </div>
        </div>
      </div>
    </div>
  )
}
