import { useEffect, useState } from "react";

import { FileVideo, Upload } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { MediaFile } from "@/types/media";

// Типы для информации о медиафайле
interface MediaFileInfo {
  name: string;
  size: number;
  duration: number;
  resolution: {
    width: number;
    height: number;
  };
  fps: number;
  bitrate: number;
  videoCodec: string;
  audioCodec: string;
  sampleRate: number;
  channels: number;
  audioBitrate: number;
  colorSpace: string;
  profile: string;
  createdAt: string;
  device?: string;
}

// Моковые данные для примера
const MOCK_FILE_INFO: MediaFileInfo = {
  name: "sample_video.mp4",
  size: 157286400, // 150 MB
  duration: 120, // 2 минуты
  resolution: { width: 1920, height: 1080 },
  fps: 30,
  bitrate: 10485760, // 10 Mbps
  videoCodec: "H.264",
  audioCodec: "AAC",
  sampleRate: 48000,
  channels: 2,
  audioBitrate: 256000, // 256 kbps
  colorSpace: "YUV 4:2:0",
  profile: "High",
  createdAt: "2024-01-15T10:30:00Z",
  device: "iPhone 15 Pro",
};

function formatFileSize(bytes: number): string {
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

function formatBitrate(bitrate: number): string {
  if (bitrate >= 1000000) {
    return `${(bitrate / 1000000).toFixed(1)} Mbps`;
  }
  return `${(bitrate / 1000).toFixed(0)} kbps`;
}

interface MediaInfoProps {
  selectedMediaFile?: MediaFile | null;
}

export function MediaInfo({ selectedMediaFile }: MediaInfoProps) {
  const { t } = useTranslation();
  const [selectedFile, setSelectedFile] = useState<MediaFileInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Конвертируем MediaFile в MediaFileInfo
  const convertMediaFileToInfo = (mediaFile: MediaFile): MediaFileInfo => {
    // Извлекаем данные из probeData если доступны
    const videoStream = mediaFile.probeData?.streams?.find(
      (s) => s.codec_type === "video",
    );
    const audioStream = mediaFile.probeData?.streams?.find(
      (s) => s.codec_type === "audio",
    );

    return {
      name: mediaFile.name,
      size: mediaFile.size || 0,
      duration:
        mediaFile.duration ||
        Number(mediaFile.probeData?.format?.duration) ||
        0,
      resolution: {
        width: videoStream?.width || 0,
        height: videoStream?.height || 0,
      },
      fps: videoStream?.r_frame_rate ? eval(videoStream.r_frame_rate) : 0,
      bitrate: Number(mediaFile.probeData?.format?.bit_rate) || 0,
      videoCodec: videoStream?.codec_name || "Unknown",
      audioCodec: audioStream?.codec_name || "Unknown",
      sampleRate: Number(audioStream?.sample_rate) || 0,
      channels: audioStream?.channels || 0,
      audioBitrate: Number(audioStream?.bit_rate) || 0,
      colorSpace: "YUV 4:2:0", // Пока статично
      profile: "High", // Пока статично
      createdAt: mediaFile.createdAt || new Date().toISOString(),
      device: undefined, // Пока не доступно
    };
  };

  // Эффект для обновления информации при изменении выбранного файла
  useEffect(() => {
    if (selectedMediaFile) {
      setIsLoading(true);
      // Имитируем небольшую задержку для загрузки метаданных
      setTimeout(() => {
        setSelectedFile(convertMediaFileToInfo(selectedMediaFile));
        setIsLoading(false);
      }, 300);
    } else {
      setSelectedFile(null);
    }
  }, [selectedMediaFile]);

  const handleFileSelect = async () => {
    setIsLoading(true);
    // Имитация загрузки файла
    setTimeout(() => {
      setSelectedFile(MOCK_FILE_INFO);
      setIsLoading(false);
    }, 1000);
  };

  const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <div className="flex justify-between items-center py-1">
      <span className="text-sm text-muted-foreground">{label}:</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );

  return (
    <div className="space-y-6" data-testid="media-info">
      <div>
        <h2 className="text-lg font-semibold mb-4">
          {t("options.info.title", "Информация о медиафайле")}
        </h2>

        {/* Выбор файла */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>
              {t("options.info.selectFile", "Выберите файл для анализа")}
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder={t("options.info.noFileSelected", "Файл не выбран")}
                value={selectedFile?.name || ""}
                readOnly
              />
              <Button onClick={handleFileSelect} disabled={isLoading}>
                <Upload className="w-4 h-4 mr-2" />
                {isLoading
                  ? t("common.loading", "Загрузка...")
                  : t("common.browse", "Обзор")}
              </Button>
            </div>
          </div>
        </div>

        {selectedFile && (
          <>
            <Separator className="my-6" />

            {/* Основная информация */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileVideo className="w-5 h-5" />
                  {t("options.info.basicInfo", "Основная информация")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <InfoRow
                  label={t("options.info.fileName", "Имя файла")}
                  value={selectedFile.name}
                />
                <InfoRow
                  label={t("options.info.fileSize", "Размер файла")}
                  value={formatFileSize(selectedFile.size)}
                />
                <InfoRow
                  label={t("options.info.duration", "Длительность")}
                  value={formatDuration(selectedFile.duration)}
                />
                <InfoRow
                  label={t("options.info.resolution", "Разрешение")}
                  value={`${selectedFile.resolution.width}x${selectedFile.resolution.height}`}
                />
                <InfoRow
                  label={t("options.info.fps", "Частота кадров")}
                  value={`${selectedFile.fps} fps`}
                />
                <InfoRow
                  label={t("options.info.bitrate", "Битрейт")}
                  value={formatBitrate(selectedFile.bitrate)}
                />
              </CardContent>
            </Card>

            {/* Видео поток */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {t("options.info.videoStream", "Видео поток")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <InfoRow
                  label={t("options.info.codec", "Кодек")}
                  value={selectedFile.videoCodec}
                />
                <InfoRow
                  label={t("options.info.colorSpace", "Цветовое пространство")}
                  value={selectedFile.colorSpace}
                />
                <InfoRow
                  label={t("options.info.profile", "Профиль")}
                  value={selectedFile.profile}
                />
              </CardContent>
            </Card>

            {/* Аудио поток */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {t("options.info.audioStream", "Аудио поток")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <InfoRow
                  label={t("options.info.codec", "Кодек")}
                  value={selectedFile.audioCodec}
                />
                <InfoRow
                  label={t("options.info.sampleRate", "Частота дискретизации")}
                  value={`${selectedFile.sampleRate / 1000} kHz`}
                />
                <InfoRow
                  label={t("options.info.channels", "Каналы")}
                  value={selectedFile.channels === 2 ? "Стерео" : "Моно"}
                />
                <InfoRow
                  label={t("options.info.audioBitrate", "Битрейт аудио")}
                  value={formatBitrate(selectedFile.audioBitrate)}
                />
              </CardContent>
            </Card>

            {/* Метаданные */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {t("options.info.metadata", "Метаданные")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <InfoRow
                  label={t("options.info.createdAt", "Дата создания")}
                  value={new Date(selectedFile.createdAt).toLocaleString()}
                />
                {selectedFile.device && (
                  <InfoRow
                    label={t("options.info.device", "Устройство")}
                    value={selectedFile.device}
                  />
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
