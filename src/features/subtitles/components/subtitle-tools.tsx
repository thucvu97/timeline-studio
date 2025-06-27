import { FileDown, FileUp, Loader2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { useSubtitlesExport } from "../hooks/use-subtitles-export"
import { useSubtitlesImport } from "../hooks/use-subtitles-import"

/**
 * Компонент инструментов для работы с субтитрами
 * Предоставляет UI для импорта и экспорта субтитров
 */
export function SubtitleTools() {
  const { t } = useTranslation()
  const { importSubtitleFile, importSubtitleFiles, isImporting } = useSubtitlesImport()
  const { exportSubtitleFile, isExporting } = useSubtitlesExport()

  return (
    <div className="flex items-center gap-2">
      {/* Кнопка импорта */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={isImporting}>
            {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileUp className="mr-2 h-4 w-4" />}
            {t("subtitles.import.title", "Импорт")}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{t("subtitles.import.selectFormat", "Выберите формат")}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={importSubtitleFile}>
            {t("subtitles.import.singleFile", "Импортировать один файл")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={importSubtitleFiles}>
            {t("subtitles.import.multipleFiles", "Импортировать несколько файлов")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Кнопка экспорта */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={isExporting}>
            {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
            {t("subtitles.export.title", "Экспорт")}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{t("subtitles.export.selectFormat", "Выберите формат")}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => exportSubtitleFile("srt")}>
            {t("subtitles.export.srt", "SubRip (.srt)")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => exportSubtitleFile("vtt")}>
            {t("subtitles.export.vtt", "WebVTT (.vtt)")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => exportSubtitleFile("ass")}>
            {t("subtitles.export.ass", "Advanced SSA (.ass)")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
