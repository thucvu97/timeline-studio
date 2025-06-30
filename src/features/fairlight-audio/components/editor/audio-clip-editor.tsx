import { useState } from "react"

import { Scissors, TrendingDown, TrendingUp, Volume2, Zap } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"

import { useAudioEngine } from "../../hooks/use-audio-engine"
import { AudioClip, FadeOptions } from "../../services/audio-clip-editor"

interface AudioClipEditorProps {
  clip: AudioClip
  onUpdate: (clip: AudioClip) => void
  onSplit: (time: number) => void
}

export function AudioClipEditorComponent({ clip, onUpdate, onSplit }: AudioClipEditorProps) {
  const { t } = useTranslation()
  const { engine: audioEngine } = useAudioEngine()
  const [fadeInDuration, setFadeInDuration] = useState(clip.fadeIn || 0)
  const [fadeOutDuration, setFadeOutDuration] = useState(clip.fadeOut || 0)
  const [fadeType, setFadeType] = useState<FadeOptions["type"]>("cosine")
  const [splitPosition, setSplitPosition] = useState(50)
  const [isNormalizing, setIsNormalizing] = useState(false)

  const handleFadeIn = () => {
    if (!audioEngine?.clipEditor) return

    const updatedClip = audioEngine.clipEditor.applyFadeIn(clip, {
      type: fadeType,
      duration: fadeInDuration,
    })

    onUpdate(updatedClip)
  }

  const handleFadeOut = () => {
    if (!audioEngine?.clipEditor) return

    const updatedClip = audioEngine.clipEditor.applyFadeOut(clip, {
      type: fadeType,
      duration: fadeOutDuration,
    })

    onUpdate(updatedClip)
  }

  const handleSplit = () => {
    const splitTime = (clip.duration * splitPosition) / 100
    onSplit(splitTime)
  }

  const handleNormalize = async () => {
    if (!audioEngine?.clipEditor) return

    setIsNormalizing(true)
    try {
      const normalizedClip = audioEngine.clipEditor.normalizeClip(clip, -3)
      onUpdate(normalizedClip)
    } finally {
      setIsNormalizing(false)
    }
  }

  return (
    <div className="p-4 space-y-4 bg-zinc-900 rounded-lg">
      <h3 className="text-sm font-semibold text-zinc-100">{t("fairlightAudio.audioClipEditor.title")}</h3>

      {/* Fade Controls */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Select value={fadeType} onValueChange={(v) => setFadeType(v as FadeOptions["type"])}>
            <SelectTrigger className="w-32 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="linear">{t("fairlightAudio.audioClipEditor.fadeTypes.linear")}</SelectItem>
              <SelectItem value="exponential">{t("fairlightAudio.audioClipEditor.fadeTypes.exponential")}</SelectItem>
              <SelectItem value="logarithmic">{t("fairlightAudio.audioClipEditor.fadeTypes.logarithmic")}</SelectItem>
              <SelectItem value="cosine">{t("fairlightAudio.audioClipEditor.fadeTypes.cosine")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Fade In */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-xs text-zinc-400 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {t("fairlightAudio.audioClipEditor.fadeIn")}
            </label>
            <span className="text-xs text-zinc-500">{fadeInDuration.toFixed(1)}s</span>
          </div>
          <div className="flex items-center gap-2">
            <Slider
              value={[fadeInDuration]}
              onValueChange={([v]) => setFadeInDuration(v)}
              min={0}
              max={5}
              step={0.1}
              className="flex-1"
            />
            <Button size="sm" variant="secondary" onClick={handleFadeIn} className="h-7 px-2">
              {t("fairlightAudio.audioClipEditor.apply")}
            </Button>
          </div>
        </div>

        {/* Fade Out */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-xs text-zinc-400 flex items-center gap-1">
              <TrendingDown className="w-3 h-3" />
              {t("fairlightAudio.audioClipEditor.fadeOut")}
            </label>
            <span className="text-xs text-zinc-500">{fadeOutDuration.toFixed(1)}s</span>
          </div>
          <div className="flex items-center gap-2">
            <Slider
              value={[fadeOutDuration]}
              onValueChange={([v]) => setFadeOutDuration(v)}
              min={0}
              max={5}
              step={0.1}
              className="flex-1"
            />
            <Button size="sm" variant="secondary" onClick={handleFadeOut} className="h-7 px-2">
              {t("fairlightAudio.audioClipEditor.apply")}
            </Button>
          </div>
        </div>
      </div>

      {/* Split Control */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs text-zinc-400 flex items-center gap-1">
            <Scissors className="w-3 h-3" />
            {t("fairlightAudio.audioClipEditor.splitPosition")}
          </label>
          <span className="text-xs text-zinc-500">{splitPosition}%</span>
        </div>
        <div className="flex items-center gap-2">
          <Slider
            value={[splitPosition]}
            onValueChange={([v]) => setSplitPosition(v)}
            min={0}
            max={100}
            step={1}
            className="flex-1"
          />
          <Button size="sm" variant="secondary" onClick={handleSplit} className="h-7 px-2">
            {t("fairlightAudio.audioClipEditor.split")}
          </Button>
        </div>
      </div>

      {/* Normalize */}
      <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-zinc-400" />
          <span className="text-xs text-zinc-400">{t("fairlightAudio.audioClipEditor.normalizeTo")}</span>
        </div>
        <Button size="sm" variant="secondary" onClick={handleNormalize} disabled={isNormalizing} className="h-7 px-3">
          {isNormalizing ? <Zap className="w-3 h-3 animate-pulse" /> : t("fairlightAudio.audioClipEditor.normalize")}
        </Button>
      </div>
    </div>
  )
}
