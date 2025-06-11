import { useCallback, useEffect, useMemo, useState } from "react"

import {
  FolderOpen,
  Keyboard,
  LayoutTemplate,
  ListTodo,
  Mic,
  MonitorCog,
  PanelBottomClose,
  PanelBottomOpen,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Save,
  Send,
  Upload,
  UserCog,
  Webcam,
} from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useCurrentProject } from "@/features/app-state/hooks/use-current-project"
import { LayoutPreviews } from "@/features/media-studio"
import { ModalType } from "@/features/modals"
import { useModal } from "@/features/modals/services/modal-provider"
import { ThemeToggle } from "@/features/top-bar/components/theme/theme-toggle"
import { useUserSettings } from "@/features/user-settings"
import { GpuStatusBadge, RenderJobsDropdown } from "@/features/video-compiler"
import { cn } from "@/lib/utils"

export const TOP_BAR_BUTTON_CLASS = "hover:bg-[#D1D1D1] dark:hover:bg-[#464747] h-6 w-6 cursor-pointer m-0.5 p-0"

const TopBarComponent = function TopBar() {
  const { t } = useTranslation()
  const { openModal } = useModal()
  const { isBrowserVisible, toggleBrowserVisibility } = useUserSettings()
  const { isTimelineVisible, toggleTimelineVisibility } = useUserSettings()
  const { isOptionsVisible, toggleOptionsVisibility } = useUserSettings()
  const { currentProject, openProject, saveProject, setProjectDirty } = useCurrentProject()
  const [isEditing, setIsEditing] = useState(false)
  const [projectName, setProjectName] = useState(currentProject.name)

  // Синхронизируем projectName с currentProject.name
  useEffect(() => {
    setProjectName(currentProject.name)
  }, [currentProject.name])

  const handleOpenModal = useCallback(
    (modal: string) => {
      console.log(`Opening modal: ${modal}`)
      openModal(modal as ModalType)
    },
    [openModal],
  )

  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setProjectName(e.target.value)
      setProjectDirty(true)
    },
    [setProjectDirty],
  )

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setIsEditing(false)
    }
  }, [])

  const handleSave = useCallback(() => {
    try {
      // Сохраняем проект
      void saveProject(projectName)
      console.log("Project saved successfully")
    } catch (error) {
      console.error("[handleSave] Error saving project:", error)
    }
  }, [saveProject, projectName])

  const handleOpenProject = useCallback(() => {
    try {
      // Открываем проект
      void openProject()
      console.log("Project opened successfully")
    } catch (error) {
      console.error("[handleOpenProject] Error opening project:", error)
    }
  }, [openProject])

  // Мемоизируем заголовки для кнопок
  const buttonTitles = useMemo(
    () => ({
      browser: isBrowserVisible ? t("browser.hide") : t("browser.show"),
      timeline: isTimelineVisible ? t("timeline.hide") : t("timeline.show"),
      layout: t("topBar.layout"),
      keyboardShortcuts: t("topBar.keyboardShortcuts"),
      userSettings: t("topBar.userSettings"),
      projectSettings: t("topBar.projectSettings"),
      openProject: t("topBar.openProject"),
      save: currentProject.isDirty ? t("topBar.saveChanges") : t("topBar.allChangesSaved"),
      cameraCapture: t("topBar.cameraCapture"),
      voiceRecording: t("topBar.voiceRecording"),
      publish: t("topBar.publish"),
      editingTasks: t("topBar.editingTasks"),
      export: t("topBar.export"),
    }),
    [t, isBrowserVisible, currentProject.isDirty],
  )

  // Мемоизируем CSS классы
  const saveButtonClassName = useMemo(
    () =>
      cn(
        "h-7 w-7 cursor-pointer p-0",
        currentProject.isDirty ? "hover:bg-accent opacity-100" : "opacity-50 hover:opacity-50",
      ),
    [currentProject.isDirty],
  )

  const projectNameClassName = useMemo(
    () =>
      cn(
        "group relative ml-1 w-[100px] text-xs",
        isEditing ? "ring-1 ring-teal" : "transition-colors group-hover:ring-1 group-hover:ring-teal",
      ),
    [isEditing],
  )

  return (
    <div className="relative flex w-full items-center bg-[#DDDDDD] px-1 py-0 dark:bg-[#3D3D3D]">
      {/* Используем grid для равномерного распределения групп */}
      <div className="grid w-full grid-cols-5 items-center">
        {/* Группа 1: Переключатель браузера и макет */}
        <div className="flex items-start">
          <Button
            variant="ghost"
            size="icon"
            className={TOP_BAR_BUTTON_CLASS}
            onClick={toggleBrowserVisibility}
            title={buttonTitles.browser}
          >
            {isBrowserVisible ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className={TOP_BAR_BUTTON_CLASS}
            onClick={toggleTimelineVisibility}
            title={buttonTitles.timeline}
          >
            {isTimelineVisible ? <PanelBottomClose size={16} /> : <PanelBottomOpen size={16} />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className={TOP_BAR_BUTTON_CLASS}
            onClick={toggleOptionsVisibility}
            title={buttonTitles.layout}
          >
            {isOptionsVisible ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                className={TOP_BAR_BUTTON_CLASS}
                variant="ghost"
                size="icon"
                title={buttonTitles.layout}
                data-testid="layout-button"
              >
                <LayoutTemplate className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-3 rounded-none mt-0.5 ml-0" sideOffset={0}>
              <LayoutPreviews />
            </PopoverContent>
          </Popover>
        </div>

        {/* Группа 2: Переключатель темы, быстрые клавиши, настройки проекта */}
        <div className="flex items-center justify-start ml-[20%]">
          <div data-testid="theme-toggle">
            <ThemeToggle />
          </div>
          <Button
            className={TOP_BAR_BUTTON_CLASS}
            variant="ghost"
            size="icon"
            title={buttonTitles.keyboardShortcuts}
            onClick={() => handleOpenModal("keyboard-shortcuts")}
            data-testid="keyboard-shortcuts-button"
          >
            <Keyboard className="h-5 w-5" />
          </Button>
          <Button
            className={TOP_BAR_BUTTON_CLASS}
            variant="ghost"
            size="icon"
            title={buttonTitles.userSettings}
            onClick={() => handleOpenModal("user-settings")}
            data-testid="user-settings-button"
          >
            <UserCog className="h-5 w-5" />
          </Button>
        </div>

        {/* Группа 3: Открытие, сохранение и редактирование названия */}
        <div className="flex items-center justify-center">
          <Button
            className={TOP_BAR_BUTTON_CLASS}
            variant="ghost"
            size="icon"
            title={buttonTitles.projectSettings}
            onClick={() => handleOpenModal("project-settings")}
            data-testid="project-settings-button"
          >
            <MonitorCog className="h-5 w-5" />
          </Button>
          <Button
            className={TOP_BAR_BUTTON_CLASS}
            variant="ghost"
            size="icon"
            title={buttonTitles.openProject}
            onClick={handleOpenProject}
            data-testid="open-project-button"
          >
            <FolderOpen className="h-5 w-5" />
          </Button>

          <Button
            className={saveButtonClassName}
            variant="ghost"
            size="icon"
            title={buttonTitles.save}
            onClick={handleSave}
            disabled={!currentProject.isDirty}
            data-testid="save-button"
          >
            <Save className="h-5 w-5" />
          </Button>

          <div className={projectNameClassName} onClick={() => setIsEditing(true)}>
            {isEditing ? (
              <input
                id="project-name-input"
                type="text"
                value={projectName}
                onChange={handleNameChange}
                onKeyDown={handleKeyDown}
                onBlur={() => setIsEditing(false)}
                className="w-full h-5 bg-transparent pl-[1px] text-xs focus:outline-none"
                autoFocus
              />
            ) : (
              <span className="block truncate pl-[1px] hover:border hover:border-teal hover:pl-[0px]">
                {projectName}
              </span>
            )}
          </div>
        </div>

        {/* Группа 4: Запись видео и голоса */}
        <div className="flex items-center justify-end mr-[30%]">
          <Button
            variant="ghost"
            size="icon"
            className={TOP_BAR_BUTTON_CLASS}
            title={buttonTitles.cameraCapture}
            onClick={() => handleOpenModal("camera-capture")}
            data-testid="camera-capture-button"
          >
            <Webcam size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={TOP_BAR_BUTTON_CLASS}
            title={buttonTitles.voiceRecording}
            onClick={() => handleOpenModal("voice-recording")}
            data-testid="voice-recording-button"
          >
            <Mic className="h-5 w-5" />
          </Button>
        </div>

        {/* Группа 5: Публикация, задачи, настройки пользователя и экспорт */}
        <div className="flex items-center justify-end">
          <GpuStatusBadge className="mr-2" />
          <Popover>
            <PopoverTrigger asChild>
              <Button
                className={TOP_BAR_BUTTON_CLASS}
                variant="ghost"
                size="icon"
                title={buttonTitles.publish}
                data-testid="publish-button"
              >
                <Send className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64" sideOffset={0}>
              <div className="">
                <h4 className="text-sm font-semibold">{t("topBar.publicationTasks")}</h4>
                <div className="h-10" />
              </div>
            </PopoverContent>
          </Popover>

          <RenderJobsDropdown />

          <Button
            variant="outline"
            size="sm"
            className="h-6 w-24 cursor-pointer items-center gap-1 border-none rounded-sm bg-teal px-1 text-sm text-black hover:bg-teal hover:text-black dark:bg-teal dark:hover:bg-teal"
            onClick={() => handleOpenModal("export")}
            data-testid="export-button"
          >
            <span className="px-2 text-xs">{buttonTitles.export}</span>
            <Upload className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// Мемоизируем компонент для предотвращения лишних перерисовок
export const TopBar = TopBarComponent
