import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"

export function AudioSettings() {
  const { t } = useTranslation()

  const SAMPLE_RATE_OPTIONS = [
    { value: "44100", label: t("options.audio.sampleRates.44100", "44.1 kHz (CD quality)") },
    { value: "48000", label: t("options.audio.sampleRates.48000", "48 kHz (Professional)") },
    { value: "96000", label: t("options.audio.sampleRates.96000", "96 kHz (Hi-Res)") },
    { value: "192000", label: t("options.audio.sampleRates.192000", "192 kHz (Studio)") },
  ]

  const BITRATE_OPTIONS = [
    { value: "128", label: t("options.audio.bitrates.128", "128 kbps (Basic)") },
    { value: "192", label: t("options.audio.bitrates.192", "192 kbps (Good)") },
    { value: "256", label: t("options.audio.bitrates.256", "256 kbps (High)") },
    { value: "320", label: t("options.audio.bitrates.320", "320 kbps (Maximum)") },
  ]

  const CHANNELS_OPTIONS = [
    { value: "mono", label: t("options.audio.channelsOptions.mono", "Mono (1 channel)") },
    { value: "stereo", label: t("options.audio.channelsOptions.stereo", "Stereo (2 channels)") },
    { value: "5.1", label: t("options.audio.channelsOptions.5_1", "5.1 Surround") },
    { value: "7.1", label: t("options.audio.channelsOptions.7_1", "7.1 Surround") },
  ]

  const AUDIO_CODEC_OPTIONS = [
    { value: "aac", label: t("options.audio.codecs.aac", "AAC (Recommended)") },
    { value: "mp3", label: t("options.audio.codecs.mp3", "MP3 (Compatibility)") },
    { value: "flac", label: t("options.audio.codecs.flac", "FLAC (Lossless)") },
    { value: "opus", label: t("options.audio.codecs.opus", "Opus (Efficiency)") },
  ]

  return (
    <div className="space-y-6 h-full overflow-auto" data-testid="audio-settings">
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
          <Slider defaultValue={[75]} max={100} step={1} className="w-full" />
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
        <h3 className="text-md font-medium">{t("options.audio.advanced", "Дополнительные настройки")}</h3>

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
        <Button variant="outline">{t("common.reset", "Сбросить")}</Button>
        <Button>{t("common.apply", "Применить")}</Button>
      </div>
    </div>
  )
}
