import { useEffect, useState } from "react"

import { useTranslation } from "react-i18next"

import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

import { useApiKeys } from "../../hooks/use-api-keys"
import { ApiKeyInput } from "../widgets/api-key-input"

/**
 * Вкладка настроек разработки
 * Доступна только в development режиме
 * Содержит ключи для инструментов разработки
 */
export function DevelopmentTab() {
  const { t } = useTranslation()
  const { saveSimpleApiKey, getApiKeyInfo } = useApiKeys()

  const [codecovToken, setCodecovToken] = useState("")
  const [tauriAnalyticsKey, setTauriAnalyticsKey] = useState("")

  // Загружаем существующие ключи при монтировании
  useEffect(() => {
    const codecovInfo = getApiKeyInfo("codecov")
    const tauriInfo = getApiKeyInfo("tauri_analytics")

    // Если ключи существуют, показываем placeholder вместо значения для безопасности
    if (codecovInfo?.has_value) {
      setCodecovToken("••••••••••••••••••••••••••••••••••••••••••••••••••••")
    }
    if (tauriInfo?.has_value) {
      setTauriAnalyticsKey("••••••••••••••••••••••••••••••••••••••••••••••••••••")
    }
  }, [getApiKeyInfo])

  const handleCodecovTokenChange = (value: string) => {
    setCodecovToken(value)
    // Автосохранение при изменении
    if (value && !value.includes("••••")) {
      void saveSimpleApiKey("codecov", value)
    }
  }

  const handleTauriAnalyticsKeyChange = (value: string) => {
    setTauriAnalyticsKey(value)
    // Автосохранение при изменении
    if (value && !value.includes("••••")) {
      void saveSimpleApiKey("tauri_analytics", value)
    }
  }

  // Показываем только в dev режиме
  if (process.env.NODE_ENV !== "development") {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Заголовок и описание */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{t("dialogs.userSettings.tabs.development", "Разработка")}</h3>
        <p className="text-sm text-muted-foreground">
          {t(
            "dialogs.userSettings.developmentDescription",
            "Настройки для инструментов разработки и аналитики. Доступно только в режиме разработки.",
          )}
        </p>
      </div>

      <Separator />

      {/* Codecov Token */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">{t("dialogs.userSettings.codecovToken", "Codecov Token")}</Label>
          <p className="text-xs text-muted-foreground">
            {t(
              "dialogs.userSettings.codecovDescription",
              "Токен для отправки отчетов покрытия тестами в Codecov. Используется в CI/CD pipeline.",
            )}
          </p>
        </div>

        <ApiKeyInput
          value={codecovToken}
          onChange={handleCodecovTokenChange}
          placeholder="your_codecov_token_here"
          service="codecov"
          testable={false}
          links={[
            {
              text: t("dialogs.userSettings.getToken", "Получить токен"),
              url: "https://app.codecov.io/settings",
            },
          ]}
        />
      </div>

      <Separator />

      {/* Tauri Analytics */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            {t("dialogs.userSettings.tauriAnalyticsKey", "Tauri Analytics Key")}
          </Label>
          <p className="text-xs text-muted-foreground">
            {t(
              "dialogs.userSettings.tauriAnalyticsDescription",
              "Ключ для аналитики Tauri приложения. Используется для сбора метрик производительности.",
            )}
          </p>
        </div>

        <ApiKeyInput
          value={tauriAnalyticsKey}
          onChange={handleTauriAnalyticsKeyChange}
          placeholder="your_tauri_analytics_key"
          service="tauri_analytics"
          testable={false}
          links={[
            {
              text: t("dialogs.userSettings.tauriDocs", "Документация Tauri"),
              url: "https://tauri.app/v1/guides/features/analytics/",
            },
          ]}
        />
      </div>

      {/* Информация о разработке */}
      <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md">
        <h4 className="text-sm font-medium mb-2 text-amber-800 dark:text-amber-200">
          {t("dialogs.userSettings.devModeNote", "Режим разработки")}
        </h4>
        <p className="text-xs text-amber-700 dark:text-amber-300">
          {t(
            "dialogs.userSettings.devModeNoteText",
            "Эта вкладка видна только в режиме разработки. В production сборке настройки разработки недоступны.",
          )}
        </p>
      </div>
    </div>
  )
}
