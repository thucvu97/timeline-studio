import { useEffect, useState } from "react"

import { Clock, Flag, Scissors, Video } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTimeline } from "@/features/timeline/hooks/use-timeline"

import type { ExportSettings } from "../types/export-types"

interface SectionExportTabProps {
  defaultSettings: ExportSettings
  onExport: (settings: ExportSettings & { sections: ExportSection[] }) => void
}

interface ExportSection {
  id: string
  name: string
  startTime: number
  endTime: number
  includeInExport: boolean
  customFileName?: string
  customSettings?: Partial<ExportSettings>
}

interface TimeMarker {
  id: string
  name: string
  time: number
  type: "start" | "end" | "marker"
}

export function SectionExportTab({ defaultSettings, onExport }: SectionExportTabProps) {
  const { t } = useTranslation()
  const { project } = useTimeline()
  const [exportMode, setExportMode] = useState<"markers" | "manual" | "clips">("markers")
  const [sections, setSections] = useState<ExportSection[]>([])
  const [manualStart, setManualStart] = useState("00:00:00")
  const [manualEnd, setManualEnd] = useState("00:00:10")
  const [selectedQuality, setSelectedQuality] = useState<"preview" | "draft" | "final">("final")

  // Convert markers to sections
  useEffect(() => {
    if (exportMode === "markers") {
      // TODO: Implement markers functionality when TimelineProject supports markers
      // For now, create a demo section
      const markerSections: ExportSection[] = [
        {
          id: "demo-1",
          name: "Demo Section 1",
          startTime: 0,
          endTime: 30,
          includeInExport: true,
        },
      ]
      setSections(markerSections)
    }
  }, [exportMode])

  // Convert clips to sections
  useEffect(() => {
    if (exportMode === "clips") {
      // TODO: Implement clips functionality when TimelineProject supports tracks/clips
      // For now, create demo sections
      const clipSections: ExportSection[] = [
        {
          id: "clip-1",
          name: "Demo Clip 1",
          startTime: 0,
          endTime: 15,
          includeInExport: true,
        },
        {
          id: "clip-2",
          name: "Demo Clip 2", 
          startTime: 15,
          endTime: 30,
          includeInExport: true,
        },
      ]
      setSections(clipSections)
    }
  }, [exportMode])

  const handleToggleSection = (sectionId: string) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId ? { ...section, includeInExport: !section.includeInExport } : section,
      ),
    )
  }

  const handleSelectAll = () => {
    const allSelected = sections.every((s) => s.includeInExport)
    setSections((prev) => prev.map((section) => ({ ...section, includeInExport: !allSelected })))
  }

  const handleUpdateSectionName = (sectionId: string, name: string) => {
    setSections((prev) =>
      prev.map((section) => (section.id === sectionId ? { ...section, customFileName: name } : section)),
    )
  }

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const parseTime = (timeStr: string): number => {
    const parts = timeStr.split(":").map((p) => Number.parseInt(p) || 0)
    return parts[0] * 3600 + parts[1] * 60 + parts[2]
  }

  const handleManualSection = () => {
    const startSeconds = parseTime(manualStart)
    const endSeconds = parseTime(manualEnd)

    if (startSeconds < endSeconds) {
      setSections([
        {
          id: "manual-1",
          name: "Manual Section",
          startTime: startSeconds,
          endTime: endSeconds,
          includeInExport: true,
        },
      ])
    }
  }

  const getQualitySettings = (): Partial<ExportSettings> => {
    switch (selectedQuality) {
      case "preview":
        return {
          resolution: "720",
          bitrate: 2000,
          bitrateMode: "vbr",
          quality: "normal",
        }
      case "draft":
        return {
          resolution: "1080",
          bitrate: 5000,
          bitrateMode: "vbr",
          quality: "good",
        }
      case "final":
      default:
        return defaultSettings
    }
  }

  const handleStartExport = () => {
    const selectedSections = sections.filter((s) => s.includeInExport)
    const qualitySettings = getQualitySettings()

    onExport({
      ...defaultSettings,
      ...qualitySettings,
      sections: selectedSections,
    })
  }

  const selectedCount = sections.filter((s) => s.includeInExport).length

  return (
    <div className="space-y-4">
      {/* Export Mode Selection */}
      <Card>
        <CardHeader>
          <CardTitle>{t("export.sections.exportMode")}</CardTitle>
          <CardDescription>{t("export.sections.exportModeDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={exportMode}
            onValueChange={(value) => setExportMode(value as "markers" | "manual" | "clips")}
          >
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="markers" id="markers" />
                <Label htmlFor="markers" className="flex items-center gap-2 cursor-pointer">
                  <Flag className="h-4 w-4" />
                  {t("export.sections.byMarkers")}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="clips" id="clips" />
                <Label htmlFor="clips" className="flex items-center gap-2 cursor-pointer">
                  <Video className="h-4 w-4" />
                  {t("export.sections.byClips")}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="manual" id="manual" />
                <Label htmlFor="manual" className="flex items-center gap-2 cursor-pointer">
                  <Scissors className="h-4 w-4" />
                  {t("export.sections.manual")}
                </Label>
              </div>
            </div>
          </RadioGroup>

          {/* Manual Time Input */}
          {exportMode === "manual" && (
            <div className="mt-4 space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("export.sections.startTime")}</Label>
                  <Input value={manualStart} onChange={(e) => setManualStart(e.target.value)} placeholder="00:00:00" />
                </div>
                <div className="space-y-2">
                  <Label>{t("export.sections.endTime")}</Label>
                  <Input value={manualEnd} onChange={(e) => setManualEnd(e.target.value)} placeholder="00:00:10" />
                </div>
              </div>
              <Button onClick={handleManualSection} size="sm" className="w-full">
                {t("export.sections.createSection")}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quality Settings */}
      <Card>
        <CardHeader>
          <CardTitle>{t("export.sections.qualityPreset")}</CardTitle>
          <CardDescription>{t("export.sections.qualityPresetDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedQuality}
            onValueChange={(value) => setSelectedQuality(value as "preview" | "draft" | "final")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="preview">
                <div>
                  <div className="font-medium">{t("export.sections.preview")}</div>
                  <div className="text-xs text-muted-foreground">720p, Low bitrate, Fast encoding</div>
                </div>
              </SelectItem>
              <SelectItem value="draft">
                <div>
                  <div className="font-medium">{t("export.sections.draft")}</div>
                  <div className="text-xs text-muted-foreground">1080p, Medium quality</div>
                </div>
              </SelectItem>
              <SelectItem value="final">
                <div>
                  <div className="font-medium">{t("export.sections.final")}</div>
                  <div className="text-xs text-muted-foreground">Full quality, project settings</div>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Sections List */}
      {sections.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t("export.sections.sections")}</CardTitle>
                <CardDescription>
                  {t("export.sections.selectedCount", { selected: selectedCount, total: sections.length })}
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                {sections.every((s) => s.includeInExport)
                  ? t("export.sections.deselectAll")
                  : t("export.sections.selectAll")}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {sections.map((section) => (
                  <div
                    key={section.id}
                    className="flex items-center space-x-3 p-3 border rounded-md hover:bg-accent/50"
                  >
                    <Checkbox
                      checked={section.includeInExport}
                      onCheckedChange={() => handleToggleSection(section.id)}
                    />

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <Input
                          value={section.customFileName || section.name}
                          onChange={(e) => handleUpdateSectionName(section.id, e.target.value)}
                          className="h-7 text-sm"
                          placeholder={t("export.sections.fileName")}
                        />
                        <div className="flex items-center gap-2 text-sm text-muted-foreground ml-2">
                          <Clock className="h-3 w-3" />
                          <span>
                            {formatTime(section.startTime)} - {formatTime(section.endTime)}
                          </span>
                        </div>
                      </div>

                      <div className="text-xs text-muted-foreground">
                        {t("export.sections.duration", {
                          duration: formatTime(section.endTime - section.startTime),
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Export Actions */}
      <div className="flex justify-end gap-2">
        <Button onClick={handleStartExport} disabled={selectedCount === 0}>
          {t("export.sections.exportSections", { count: selectedCount })}
        </Button>
      </div>
    </div>
  )
}
