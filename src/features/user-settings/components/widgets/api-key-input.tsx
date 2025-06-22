import { useState } from "react"

import { ExternalLink, Eye, EyeOff, Loader2, X } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { KeyStatusIndicator } from "./key-status-indicator"
import { useApiKeys } from "../../hooks/use-api-keys"

interface ApiKeyInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  service: string
  label?: string
  testable?: boolean
  links?: Array<{
    text: string
    url: string
  }>
}

/**
 * Переиспользуемый компонент для ввода API ключей
 * Поддерживает скрытие/показ, валидацию и тестирование
 */
export function ApiKeyInput({ 
  value, 
  onChange, 
  placeholder, 
  service, 
  label,
  testable = false,
  links = []
}: ApiKeyInputProps) {
  const { t } = useTranslation()
  const { getApiKeyStatus, testApiKey } = useApiKeys()
  const [showKey, setShowKey] = useState(false)
  const [isTesting, setIsTesting] = useState(false)

  const status = getApiKeyStatus(service)

  const handleTest = async () => {
    if (!value || isTesting) return
    
    setIsTesting(true)
    try {
      await testApiKey(service)
    } finally {
      setIsTesting(false)
    }
  }

  const handleClear = () => {
    onChange("")
    setShowKey(false)
  }

  return (
    <div className="space-y-3">
      {/* Label и статус */}
      {label && (
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">{label}</Label>
          <KeyStatusIndicator status={status} />
        </div>
      )}

      {/* Поле ввода */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            type={showKey ? "text" : "password"}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="h-9 pr-16 font-mono text-sm"
          />
          
          {/* Кнопки в поле ввода */}
          <div className="absolute top-1/2 right-2 -translate-y-1/2 flex items-center gap-1">
            {/* Показать/скрыть ключ */}
            {value && (
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                title={showKey ? t("dialogs.userSettings.hideKey", "Скрыть ключ") : t("dialogs.userSettings.showKey", "Показать ключ")}
              >
                {showKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </button>
            )}
            
            {/* Очистить ключ */}
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                title={t("dialogs.userSettings.clearApiKey", "Очистить API ключ")}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* Кнопка тестирования */}
        {testable && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleTest}
            disabled={!value || isTesting || status === 'testing'}
            className="h-9 px-3"
          >
            {(isTesting || status === 'testing') ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              t("dialogs.userSettings.test", "Тест")
            )}
          </Button>
        )}
      </div>

      {/* Ссылки */}
      {links.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {links.map((link, index) => (
            <Button
              key={index}
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => window.open(link.url, '_blank')}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              {link.text}
            </Button>
          ))}
        </div>
      )}

      {/* Статусное сообщение */}
      {status === 'invalid' && (
        <p className="text-xs text-red-600 dark:text-red-400">
          {t("dialogs.userSettings.invalidKey", "Неверный API ключ или проблемы с подключением")}
        </p>
      )}
      {status === 'valid' && (
        <p className="text-xs text-green-600 dark:text-green-400">
          {t("dialogs.userSettings.validKey", "API ключ работает корректно")}
        </p>
      )}
    </div>
  )
}