/**
 * NoFiles - Универсальный компонент для отображения пустого состояния
 *
 * Показывает сообщение когда нет файлов определенного типа,
 * с инструкциями по добавлению и поддерживаемыми форматами
 */

import React from "react";

import {
  FileText,
  Filter,
  FolderOpen,
  Image,
  Music,
  Palette,
  Sparkles,
  Upload,
  Video,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export type MediaType =
  | "media"
  | "music"
  | "effects"
  | "filters"
  | "transitions"
  | "templates"
  | "style-templates"
  | "subtitles";

interface NoFilesProps {
  type: MediaType;
  onImport?: () => void;
  className?: string;
}

interface MediaTypeConfig {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  folders: string[];
  formats: string[];
  importText: string;
  folderText: string;
}

const MEDIA_CONFIGS: Record<MediaType, MediaTypeConfig> = {
  media: {
    title: "Медиафайлы не найдены",
    description: "Добавьте видео, аудио или фото файлы для работы с проектом",
    icon: Video,
    folders: ["/public/media/"],
    formats: [
      "Видео: MP4, MOV, AVI, MKV, WEBM, INSV (360°)",
      "Аудио: MP3, WAV, AAC, ALAC, OGG, FLAC",
      "Фото: JPG, PNG, GIF, WEBP, TIFF, BMP",
    ],
    importText: "Импортировать медиафайлы",
    folderText: "Или поместите файлы в папку",
  },
  music: {
    title: "Музыкальные файлы не найдены",
    description: "Добавьте музыку и звуковые эффекты для озвучивания проекта",
    icon: Music,
    folders: ["/public/music/"],
    formats: ["MP3, WAV, AAC, ALAC, OGG, FLAC"],
    importText: "Импортировать музыку",
    folderText: "Или поместите музыку в папку",
  },
  effects: {
    title: "Эффекты не найдены",
    description: "Добавьте видеоэффекты для улучшения ваших клипов",
    icon: Sparkles,
    folders: ["/public/effects/"],
    formats: ["JSON файлы с описанием эффектов"],
    importText: "Импортировать эффекты",
    folderText: "Или поместите эффекты в папку",
  },
  filters: {
    title: "Фильтры не найдены",
    description: "Добавьте цветовые фильтры и коррекцию для видео",
    icon: Filter,
    folders: ["/public/filters/"],
    formats: ["JSON файлы с настройками фильтров"],
    importText: "Импортировать фильтры",
    folderText: "Или поместите фильтры в папку",
  },
  transitions: {
    title: "Переходы не найдены",
    description: "Добавьте переходы между клипами для плавного монтажа",
    icon: Palette,
    folders: ["/public/transitions/"],
    formats: ["JSON файлы с анимациями переходов"],
    importText: "Импортировать переходы",
    folderText: "Или поместите переходы в папку",
  },
  templates: {
    title: "Шаблоны не найдены",
    description: "Добавьте готовые шаблоны для быстрого создания проектов",
    icon: FileText,
    folders: ["/public/templates/"],
    formats: ["JSON файлы с настройками шаблонов"],
    importText: "Импортировать шаблоны",
    folderText: "Или поместите шаблоны в папку",
  },
  "style-templates": {
    title: "Стильные шаблоны не найдены",
    description: "Добавьте стилизованные шаблоны с готовым дизайном",
    icon: Palette,
    folders: ["/public/style-templates/"],
    formats: ["JSON файлы со стилями и настройками"],
    importText: "Импортировать стильные шаблоны",
    folderText: "Или поместите шаблоны в папку",
  },
  subtitles: {
    title: "Субтитры не найдены",
    description: "Добавьте файлы субтитров или создайте новые",
    icon: FileText,
    folders: ["/public/subtitles/"],
    formats: ["SRT, VTT, ASS, SSA файлы субтитров"],
    importText: "Импортировать субтитры",
    folderText: "Или поместите субтитры в папку",
  },
};

export function NoFiles({ type, onImport, className }: NoFilesProps) {
  const config = MEDIA_CONFIGS[type];
  const IconComponent = config.icon;

  return (
    <div
      className={`flex h-full items-center justify-center p-8 ${className || ""}`}
      data-testid="no-files"
    >
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            {/* Иконка */}
            <div className="flex justify-center">
              <div className="p-3 rounded-full bg-muted">
                <IconComponent className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>

            {/* Заголовок и описание */}
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">{config.title}</h3>
              <p className="text-sm text-muted-foreground">
                {config.description}
              </p>
            </div>

            {/* Кнопка импорта */}
            {onImport && (
              <Button onClick={onImport} className="w-full">
                <Upload className="h-4 w-4 mr-2" />
                {config.importText}
              </Button>
            )}

            {/* Инструкции по папкам */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <span>{config.folderText}</span>
              </div>

              {config.folders.map((folder, index) => (
                <div
                  key={index}
                  className="flex items-center justify-center gap-2"
                >
                  <FolderOpen className="h-4 w-4 text-muted-foreground" />
                  <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                    {folder}
                  </code>
                </div>
              ))}
            </div>

            {/* Поддерживаемые форматы */}
            <div className="space-y-2 pt-2">
              <p className="text-xs text-muted-foreground">
                Поддерживаемые форматы:
              </p>
              <div className="flex flex-wrap gap-1 justify-center">
                {config.formats.map((format, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {format}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
