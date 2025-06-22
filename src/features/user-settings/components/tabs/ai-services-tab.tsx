import { useEffect, useState } from "react"

import { useTranslation } from "react-i18next"

import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

import { useApiKeys } from "../../hooks/use-api-keys"
import { ApiKeyInput } from "../widgets/api-key-input"

/**
 * Вкладка настроек AI сервисов
 * Управление API ключами для OpenAI и Claude
 */
export function AiServicesTab() {
  const { t } = useTranslation()
  const { saveSimpleApiKey, getApiKeyInfo } = useApiKeys()

  const [openAiKey, setOpenAiKey] = useState("")
  const [claudeKey, setClaudeKey] = useState("")

  // Загружаем существующие ключи при монтировании
  useEffect(() => {
    const openAiInfo = getApiKeyInfo("openai")
    const claudeInfo = getApiKeyInfo("claude")

    // Если ключи существуют, показываем placeholder вместо значения для безопасности
    if (openAiInfo?.has_value) {
      setOpenAiKey("••••••••••••••••••••••••••••••••••••••••••••••••••••")
    }
    if (claudeInfo?.has_value) {
      setClaudeKey("••••••••••••••••••••••••••••••••••••••••••••••••••••")
    }
  }, [getApiKeyInfo])

  const handleOpenAiChange = (value: string) => {
    setOpenAiKey(value)
    // Автосохранение при изменении
    if (value && !value.includes("••••")) {
      void saveSimpleApiKey("openai", value)
    }
  }

  const handleClaudeChange = (value: string) => {
    setClaudeKey(value)
    // Автосохранение при изменении
    if (value && !value.includes("••••")) {
      void saveSimpleApiKey("claude", value)
    }
  }

  return (
    <div className="space-y-6">
      {/* Заголовок и описание */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{t("dialogs.userSettings.tabs.aiServices", "AI Сервисы")}</h3>
        <p className="text-sm text-muted-foreground">
          {t(
            "dialogs.userSettings.aiServicesDescription",
            "Настройте API ключи для интеграции с AI ассистентами. Ключи безопасно хранятся локально.",
          )}
        </p>
      </div>

      <Separator />

      {/* OpenAI настройки */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">{t("dialogs.userSettings.openAiApiKey", "OpenAI API ключ")}</Label>
          <p className="text-xs text-muted-foreground">
            {t(
              "dialogs.userSettings.openAiDescription",
              "Используется для ChatGPT интеграции и генерации контента. Получите ключ на platform.openai.com",
            )}
          </p>
        </div>

        <ApiKeyInput
          value={openAiKey}
          onChange={handleOpenAiChange}
          placeholder={t("dialogs.userSettings.enterApiKey", "Введите API ключ")}
          service="openai"
          testable={true}
          links={[
            {
              text: t("dialogs.userSettings.getApiKey", "Получить API ключ"),
              url: "https://platform.openai.com/api-keys",
            },
          ]}
        />
      </div>

      <Separator />

      {/* Claude настройки */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">{t("dialogs.userSettings.claudeApiKey", "Claude API ключ")}</Label>
          <p className="text-xs text-muted-foreground">
            {t(
              "dialogs.userSettings.claudeDescription",
              "Используется для Claude AI ассистента и продвинутого анализа контента. Получите ключ в консоли Anthropic",
            )}
          </p>
        </div>

        <ApiKeyInput
          value={claudeKey}
          onChange={handleClaudeChange}
          placeholder={t("dialogs.userSettings.enterApiKey", "Введите API ключ")}
          service="claude"
          testable={true}
          links={[
            {
              text: t("dialogs.userSettings.getApiKey", "Получить API ключ"),
              url: "https://console.anthropic.com/settings/keys",
            },
          ]}
        />
      </div>

      {/* Дополнительная информация */}
      <div className="mt-6 p-4 bg-muted/50 rounded-md">
        <h4 className="text-sm font-medium mb-2">
          {t("dialogs.userSettings.securityNote", "Примечание о безопасности")}
        </h4>
        <p className="text-xs text-muted-foreground">
          {t(
            "dialogs.userSettings.securityNoteText",
            "Все API ключи шифруются и хранятся локально на вашем устройстве. Они никогда не передаются третьим лицам.",
          )}
        </p>
      </div>
    </div>
  )
}
