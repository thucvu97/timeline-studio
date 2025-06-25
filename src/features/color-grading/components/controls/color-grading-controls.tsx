import { Eye, EyeOff, RotateCcw, Save } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"

import { useColorGradingContext } from "../../services/color-grading-provider"

export function ColorGradingControls() {
  const { t } = useTranslation()
  const { 
    state, 
    hasChanges, 
    resetAll, 
    togglePreview, 
    applyToClip,
    loadPreset,
    savePreset
  } = useColorGradingContext()

  return (
    <div className="flex justify-between items-center p-4" data-testid="color-grading-controls">
      {/* Левые кнопки - управление пресетами */}
      <div className="flex gap-2">
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-xs h-8 px-3 hover:bg-[#404040]"
          title={t('colorGrading.controls.resetAllTooltip', 'Reset all color corrections')}
          onClick={resetAll}
          disabled={!hasChanges}
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          {t('colorGrading.controls.resetAll', 'Reset All')}
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-xs h-8 px-3 hover:bg-[#404040]"
          title={t('colorGrading.controls.loadPresetTooltip', 'Load color grading preset')}
        >
          {t('colorGrading.controls.loadPreset', 'Load Preset')}
        </Button>

        <Button 
          variant="ghost" 
          size="sm" 
          className="text-xs h-8 px-3 hover:bg-[#404040]"
          title={t('colorGrading.controls.savePresetTooltip', 'Save current settings as preset')}
        >
          <Save className="h-3 w-3 mr-1" />
          {t('colorGrading.controls.savePreset', 'Save Preset')}
        </Button>
      </div>
      
      {/* Правые кнопки - применение */}
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="text-xs h-8 px-3 bg-[#383838] border-[#464647] hover:bg-[#404040]"
          title={t('colorGrading.controls.togglePreviewTooltip', 'Toggle real-time preview')}
          onClick={() => togglePreview(!state.previewEnabled)}
        >
          {state.previewEnabled ? (
            <Eye className="h-3 w-3 mr-1" />
          ) : (
            <EyeOff className="h-3 w-3 mr-1" />
          )}
          {t('colorGrading.controls.preview', 'Preview')}
        </Button>
        
        <Button 
          size="sm" 
          className="text-xs h-8 px-4 bg-blue-600 hover:bg-blue-700"
          title={t('colorGrading.controls.applyToClipTooltip', 'Apply color grading to selected clip')}
          onClick={applyToClip}
          disabled={!state.selectedClip || !hasChanges}
        >
          {t('colorGrading.controls.applyToClip', 'Apply to Clip')}
        </Button>
      </div>
    </div>
  )
}