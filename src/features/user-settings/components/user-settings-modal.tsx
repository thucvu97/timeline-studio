import { useState } from "react"

import { open } from "@tauri-apps/plugin-dialog"
import { Database, Folder, X } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useModal } from "@/features/modals/services/modal-provider"
import { CacheStatsDialog } from "@/features/video-compiler"
import { LanguageCode, SUPPORTED_LANGUAGES } from "@/i18n/constants"
import { useLanguage } from "@/i18n/hooks/use-language"

import { useUserSettings } from "../hooks/use-user-settings"

/**
 * Модальное окно пользовательских настроек
 * Позволяет пользователю настраивать различные параметры приложения:
 * - Язык интерфейса
 * - Пути для сохранения скриншотов
 * - API ключи для сервисов ИИ
 *
 * @returns {JSX.Element} Компонент модального окна настроек пользователя
 */
export function UserSettingsModal() {
  // Получаем настройки и методы для их изменения из контекста
  const {
    screenshotsPath, // Путь для сохранения скриншотов
    playerScreenshotsPath, // Путь для сохранения скриншотов плеера
    openAiApiKey, // API ключ OpenAI
    claudeApiKey, // API ключ Claude
    handlePlayerScreenshotsPathChange, // Метод для изменения пути скриншотов плеера
    handleScreenshotsPathChange, // Метод для изменения пути скриншотов
    handleAiApiKeyChange, // Метод для изменения API ключа OpenAI
    handleClaudeApiKeyChange, // Метод для изменения API ключа Claude
  } = useUserSettings()

  const { closeModal } = useModal() // Хук для закрытия модального окна
  const { t } = useTranslation() // Хук для интернационализации
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  const { currentLanguage, changeLanguage } = useLanguage() // Хук для управления языком

  // Локальное состояние для выбранного языка
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>(currentLanguage)
  // Состояние для диалога статистики кэша
  const [showCacheStats, setShowCacheStats] = useState(false)

  /**
   * Обработчик изменения языка интерфейса
   * Применяет изменения языка немедленно через новую систему
   *
   * @param {string} value - Код выбранного языка
   */
  const handleLanguageSelect = (value: string) => {
    // Приводим значение к типу LanguageCode
    const newLanguage = value as LanguageCode
    // Обновляем локальное состояние
    setSelectedLanguage(newLanguage)

    // Сразу применяем изменения языка через новую систему
    console.log("Applying language change via new system:", newLanguage)

    // Используем метод changeLanguage из нового хука
    void changeLanguage(newLanguage)
  }

  return (
    <div className="flex flex-col h-full space-y-6 py-1">
      {/* Выбор языка интерфейса */}
      <div className="flex items-center justify-end">
        <Label className="mr-2 text-xs">{t("dialogs.userSettings.interfaceLanguage")}</Label>
        <Select value={selectedLanguage} onValueChange={handleLanguageSelect}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t("dialogs.userSettings.interfaceLanguage")} />
          </SelectTrigger>
          <SelectContent>
            {/* Отображение списка поддерживаемых языков */}
            {SUPPORTED_LANGUAGES.map((lang) => (
              <SelectItem key={lang} value={lang}>
                {/* Отображение названия языка на его родном языке */}
                {t(`language.native.${lang}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Настройка пути для сохранения скриншотов */}
      <div className="flex flex-col space-y-2">
        <Label className="text-xs font-medium">{t("dialogs.userSettings.screenshotsPath")}</Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            {/* Поле ввода пути для скриншотов */}
            <Input
              value={screenshotsPath}
              onChange={(e) => {
                handleScreenshotsPathChange(e.target.value)
              }}
              placeholder="public/screenshots"
              className="h-9 pr-8 font-mono text-sm"
            />
            {/* Кнопка сброса пути к значению по умолчанию */}
            {screenshotsPath && screenshotsPath !== "public/screenshots" && (
              <button
                type="button"
                onClick={() => {
                  handleScreenshotsPathChange("public/screenshots")
                }}
                className="absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                title={t("dialogs.userSettings.clearPath")}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {/* Кнопка выбора директории */}
          <Button
            variant="outline"
            size="icon"
            className="h-9 cursor-pointer"
            title={t("dialogs.userSettings.selectFolder")}
            onClick={() => {
              void (async () => {
                try {
                  // Используем плагин dialog для выбора директории
                  const selectedFolder = await open({
                    directory: true,
                    multiple: false,
                    title: t("dialogs.userSettings.selectFolder"),
                  })

                  // Если пользователь выбрал директорию, обновляем путь
                  if (selectedFolder && !Array.isArray(selectedFolder)) {
                    handleScreenshotsPathChange(selectedFolder)
                    console.log("Screenshots path updated from folder dialog:", selectedFolder)
                  }
                } catch (error) {
                  console.error("Ошибка при выборе директории:", error)

                  // Если произошла ошибка, используем запасной вариант с prompt
                  const folders = [
                    "public/screenshots",
                    "public/images/screenshots",
                    "public/media/screenshots",
                    "public/assets/screenshots",
                  ]

                  const promptResult = window.prompt(t("dialogs.userSettings.selectFolderPrompt"), folders.join("\n"))

                  if (promptResult) {
                    const trimmedPath = promptResult.trim()
                    handleScreenshotsPathChange(trimmedPath)
                    console.log("Screenshots path updated from prompt:", trimmedPath)
                  }
                }
              })()
            }}
          >
            <Folder className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Настройка пути для сохранения скриншотов плеера */}
      <div className="flex flex-col space-y-2">
        <Label className="text-xs font-medium">
          {t("dialogs.userSettings.playerScreenshotsPath", "Путь для сохранения скриншотов видеоплеера")}
        </Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            {/* Поле ввода пути для скриншотов плеера */}
            <Input
              value={playerScreenshotsPath}
              onChange={(e) => {
                handlePlayerScreenshotsPathChange(e.target.value)
              }}
              placeholder="public/media"
              className="h-9 pr-8 font-mono text-sm"
            />
            {/* Кнопка сброса пути к значению по умолчанию */}
            {playerScreenshotsPath && playerScreenshotsPath !== "public/media" && (
              <button
                type="button"
                onClick={() => {
                  handlePlayerScreenshotsPathChange("public/media")
                }}
                className="absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                title={t("dialogs.userSettings.clearPath")}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Кнопка выбора директории */}
          <Button
            variant="outline"
            size="icon"
            className="h-9 cursor-pointer"
            title={t("dialogs.userSettings.selectFolder")}
            onClick={() => {
              void (async () => {
                try {
                  // Используем плагин dialog для выбора директории
                  const selectedFolder = await open({
                    directory: true,
                    multiple: false,
                    title: t("dialogs.userSettings.selectFolder"),
                  })

                  // Если пользователь выбрал директорию, обновляем путь
                  if (selectedFolder && !Array.isArray(selectedFolder)) {
                    handleScreenshotsPathChange(selectedFolder)
                    console.log("Screenshots path updated from folder dialog:", selectedFolder)
                  }
                } catch (error) {
                  console.error("Ошибка при выборе директории:", error)

                  // Если произошла ошибка, используем запасной вариант с prompt
                  const folders = ["public/"]

                  const promptResult = window.prompt(t("dialogs.userSettings.selectFolderPrompt"), folders.join("\n"))

                  if (promptResult) {
                    const trimmedPath = promptResult.trim()
                    handleScreenshotsPathChange(trimmedPath)
                    console.log("Screenshots path updated from prompt:", trimmedPath)
                  }
                }
              })()
            }}
          >
            <Folder className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Настройка API ключа OpenAI */}
      <div className="flex flex-col space-y-2">
        <Label className="text-xs font-medium">{t("dialogs.userSettings.openAiApiKey", "OpenAI API ключ")}</Label>
        <div className="relative flex-1">
          {/* Поле ввода API ключа OpenAI (скрытое) */}
          <Input
            type="password"
            value={openAiApiKey}
            onChange={(e) => {
              // Обновляем значение в машине состояний
              handleAiApiKeyChange(e.target.value)
            }}
            placeholder={t("dialogs.userSettings.enterApiKey", "Введите API ключ")}
            className="h-9 pr-8 font-mono text-sm"
          />
          {/* Кнопка очистки API ключа */}
          {openAiApiKey && (
            <button
              type="button"
              onClick={() => handleAiApiKeyChange("")}
              className="absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              title={t("dialogs.userSettings.clearApiKey", "Очистить API ключ")}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Настройка API ключа Claude */}
      <div className="flex flex-col space-y-2">
        <Label className="text-xs font-medium">{t("dialogs.userSettings.claudeApiKey", "Claude API ключ")}</Label>
        <div className="relative flex-1">
          {/* Поле ввода API ключа Claude (скрытое) */}
          <Input
            type="password"
            value={claudeApiKey}
            onChange={(e) => {
              // Обновляем значение в машине состояний
              handleClaudeApiKeyChange(e.target.value)
            }}
            placeholder={t("dialogs.userSettings.enterApiKey", "Введите API ключ")}
            className="h-9 pr-8 font-mono text-sm"
          />
          {/* Кнопка очистки API ключа */}
          {claudeApiKey && (
            <button
              type="button"
              onClick={() => {
                handleClaudeApiKeyChange("")
              }}
              className="absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              title={t("dialogs.userSettings.clearApiKey", "Очистить API ключ")}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Разделитель */}
      <Separator className="my-4" />

      {/* Раздел производительности */}
      <div className="flex flex-col space-y-2">
        <Label className="text-xs font-medium">{t("dialogs.userSettings.performance", "Производительность")}</Label>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCacheStats(true)}
            className="flex items-center gap-2"
          >
            <Database className="h-4 w-4" />
            {t("dialogs.userSettings.cacheStats", "Статистика кэша")}
          </Button>
        </div>
      </div>

      {/* Кнопки действий в нижней части модального окна */}
      <DialogFooter className="flex justify-between space-x-4 mt-2">
        {/* Кнопка отмены */}
        <Button
          variant="default"
          className="flex-1 cursor-pointer"
          onClick={() => closeModal()} // Закрываем модальное окно без сохранения
        >
          {t("dialogs.userSettings.cancel")}
        </Button>

        {/* Кнопка сохранения */}
        <Button
          variant="default"
          className="flex-1 cursor-pointer bg-[#00CCC0] text-black hover:bg-[#00AAA0]"
          onClick={() => {
            // Все изменения уже применены, просто закрываем модальное окно
            console.log("Closing modal with save button, all changes already applied")
            closeModal()
          }}
        >
          {t("dialogs.userSettings.save")}
        </Button>
      </DialogFooter>

      {/* Диалог статистики кэша */}
      <CacheStatsDialog open={showCacheStats} onOpenChange={setShowCacheStats} />
    </div>
  )
}
