import { Languages, Loader2 } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { WhisperService } from "@/features/ai-chat/services/whisper-service"
import { useMediaFiles } from "@/features/app-state/hooks/use-media-files"
import { useModal } from "@/features/modals/services"
import { useTimeline } from "@/features/timeline/hooks/use-timeline"

import { parseSRT } from "../utils/subtitle-parsers"

// Функция генерации уникального ID для субтитров
const generateSubtitleId = () => `subtitle-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

export function SubtitleAIToolsModal() {
  const { t } = useTranslation()
  const { modalData, closeModal } = useModal()
  const { project, send } = useTimeline()
  const { mediaFiles } = useMediaFiles()

  const [isTranscribing, setIsTranscribing] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState("auto")
  const [selectedTrack, setSelectedTrack] = useState<string>("")
  const [useLocalModel, setUseLocalModel] = useState(false)
  const [selectedModel, setSelectedModel] = useState("whisper-1")

  /**
   * Добавляет субтитры на таймлайн
   * @param trackId - ID трека для субтитров
   * @param subtitle - Данные субтитра из parseSRT
   */
  const addSubtitleClip = async (
    trackId: string,
    subtitle: {
      id: string
      type: "subtitle"
      startTime: number
      duration: number
      text: string
      style?: any
      position?: any
      subtitlePosition?: any
    },
  ) => {
    // Находим или создаем трек для субтитров
    const subtitleTrack = project?.sections[0]?.tracks.find((track) => track.type === "subtitle")

    if (!subtitleTrack) {
      // Создаем новый трек для субтитров
      send({
        type: "ADD_TRACK",
        track: {
          id: trackId,
          type: "subtitle",
          name: t("subtitles.trackName", "Субтитры"),
          clips: [],
          height: 60,
          locked: false,
          muted: false,
          visible: true,
        },
      })
    }

    // Добавляем клип субтитра
    send({
      type: "ADD_CLIP",
      trackId: subtitleTrack?.id || trackId,
      clip: {
        id: subtitle.id,
        type: "subtitle",
        startTime: subtitle.startTime,
        duration: subtitle.duration,
        text: subtitle.text,
        style: {
          fontSize: 24,
          fontFamily: "Arial",
          color: "#FFFFFF",
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          position: "bottom",
        },
      },
    })
  }

  // Фильтруем только видео и аудио файлы для транскрипции
  const audioVideoFiles = mediaFiles
    .filter((file) => file.media_type === "Video" || file.media_type === "Audio")
    .map((file) => ({
      id: file.id,
      path: file.path,
      name: file.name,
      duration: file.duration,
    }))

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
      const whisperService = WhisperService.getInstance()

      // Загружаем API ключ, если есть
      await whisperService.loadApiKey()

      // Определяем, нужно ли извлечь аудио из видео
      const filePath = selectedTrack
      let audioFilePath = filePath

      // Если это видеофайл, извлекаем аудио
      const videoRegex = /\.(mp4|avi|mov|mkv|webm)$/i
      if (videoRegex.test(filePath)) {
        toast.info(t("subtitles.ai.extractingAudio", "Извлечение аудио из видео..."))
        audioFilePath = await whisperService.extractAudioForTranscription(filePath)
      }

      // Выбираем метод транскрипции
      let transcriptionResult

      if (!useLocalModel && whisperService.hasApiKey()) {
        // Используем OpenAI API
        toast.info(t("subtitles.ai.transcribing", "Транскрипция с помощью OpenAI Whisper..."))
        transcriptionResult = await whisperService.transcribeWithOpenAI(audioFilePath, {
          language: selectedLanguage === "auto" ? undefined : selectedLanguage,
          response_format: "verbose_json",
          timestamp_granularities: ["segment"],
        })
      } else if (useLocalModel || !whisperService.hasApiKey()) {
        // Проверяем доступность локального Whisper
        const isLocalAvailable = await whisperService.isLocalWhisperAvailable()

        if (!isLocalAvailable) {
          toast.error(t("subtitles.ai.noMethod", "Метод транскрипции недоступен"), {
            description: t("subtitles.ai.noMethodDesc", "Установите API ключ OpenAI или локальную модель Whisper"),
          })
          return
        }

        // Используем локальную модель
        toast.info(t("subtitles.ai.transcribingLocal", "Транскрипция с помощью локальной модели..."))

        // Получаем длительность файла для рекомендации модели
        const selectedFile = mediaFiles.find((f) => f.path === selectedTrack)
        const duration = selectedFile?.duration || 300 // по умолчанию 5 минут

        const modelToUse = useLocalModel ? selectedModel : whisperService.recommendModel(duration, true)

        transcriptionResult = await whisperService.transcribeWithLocalModel(audioFilePath, modelToUse, {
          language: selectedLanguage === "auto" ? undefined : selectedLanguage,
          outputFormat: "json",
        })
      } else {
        toast.error(t("subtitles.ai.noMethod", "Метод транскрипции недоступен"), {
          description: t("subtitles.ai.noMethodDesc", "Установите API ключ OpenAI или локальную модель Whisper"),
        })
        return
      }

      // Конвертируем результат в SRT формат
      let srtContent = ""

      if (transcriptionResult.segments && transcriptionResult.segments.length > 0) {
        srtContent = whisperService.convertToSRT(transcriptionResult.segments)
      } else if (transcriptionResult.text) {
        // Если нет сегментов, создаем один субтитр на весь текст
        srtContent = `1
00:00:00,000 --> 00:00:10,000
${transcriptionResult.text}`
      }

      // Парсим SRT и добавляем на таймлайн
      const subtitles = parseSRT(srtContent)

      // Находим или создаем ID трека для субтитров
      let subtitleTrackId = project?.sections[0]?.tracks.find((track) => track.type === "subtitle")?.id

      if (!subtitleTrackId) {
        subtitleTrackId = `subtitle-track-${Date.now()}`
      }

      for (const subtitle of subtitles) {
        await addSubtitleClip(subtitleTrackId, {
          ...subtitle,
          id: generateSubtitleId(),
        })
      }

      toast.success(t("subtitles.ai.success", "Транскрипция завершена"), {
        description: t("subtitles.ai.successDesc", "Добавлено {{count}} субтитров", { count: subtitles.length }),
      })

      closeModal()
    } catch (error) {
      console.error("Ошибка транскрипции:", error)
      toast.error(t("subtitles.ai.error", "Ошибка транскрипции"), {
        description:
          error instanceof Error
            ? error.message
            : t("subtitles.ai.errorDesc", "Не удалось выполнить транскрипцию аудио"),
      })
    } finally {
      setIsTranscribing(false)
    }
  }

  const availableMediaFiles = audioVideoFiles

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {t("subtitles.ai.dialogDesc", "Используйте AI для автоматического создания субтитров из аудио")}
      </p>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="media-file">{t("subtitles.ai.selectMedia", "Выберите медиафайл")}</Label>
          <Select value={selectedTrack} onValueChange={setSelectedTrack}>
            <SelectTrigger id="media-file">
              <SelectValue placeholder={t("subtitles.ai.selectPlaceholder", "Выберите файл...")} />
            </SelectTrigger>
            <SelectContent>
              {availableMediaFiles.map((file) => (
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
              <SelectItem value="ko">{t("language.native.ko", "한국어")}</SelectItem>
              <SelectItem value="pt">{t("language.native.pt", "Português")}</SelectItem>
              <SelectItem value="tr">{t("language.native.tr", "Türkçe")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="model">{t("subtitles.ai.modelSelection", "Модель транскрипции")}</Label>
          <Select
            value={useLocalModel ? selectedModel : "whisper-1"}
            onValueChange={(value) => {
              if (value.startsWith("whisper-") && value !== "whisper-1") {
                setUseLocalModel(true)
                setSelectedModel(value)
              } else {
                setUseLocalModel(false)
                setSelectedModel(value)
              }
            }}
          >
            <SelectTrigger id="model">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="whisper-1">{t("subtitles.ai.openaiModel", "OpenAI Whisper (облачный)")}</SelectItem>
              <SelectItem value="whisper-tiny">{t("subtitles.ai.localTiny", "Локальная Tiny (39 MB)")}</SelectItem>
              <SelectItem value="whisper-base">{t("subtitles.ai.localBase", "Локальная Base (74 MB)")}</SelectItem>
              <SelectItem value="whisper-small">{t("subtitles.ai.localSmall", "Локальная Small (244 MB)")}</SelectItem>
              <SelectItem value="whisper-medium">
                {t("subtitles.ai.localMedium", "Локальная Medium (769 MB)")}
              </SelectItem>
              <SelectItem value="whisper-large-v3">
                {t("subtitles.ai.localLarge", "Локальная Large v3 (1.5 GB)")}
              </SelectItem>
            </SelectContent>
          </Select>
          {useLocalModel && (
            <p className="text-xs text-muted-foreground">
              {t("subtitles.ai.localModelNote", "Локальные модели работают без интернета, но могут быть медленнее")}
            </p>
          )}
        </div>

        {mediaFiles.length === 0 && (
          <div className="rounded-md bg-muted p-4 text-center text-sm text-muted-foreground">
            {t("subtitles.ai.noMedia", "Добавьте видео или аудио файлы в проект для транскрипции")}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={closeModal} disabled={isTranscribing}>
          {t("common.cancel", "Отмена")}
        </Button>
        <Button onClick={startTranscription} disabled={!selectedTrack || isTranscribing}>
          {isTranscribing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t("subtitles.ai.start", "Начать транскрипцию")}
        </Button>
      </div>
    </div>
  )
}
