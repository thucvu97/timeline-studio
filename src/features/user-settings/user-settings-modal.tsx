import { useEffect, useState } from "react"

import { Folder, X } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useLanguage } from "@/hooks/use-language"
import { LanguageCode, SUPPORTED_LANGUAGES } from "@/i18n/constants"

import { useUserSettings } from "./user-settings-provider"
import { useModal } from "../modals"

export function UserSettingsModal() {
  const {
    screenshotsPath,
    aiApiKey,
    handleScreenshotsPathChange,
    handleAiApiKeyChange,
  } = useUserSettings()
  const { closeModal } = useModal()
  const { t } = useTranslation()
  const { currentLanguage, changeLanguage } = useLanguage()

  const [selectedLanguage, setSelectedLanguage] =
    useState<LanguageCode>(currentLanguage)
  const [selectedScreenshotsPath, setSelectedScreenshotsPath] =
    useState<string>(screenshotsPath)
  const [selectedAiApiKey, setSelectedAiApiKey] = useState<string>(aiApiKey)

  // Обновляем выбранный язык при изменении языка в контексте
  useEffect(() => {
    setSelectedLanguage(currentLanguage)
  }, [currentLanguage])

  // Обновляем выбранный путь скриншотов при изменении пути в контексте
  useEffect(() => {
    setSelectedScreenshotsPath(screenshotsPath)
  }, [screenshotsPath])

  // Обновляем выбранный API ключ при изменении в контексте
  useEffect(() => {
    setSelectedAiApiKey(aiApiKey)
  }, [aiApiKey])

  // Обработчик изменения языка - применяет изменения сразу
  const handleLanguageSelect = (value: string) => {
    const newLanguage = value as LanguageCode
    setSelectedLanguage(newLanguage)

    // Сразу применяем изменения языка через хук useLanguage
    console.log("Applying language change immediately:", newLanguage)

    // Используем метод changeLanguage из хука useLanguage
    void changeLanguage(newLanguage)
  }

  // Обработчик изменения пути скриншотов
  const handleScreenshotsPathInput = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const newPath = e.target.value
    setSelectedScreenshotsPath(newPath)
  }

  // Обработчик изменения API ключа
  const handleAiApiKeyInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newApiKey = e.target.value
    setSelectedAiApiKey(newApiKey)
  }

  // Обработчик сохранения настроек
  const handleSaveSettings = () => {
    // Применяем изменения пути скриншотов
    if (selectedScreenshotsPath !== screenshotsPath) {
      console.log("Applying screenshots path change:", selectedScreenshotsPath)
      handleScreenshotsPathChange(selectedScreenshotsPath)
    }

    // Применяем изменения API ключа
    if (selectedAiApiKey !== aiApiKey) {
      console.log(
        "Applying AI API key change:",
        selectedAiApiKey ? "***" : "(empty)",
      )
      handleAiApiKeyChange(selectedAiApiKey)
    }

    // Закрываем диалог
    closeModal()
  }

  return (
    <>
      <div className="flex flex-col space-y-6 py-1">
        <div className="flex items-center justify-end">
          <Label className="mr-2 text-xs">
            {t("dialogs.userSettings.interfaceLanguage")}
          </Label>
          <Select value={selectedLanguage} onValueChange={handleLanguageSelect}>
            <SelectTrigger className="w-[180px]">
              <SelectValue
                placeholder={t("dialogs.userSettings.interfaceLanguage")}
              />
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

        <div className="flex flex-col space-y-2">
          <Label className="text-xs font-medium">
            {t("dialogs.userSettings.screenshotsPath")}
          </Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                value={selectedScreenshotsPath}
                onChange={handleScreenshotsPathInput}
                placeholder="public/screenshots"
                className="h-9 pr-8 font-mono text-sm"
              />
              {selectedScreenshotsPath &&
                selectedScreenshotsPath !== "public/screenshots" && (
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedScreenshotsPath("public/screenshots")
                    }
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
                // Предлагаем несколько стандартных папок для выбора
                const folders = [
                  "public/screenshots",
                  "public/images/screenshots",
                  "public/media/screenshots",
                  "public/assets/screenshots",
                ]

                // Создаем диалог выбора папки
                const selectedFolder = window.prompt(
                  t("dialogs.userSettings.selectFolderPrompt"),
                  folders.join("\n"),
                )

                if (selectedFolder) {
                  setSelectedScreenshotsPath(selectedFolder.trim())
                }
              }}
            >
              <Folder className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-col space-y-2">
          <Label className="text-xs font-medium">
            {t("dialogs.userSettings.aiApiKey", "API ключ для ИИ")}
          </Label>
          <div className="relative flex-1">
            <Input
              type="password"
              value={selectedAiApiKey}
              onChange={handleAiApiKeyInput}
              placeholder="Введите API ключ"
              className="h-9 pr-8 font-mono text-sm"
            />
            {selectedAiApiKey && (
              <button
                type="button"
                onClick={() => setSelectedAiApiKey("")}
                className="absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                title={t(
                  "dialogs.userSettings.clearApiKey",
                  "Очистить API ключ",
                )}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
      <DialogFooter className="flex justify-between space-x-4">
        <Button
          variant="default"
          className="flex-1 cursor-pointer"
          onClick={() => closeModal()}
        >
          {t("dialogs.userSettings.cancel")}
        </Button>
        <Button
          variant="default"
          className="flex-1 cursor-pointer bg-[#00CCC0] text-black hover:bg-[#00AAA0]"
          onClick={handleSaveSettings}
        >
          {t("dialogs.userSettings.save")}
        </Button>
      </DialogFooter>
    </>
  )
}
