import { useTranslation } from "react-i18next"

import { Fader } from "./fader"
import { useMixerState } from "../../hooks/use-mixer-state"

export function MasterSection() {
  const { t } = useTranslation()
  const { master, updateMaster } = useMixerState()

  return (
    <div className="h-full flex flex-col p-4">
      <h3 className="text-sm font-medium text-zinc-300 mb-4">{t("timeline.audioMixer.master")}</h3>

      {/* Bus section (placeholder for now) */}
      <div className="flex-1 space-y-2 mb-4">
        <div className="p-3 bg-zinc-800 rounded">
          <div className="text-xs text-zinc-500 mb-1">Bus 1</div>
          <div className="h-2 bg-zinc-700 rounded" />
        </div>
        <div className="p-3 bg-zinc-800 rounded">
          <div className="text-xs text-zinc-500 mb-1">Bus 2</div>
          <div className="h-2 bg-zinc-700 rounded" />
        </div>
      </div>

      {/* Master controls */}
      <div className="border-t border-zinc-800 pt-4">
        {/* Limiter */}
        <div className="mb-4">
          <label className="flex items-center gap-2 text-xs text-zinc-400">
            <input
              type="checkbox"
              checked={master.limiterEnabled}
              onChange={(e) => updateMaster({ limiterEnabled: e.target.checked })}
              className="rounded border-zinc-600"
            />
            <span>Limiter</span>
          </label>
          {master.limiterEnabled && (
            <div className="mt-2">
              <div className="text-[10px] text-zinc-500 mb-1">Threshold: {master.limiterThreshold} dB</div>
              <input
                type="range"
                min="-20"
                max="0"
                value={master.limiterThreshold}
                onChange={(e) => updateMaster({ limiterThreshold: Number(e.target.value) })}
                className="w-full h-1"
              />
            </div>
          )}
        </div>

        {/* Master fader */}
        <div className="flex justify-center">
          <Fader
            value={master.volume}
            onChange={(value) => updateMaster({ volume: value })}
            muted={master.muted}
            onMute={() => updateMaster({ muted: !master.muted })}
            label="MASTER"
            className="scale-110"
          />
        </div>
      </div>
    </div>
  )
}
