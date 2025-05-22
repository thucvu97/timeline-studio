import { useState } from "react"

import {
  Keyboard,
  Layout,
  ListTodo,
  Mic,
  PanelLeftClose,
  PanelLeftOpen,
  Save,
  Send,
  Settings,
  Upload,
  UserCog,
  Webcam,
} from "lucide-react"
import { useTranslation } from "react-i18next"

import { ThemeToggle } from "@/components/theme/theme-toggle"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { LayoutPreviews } from "@/features/media-studio/layouts"
import { ModalType } from "@/features/modals"
import { useModal } from "@/features/modals/services/modal-provider"
import { useUserSettings } from "@/features/user-settings/user-settings-provider"
import { cn } from "@/lib/utils"

export function TopBar() {
  const { t } = useTranslation()
  const { openModal } = useModal()
  const { isBrowserVisible, toggleBrowserVisibility } = useUserSettings()
  const [isEditing, setIsEditing] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [name, setName] = useState("New Project")

  const handleOpenModal = (modal: string) => {
    console.log(`Opening modal: ${modal}`)
    openModal(modal as ModalType)
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value)
    setIsDirty(true)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setIsEditing(false)
    }
  }

  const handleSave = () => {
    setIsDirty(false)
  }

  return (
    <div className="relative flex w-full items-center justify-between bg-gray-200 px-1 py-0 dark:bg-[#3C3C3C] gap-2">
      {/* Группа 1: Переключатель браузера и макет */}
      <div className="flex items-center justify-center">
        <Button
          variant="ghost"
          size="icon"
          className={
            "transition-all duration-300 hover:bg-secondary h-7 w-7 cursor-pointer p-0"
          }
          onClick={toggleBrowserVisibility}
          title={isBrowserVisible ? t("browser.hide") : t("browser.show")}
        >
          {isBrowserVisible ? (
            <PanelLeftClose size={16} />
          ) : (
            <PanelLeftOpen size={16} />
          )}
        </Button>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              className="h-7 w-7 cursor-pointer p-0"
              variant="ghost"
              size="icon"
              title={t("topBar.layout")}
              data-testid="layout-button"
            >
              <Layout className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-2" sideOffset={0}>
            <LayoutPreviews />
          </PopoverContent>
        </Popover>
      </div>

      {/* Группа 2: Переключатель темы и быстрые клавиши */}
      <div className="flex items-center justify-center">
        <div data-testid="theme-toggle">
          <ThemeToggle />
        </div>
        <Button
          className="h-7 w-7 cursor-pointer p-0"
          variant="ghost"
          size="icon"
          title={t("topBar.keyboardShortcuts")}
          onClick={() => handleOpenModal("keyboard-shortcuts")}
          data-testid="keyboard-shortcuts-button"
        >
          <Keyboard className="h-5 w-5" />
        </Button>
      </div>

      {/* Группа 3: Настройки проекта, сохранение и имя проекта */}
      <div className="flex items-center justify-center">
        <Button
          className="h-7 w-7 cursor-pointer p-0"
          variant="ghost"
          size="icon"
          title={t("topBar.projectSettings")}
          onClick={() => handleOpenModal("project-settings")}
          data-testid="project-settings-button"
        >
          <Settings className="h-5 w-5" />
        </Button>
        <Button
          className={cn(
            "h-7 w-7 cursor-pointer p-0",
            isDirty
              ? "hover:bg-accent opacity-100"
              : "opacity-50 hover:opacity-50",
          )}
          variant="ghost"
          size="icon"
          title={
            isDirty ? t("topBar.saveChanges") : t("topBar.allChangesSaved")
          }
          onClick={handleSave}
          disabled={!isDirty}
          data-testid="save-button"
        >
          <Save className="h-5 w-5" />
        </Button>

        {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
        <div
          className={cn(
            "group relative ml-1 w-[130px] text-xs",
            isEditing
              ? "ring-1 ring-teal"
              : "transition-colors group-hover:ring-1 group-hover:ring-teal",
          )}
          onClick={() => setIsEditing(true)}
        >
          {isEditing ? (
            <input
              id="project-name-input"
              type="text"
              value={name}
              onChange={handleNameChange}
              onKeyDown={handleKeyDown}
              onBlur={() => setIsEditing(false)}
              className="w-full h-5 bg-transparent pl-[1px] text-xs focus:outline-none"
              // biome-ignore lint/a11y/noAutofocus: <explanation>
              autoFocus
            />
          ) : (
            <span className="block truncate pl-[1px] hover:border hover:border-teal hover:pl-[0px]">
              {name}
            </span>
          )}
        </div>
      </div>

      {/* Группа 4: Запись видео и голоса */}
      <div className="flex items-center justify-center">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 cursor-pointer p-0"
          title={t("topBar.cameraCapture")}
          onClick={() => handleOpenModal("camera-capture")}
          data-testid="camera-capture-button"
        >
          <Webcam size={16} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 cursor-pointer p-0"
          title={t("topBar.voiceRecording")}
          onClick={() => handleOpenModal("voice-recording")}
          data-testid="voice-recording-button"
        >
          <Mic className="h-5 w-5" />
        </Button>
      </div>

      {/* Группа 5: Публикация, задачи, настройки пользователя и экспорт */}
      <div className="flex items-center justify-center">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              className="h-7 w-7 cursor-pointer p-0"
              variant="ghost"
              size="icon"
              title={t("topBar.publish")}
              data-testid="publish-button"
            >
              <Send className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64" sideOffset={0}>
            <div className="">
              <h4 className="text-sm font-semibold">
                {t("topBar.publicationTasks")}
              </h4>
              <div className="h-10" />
            </div>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              className="h-7 w-7 cursor-pointer p-0"
              variant="ghost"
              size="icon"
              title={t("topBar.editingTasks")}
              data-testid="editing-tasks-button"
            >
              <ListTodo className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64" sideOffset={0}>
            <div className="">
              <h4 className="text-sm font-semibold">
                {t("topBar.projectTasks")}
              </h4>
              <div className="h-10" />
            </div>
          </PopoverContent>
        </Popover>
        <Button
          variant="ghost"
          size="icon"
          className="mr-1 h-7 w-7 cursor-pointer p-0"
          title={t("topBar.userSettings")}
          onClick={() => handleOpenModal("user-settings")}
          data-testid="user-settings-button"
        >
          <UserCog className="h-5 w-5" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-6 w-24 cursor-pointer items-center gap-1 border-none rounded-sm bg-teal px-1 text-sm text-black hover:bg-teal hover:text-black dark:bg-teal dark:hover:bg-teal"
          onClick={() => handleOpenModal("export")}
          data-testid="export-button"
        >
          <span className="px-2 text-xs">{t("topBar.export")}</span>
          <Upload className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
