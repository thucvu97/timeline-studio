import { useState } from "react"

import { ChevronDown, Eye, EyeOff, RotateCcw, Save, Wand2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { useColorGradingContext } from "../../services/color-grading-provider"
import { getAllPresetCategories } from "../../types/presets"

export function ColorGradingControls() {
  const { t } = useTranslation()
  const {
    state,
    hasChanges,
    resetAll,
    togglePreview,
    applyToClip,
    loadPreset,
    savePreset,
    autoCorrect,
    availablePresets,
    dispatch,
  } = useColorGradingContext()

  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [presetName, setPresetName] = useState("")

  const handleSavePreset = () => {
    if (presetName.trim()) {
      savePreset(presetName)
      setSaveDialogOpen(false)
      setPresetName("")
    }
  }

  // Группируем пресеты по категориям
  const presetCategories = getAllPresetCategories()
  const presetsByCategory = presetCategories.reduce<Record<string, typeof availablePresets>>((acc, category) => {
    acc[category] = availablePresets.filter((preset) => preset.category === category)
    return acc
  }, {})

  return (
    <>
      <div className="flex justify-between items-center p-4" data-testid="color-grading-controls">
        {/* Левые кнопки - управление пресетами */}
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-8 px-3 hover:bg-[#404040]"
            title={t("colorGrading.controls.resetAllTooltip", "Reset all color corrections")}
            onClick={resetAll}
            disabled={!hasChanges}
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            {t("colorGrading.controls.resetAll", "Reset All")}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-8 px-3 hover:bg-[#404040]"
            title={t("colorGrading.controls.autoCorrectTooltip", "Automatically adjust levels")}
            onClick={autoCorrect}
          >
            <Wand2 className="h-3 w-3 mr-1" />
            {t("colorGrading.controls.auto", "Auto")}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-8 px-3 hover:bg-[#404040]"
                title={t("colorGrading.controls.loadPresetTooltip", "Load color grading preset")}
              >
                {t("colorGrading.controls.loadPreset", "Load Preset")}
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-[#2D2D30] border-[#464647]">
              {presetCategories.map((category) => (
                <div key={category}>
                  <DropdownMenuLabel className="text-xs text-gray-400 uppercase">
                    {t(`colorGrading.presets.categories.${category}`, category)}
                  </DropdownMenuLabel>
                  {presetsByCategory[category].map((preset) => (
                    <DropdownMenuItem
                      key={preset.id}
                      className="text-sm hover:bg-[#404040]"
                      onClick={() => loadPreset(preset.id)}
                    >
                      {preset.name}
                      {preset.description && <span className="text-xs text-gray-400 ml-2">{preset.description}</span>}
                    </DropdownMenuItem>
                  ))}
                  {category !== presetCategories[presetCategories.length - 1] && (
                    <DropdownMenuSeparator className="bg-[#464647]" />
                  )}
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-8 px-3 hover:bg-[#404040]"
            title={t("colorGrading.controls.savePresetTooltip", "Save current settings as preset")}
            onClick={() => setSaveDialogOpen(true)}
            disabled={!hasChanges}
          >
            <Save className="h-3 w-3 mr-1" />
            {t("colorGrading.controls.savePreset", "Save Preset")}
          </Button>
        </div>

        {/* Правые кнопки - применение */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-8 px-3 bg-[#383838] border-[#464647] hover:bg-[#404040]"
            title={t("colorGrading.controls.togglePreviewTooltip", "Toggle real-time preview")}
            onClick={() => togglePreview(!state.previewEnabled)}
          >
            {state.previewEnabled ? <Eye className="h-3 w-3 mr-1" /> : <EyeOff className="h-3 w-3 mr-1" />}
            {t("colorGrading.controls.preview", "Preview")}
          </Button>

          <Button
            size="sm"
            className="text-xs h-8 px-4 bg-blue-600 hover:bg-blue-700"
            title={t("colorGrading.controls.applyToClipTooltip", "Apply color grading to selected clip")}
            onClick={applyToClip}
            disabled={!state.selectedClip || !hasChanges}
          >
            {t("colorGrading.controls.applyToClip", "Apply to Clip")}
          </Button>
        </div>
      </div>

      {/* Save Preset Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="bg-[#2D2D30] border-[#464647]">
          <DialogHeader>
            <DialogTitle>{t("colorGrading.dialogs.savePreset.title", "Save Color Grading Preset")}</DialogTitle>
            <DialogDescription>
              {t("colorGrading.dialogs.savePreset.description", "Enter a name for your color grading preset")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="preset-name" className="text-right">
                {t("colorGrading.dialogs.savePreset.nameLabel", "Name")}
              </Label>
              <Input
                id="preset-name"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                className="col-span-3 bg-[#383838] border-[#464647]"
                placeholder={t("colorGrading.dialogs.savePreset.namePlaceholder", "My Preset")}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSaveDialogOpen(false)} className="hover:bg-[#404040]">
              {t("common.cancel", "Cancel")}
            </Button>
            <Button onClick={handleSavePreset} disabled={!presetName.trim()} className="bg-blue-600 hover:bg-blue-700">
              {t("common.save", "Save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
