import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

const RESOLUTION_OPTIONS = [
  { value: "1920x1080", label: "1920x1080 (Full HD)" },
  { value: "1280x720", label: "1280x720 (HD)" },
  { value: "2560x1440", label: "2560x1440 (2K QHD)" },
  { value: "3840x2160", label: "3840x2160 (4K UHD)" },
  { value: "custom", label: "Пользовательское" },
];

const FPS_OPTIONS = [
  { value: "24", label: "24 fps (Кино)" },
  { value: "25", label: "25 fps (PAL)" },
  { value: "30", label: "30 fps (NTSC)" },
  { value: "50", label: "50 fps" },
  { value: "60", label: "60 fps" },
  { value: "120", label: "120 fps" },
];

const ASPECT_RATIO_OPTIONS = [
  { value: "16:9", label: "16:9 (Широкоэкранный)" },
  { value: "4:3", label: "4:3 (Стандартный)" },
  { value: "21:9", label: "21:9 (Ультраширокий)" },
  { value: "1:1", label: "1:1 (Квадратный)" },
  { value: "9:16", label: "9:16 (Вертикальный)" },
];

const QUALITY_OPTIONS = [
  { value: "low", label: "Низкое (быстрее)" },
  { value: "medium", label: "Среднее" },
  { value: "high", label: "Высокое" },
  { value: "ultra", label: "Ультра (медленнее)" },
];

const CODEC_OPTIONS = [
  { value: "h264", label: "H.264 (Совместимость)" },
  { value: "h265", label: "H.265 (Эффективность)" },
  { value: "vp9", label: "VP9 (Веб)" },
  { value: "av1", label: "AV1 (Новейший)" },
];

export function VideoSettings() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6" data-testid="video-settings">
      <div>
        <h2 className="text-lg font-semibold mb-4">
          {t("options.video.title", "Настройки видео")}
        </h2>

        {/* Разрешение проекта */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t("options.video.resolution", "Разрешение проекта")}</Label>
            <Select defaultValue="1920x1080">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RESOLUTION_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Пользовательское разрешение */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label>{t("options.video.width", "Ширина")}</Label>
              <Input type="number" placeholder="1920" />
            </div>
            <div className="space-y-2">
              <Label>{t("options.video.height", "Высота")}</Label>
              <Input type="number" placeholder="1080" />
            </div>
          </div>
        </div>

        <Separator className="my-6" />

        {/* Частота кадров */}
        <div className="space-y-2">
          <Label>{t("options.video.fps", "Частота кадров")}</Label>
          <Select defaultValue="30">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FPS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator className="my-6" />

        {/* Соотношение сторон */}
        <div className="space-y-2">
          <Label>{t("options.video.aspectRatio", "Соотношение сторон")}</Label>
          <Select defaultValue="16:9">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ASPECT_RATIO_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator className="my-6" />

        {/* Качество превью */}
        <div className="space-y-2">
          <Label>{t("options.video.previewQuality", "Качество превью")}</Label>
          <Select defaultValue="medium">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {QUALITY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator className="my-6" />

        {/* Кодек по умолчанию */}
        <div className="space-y-2">
          <Label>{t("options.video.defaultCodec", "Кодек по умолчанию")}</Label>
          <Select defaultValue="h264">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CODEC_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator className="my-6" />

        {/* Кнопки действий */}
        <div className="flex gap-2">
          <Button variant="outline">{t("common.reset", "Сбросить")}</Button>
          <Button>{t("common.apply", "Применить")}</Button>
        </div>
      </div>
    </div>
  );
}
