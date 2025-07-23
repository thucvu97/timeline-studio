import React, { useState } from "react"

import { 
  ChevronDown,
  FileText,
  Info,
  Monitor,
  Music,
  Settings,
  Video
} from "lucide-react"
import { useTranslation } from "react-i18next"

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Label } from "@/components/ui/label"
import type { MediaFile } from "@/features/media/types/media"
import { useTimeline } from "@/features/timeline/hooks/use-timeline"

interface InfoSettingsState {
  mediaInfo: boolean
  projectInfo: boolean
  technicalInfo: boolean
  advanced: boolean
}

interface InfoSettingsProps {
  selectedMediaFile?: MediaFile | null
}

export function InfoSettings({ selectedMediaFile }: InfoSettingsProps) {
  const { t } = useTranslation()
  
  // Безопасно получаем timeline data
  let project: any = null
  let selectedClips: any[] = []
  try {
    const timeline = useTimeline()
    project = timeline.project
    selectedClips = timeline.selectedClips || []
  } catch {
    // TimelineProvider не доступен (например, в тестах)
    project = null
    selectedClips = []
  }
  
  // Получаем первый выбранный клип для отображения информации
  const currentClip = selectedClips?.[0] || null
  
  // Состояние открытых секций
  const [openSections, setOpenSections] = useState<InfoSettingsState>({
    mediaInfo: true, // Первая секция открыта по умолчанию
    projectInfo: false,
    technicalInfo: false,
    advanced: false,
  })

  const toggleSection = (section: keyof InfoSettingsState) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  // Определяем медиафайл для отображения
  const displayMediaFile = selectedMediaFile || currentClip?.mediaFile || null

  // Извлекаем расширение файла из имени
  const getFileExtension = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    return extension ? extension : 'unknown'
  }

  const formatFileSize = (bytes: number): string => {
    if (!bytes) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatDuration = (seconds: number): string => {
    if (!seconds) return "00:00"
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getMediaTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'video':
        return <Video className="h-4 w-4 text-blue-400" />
      case 'audio':
      case 'music':
        return <Music className="h-4 w-4 text-green-400" />
      default:
        return <FileText className="h-4 w-4 text-gray-400" />
    }
  }

  return (
    <div className="flex flex-col h-full" data-testid="info-settings">
      {/* Основной контент с прокруткой */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-[#2D2D30] scrollbar-thumb-[#464647] hover:scrollbar-thumb-[#5A5A5C]">
        <div className="p-4 space-y-4">
          
          {/* Информация о медиафайле */}
          <Collapsible open={openSections.mediaInfo} onOpenChange={() => toggleSection("mediaInfo")}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-[#383838] hover:bg-[#404040] rounded-lg border border-[#464647] transition-colors">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <FileText className="h-4 w-4 text-blue-400" />
                <h3 className="font-medium text-white">{t("options.info.mediaInfo", "Media Information")}</h3>
              </div>
              <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${openSections.mediaInfo ? "rotate-180" : ""}`} />
            </CollapsibleTrigger>
            
            <CollapsibleContent className="mt-3">
              <div className="bg-[#2D2D30] rounded-lg border border-[#464647] p-4 space-y-4">
                
                {displayMediaFile ? (
                  <div className="space-y-3">
                    {/* Имя файла */}
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-gray-300">{t("options.info.fileName", "File Name")}</Label>
                      <div className="flex items-center gap-2">
                        {getMediaTypeIcon(displayMediaFile.type)}
                        <span className="text-sm text-white">{displayMediaFile.name}</span>
                      </div>
                    </div>

                    {/* Путь к файлу */}
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-gray-300">{t("options.info.filePath", "File Path")}</Label>
                      <span className="text-sm text-gray-400 truncate max-w-64" title={displayMediaFile.path}>
                        {displayMediaFile.path}
                      </span>
                    </div>

                    {/* Размер файла */}
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-gray-300">{t("options.info.fileSize", "File Size")}</Label>
                      <span className="text-sm text-white">{formatFileSize(displayMediaFile.size || 0)}</span>
                    </div>

                    {/* Длительность */}
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-gray-300">{t("options.info.duration", "Duration")}</Label>
                      <span className="text-sm text-white">{formatDuration(displayMediaFile.duration || 0)}</span>
                    </div>

                    {/* Тип файла */}
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-gray-300">{t("options.info.fileType", "File Type")}</Label>
                      <span className="text-sm text-white uppercase">
                        {getFileExtension(displayMediaFile.name)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <FileText className="h-12 w-12 mx-auto mb-3 text-gray-600" />
                    <div className="text-sm">{t("options.info.noMediaSelected", "No media file selected")}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      {t("options.info.selectMediaHint", "Select a media file or clip to view information")}
                    </div>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Информация о проекте */}
          <Collapsible open={openSections.projectInfo} onOpenChange={() => toggleSection("projectInfo")}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-[#383838] hover:bg-[#404040] rounded-lg border border-[#464647] transition-colors">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <Monitor className="h-4 w-4 text-green-400" />
                <h3 className="font-medium text-white">{t("options.info.projectInfo", "Project Information")}</h3>
              </div>
              <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${openSections.projectInfo ? "rotate-180" : ""}`} />
            </CollapsibleTrigger>
            
            <CollapsibleContent className="mt-3">
              <div className="bg-[#2D2D30] rounded-lg border border-[#464647] p-4 space-y-4">
                
                {project ? (
                  <div className="space-y-3">
                    {/* Название проекта */}
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-gray-300">{t("options.info.projectName", "Project Name")}</Label>
                      <span className="text-sm text-white">{project.name || "Untitled Project"}</span>
                    </div>

                    {/* Разрешение */}
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-gray-300">{t("options.info.resolution", "Resolution")}</Label>
                      <span className="text-sm text-white">
                        {project.settings?.resolution?.width || 1920} × {project.settings?.resolution?.height || 1080}
                      </span>
                    </div>

                    {/* Частота кадров */}
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-gray-300">{t("options.info.frameRate", "Frame Rate")}</Label>
                      <span className="text-sm text-white">{project.fps || 30} fps</span>
                    </div>

                    {/* Длительность проекта */}
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-gray-300">{t("options.info.projectDuration", "Project Duration")}</Label>
                      <span className="text-sm text-white">{formatDuration(project.duration || 0)}</span>
                    </div>

                    {/* Количество секций */}
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-gray-300">{t("options.info.sections", "Sections")}</Label>
                      <span className="text-sm text-white">{project.sections?.length || 0}</span>
                    </div>

                    {/* Количество треков */}
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-gray-300">{t("options.info.tracks", "Tracks")}</Label>
                      <span className="text-sm text-white">
                        {(project.globalTracks?.length || 0) + 
                         (project.sections?.reduce(
                           (sum: number, section: any) => sum + (section.tracks?.length || 0), 0
                         ) || 0)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <Monitor className="h-12 w-12 mx-auto mb-3 text-gray-600" />
                    <div className="text-sm">{t("options.info.noProject", "No project loaded")}</div>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Техническая информация */}
          <Collapsible open={openSections.technicalInfo} onOpenChange={() => toggleSection("technicalInfo")}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-[#383838] hover:bg-[#404040] rounded-lg border border-[#464647] transition-colors">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-400" />
                <Info className="h-4 w-4 text-yellow-400" />
                <h3 className="font-medium text-white">{t("options.info.technicalInfo", "Technical Information")}</h3>
              </div>
              <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${openSections.technicalInfo ? "rotate-180" : ""}`} />
            </CollapsibleTrigger>
            
            <CollapsibleContent className="mt-3">
              <div className="bg-[#2D2D30] rounded-lg border border-[#464647] p-4 space-y-4">
                
                {displayMediaFile ? (
                  <div className="space-y-3">
                    {/* Видео кодек */}
                    {displayMediaFile.type === 'video' && (
                      <>
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium text-gray-300">{t("options.info.videoCodec", "Video Codec")}</Label>
                          <span className="text-sm text-white">{displayMediaFile.videoCodec || "Unknown"}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium text-gray-300">{t("options.info.videoBitrate", "Video Bitrate")}</Label>
                          <span className="text-sm text-white">{displayMediaFile.bitrate ? `${displayMediaFile.bitrate} kbps` : "Unknown"}</span>
                        </div>
                      </>
                    )}

                    {/* Аудио кодек */}
                    {(displayMediaFile.type === 'audio' || displayMediaFile.type === 'video') && (
                      <>
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium text-gray-300">{t("options.info.audioCodec", "Audio Codec")}</Label>
                          <span className="text-sm text-white">{displayMediaFile.audioCodec || "Unknown"}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium text-gray-300">{t("options.info.sampleRate", "Sample Rate")}</Label>
                          <span className="text-sm text-white">{displayMediaFile.sampleRate ? `${displayMediaFile.sampleRate} Hz` : "Unknown"}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium text-gray-300">{t("options.info.channels", "Audio Channels")}</Label>
                          <span className="text-sm text-white">{displayMediaFile.channels || "Unknown"}</span>
                        </div>
                      </>
                    )}

                    {/* Дата создания */}
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-gray-300">{t("options.info.createdAt", "Created")}</Label>
                      <span className="text-sm text-white">
                        {displayMediaFile.createdAt ? new Date(displayMediaFile.createdAt).toLocaleDateString() : "Unknown"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <Info className="h-12 w-12 mx-auto mb-3 text-gray-600" />
                    <div className="text-sm">{t("options.info.noTechnicalInfo", "No technical information available")}</div>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Дополнительная информация */}
          <Collapsible open={openSections.advanced} onOpenChange={() => toggleSection("advanced")}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-[#383838] hover:bg-[#404040] rounded-lg border border-[#464647] transition-colors">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-400" />
                <Settings className="h-4 w-4 text-purple-400" />
                <h3 className="font-medium text-white">{t("options.info.advanced", "Advanced Information")}</h3>
              </div>
              <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${openSections.advanced ? "rotate-180" : ""}`} />
            </CollapsibleTrigger>
            
            <CollapsibleContent className="mt-3">
              <div className="bg-[#2D2D30] rounded-lg border border-[#464647] p-4 space-y-4">
                
                {/* Информация о выбранном клипе */}
                {currentClip ? (
                  <div className="space-y-3">
                    <div className="text-sm font-medium text-gray-300 mb-3">{t("options.info.selectedClip", "Selected Clip")}</div>
                    
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-gray-300">{t("options.info.clipName", "Clip Name")}</Label>
                      <span className="text-sm text-white">{currentClip.name}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-gray-300">{t("options.info.clipDuration", "Clip Duration")}</Label>
                      <span className="text-sm text-white">{formatDuration(currentClip.duration || 0)}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-gray-300">{t("options.info.clipStartTime", "Start Time")}</Label>
                      <span className="text-sm text-white">{formatDuration(currentClip.startTime || 0)}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-gray-300">{t("options.info.clipVolume", "Volume")}</Label>
                      <span className="text-sm text-white">{Math.round((currentClip.volume || 1) * 100)}%</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-gray-300">{t("options.info.clipSpeed", "Speed")}</Label>
                      <span className="text-sm text-white">{(currentClip.speed || 1).toFixed(2)}x</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <Settings className="h-12 w-12 mx-auto mb-3 text-gray-600" />
                    <div className="text-sm">{t("options.info.noClipSelected", "No clip selected")}</div>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>

        </div>
      </div>
    </div>
  )
}