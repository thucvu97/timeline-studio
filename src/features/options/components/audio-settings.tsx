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
import { Slider } from "@/components/ui/slider";

const SAMPLE_RATE_OPTIONS = [
  { value: "44100", label: "44.1 kHz (CD качество)" },
  { value: "48000", label: "48 kHz (Профессиональное)" },
  { value: "96000", label: "96 kHz (Hi-Res)" },
  { value: "192000", label: "192 kHz (Студийное)" },
];

const BITRATE_OPTIONS = [
  { value: "128", label: "128 kbps (Базовое)" },
  { value: "192", label: "192 kbps (Хорошее)" },
  { value: "256", label: "256 kbps (Высокое)" },
  { value: "320", label: "320 kbps (Максимальное)" },
];

const CHANNELS_OPTIONS = [
  { value: "mono", label: "Моно (1 канал)" },
  { value: "stereo", label: "Стерео (2 канала)" },
  { value: "5.1", label: "5.1 Surround" },
  { value: "7.1", label: "7.1 Surround" },
];

const AUDIO_CODEC_OPTIONS = [
  { value: "aac", label: "AAC (Рекомендуется)" },
  { value: "mp3", label: "MP3 (Совместимость)" },
  { value: "flac", label: "FLAC (Без потерь)" },
  { value: "opus", label: "Opus (Эффективность)" },
];

export function AudioSettings() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6" data-testid="audio-settings">
      <div>
        <h2 className="text-lg font-semibold mb-4">
          {t("options.audio.title", "Настройки аудио")}
        </h2>

        {/* Частота дискретизации */}
        <div className="space-y-2">
          <Label>{t("options.audio.sampleRate", "Частота дискретизации")}</Label>
          <Select defaultValue="48000">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SAMPLE_RATE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator className="my-6" />

        {/* Битрейт */}
        <div className="space-y-2">
          <Label>{t("options.audio.bitrate", "Битрейт")}</Label>
          <Select defaultValue="256">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BITRATE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator className="my-6" />

        {/* Количество каналов */}
        <div className="space-y-2">
          <Label>{t("options.audio.channels", "Количество каналов")}</Label>
          <Select defaultValue="stereo">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CHANNELS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator className="my-6" />

        {/* Громкость по умолчанию */}
        <div className="space-y-4">
          <Label>{t("options.audio.defaultVolume", "Громкость по умолчанию")}</Label>
          <div className="space-y-2">
            <Slider
              defaultValue={[75]}
              max={100}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>0%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        <Separator className="my-6" />

        {/* Аудиокодек */}
        <div className="space-y-2">
          <Label>{t("options.audio.codec", "Аудиокодек")}</Label>
          <Select defaultValue="aac">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AUDIO_CODEC_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator className="my-6" />

        {/* Дополнительные настройки */}
        <div className="space-y-4">
          <h3 className="text-md font-medium">
            {t("options.audio.advanced", "Дополнительные настройки")}
          </h3>

          <div className="space-y-2">
            <Label>{t("options.audio.bufferSize", "Размер буфера (мс)")}</Label>
            <Input type="number" defaultValue="512" min="128" max="2048" step="128" />
          </div>

          <div className="space-y-2">
            <Label>{t("options.audio.latency", "Задержка (мс)")}</Label>
            <Input type="number" defaultValue="20" min="0" max="100" step="5" />
          </div>
        </div>

        <Separator className="my-6" />

        {/* Кнопки действий */}
        <div className="flex gap-2">
          <Button variant="outline">
            {t("common.reset", "Сбросить")}
          </Button>
          <Button>
            {t("common.apply", "Применить")}
          </Button>
        </div>
      </div>
    </div>
  );
}
