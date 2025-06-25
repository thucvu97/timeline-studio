import { useState } from "react"

import { ChevronDown, Palette } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

import { ColorWheelsSection } from "./color-wheels/color-wheels-section"
import { ColorGradingControls } from "./controls/color-grading-controls"
import { CurvesSection } from "./curves/curves-section"
import { HSLSection } from "./hsl/hsl-section"
import { LUTSection } from "./lut/lut-section"
import { ScopesSection } from "./scopes/scopes-section"
import { ColorGradingProvider } from "../services/color-grading-provider"

export interface ColorSettingsProps {
  className?: string
}

export function ColorSettings({ className }: ColorSettingsProps) {
  const { t } = useTranslation()
  
  // Состояние открытых секций (по умолчанию первичная коррекция открыта)
  const [openSections, setOpenSections] = useState({
    colorWheels: true,
    curves: false,
    hsl: false,
    lut: false,
    scopes: false
  })

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  return (
    <ColorGradingProvider>
      <div className={`color-grading-panel h-full flex flex-col ${className || ''}`} data-testid="color-settings">
        {/* Заголовок */}
        <div className="flex items-center gap-2 p-4 border-b bg-[#2D2D30]">
          <Palette className="h-5 w-5 text-blue-400" />
          <h2 className="text-lg font-semibold text-white">
            {t('colorGrading.title', 'Color Grading')}
          </h2>
        </div>

        {/* Прокручиваемое содержимое */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
        
          {/* 1. ОСНОВНЫЕ НАСТРОЙКИ - Color Wheels */}
          <Collapsible 
            open={openSections.colorWheels} 
            onOpenChange={() => toggleSection('colorWheels')}
          >
            <CollapsibleTrigger 
              className="flex items-center justify-between w-full p-3 bg-[#383838] hover:bg-[#404040] rounded-lg border border-[#464647] transition-colors"
              data-testid="color-wheels-trigger"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <h3 className="font-medium text-white">
                  {t('colorGrading.primaryCorrection', 'Primary Color Correction')}
                </h3>
              </div>
              <ChevronDown 
                className={`h-4 w-4 text-gray-400 transition-transform ${
                  openSections.colorWheels ? 'rotate-180' : ''
                }`} 
              />
            </CollapsibleTrigger>
          
            <CollapsibleContent className="mt-3">
              <div className="bg-[#2D2D30] rounded-lg border border-[#464647] p-4">
                <ColorWheelsSection />
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* 2. КРИВЫЕ */}
          <Collapsible 
            open={openSections.curves} 
            onOpenChange={() => toggleSection('curves')}
          >
            <CollapsibleTrigger 
              className="flex items-center justify-between w-full p-3 bg-[#383838] hover:bg-[#404040] rounded-lg border border-[#464647] transition-colors"
              data-testid="curves-trigger"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <h3 className="font-medium text-white">
                  {t('colorGrading.curves', 'Curves')}
                </h3>
              </div>
              <ChevronDown 
                className={`h-4 w-4 text-gray-400 transition-transform ${
                  openSections.curves ? 'rotate-180' : ''
                }`} 
              />
            </CollapsibleTrigger>
          
            <CollapsibleContent className="mt-3">
              <div className="bg-[#2D2D30] rounded-lg border border-[#464647] p-4">
                <CurvesSection />
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* 3. HSL КОРРЕКЦИЯ */}
          <Collapsible 
            open={openSections.hsl} 
            onOpenChange={() => toggleSection('hsl')}
          >
            <CollapsibleTrigger 
              className="flex items-center justify-between w-full p-3 bg-[#383838] hover:bg-[#404040] rounded-lg border border-[#464647] transition-colors"
              data-testid="hsl-trigger"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-400" />
                <h3 className="font-medium text-white">
                  {t('colorGrading.hslCorrection', 'HSL Correction')}
                </h3>
              </div>
              <ChevronDown 
                className={`h-4 w-4 text-gray-400 transition-transform ${
                  openSections.hsl ? 'rotate-180' : ''
                }`} 
              />
            </CollapsibleTrigger>
          
            <CollapsibleContent className="mt-3">
              <div className="bg-[#2D2D30] rounded-lg border border-[#464647] p-4">
                <HSLSection />
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* 4. LUT */}
          <Collapsible 
            open={openSections.lut} 
            onOpenChange={() => toggleSection('lut')}
          >
            <CollapsibleTrigger 
              className="flex items-center justify-between w-full p-3 bg-[#383838] hover:bg-[#404040] rounded-lg border border-[#464647] transition-colors"
              data-testid="lut-trigger"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-400" />
                <h3 className="font-medium text-white">
                  {t('colorGrading.lut', 'LUT')}
                </h3>
              </div>
              <ChevronDown 
                className={`h-4 w-4 text-gray-400 transition-transform ${
                  openSections.lut ? 'rotate-180' : ''
                }`} 
              />
            </CollapsibleTrigger>
          
            <CollapsibleContent className="mt-3">
              <div className="bg-[#2D2D30] rounded-lg border border-[#464647] p-4">
                <LUTSection />
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* 5. SCOPES */}
          <Collapsible 
            open={openSections.scopes} 
            onOpenChange={() => toggleSection('scopes')}
          >
            <CollapsibleTrigger 
              className="flex items-center justify-between w-full p-3 bg-[#383838] hover:bg-[#404040] rounded-lg border border-[#464647] transition-colors"
              data-testid="scopes-trigger"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <h3 className="font-medium text-white">
                  {t('colorGrading.scopes', 'Scopes')}
                </h3>
              </div>
              <ChevronDown 
                className={`h-4 w-4 text-gray-400 transition-transform ${
                  openSections.scopes ? 'rotate-180' : ''
                }`} 
              />
            </CollapsibleTrigger>
          
            <CollapsibleContent className="mt-3">
              <div className="bg-[#2D2D30] rounded-lg border border-[#464647] p-4">
                <ScopesSection />
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Нижние кнопки управления */}
        <div className="border-t border-[#464647] bg-[#2D2D30]">
          <ColorGradingControls />
        </div>
      </div>
    </ColorGradingProvider>
  )
}