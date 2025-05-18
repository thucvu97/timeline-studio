import { Lock, Unlock } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ASPECT_RATIOS,
  getDefaultResolutionForAspectRatio,
  getResolutionsForAspectRatio,
} from "@/features/project-settings/project-settings-machine"
import { useProjectSettings } from "@/features/project-settings/project-settings-provider"
import {
  type AspectRatio,
  type ColorSpace,
  type FrameRate,
} from "@/types/project"

import { useModal } from "../modals"

export function ProjectSettingsModal() {
  const { t } = useTranslation()
  const {
    frameRates,
    colorSpaces,
    availableResolutions,
    customWidth,
    customHeight,
    aspectRatioLocked,
    updateCustomWidth,
    updateCustomHeight,
    updateAspectRatioLocked,
    updateAvailableResolutions,
    updateAspectRatio,
    updateResolution,
    updateFrameRate,
    updateColorSpace,
    saveSettings,
    settings,
  } = useProjectSettings()
  const { closeModal } = useModal()

  // Функция для получения локализованного названия соотношения сторон
  const getAspectRatioLabel = (textLabel: string): string => {
    const labelMap: Record<string, string> = {
      Широкоэкнранный: t(
        "dialogs.projectSettings.aspectRatioLabels.widescreen",
      ),
      Портрет: t("dialogs.projectSettings.aspectRatioLabels.portrait"),
      "Социальные сети": t("dialogs.projectSettings.aspectRatioLabels.social"),
      Стандарт: t("dialogs.projectSettings.aspectRatioLabels.standard"),
      Вертикальный: t("dialogs.projectSettings.aspectRatioLabels.vertical"),
      Кинотеатр: t("dialogs.projectSettings.aspectRatioLabels.cinema"),
    }

    return labelMap[textLabel] || textLabel
  }

  // Функция для преобразования ширины и высоты в строку формата X:Y
  const getAspectRatioString = (width: number, height: number): string => {
    // Стандартные соотношения сторон
    if (Math.abs(width / height - 16 / 9) < 0.01) return "16:9"
    if (Math.abs(width / height - 9 / 16) < 0.01) return "9:16"
    if (Math.abs(width / height - 1) < 0.01) return "1:1"
    if (Math.abs(width / height - 4 / 3) < 0.01) return "4:3"
    if (Math.abs(width / height - 3 / 4) < 0.01) return "3:4"
    if (Math.abs(width / height - 4 / 5) < 0.01) return "4:5"
    if (Math.abs(width / height - 5 / 4) < 0.01) return "5:4"
    if (Math.abs(width / height - 21 / 9) < 0.01) return "21:9"

    // Находим наибольший общий делитель
    const gcd = (a: number, b: number): number => {
      return b === 0 ? a : gcd(b, a % b)
    }

    const divisor = gcd(width, height)
    const x = width / divisor
    const y = height / divisor

    // Если соотношение получается слишком сложным, возвращаем десятичную дробь с 2 знаками после запятой
    if (x > 30 || y > 30) {
      return (width / height).toFixed(2).replace(".", ":")
    }

    return `${Math.round(x)}:${Math.round(y)}`
  }

  // Функция для обновления соотношения сторон и автоматического обновления разрешения
  const handleAspectRatioChange = (value: string) => {
    console.log(
      "[ProjectSettingsDialog] Изменение соотношения сторон на:",
      value,
    )

    // Находим выбранное соотношение сторон в списке доступных
    const newAspectRatio = ASPECT_RATIOS.find((item) => item.label === value)

    if (!newAspectRatio) {
      console.error(
        "[ProjectSettingsDialog] Соотношение сторон не найдено:",
        value,
      )
      return
    }

    // Если выбрано пользовательское соотношение сторон, отключаем блокировку
    if (value === "custom" && aspectRatioLocked) {
      updateAspectRatioLocked(false)
    }

    if (value === "custom") {
      // Для пользовательского соотношения используем текущие значения ширины и высоты
      // Обновляем соотношение сторон напрямую
      updateAspectRatio({
        ...newAspectRatio,
        value: {
          ...newAspectRatio.value,
          width: customWidth,
          height: customHeight,
        },
      })

      // Обновляем разрешение
      updateResolution("custom")

      // Сохраняем настройки
      saveSettings()
    } else {
      // Для стандартных соотношений сторон
      // Получаем рекомендуемое разрешение
      const recommendedResolution = getDefaultResolutionForAspectRatio(value)

      // Обновляем доступные разрешения
      const newResolutions = getResolutionsForAspectRatio(value)
      updateAvailableResolutions(newResolutions)

      // Обновляем значения пользовательской ширины и высоты
      updateCustomWidth(recommendedResolution.width)
      updateCustomHeight(recommendedResolution.height)

      // Обновляем соотношение сторон напрямую
      updateAspectRatio({
        ...newAspectRatio,
        value: {
          ...newAspectRatio.value,
          width: recommendedResolution.width,
          height: recommendedResolution.height,
        },
      })

      // Обновляем разрешение
      updateResolution(recommendedResolution.value)

      // Сохраняем настройки
      saveSettings()
    }

    console.log("[ProjectSettingsDialog] Соотношение сторон изменено:", {
      aspectRatio: value,
      width: customWidth,
      height: customHeight,
    })
  }

  // Логируем текущие настройки перед рендерингом
  console.log("[ProjectSettingsDialog] Рендеринг с настройками:", {
    aspectRatio: settings.aspectRatio.label,
    resolution: settings.resolution,
    availableResolutions: availableResolutions.map((r) => r.value),
    resolutionExists: availableResolutions.some(
      (r) => r.value === settings.resolution,
    ),
  })

  return (
    <>
      <div className="flex flex-col space-y-6 py-1">
        <div className="flex items-center justify-end">
          <Label className="mr-2 text-xs">
            {t("dialogs.projectSettings.aspectRatio")}
          </Label>
          <Select
            value={settings.aspectRatio.label}
            onValueChange={handleAspectRatioChange}
          >
            <SelectTrigger className="w-[300px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="">
              {ASPECT_RATIOS.map((item: AspectRatio) => (
                <SelectItem key={item.label} value={item.label} className="">
                  {item.label === "custom"
                    ? t("dialogs.projectSettings.aspectRatioLabels.custom")
                    : `${item.label} ${item.textLabel ? `(${getAspectRatioLabel(item.textLabel)})` : ""}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-end">
          <Label className="mr-2 text-xs">
            {t("dialogs.projectSettings.resolution")}
          </Label>
          <Select
            value={settings.resolution}
            onValueChange={(value: string) => {
              console.log("[ProjectSettingsDialog] Выбрано разрешение:", value)

              // Для пользовательского соотношения сторон всегда используем пользовательское разрешение
              if (settings.aspectRatio.label === "custom") {
                updateResolution(value)
                saveSettings()
                return
              }

              // Находим выбранное разрешение в списке доступных
              const selectedResolution = availableResolutions.find(
                (res) => res.value === value,
              )

              if (!selectedResolution) {
                console.error(
                  "[ProjectSettingsDialog] Разрешение не найдено:",
                  value,
                )
                updateResolution(value)
                saveSettings()
                return
              }

              // Обновляем значения пользовательской ширины и высоты
              updateCustomWidth(selectedResolution.width)
              updateCustomHeight(selectedResolution.height)

              // Обновляем разрешение
              updateResolution(value)

              // Сохраняем настройки
              saveSettings()

              // Обновляем размеры в соотношении сторон
              updateAspectRatio({
                ...settings.aspectRatio,
                value: {
                  ...settings.aspectRatio.value,
                  width: selectedResolution.width,
                  height: selectedResolution.height,
                },
              })

              console.log("[ProjectSettingsDialog] Разрешение изменено:", {
                resolution: value,
                width: selectedResolution.width,
                height: selectedResolution.height,
              })
            }}
          >
            <SelectTrigger className="w-[300px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="">
              {availableResolutions.map((option) => {
                console.log("[ProjectSettingsDialog] Опция разрешения:", {
                  value: option.value,
                  label: option.label,
                  isSelected: option.value === settings.resolution,
                })
                return (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className=""
                  >
                    {option.label}
                  </SelectItem>
                )
              })}
              {settings.aspectRatio.label === "custom" && (
                <SelectItem value="custom" className="">
                  {t("dialogs.projectSettings.aspectRatioLabels.custom")}
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Поля для ввода ширины и высоты (всегда видимы) */}
        <div className="flex items-center justify-end">
          <Label className="mr-2 text-xs">
            {t("dialogs.projectSettings.customSize")}
          </Label>
          <div className="flex items-center">
            <Input
              type="number"
              value={customWidth}
              onChange={(e) => {
                const width = parseInt(e.target.value, 10)
                if (!isNaN(width) && width > 0) {
                  // Обновляем значение ширины
                  updateCustomWidth(width)

                  // Если соотношение сторон заблокировано, обновляем высоту пропорционально
                  if (
                    aspectRatioLocked &&
                    settings.aspectRatio.label !== "custom"
                  ) {
                    const aspectRatio =
                      settings.aspectRatio.value.width /
                      settings.aspectRatio.value.height
                    const newHeight = Math.round(width / aspectRatio)
                    updateCustomHeight(newHeight)

                    // Обновляем размеры в соотношении сторон
                    updateAspectRatio({
                      ...settings.aspectRatio,
                      value: {
                        ...settings.aspectRatio.value,
                        width,
                        height: newHeight,
                      },
                    })

                    // Обновляем разрешение
                    updateResolution(`${width}x${newHeight}`)

                    // Сохраняем настройки
                    saveSettings()
                  } else {
                    // Если соотношение сторон не заблокировано или пользовательское
                    // Обновляем размеры в соотношении сторон
                    updateAspectRatio({
                      ...settings.aspectRatio,
                      value: {
                        ...settings.aspectRatio.value,
                        width,
                      },
                    })

                    // Обновляем разрешение
                    updateResolution(`${width}x${customHeight}`)

                    // Сохраняем настройки
                    saveSettings()
                  }

                  console.log("[ProjectSettingsDialog] Ширина изменена:", {
                    width,
                    height: aspectRatioLocked
                      ? Math.round(
                          width /
                            (settings.aspectRatio.value.width /
                              settings.aspectRatio.value.height),
                        )
                      : customHeight,
                  })
                }
              }}
              className="w-20 text-center"
              min={320}
              max={7680}
            />
            <span className="mx-2 text-sm">x</span>
            <Input
              type="number"
              value={customHeight}
              onChange={(e) => {
                const height = parseInt(e.target.value, 10)
                if (!isNaN(height) && height > 0) {
                  // Обновляем значение высоты
                  updateCustomHeight(height)

                  // Если соотношение сторон заблокировано, обновляем ширину пропорционально
                  if (
                    aspectRatioLocked &&
                    settings.aspectRatio.label !== "custom"
                  ) {
                    const aspectRatio =
                      settings.aspectRatio.value.width /
                      settings.aspectRatio.value.height
                    const newWidth = Math.round(height * aspectRatio)
                    updateCustomWidth(newWidth)

                    // Обновляем размеры в соотношении сторон
                    updateAspectRatio({
                      ...settings.aspectRatio,
                      value: {
                        ...settings.aspectRatio.value,
                        width: newWidth,
                        height,
                      },
                    })

                    // Обновляем разрешение
                    updateResolution(`${newWidth}x${height}`)

                    // Сохраняем настройки
                    saveSettings()
                  } else {
                    // Если соотношение сторон не заблокировано или пользовательское
                    // Обновляем размеры в соотношении сторон
                    updateAspectRatio({
                      ...settings.aspectRatio,
                      value: {
                        ...settings.aspectRatio.value,
                        height,
                      },
                    })

                    // Обновляем разрешение
                    updateResolution(`${customWidth}x${height}`)

                    // Сохраняем настройки
                    saveSettings()
                  }

                  console.log("[ProjectSettingsDialog] Высота изменена:", {
                    width: aspectRatioLocked
                      ? Math.round(
                          height *
                            (settings.aspectRatio.value.width /
                              settings.aspectRatio.value.height),
                        )
                      : customWidth,
                    height,
                  })
                }
              }}
              className="w-20 text-center"
              min={240}
              max={4320}
            />
            {settings.aspectRatio.label !== "custom" && (
              <Button
                variant="ghost"
                size="icon"
                className={`ml-2 h-7 w-7 cursor-pointer p-0 ${aspectRatioLocked ? "text-[#00CCC0]" : "text-gray-400 hover:text-gray-200"}`}
                onClick={() => {
                  updateAspectRatioLocked(!aspectRatioLocked)
                  saveSettings()
                }}
                title={
                  aspectRatioLocked
                    ? t("dialogs.projectSettings.unlockAspectRatio")
                    : t("dialogs.projectSettings.lockAspectRatio")
                }
              >
                {aspectRatioLocked ? (
                  <Lock className="h-4 w-4" />
                ) : (
                  <Unlock className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-center">
          <div className="flex items-center text-xs text-gray-400">
            {settings.aspectRatio.label !== "custom" ? (
              aspectRatioLocked ? (
                <>
                  <Lock className="mr-1 h-3 w-3 text-[#00CCC0]" />
                  <span className="text-[#00CCC0]">
                    {t("dialogs.projectSettings.aspectRatioLocked", {
                      ratio: settings.aspectRatio.label,
                    })}
                  </span>
                </>
              ) : (
                <>
                  <Unlock className="mr-1 h-3 w-3" />
                  {t("dialogs.projectSettings.aspectRatioUnlocked", {
                    ratio: settings.aspectRatio.label,
                  })}
                </>
              )
            ) : (
              <>
                {t("dialogs.projectSettings.aspectRatioValue", {
                  ratio: getAspectRatioString(customWidth, customHeight),
                })}
              </>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end">
          <Label className="mr-2 text-xs">
            {t("dialogs.projectSettings.frameRate")}
          </Label>
          <Select
            value={settings.frameRate}
            onValueChange={(value: FrameRate) => {
              console.log(
                "[ProjectSettingsDialog] Выбрана частота кадров:",
                value,
              )
              updateFrameRate(value)
              saveSettings()
            }}
          >
            <SelectTrigger className="w-[300px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="">
              {frameRates.map((frameRate) => (
                <SelectItem
                  key={frameRate.value}
                  value={frameRate.value}
                  className=""
                >
                  {frameRate.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-end">
          <Label className="mr-2 text-xs">
            {t("dialogs.projectSettings.colorSpace")}
          </Label>
          <Select
            value={settings.colorSpace}
            onValueChange={(value: ColorSpace) => {
              console.log(
                "[ProjectSettingsDialog] Выбрано цветовое пространство:",
                value,
              )
              updateColorSpace(value)
              saveSettings()
            }}
          >
            <SelectTrigger className="w-[300px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="">
              {colorSpaces.map((colorSpace) => (
                <SelectItem
                  key={colorSpace.value}
                  value={colorSpace.value}
                  className=""
                >
                  {colorSpace.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter className="flex justify-center space-x-4">
        <Button
          variant="default"
          className="w-1/3 cursor-pointer bg-[#00CCC0] text-black hover:bg-[#00AAA0]"
          onClick={() => {
            // Сохраняем настройки в localStorage (на всякий случай)
            saveSettings()

            console.log("[ProjectSettingsDialog] Настройки сохранены")

            // Закрываем модальное окно
            closeModal()
          }}
        >
          {t("dialogs.projectSettings.ok")}
        </Button>
      </DialogFooter>
    </>
  )
}
