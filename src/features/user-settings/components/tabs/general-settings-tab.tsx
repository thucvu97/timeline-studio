import { useState } from "react"

import { open } from "@tauri-apps/plugin-dialog"
import { Database, Folder, X } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useModal } from "@/features/modals/services/modal-provider"
import { LanguageCode, SUPPORTED_LANGUAGES } from "@/i18n/constants"
import { useLanguage } from "@/i18n/hooks/use-language"

import { useUserSettings } from "../../hooks/use-user-settings"

/**
 * Вкладка общих настроек пользователя
 * Содержит основные настройки: язык, пути, производительность
 */
export function GeneralSettingsTab() {
  const { screenshotsPath, playerScreenshotsPath, handlePlayerScreenshotsPathChange, handleScreenshotsPathChange } =
    useUserSettings()

  const { openModal } = useModal()
  const { t } = useTranslation()
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  const { currentLanguage, changeLanguage } = useLanguage()

  // Локальное состояние для выбранного языка
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>(currentLanguage)

  /**
   * Обработчик изменения языка интерфейса
   */
  const handleLanguageSelect = (value: string) => {
    const newLanguage = value as LanguageCode
    setSelectedLanguage(newLanguage)
    console.log("Applying language change via new system:", newLanguage)
    void changeLanguage(newLanguage)
  }

  return (
    <div className="space-y-6">
      {/* Выбор языка интерфейса */}
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{t("dialogs.userSettings.interfaceLanguage")}</Label>
        <Select value={selectedLanguage} onValueChange={handleLanguageSelect}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t("dialogs.userSettings.interfaceLanguage")} />
          </SelectTrigger>
          <SelectContent>
            {SUPPORTED_LANGUAGES.map((lang) => (
              <SelectItem key={lang} value={lang}>
                {t(`language.native.${lang}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Настройка пути для сохранения скриншотов */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">{t("dialogs.userSettings.screenshotsPath")}</Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              value={screenshotsPath}
              onChange={(e) => handleScreenshotsPathChange(e.target.value)}
              placeholder="public/screenshots"
              className="h-9 pr-8 font-mono text-sm"
            />
            {screenshotsPath && screenshotsPath !== "public/screenshots" && (
              <button
                type="button"
                onClick={() => handleScreenshotsPathChange("public/screenshots")}
                className="absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                title={t("dialogs.userSettings.clearPath")}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button
            variant="outline"
            size="icon"
            className="h-9 cursor-pointer"
            title={t("dialogs.userSettings.selectFolder")}
            onClick={() => {
              void (async () => {
                try {
                  const selectedFolder = await open({
                    directory: true,
                    multiple: false,
                    title: t("dialogs.userSettings.selectFolder"),
                  })

                  if (selectedFolder && !Array.isArray(selectedFolder)) {
                    handleScreenshotsPathChange(selectedFolder)
                    console.log("Screenshots path updated from folder dialog:", selectedFolder)
                  }
                } catch (error) {
                  console.error("Ошибка при выборе директории:", error)
                  const promptResult = window.prompt(t("dialogs.userSettings.selectFolderPrompt"), "public/screenshots")
                  if (promptResult) {
                    handleScreenshotsPathChange(promptResult.trim())
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
      <div className="space-y-3">
        <Label className="text-sm font-medium">
          {t("dialogs.userSettings.playerScreenshotsPath", "Путь для сохранения скриншотов видеоплеера")}
        </Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              value={playerScreenshotsPath}
              onChange={(e) => handlePlayerScreenshotsPathChange(e.target.value)}
              placeholder="public/media"
              className="h-9 pr-8 font-mono text-sm"
            />
            {playerScreenshotsPath && playerScreenshotsPath !== "public/media" && (
              <button
                type="button"
                onClick={() => handlePlayerScreenshotsPathChange("public/media")}
                className="absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                title={t("dialogs.userSettings.clearPath")}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button
            variant="outline"
            size="icon"
            className="h-9 cursor-pointer"
            title={t("dialogs.userSettings.selectFolder")}
            onClick={() => {
              void (async () => {
                try {
                  const selectedFolder = await open({
                    directory: true,
                    multiple: false,
                    title: t("dialogs.userSettings.selectFolder"),
                  })

                  if (selectedFolder && !Array.isArray(selectedFolder)) {
                    handlePlayerScreenshotsPathChange(selectedFolder)
                    console.log("Player screenshots path updated from folder dialog:", selectedFolder)
                  }
                } catch (error) {
                  console.error("Ошибка при выборе директории:", error)
                  const promptResult = window.prompt(t("dialogs.userSettings.selectFolderPrompt"), "public/media")
                  if (promptResult) {
                    handlePlayerScreenshotsPathChange(promptResult.trim())
                  }
                }
              })()
            }}
          >
            <Folder className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Separator />

      {/* Раздел производительности */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">{t("dialogs.userSettings.performance.title")}</Label>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => openModal("cache-statistics", { returnTo: "user-settings" })}
            className="flex items-center gap-2"
          >
            <Database className="h-4 w-4" />
            {t("dialogs.userSettings.cacheStats", "Статистика кэша")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => openModal("cache-settings", { returnTo: "user-settings" })}
            className="flex items-center gap-2"
          >
            <Database className="h-4 w-4" />
            {t("dialogs.userSettings.cacheSettings", "Настройки кэша")}
          </Button>
        </div>
      </div>
    </div>
  )
}
