import { useState } from "react"

import {
  Keyboard,
  Layout,
  ListTodo,
  Save,
  Send,
  Settings,
  Upload,
  UserCog,
} from "lucide-react"
import { useTranslation } from "react-i18next"

import { ThemeToggle } from "@/components/theme/theme-toggle"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { BrowserToggle } from "@/features/browser/components/layout/browser-toggle"
import { LayoutMode, LayoutPreviews } from "@/features/media-studio/layouts"
import { cn } from "@/lib/utils"

export function TopBar({
  layoutMode,
  onLayoutChange,
}: { layoutMode: LayoutMode; onLayoutChange: (mode: LayoutMode) => void }) {
  const { t } = useTranslation()
  const [isEditing, setIsEditing] = useState(false)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setIsEditing(false)
    }
  }

  const handleOpenModal = (modal: string) => {
    console.log(`Opening modal: ${modal}`)
  }

  return (
    <div className="relative flex w-full items-center justify-between bg-gray-200 px-1 py-0 dark:bg-[#3c3c3c]">
      <div className="flex h-6 items-center">
        <BrowserToggle />
        <Popover>
          <PopoverTrigger asChild>
            <Button
              className="hover:bg-secondary h-7 w-7 cursor-pointer p-0"
              variant="ghost"
              size="icon"
              title={t("topBar.layout")}
            >
              <Layout className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-2" sideOffset={0}>
            <LayoutPreviews
              onLayoutChange={onLayoutChange}
              layoutMode={layoutMode}
              hasExternalDisplay={false}
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex items-center">
        <ThemeToggle />
        <Button
          className="hover:bg-secondary h-7 w-7 cursor-pointer p-0"
          variant="ghost"
          size="icon"
          title={t("topBar.keyboardShortcuts")}
          onClick={() => handleOpenModal("keyboard-shortcuts")}
        >
          <Keyboard className="h-5 w-5" />
        </Button>
        <Button
          className="hover:bg-secondary h-7 w-7 cursor-pointer p-0"
          variant="ghost"
          size="icon"
          title={t("topBar.projectSettings")}
          onClick={() => handleOpenModal("project-settings")}
        >
          <Settings className="h-5 w-5" />
        </Button>
        <Button
          className={cn(
            "hover:bg-secondary h-7 w-7 cursor-pointer p-0",
            // isDirty ? "hover:bg-accent opacity-100" : "opacity-50 hover:opacity-50",
          )}
          variant="ghost"
          size="icon"
          // title={isDirty ? t("topBar.saveChanges") : t("topBar.allChangesSaved")}
          // onClick={handleSave}
          // disabled={!isDirty}
        >
          <Save className="h-5 w-5" />
        </Button>

        <div
          className={cn(
            "group relative ml-1 w-[130px] text-xs",
            isEditing
              ? "ring-1 ring-[#35d1c1]"
              : "transition-colors group-hover:ring-1 group-hover:ring-[#35d1c1]",
          )}
          onClick={() => setIsEditing(true)}
        >
          {isEditing ? (
            <input
              id="project-name-input"
              type="text"
              // value={name}
              // onChange={handleNameChange}
              onKeyDown={handleKeyDown}
              onBlur={() => setIsEditing(false)}
              className="w-full bg-transparent pl-[1px] text-xs focus:outline-none"
              autoFocus
            />
          ) : (
            <span className="block truncate pl-[1px] hover:border hover:border-[#35d1c1] hover:pl-[0px]">
              {/* {name} */}
            </span>
          )}
        </div>
      </div>
      <div className="flex h-6 items-center">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              className="h-7 w-7 cursor-pointer p-0"
              variant="ghost"
              size="icon"
              title={t("topBar.publish")}
            >
              <Send className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64" sideOffset={0}>
            <div className="">
              <h4 className="text-sm font-semibold">
                {t("topBar.publicationTasks")}
              </h4>
              <div className="h-10"></div>
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
            >
              <ListTodo className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64" sideOffset={0}>
            <div className="">
              <h4 className="text-sm font-semibold">
                {t("topBar.projectTasks")}
              </h4>
              <div className="h-10"></div>
            </div>
          </PopoverContent>
        </Popover>
        {/* <Button
          variant="ghost"
          size="icon"
          className="cursor-pointer p-0 h-7 w-7"
          title="Экспорт"
          onClick={() => setIsExportOpen(true)}
        >
          <Upload className="h-5 w-5" />
        </Button> */}
        <Button
          variant="ghost"
          size="icon"
          className="mr-1 h-7 w-7 cursor-pointer p-0"
          title={t("topBar.userSettings")}
          onClick={() => handleOpenModal("user-settings")}
        >
          <UserCog className="h-5 w-5" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-6 w-24 cursor-pointer items-center gap-1 border-none rounded-sm bg-[#38dacac3] px-1 text-sm text-black hover:bg-[#35d1c1] hover:text-black dark:bg-[#35d1c1] dark:hover:bg-[#35d1c1]"
          // onClick={handleExport}
        >
          <span className="px-2 text-xs">{t("topBar.export")}</span>
          <Upload className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
