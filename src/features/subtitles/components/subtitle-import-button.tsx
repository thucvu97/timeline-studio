/**
 * Кнопка для импорта субтитров
 */

import { Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"

import { useSubtitleImport } from "../hooks/use-subtitle-import"

export interface SubtitleImportButtonProps {
  trackId?: string
  variant?: "default" | "outline" | "ghost" | "secondary"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  onImportComplete?: () => void
}

export function SubtitleImportButton({
  trackId,
  variant = "outline",
  size = "sm",
  className,
  onImportComplete,
}: SubtitleImportButtonProps) {
  const { importFromFile, isImporting, importProgress } = useSubtitleImport({
    trackId,
    onImportComplete: () => {
      onImportComplete?.()
    },
  })

  const handleImportFromFile = async () => {
    await importFromFile()
  }

  return (
    <>
      {isImporting ? (
        <div className="flex items-center gap-2">
          <Progress value={importProgress} className="w-24 h-2" />
          <span className="text-xs text-muted-foreground">
            {importProgress}%
          </span>
        </div>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant={variant} size={size} className={className}>
              <Upload className="mr-2 h-4 w-4" />
              Импорт субтитров
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handleImportFromFile}>
              <Upload className="mr-2 h-4 w-4" />
              Из файла
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 text-xs text-muted-foreground">
              Поддерживаемые форматы:
            </div>
            <DropdownMenuItem disabled className="text-xs">
              • SRT (SubRip)
            </DropdownMenuItem>
            <DropdownMenuItem disabled className="text-xs">
              • VTT (WebVTT)
            </DropdownMenuItem>
            <DropdownMenuItem disabled className="text-xs">
              • ASS/SSA (Advanced SubStation)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </>
  )
}