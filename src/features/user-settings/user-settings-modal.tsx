import { useEffect, useState } from "react"

import { open } from "@tauri-apps/plugin-dialog"
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
    playerScreenshotsPath,
    openAiApiKey,
    claudeApiKey,
    handleScreenshotsPathChange,
    handleAiApiKeyChange,
    handleClaudeApiKeyChange,
  } = useUserSettings()
  const { closeModal } = useModal()
  const { t } = useTranslation()
  const { currentLanguage, changeLanguage } = useLanguage()

  const [selectedLanguage, setSelectedLanguage] =
    useState<LanguageCode>(currentLanguage)

  // Обработчик изменения языка - применяет изменения сразу
  const handleLanguageSelect = (value: string) => {
    const newLanguage = value as LanguageCode
    setSelectedLanguage(newLanguage)

    // Сразу применяем изменения языка через хук useLanguage
    console.log("Applying language change immediately:", newLanguage)

    // Используем метод changeLanguage из хука useLanguage
    void changeLanguage(newLanguage)
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
                value={screenshotsPath}
                onChange={(e) => {
                  handleScreenshotsPathChange(e.target.value)
                }}
                placeholder="public/screenshots"
                className="h-9 pr-8 font-mono text-sm"
              />
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
                      console.log(
                        "Screenshots path updated from folder dialog:",
                        selectedFolder,
                      )
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

                    const promptResult = window.prompt(
                      t("dialogs.userSettings.selectFolderPrompt"),
                      folders.join("\n"),
                    )

                    if (promptResult) {
                      const trimmedPath = promptResult.trim()
                      handleScreenshotsPathChange(trimmedPath)
                      console.log(
                        "Screenshots path updated from prompt:",
                        trimmedPath,
                      )
                    }
                  }
                })()
              }}
            >
              <Folder className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-col space-y-2">
          <Label className="text-xs font-medium">
            {t("dialogs.userSettings.aiApiKey", "API ключ для OpenAI")}
          </Label>
          <div className="relative flex-1">
            <Input
              type="password"
              value={openAiApiKey}
              onChange={(e) => {
                // Обновляем значение в машине состояний
                handleAiApiKeyChange(e.target.value)
              }}
              placeholder={t(
                "dialogs.userSettings.enterApiKey",
                "Введите API ключ",
              )}
              className="h-9 pr-8 font-mono text-sm"
            />
            {openAiApiKey && (
              <button
                type="button"
                onClick={() => handleAiApiKeyChange("")}
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
        <div className="flex flex-col space-y-2">
          <Label className="text-xs font-medium">
            {t("dialogs.userSettings.aiApiKey", "API ключ для Claude")}
          </Label>
          <div className="relative flex-1">
            <Input
              type="password"
              value={claudeApiKey}
              onChange={(e) => {
                // Обновляем значение в машине состояний
                handleClaudeApiKeyChange(e.target.value)
              }}
              placeholder={t(
                "dialogs.userSettings.claudeApiKey",
                "Введите API ключ Claude",
              )}
              className="h-9 pr-8 font-mono text-sm"
            />
            {claudeApiKey && (
              <button
                type="button"
                onClick={() => {
                  handleClaudeApiKeyChange("")
                }}
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
          onClick={() => {
            console.log(
              "Closing modal with save button, all changes already applied",
            )
            closeModal()
          }}
        >
          {t("dialogs.userSettings.save")}
        </Button>
      </DialogFooter>
    </>
  )
}
