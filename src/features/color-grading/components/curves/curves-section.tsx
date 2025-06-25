import { useMemo, useState } from "react"

import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { CurveEditor, CurvePoint } from "./curve-editor"
import { useColorGrading } from "../../services/color-grading-provider"

// Цвета для разных типов кривых
const CURVE_COLORS = {
  master: "#ffffff",
  red: "#ef4444",
  green: "#22c55e",
  blue: "#3b82f6",
}

// Начальные точки для кривой (прямая линия)
const DEFAULT_CURVE_POINTS: CurvePoint[] = [
  { x: 0, y: 256, id: "start" },
  { x: 256, y: 0, id: "end" },
]

export function CurvesSection() {
  const { t } = useTranslation()
  const { state, dispatch } = useColorGrading()
  const [activeCurve, setActiveCurve] = useState<"master" | "red" | "green" | "blue">("master")

  // Получаем точки для активной кривой
  const activeCurvePoints = useMemo(() => {
    switch (activeCurve) {
      case "master":
        return state.masterCurve
      case "red":
        return state.redCurve
      case "green":
        return state.greenCurve
      case "blue":
        return state.blueCurve
      default:
        return state.masterCurve
    }
  }, [activeCurve, state])

  // Обработчик изменения точек кривой
  const handlePointsChange = (points: CurvePoint[]) => {
    dispatch({
      type: "UPDATE_CURVE",
      curve: activeCurve,
      points,
    })
  }

  // Сброс кривой к исходному состоянию
  const handleReset = () => {
    dispatch({
      type: "UPDATE_CURVE",
      curve: activeCurve,
      points: DEFAULT_CURVE_POINTS,
    })
  }

  // Автоматическая коррекция (простая S-кривая для контраста)
  const handleAuto = () => {
    const autoCurve: CurvePoint[] = [
      { x: 0, y: 256, id: "start" },
      { x: 64, y: 176, id: "shadows" },
      { x: 192, y: 80, id: "highlights" },
      { x: 256, y: 0, id: "end" },
    ]
    dispatch({
      type: "UPDATE_CURVE",
      curve: activeCurve,
      points: autoCurve,
    })
  }

  return (
    <div className="space-y-4" data-testid="curves-section">
      {/* Заголовок секции */}
      <div className="text-sm text-gray-400">
        {t("colorGrading.curves.description", "Fine-tune tonal response with interactive curves")}
      </div>

      {/* Переключатель типа кривой */}
      <Tabs
        value={activeCurve}
        onValueChange={(value) => setActiveCurve(value as typeof activeCurve)}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-4 bg-[#383838] border border-[#464647]">
          <TabsTrigger value="master" className="text-xs">
            {t("colorGrading.curves.master", "Master")}
          </TabsTrigger>
          <TabsTrigger value="red" className="text-xs text-red-400">
            {t("colorGrading.curves.red", "Red")}
          </TabsTrigger>
          <TabsTrigger value="green" className="text-xs text-green-400">
            {t("colorGrading.curves.green", "Green")}
          </TabsTrigger>
          <TabsTrigger value="blue" className="text-xs text-blue-400">
            {t("colorGrading.curves.blue", "Blue")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeCurve} className="mt-4">
          <div className="space-y-4">
            {/* Интерактивный редактор кривой */}
            <CurveEditor
              points={activeCurvePoints}
              onPointsChange={handlePointsChange}
              color={CURVE_COLORS[activeCurve]}
              className="w-full h-64"
            />

            {/* Кнопки управления */}
            <div className="flex justify-between">
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="text-xs h-7" onClick={handleReset}>
                  {t("colorGrading.curves.reset", "Reset")}
                </Button>
                <Button variant="ghost" size="sm" className="text-xs h-7" onClick={handleAuto}>
                  {t("colorGrading.curves.auto", "Auto")}
                </Button>
              </div>
              <div className="text-xs text-gray-400">
                {t("colorGrading.curves.hint", "Click to add points, drag to adjust")}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
