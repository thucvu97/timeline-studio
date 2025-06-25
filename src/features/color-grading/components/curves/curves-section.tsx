import { useState } from "react"

import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function CurvesSection() {
  const { t } = useTranslation()
  const [activeCurve, setActiveCurve] = useState<'master' | 'red' | 'green' | 'blue'>('master')

  return (
    <div className="space-y-4" data-testid="curves-section">
      {/* Заголовок секции */}
      <div className="text-sm text-gray-400">
        {t('colorGrading.curves.description', 'Fine-tune tonal response with interactive curves')}
      </div>

      {/* Переключатель типа кривой */}
      <Tabs value={activeCurve} onValueChange={(value) => setActiveCurve(value as typeof activeCurve)} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-[#383838] border border-[#464647]">
          <TabsTrigger value="master" className="text-xs">
            {t('colorGrading.curves.master', 'Master')}
          </TabsTrigger>
          <TabsTrigger value="red" className="text-xs text-red-400">
            {t('colorGrading.curves.red', 'Red')}
          </TabsTrigger>
          <TabsTrigger value="green" className="text-xs text-green-400">
            {t('colorGrading.curves.green', 'Green')}
          </TabsTrigger>
          <TabsTrigger value="blue" className="text-xs text-blue-400">
            {t('colorGrading.curves.blue', 'Blue')}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeCurve} className="mt-4">
          <div className="space-y-4">
            {/* SVG график кривой */}
            <div className="w-full h-32 bg-gray-900 rounded border border-gray-600 relative">
              <svg className="w-full h-full" viewBox="0 0 256 128">
                {/* Сетка */}
                <defs>
                  <pattern id="grid" width="25.6" height="12.8" patternUnits="userSpaceOnUse">
                    <path d="M 25.6 0 L 0 0 0 12.8" fill="none" stroke="gray" strokeWidth="0.5" opacity="0.3"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
                
                {/* Диагональная линия (базовая кривая) */}
                <path 
                  d="M 0 128 L 256 0" 
                  stroke={activeCurve === 'master' ? 'white' : 
                    activeCurve === 'red' ? '#ef4444' : 
                      activeCurve === 'green' ? '#22c55e' : '#3b82f6'} 
                  strokeWidth="2" 
                  fill="none" 
                />
                
                {/* Интерактивные точки кривой */}
                <circle 
                  cx="64" 
                  cy="96" 
                  r="4" 
                  fill="white" 
                  stroke={activeCurve === 'master' ? 'white' : 
                    activeCurve === 'red' ? '#ef4444' : 
                      activeCurve === 'green' ? '#22c55e' : '#3b82f6'} 
                  strokeWidth="2" 
                  className="cursor-pointer hover:r-5 transition-all" 
                />
                <circle 
                  cx="192" 
                  cy="32" 
                  r="4" 
                  fill="white" 
                  stroke={activeCurve === 'master' ? 'white' : 
                    activeCurve === 'red' ? '#ef4444' : 
                      activeCurve === 'green' ? '#22c55e' : '#3b82f6'} 
                  strokeWidth="2" 
                  className="cursor-pointer hover:r-5 transition-all" 
                />
              </svg>
            </div>
            
            {/* Кнопки управления */}
            <div className="flex justify-between">
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="text-xs h-7">
                  {t('colorGrading.curves.reset', 'Reset')}
                </Button>
                <Button variant="ghost" size="sm" className="text-xs h-7">
                  {t('colorGrading.curves.auto', 'Auto')}
                </Button>
              </div>
              <div className="text-xs text-gray-400">
                {t('colorGrading.curves.hint', 'Click to add points, drag to adjust')}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}