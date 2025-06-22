import { ExternalLink, Link } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { KeyStatusIndicator } from "./key-status-indicator"
import { useApiKeys } from "../../hooks/use-api-keys"

interface OAuthField {
  key: string
  label: string
  placeholder: string
  type?: "text" | "password"
  optional?: boolean
}

interface OAuthConnectionProps {
  service: string
  credentials: any
  onUpdate: (credentials: any) => void
  fields: OAuthField[]
  links?: Array<{
    text: string
    url: string
  }>
}

/**
 * Компонент для настройки OAuth подключений
 * Поддерживает множественные поля и авторизацию
 */
export function OAuthConnection({ service, credentials, onUpdate, fields, links = [] }: OAuthConnectionProps) {
  const { t } = useTranslation()
  const { getApiKeyStatus, saveOAuthCredentials } = useApiKeys()

  const status = getApiKeyStatus(service)

  const handleFieldChange = (key: string, value: string) => {
    onUpdate({
      ...credentials,
      [key]: value,
    })
  }

  const handleClearField = (key: string) => {
    onUpdate({
      ...credentials,
      [key]: "",
    })
  }

  const handleInitiateOAuth = async () => {
    try {
      // Simple OAuth credentials save for now
      if (credentials.clientId && credentials.clientSecret) {
        await saveOAuthCredentials(service, credentials.clientId, credentials.clientSecret)
      }
    } catch (error) {
      console.error(`OAuth error for ${service}:`, error)
    }
  }

  const isReadyForOAuth = fields
    .filter((field) => !field.optional)
    .every((field) => (credentials[field.key] || "").length > 0)

  return (
    <div className="space-y-4">
      {/* Статус подключения */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{t("dialogs.userSettings.connectionStatus", "Статус подключения")}</span>
        <KeyStatusIndicator status={status} />
      </div>

      {/* Поля для ввода */}
      <div className="space-y-3">
        {fields.map((field) => (
          <div key={field.key} className="space-y-1">
            <Label className="text-sm">
              {field.label}
              {field.optional && (
                <span className="text-xs text-muted-foreground ml-1">
                  ({t("dialogs.userSettings.optional", "опционально")})
                </span>
              )}
            </Label>
            <div className="relative">
              <Input
                type={field.type || "text"}
                value={credentials[field.key] || ""}
                onChange={(e) => handleFieldChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                className="h-9 pr-8 font-mono text-sm"
              />
              {(credentials[field.key] || "").length > 0 && (
                <button
                  type="button"
                  onClick={() => handleClearField(field.key)}
                  className="absolute top-1/2 right-2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  title={t("dialogs.userSettings.clear", "Очистить")}
                >
                  ×
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Кнопки действий */}
      <div className="flex flex-wrap gap-2">
        {/* OAuth авторизация */}
        <Button
          variant="default"
          size="sm"
          onClick={handleInitiateOAuth}
          disabled={!isReadyForOAuth || status === "testing"}
          className="flex items-center gap-2"
        >
          <Link className="h-3 w-3" />
          {t("dialogs.userSettings.authorize", "Авторизоваться")}
        </Button>

        {/* Ссылки на документацию */}
        {links.map((link, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            onClick={() => window.open(link.url, "_blank")}
          >
            <ExternalLink className="h-3 w-3" />
            {link.text}
          </Button>
        ))}
      </div>

      {/* Инструкции по настройке */}
      <div className="p-3 bg-muted/50 rounded-md">
        <h5 className="text-sm font-medium mb-2">
          {t("dialogs.userSettings.setupInstructions", "Инструкции по настройке")}
        </h5>
        <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
          <li>{t("dialogs.userSettings.step1", "Создайте OAuth приложение в консоли разработчика")}</li>
          <li>{t("dialogs.userSettings.step2", "Скопируйте Client ID и Client Secret")}</li>
          <li>{t("dialogs.userSettings.step3", "Введите данные в поля выше")}</li>
          <li>{t("dialogs.userSettings.step4", "Нажмите 'Авторизоваться' для получения токена доступа")}</li>
        </ol>
      </div>

      {/* Статусные сообщения */}
      {status === "valid" && (
        <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md">
          <p className="text-sm text-green-800 dark:text-green-200">
            {t(
              "dialogs.userSettings.connectionSuccess",
              "Подключение успешно настроено. Вы можете публиковать контент.",
            )}
          </p>
        </div>
      )}

      {status === "invalid" && (
        <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-sm text-red-800 dark:text-red-200">
            {t("dialogs.userSettings.connectionError", "Ошибка подключения. Проверьте данные и повторите авторизацию.")}
          </p>
        </div>
      )}
    </div>
  )
}
