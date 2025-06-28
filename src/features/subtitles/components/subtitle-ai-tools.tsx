import { useState } from "react"

import { Languages, Loader2, Mic } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTimeline } from "@/features/timeline/hooks/use-timeline"

import { parseSRT } from "../utils/subtitle-parsers"

// import { useCurrentProject } from "@/features/timeline/hooks/use-current-project"
// Временная заглушка для useCurrentProject
const useCurrentProject = () => ({
  tracks: [
    {
      id: "video-1",
      type: "video",
      clips: [
        {
          id: "clip-1",
          type: "video",
          source: "/path/to/video.mp4",
        },
      ],
    },
  ],
})

// Временная заглушка для generateId
const generateId = () => `sub-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

// useToast удален - используем прямой импорт toast из sonner

// TODO: Import from actual AI service when integrated
// import { transcribeAudio } from "@/features/ai-models-integration/services/whisper-service"

/**
 * Инструменты AI для работы с субтитрами
 * Интеграция с Whisper для автоматической транскрипции
 */
export function SubtitleAITools() {
  const { t } = useTranslation()
  const timeline = useTimeline()
  const project = useCurrentProject()

  /**
   * Временная функция для добавления субтитров на таймлайн
   * TODO: реализовать правильное добавление SubtitleClip в timeline-machine
   */
  const addSubtitleClip = async (trackId: string, subtitle: any) => {
    // Временная заглушка - просто логируем
    console.log("Adding subtitle clip:", { trackId, subtitle })
    // В будущем здесь будет:
    // timeline.addSubtitleClip(trackId, subtitle.text, subtitle.startTime, subtitle.duration)
  }

  const [isOpen, setIsOpen] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState("auto")
  const [selectedTrack, setSelectedTrack] = useState<string>("")

  /**
   * Получает видео/аудио файлы из проекта
   */
  const getMediaFiles = () => {
    if (!project) return []

    const mediaFiles: Array<{ id: string; path: string; name: string }> = []

    for (const track of project.tracks) {
      if (track.type === "video" || track.type === "audio") {
        for (const clip of track.clips) {
          if (clip.type === "video" || clip.type === "audio") {
            mediaFiles.push({
              id: clip.id,
              path: clip.source,
              name: clip.source.split("/").pop() || clip.source,
            })
          }
        }
      }
    }

    return mediaFiles
  }

  /**
   * Запускает транскрипцию аудио
   */
  const startTranscription = async () => {
    if (!selectedTrack) {
      toast.error(t("subtitles.ai.selectFile", "Выберите файл"), {
        description: t("subtitles.ai.selectFileDesc", "Выберите аудио или видео файл для транскрипции"),
      })
      return
    }

    setIsTranscribing(true)

    try {
      // TODO: Вызвать реальный сервис транскрипции
      // const result = await transcribeAudio({
      //   filePath: selectedTrack,
      //   language: selectedLanguage === 'auto' ? undefined : selectedLanguage,
      //   format: 'srt',
      // })

      // Временная заглушка для демонстрации
      const mockSRT = `1
00:00:00,000 --> 00:00:03,000
Это пример автоматически сгенерированных субтитров

2
00:00:03,500 --> 00:00:06,000
Транскрипция выполнена с помощью Whisper AI`

      // Парсим SRT и добавляем на таймлайн
      const subtitles = parseSRT(mockSRT)
      const subtitleTrackId = "subtitle-track-1" // TODO: получать из проекта

      for (const subtitle of subtitles) {
        await addSubtitleClip(subtitleTrackId, {
          ...subtitle,
          id: generateId(),
          trackId: subtitleTrackId,
        })
      }

      toast.success(t("subtitles.ai.success", "Транскрипция завершена"), {
        description: t("subtitles.ai.successDesc", "Добавлено {{count}} субтитров", { count: subtitles.length }),
      })

      setIsOpen(false)
    } catch (error) {
      console.error("Ошибка транскрипции:", error)
      toast.error(t("subtitles.ai.error", "Ошибка транскрипции"), {
        description: t("subtitles.ai.errorDesc", "Не удалось выполнить транскрипцию аудио"),
      })
    } finally {
      setIsTranscribing(false)
    }
  }

  const mediaFiles = getMediaFiles()

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Mic className="mr-2 h-4 w-4" />
          {t("subtitles.ai.title", "AI Транскрипция")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("subtitles.ai.dialogTitle", "Автоматическая транскрипция")}</DialogTitle>
          <DialogDescription>
            {t("subtitles.ai.dialogDesc", "Используйте AI для автоматического создания субтитров из аудио")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="media-file">{t("subtitles.ai.selectMedia", "Выберите медиафайл")}</Label>
            <Select value={selectedTrack} onValueChange={setSelectedTrack}>
              <SelectTrigger id="media-file">
                <SelectValue placeholder={t("subtitles.ai.selectPlaceholder", "Выберите файл...")} />
              </SelectTrigger>
              <SelectContent>
                {mediaFiles.map((file) => (
                  <SelectItem key={file.id} value={file.path}>
                    {file.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="language">{t("subtitles.ai.language", "Язык аудио")}</Label>
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger id="language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">
                  <div className="flex items-center">
                    <Languages className="mr-2 h-4 w-4" />
                    {t("subtitles.ai.autoDetect", "Автоопределение")}
                  </div>
                </SelectItem>
                <SelectItem value="ru">{t("language.native.ru", "Русский")}</SelectItem>
                <SelectItem value="en">{t("language.native.en", "English")}</SelectItem>
                <SelectItem value="es">{t("language.native.es", "Español")}</SelectItem>
                <SelectItem value="fr">{t("language.native.fr", "Français")}</SelectItem>
                <SelectItem value="de">{t("language.native.de", "Deutsch")}</SelectItem>
                <SelectItem value="zh">{t("language.native.zh", "中文")}</SelectItem>
                <SelectItem value="ja">{t("language.native.ja", "日本語")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {mediaFiles.length === 0 && (
            <div className="rounded-md bg-muted p-4 text-center text-sm text-muted-foreground">
              {t("subtitles.ai.noMedia", "Добавьте видео или аудио файлы в проект для транскрипции")}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isTranscribing}>
            {t("common.cancel", "Отмена")}
          </Button>
          <Button onClick={startTranscription} disabled={!selectedTrack || isTranscribing}>
            {isTranscribing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("subtitles.ai.start", "Начать транскрипцию")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
