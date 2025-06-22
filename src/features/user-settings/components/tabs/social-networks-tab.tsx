import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

/**
 * Вкладка настроек социальных сетей
 * Управление OAuth ключами для различных платформ
 */
export function SocialNetworksTab() {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      {/* Заголовок и описание */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{t("dialogs.userSettings.tabs.socialNetworks", "Социальные сети")}</h3>
        <p className="text-sm text-muted-foreground">
          {t(
            "dialogs.userSettings.socialNetworksDescription",
            "Настройте OAuth подключения для автоматической публикации видео в социальных сетях.",
          )}
        </p>
      </div>

      <Separator />

      {/* YouTube, TikTok, Vimeo и Telegram подключения - временная заглушка */}
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="text-center space-y-2">
          <h4 className="text-lg font-medium text-muted-foreground">{t("dialogs.userSettings.comingSoon", "Скоро")}</h4>
          <p className="text-sm text-muted-foreground max-w-md">
            {t(
              "dialogs.userSettings.socialNetworksComingSoon",
              "OAuth интеграция с социальными сетями будет доступна в следующих обновлениях. Пока API ключи сохраняются в зашифрованном виде.",
            )}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 justify-center">
          <Button variant="outline" size="sm" disabled>
            YouTube
          </Button>
          <Button variant="outline" size="sm" disabled>
            TikTok
          </Button>
          <Button variant="outline" size="sm" disabled>
            Vimeo
          </Button>
          <Button variant="outline" size="sm" disabled>
            Telegram
          </Button>
        </div>
      </div>

      {/* Дополнительная информация */}
      <div className="mt-6 p-4 bg-muted/50 rounded-md">
        <h4 className="text-sm font-medium mb-2">
          {t("dialogs.userSettings.currentImplementation", "Текущая реализация")}
        </h4>
        <p className="text-xs text-muted-foreground">
          {t(
            "dialogs.userSettings.currentImplementationText",
            "Система безопасного хранения API ключей готова. OAuth интеграция и UI для социальных сетей находятся в разработке.",
          )}
        </p>
      </div>
    </div>
  )
}
