import React from "react"

import { Activity, Database, HardDrive, Loader2, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

import { formatCacheRatio, useCacheStats } from "../hooks/use-cache-stats"

interface CacheStatsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CacheStatsDialog({ open, onOpenChange }: CacheStatsDialogProps) {
  const { t } = useTranslation()
  const { stats, isLoading, error, refreshStats, clearPreviewCache, clearAllCache } = useCacheStats()

  const handleClearPreviewCache = async () => {
    const confirmed = window.confirm(t("videoCompiler.cache.confirmClearPreview"))
    if (confirmed) {
      await clearPreviewCache()
    }
  }

  const handleClearAllCache = async () => {
    const confirmed = window.confirm(t("videoCompiler.cache.confirmClearAll"))
    if (confirmed) {
      await clearAllCache()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            {t("videoCompiler.cache.statistics")}
          </DialogTitle>
          <DialogDescription>{t("videoCompiler.cache.management")}</DialogDescription>
        </DialogHeader>

        {isLoading && !stats ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center p-8">
            <p className="text-sm text-destructive">{error}</p>
            <Button onClick={refreshStats} variant="outline" size="sm" className="mt-4">
              {t("videoCompiler.cache.retry")}
            </Button>
          </div>
        ) : stats ? (
          <div className="space-y-4">
            {/* Общая статистика */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  {t("videoCompiler.cache.overallEfficiency")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t("videoCompiler.cache.hitRate")}:</span>
                    <Badge variant={stats.hit_ratio > 0.7 ? "default" : "secondary"}>
                      {formatCacheRatio(stats.hit_ratio)}
                    </Badge>
                  </div>
                  <Progress value={stats.hit_ratio * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Детальная статистика */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Превью */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">{t("videoCompiler.cache.preview")}</CardTitle>
                  <CardDescription className="text-xs">{t("videoCompiler.cache.previewDescription")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{t("videoCompiler.cache.hits")}:</span>
                    <span className="text-green-600">{stats.preview_hits}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{t("videoCompiler.cache.misses")}:</span>
                    <span className="text-orange-600">{stats.preview_misses}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">{t("videoCompiler.cache.efficiency")}:</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs",
                        stats.preview_hit_ratio > 0.7 && "border-green-600 text-green-600",
                        stats.preview_hit_ratio <= 0.7 &&
                          stats.preview_hit_ratio > 0.4 &&
                          "border-yellow-600 text-yellow-600",
                        stats.preview_hit_ratio <= 0.4 && "border-red-600 text-red-600",
                      )}
                    >
                      {formatCacheRatio(stats.preview_hit_ratio)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Метаданные */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">{t("videoCompiler.cache.metadata")}</CardTitle>
                  <CardDescription className="text-xs">{t("videoCompiler.cache.metadataDescription")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{t("videoCompiler.cache.hits")}:</span>
                    <span className="text-green-600">{stats.metadata_hits}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{t("videoCompiler.cache.misses")}:</span>
                    <span className="text-orange-600">{stats.metadata_misses}</span>
                  </div>
                  <Separator className="my-2" />
                  {stats.memory_usage && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium">{t("videoCompiler.cache.memory")}:</span>
                      <Badge variant="outline" className="text-xs">
                        {stats.memory_usage.total_bytes
                          ? `${(stats.memory_usage.total_bytes / (1024 * 1024)).toFixed(1)} MB`
                          : "0 MB"}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Действия */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <HardDrive className="h-4 w-4" />
                  {t("videoCompiler.cache.cacheManagement")}
                </CardTitle>
                <CardDescription>{t("videoCompiler.cache.cacheManagementDescription")}</CardDescription>
              </CardHeader>
              <CardContent className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearPreviewCache}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  {t("videoCompiler.cache.clearPreview")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearAllCache}
                  className="flex items-center gap-2 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  {t("videoCompiler.cache.clearAll")}
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={refreshStats} disabled={isLoading} className="flex items-center gap-2">
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("videoCompiler.cache.refresh")}
          </Button>
          <Button onClick={() => onOpenChange(false)}>{t("videoCompiler.cache.close")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
