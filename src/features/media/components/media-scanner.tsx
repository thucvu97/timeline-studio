import React, { useState } from "react"

import { open } from "@tauri-apps/plugin-dialog"
import { AlertCircle, FolderOpen, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { MediaFile } from "@/features/media/types/media"

import { useMediaProcessor } from "../hooks/use-media-processor"

export function MediaScanner() {
  const [scannedFiles, setScannedFiles] = useState<MediaFile[]>([])
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)

  const { scanFolderWithThumbnails, isProcessing, progress, errors, clearErrors } = useMediaProcessor({
    onFilesDiscovered: (files) => {
      console.log(`Обнаружено ${files.length} файлов`)
    },
    onMetadataReady: (fileId, metadata) => {
      console.log(`Метаданные готовы для файла ${fileId}:`, metadata)
    },
    onThumbnailReady: (fileId, thumbnailPath, thumbnailData) => {
      console.log(`Превью готово для файла ${fileId}: ${thumbnailPath}`)
      if (thumbnailData) {
        console.log(`Base64 данные превью доступны (${thumbnailData.length} символов)`)
      }
    },
    onError: (fileId, error) => {
      console.error(`Ошибка обработки файла ${fileId}:`, error)
    },
    onProgress: (current, total) => {
      console.log(`Прогресс: ${current}/${total}`)
    },
  })

  const handleSelectFolder = async () => {
    const selected = await open({
      directory: true,
      multiple: false,
      title: "Выберите папку для сканирования",
    })

    if (selected) {
      setSelectedFolder(selected)
      clearErrors()
    }
  }

  const handleScan = async () => {
    if (!selectedFolder) return

    try {
      const files = await scanFolderWithThumbnails(selectedFolder, 320, 180)
      setScannedFiles(files)
      console.log(`Сканирование завершено. Обработано файлов: ${files.length}`)
    } catch (error) {
      console.error("Ошибка сканирования:", error)
    }
  }

  const progressPercentage = progress.total > 0 ? (progress.current / progress.total) * 100 : 0

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Сканирование медиафайлов</CardTitle>
        <CardDescription>Выберите папку для асинхронного сканирования и обработки медиафайлов</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={handleSelectFolder} disabled={isProcessing} variant="outline" className="flex-1">
            <FolderOpen className="mr-2 h-4 w-4" />
            {selectedFolder ? "Изменить папку" : "Выбрать папку"}
          </Button>
          <Button onClick={handleScan} disabled={!selectedFolder || isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Сканирование...
              </>
            ) : (
              "Начать сканирование"
            )}
          </Button>
        </div>

        {selectedFolder && <div className="text-sm text-muted-foreground">Выбрана папка: {selectedFolder}</div>}

        {isProcessing && progress.total > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Обработка файлов</span>
              <span>
                {progress.current} / {progress.total}
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        )}

        {errors.size > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-destructive">
              <AlertCircle className="h-4 w-4" />
              Ошибки при обработке ({errors.size})
            </div>
            <div className="max-h-32 overflow-y-auto rounded-md bg-destructive/10 p-2 text-xs">
              {Array.from(errors.entries()).map(([fileId, error]) => (
                <div key={fileId} className="py-1">
                  <span className="font-mono">{fileId}:</span> {error}
                </div>
              ))}
            </div>
          </div>
        )}

        {scannedFiles.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Обработано файлов: {scannedFiles.length}</h3>
            <div className="max-h-64 overflow-y-auto rounded-md border p-2">
              <ul className="space-y-1 text-sm">
                {scannedFiles.map((file) => (
                  <li key={file.id} className="flex items-center justify-between py-1">
                    <span className="truncate">{file.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {file.isVideo && "Видео"}
                      {file.isImage && "Изображение"}
                      {file.isAudio && "Аудио"}
                      {file.duration && ` (${Math.round(file.duration)}с)`}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
