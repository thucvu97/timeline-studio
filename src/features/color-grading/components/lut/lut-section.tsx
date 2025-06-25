import { useState } from "react"

import { Upload, X } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function LUTSection() {
  const { t } = useTranslation()
  const [selectedLUT, setSelectedLUT] = useState<string>('none')
  const [lutIntensity, setLutIntensity] = useState(100)

  const predefinedLUTs = [
    { value: 'none', label: t('colorGrading.lut.none', 'None') },
    { value: 'cinematic-warm', label: t('colorGrading.lut.cinematicWarm', 'Cinematic Warm') },
    { value: 'vintage-film', label: t('colorGrading.lut.vintageFilm', 'Vintage Film') },
    { value: 'moody-blue', label: t('colorGrading.lut.moodynlue', 'Moody Blue') },
    { value: 'high-contrast', label: t('colorGrading.lut.highContrast', 'High Contrast') },
    { value: 'custom', label: t('colorGrading.lut.loadCustom', 'Load Custom...') }
  ]

  const handleLUTLoad = async () => {
    // TODO: Интеграция с Tauri dialog для выбора .cube файла
    console.log('Loading custom LUT file...')
  }

  return (
    <div className="space-y-4" data-testid="lut-section">
      {/* Заголовок секции */}
      <div className="text-sm text-gray-400">
        {t('colorGrading.lut.description', 'Apply Look-Up Tables for creative color grading')}
      </div>

      {/* Выбор LUT файла */}
      <div className="space-y-3">
        <Label className="text-sm text-gray-300">
          {t('colorGrading.lut.file', 'LUT File')}
        </Label>
        
        <div className="flex gap-2">
          <Select value={selectedLUT} onValueChange={setSelectedLUT}>
            <SelectTrigger className="bg-[#383838] border-[#464647] text-white">
              <SelectValue placeholder={t('colorGrading.lut.selectPlaceholder', 'Select LUT...')} />
            </SelectTrigger>
            <SelectContent className="bg-[#383838] border-[#464647]">
              {predefinedLUTs.map((lut) => (
                <SelectItem key={lut.value} value={lut.value} className="text-white hover:bg-[#404040]">
                  {lut.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleLUTLoad}
            className="bg-[#383838] border-[#464647] hover:bg-[#404040] px-3"
            title={t('colorGrading.lut.loadCustomTooltip', 'Load custom .cube file')}
          >
            <Upload className="h-4 w-4" />
          </Button>

          {selectedLUT !== 'none' && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setSelectedLUT('none')}
              className="hover:bg-[#404040] px-3"
              title={t('colorGrading.lut.remove', 'Remove LUT')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Интенсивность LUT */}
      {selectedLUT !== 'none' && (
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label className="text-sm text-gray-300">
              {t('colorGrading.lut.intensity', 'LUT Intensity')}
            </Label>
            <span className="text-xs text-gray-400">{lutIntensity}%</span>
          </div>
          <div className="relative">
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={lutIntensity}
              onChange={(e) => setLutIntensity(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* Превью выбранного LUT */}
      {selectedLUT !== 'none' && (
        <div className="border-t border-gray-600 pt-4 mt-4">
          <div className="text-sm text-gray-400 mb-2">
            {t('colorGrading.lut.preview', 'Preview')}
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            {/* Оригинал */}
            <div className="text-center">
              <div className="w-full h-16 bg-gradient-to-r from-red-500 via-green-500 to-blue-500 rounded border border-gray-600" />
              <div className="text-xs text-gray-400 mt-1">
                {t('colorGrading.lut.original', 'Original')}
              </div>
            </div>
            
            {/* С LUT */}
            <div className="text-center">
              <div className="w-full h-16 bg-gradient-to-r from-orange-600 via-yellow-600 to-red-600 rounded border border-gray-600" />
              <div className="text-xs text-gray-400 mt-1">
                {t('colorGrading.lut.withLut', 'With LUT')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Поддерживаемые форматы */}
      <div className="text-xs text-gray-500 border-t border-gray-700 pt-3">
        {t('colorGrading.lut.supportedFormats', 'Supported formats')}: .cube, .3dl, .mga, .m3d
      </div>
    </div>
  )
}