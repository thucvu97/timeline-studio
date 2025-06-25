import { useState } from "react"

import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function ScopesSection() {
  const { t } = useTranslation()
  const [activeScope, setActiveScope] = useState<'waveform' | 'vectorscope' | 'histogram'>('waveform')
  const [scopesEnabled, setScopesEnabled] = useState(true)

  return (
    <div className="space-y-4" data-testid="scopes-section">
      {/* Заголовок секции */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-400">
          {t('colorGrading.scopes.description', 'Real-time analysis of color and exposure')}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">
            {t('colorGrading.scopes.enabled', 'Enabled')}
          </span>
          <Switch 
            checked={scopesEnabled} 
            onCheckedChange={setScopesEnabled}
            className="scale-75"
          />
        </div>
      </div>

      {scopesEnabled && (
        <>
          {/* Переключатель типа scope */}
          <Tabs value={activeScope} onValueChange={(value) => setActiveScope(value as typeof activeScope)} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-[#383838] border border-[#464647]">
              <TabsTrigger value="waveform" className="text-xs">
                {t('colorGrading.scopes.waveform', 'Waveform')}
              </TabsTrigger>
              <TabsTrigger value="vectorscope" className="text-xs">
                {t('colorGrading.scopes.vectorscope', 'Vectorscope')}
              </TabsTrigger>
              <TabsTrigger value="histogram" className="text-xs">
                {t('colorGrading.scopes.histogram', 'Histogram')}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="waveform" className="mt-4">
              <div className="space-y-3">
                {/* Waveform display */}
                <div className="w-full h-32 bg-black rounded border border-gray-600 relative overflow-hidden">
                  <svg className="w-full h-full" viewBox="0 0 256 128">
                    {/* Сетка */}
                    <defs>
                      <pattern id="waveform-grid" width="32" height="16" patternUnits="userSpaceOnUse">
                        <path d="M 32 0 L 0 0 0 16" fill="none" stroke="#333" strokeWidth="1"/>
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#waveform-grid)" />
                    
                    {/* Симуляция waveform данных */}
                    <path d="M 0 100 Q 64 80 128 90 Q 192 70 256 85" stroke="#22c55e" strokeWidth="1" fill="none" opacity="0.8" />
                    <path d="M 0 110 Q 64 90 128 100 Q 192 80 256 95" stroke="#ef4444" strokeWidth="1" fill="none" opacity="0.8" />
                    <path d="M 0 120 Q 64 100 128 110 Q 192 90 256 105" stroke="#3b82f6" strokeWidth="1" fill="none" opacity="0.8" />
                  </svg>
                  
                  {/* Уровни */}
                  <div className="absolute right-2 top-2 text-xs text-gray-400 space-y-1">
                    <div>100%</div>
                    <div className="mt-4">75%</div>
                    <div className="mt-4">50%</div>
                    <div className="mt-4">25%</div>
                    <div className="mt-4">0%</div>
                  </div>
                </div>
                
                <div className="text-xs text-gray-500">
                  {t('colorGrading.scopes.waveformHint', 'Shows luminance distribution across the image')}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="vectorscope" className="mt-4">
              <div className="space-y-3">
                {/* Vectorscope display */}
                <div className="w-full h-32 bg-black rounded border border-gray-600 relative overflow-hidden flex items-center justify-center">
                  <svg width="120" height="120" viewBox="0 0 120 120">
                    {/* Круговая сетка */}
                    <circle cx="60" cy="60" r="50" fill="none" stroke="#333" strokeWidth="1" />
                    <circle cx="60" cy="60" r="30" fill="none" stroke="#333" strokeWidth="1" />
                    <circle cx="60" cy="60" r="10" fill="none" stroke="#333" strokeWidth="1" />
                    
                    {/* Цветовые маркеры */}
                    <circle cx="60" cy="10" r="2" fill="#ef4444" />  {/* Red */}
                    <circle cx="103" cy="45" r="2" fill="#eab308" /> {/* Yellow */}
                    <circle cx="103" cy="75" r="2" fill="#22c55e" /> {/* Green */}
                    <circle cx="60" cy="110" r="2" fill="#06b6d4" /> {/* Cyan */}
                    <circle cx="17" cy="75" r="2" fill="#3b82f6" />  {/* Blue */}
                    <circle cx="17" cy="45" r="2" fill="#8b5cf6" />  {/* Magenta */}
                    
                    {/* Центральная точка */}
                    <circle cx="60" cy="60" r="1" fill="white" />
                    
                    {/* Симуляция точек данных */}
                    <circle cx="65" cy="55" r="1" fill="#22c55e" opacity="0.6" />
                    <circle cx="58" cy="62" r="1" fill="#ef4444" opacity="0.6" />
                    <circle cx="62" cy="58" r="1" fill="#3b82f6" opacity="0.6" />
                  </svg>
                </div>
                
                <div className="text-xs text-gray-500">
                  {t('colorGrading.scopes.vectorscopeHint', 'Shows color saturation and hue distribution')}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="histogram" className="mt-4">
              <div className="space-y-3">
                {/* Histogram display */}
                <div className="w-full h-32 bg-black rounded border border-gray-600 relative overflow-hidden">
                  <svg className="w-full h-full" viewBox="0 0 256 128">
                    {/* Симуляция histogram данных */}
                    {Array.from({ length: 64 }).map((_, i) => {
                      const height = Math.random() * 80 + 10
                      return (
                        <g key={i}>
                          <rect x={i * 4} y={128 - height} width="1" height={height} fill="#ef4444" opacity="0.8" />
                          <rect x={i * 4 + 1} y={128 - height * 0.8} width="1" height={height * 0.8} fill="#22c55e" opacity="0.8" />
                          <rect x={i * 4 + 2} y={128 - height * 0.6} width="1" height={height * 0.6} fill="#3b82f6" opacity="0.8" />
                        </g>
                      )
                    })}
                  </svg>
                  
                  {/* Уровни */}
                  <div className="absolute bottom-2 left-2 right-2 flex justify-between text-xs text-gray-400">
                    <span>0</span>
                    <span>128</span>
                    <span>255</span>
                  </div>
                </div>
                
                <div className="text-xs text-gray-500">
                  {t('colorGrading.scopes.histogramHint', 'Shows tonal distribution for RGB channels')}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Настройки scopes */}
          <div className="border-t border-gray-600 pt-3 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">
                {t('colorGrading.scopes.refreshRate', 'Refresh Rate')}
              </span>
              <span className="text-gray-300">30 FPS</span>
            </div>
            
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="text-xs h-6 px-2">
                {t('colorGrading.scopes.settings', 'Settings')}
              </Button>
              <Button variant="ghost" size="sm" className="text-xs h-6 px-2">
                {t('colorGrading.scopes.fullscreen', 'Fullscreen')}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}