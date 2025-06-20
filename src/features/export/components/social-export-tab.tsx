import { useState } from "react"

import { LogIn, Upload } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

import { SOCIAL_NETWORKS } from "../constants/export-constants"
import { useSocialExport } from "../hooks/use-social-export"
import { ExportProgress, SocialExportSettings } from "../types/export-types"

// Иконка YouTube
const YouTubeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-red-600">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
)

// Иконка TikTok
const TikTokIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-black">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.37 6.37 0 0 0-1-.09A6.35 6.35 0 0 0 3 15.64 6.35 6.35 0 0 0 9.37 22a6.35 6.35 0 0 0 6.35-6.35V8.44a8.28 8.28 0 0 0 4.83 1.52V6.69h-.96z" />
  </svg>
)

// Иконка Telegram
const TelegramIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-blue-500">
    <path d="M12 0a12 12 0 1 0 12 12A12 12 0 0 0 12 0zm5.568 8.16l-1.635 7.7c-.123.546-.447.679-.907.422l-2.503-1.845-1.208 1.163a.63.63 0 0 1-.5.247l.179-2.5 4.61-4.158c.2-.178-.044-.278-.31-.1L9.368 13.72l-2.463-.769c-.536-.167-.546-.536.112-.793l9.615-3.7c.448-.167.84.1.696.793z" />
  </svg>
)

interface SocialExportTabProps {
  settings: SocialExportSettings
  onSettingsChange: (updates: Partial<SocialExportSettings>) => void
  onExport: (socialNetwork: string) => void
  onCancelExport: () => void
  onClose: () => void
  isRendering: boolean
  renderProgress: ExportProgress | null
  hasProject: boolean
}

export function SocialExportTab({
  settings,
  onSettingsChange,
  onExport,
  onCancelExport,
  onClose,
  isRendering,
  renderProgress,
  hasProject,
}: SocialExportTabProps) {
  const { t } = useTranslation()
  const { loginToSocialNetwork, logoutFromSocialNetwork, validateSocialExport } = useSocialExport()

  const [selectedNetwork, setSelectedNetwork] = useState<string>(settings.socialNetwork || "youtube")
  const [loginStates, setLoginStates] = useState<Record<string, boolean>>({})

  // Обработчик входа в социальную сеть
  const handleLogin = async (networkId: string) => {
    try {
      const success = await loginToSocialNetwork(networkId)
      setLoginStates((prev) => ({ ...prev, [networkId]: success }))
      if (success) {
        onSettingsChange({
          socialNetwork: networkId,
          isLoggedIn: true,
        })
      }
    } catch (error) {
      console.error(`Login to ${networkId} failed:`, error)
    }
  }

  // Обработчик выхода из социальной сети
  const handleLogout = async (networkId: string) => {
    try {
      await logoutFromSocialNetwork(networkId)
      setLoginStates((prev) => ({ ...prev, [networkId]: false }))
      onSettingsChange({ isLoggedIn: false })
    } catch (error) {
      console.error(`Logout from ${networkId} failed:`, error)
    }
  }

  // Обработчик экспорта в социальную сеть
  const handleSocialExport = async () => {
    if (!selectedNetwork) return

    try {
      // Сначала проверяем видео
      const validation = validateSocialExport(settings)
      if (!validation.valid) {
        console.warn("Video validation failed:", validation.error)
        // Показать ошибки валидации пользователю
        return
      }

      // Запускаем экспорт
      onExport(selectedNetwork)
    } catch (error) {
      console.error("Social export failed:", error)
    }
  }

  // Получение иконки для социальной сети
  const getSocialIcon = (networkId: string) => {
    switch (networkId) {
      case "youtube":
        return <YouTubeIcon />
      case "tiktok":
        return <TikTokIcon />
      case "telegram":
        return <TelegramIcon />
      default:
        return <Upload className="h-5 w-5" />
    }
  }

  // Получение сети по ID
  const getNetworkById = (id: string) => SOCIAL_NETWORKS.find((n) => n.id === id)
  const selectedNetworkData = getNetworkById(selectedNetwork)

  return (
    <div className="space-y-6" data-testid="social-export-tab">
      {/* Выбор социальной сети */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {SOCIAL_NETWORKS.map((network) => {
          const isLoggedIn = loginStates[network.id] || false
          const isSelected = selectedNetwork === network.id

          return (
            <Card
              key={network.id}
              className={`cursor-pointer transition-all ${isSelected ? "ring-2 ring-primary border-primary" : ""}`}
              onClick={() => setSelectedNetwork(network.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getSocialIcon(network.id)}
                    <CardTitle className="text-lg">{network.name}</CardTitle>
                  </div>
                  {isLoggedIn && <div className="w-2 h-2 bg-green-500 rounded-full" />}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <CardDescription>
                  Max: {network.maxResolution} • {network.maxFps}fps
                </CardDescription>

                {isSelected && (
                  <div className="space-y-3">
                    {!isLoggedIn ? (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation()
                          void handleLogin(network.id)
                        }}
                        className="w-full"
                        size="sm"
                        data-testid="social-login-button"
                      >
                        <LogIn className="h-4 w-4 mr-2" />
                        {t("dialogs.export.login")}
                      </Button>
                    ) : (
                      <div className="space-y-2">
                        <div className="text-sm text-green-600 font-medium">{t("dialogs.export.loggedIn")}</div>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            void handleLogout(network.id)
                          }}
                          variant="outline"
                          size="sm"
                          className="w-full"
                        >
                          {t("dialogs.export.logout")}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Настройки выбранной сети */}
      {selectedNetworkData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              {getSocialIcon(selectedNetwork)}
              {t("dialogs.export.uploadSettings", { platform: selectedNetworkData.name })}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Название видео */}
            <div className="space-y-2">
              <Label>{t("dialogs.export.videoTitle")}</Label>
              <Input
                placeholder={t("dialogs.export.enterTitle")}
                value={settings.title || ""}
                onChange={(e) => onSettingsChange({ title: e.target.value })}
                disabled={isRendering}
              />
            </div>

            {/* Описание */}
            <div className="space-y-2">
              <Label>{t("dialogs.export.description")}</Label>
              <Textarea
                placeholder={t("dialogs.export.enterDescription")}
                value={settings.description || ""}
                onChange={(e) => onSettingsChange({ description: e.target.value })}
                disabled={isRendering}
                rows={3}
              />
            </div>

            {/* Приватность */}
            <div className="space-y-2">
              <Label>{t("dialogs.export.privacy")}</Label>
              <Select
                value={settings.privacy || "public"}
                onValueChange={(value) => onSettingsChange({ privacy: value as any })}
                disabled={isRendering}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">{t("dialogs.export.public")}</SelectItem>
                  <SelectItem value="unlisted">{t("dialogs.export.unlisted")}</SelectItem>
                  <SelectItem value="private">{t("dialogs.export.private")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Теги (только для YouTube) */}
            {selectedNetwork === "youtube" && (
              <div className="space-y-2">
                <Label>{t("dialogs.export.tags")}</Label>
                <Input
                  placeholder={t("dialogs.export.enterTags")}
                  value={settings.tags?.join(", ") || ""}
                  onChange={(e) =>
                    onSettingsChange({
                      tags: e.target.value
                        .split(",")
                        .map((tag) => tag.trim())
                        .filter(Boolean),
                    })
                  }
                  disabled={isRendering}
                />
              </div>
            )}

            {/* Категория (только для YouTube) */}
            {selectedNetwork === "youtube" && (
              <div className="space-y-2">
                <Label>{t("dialogs.export.category")}</Label>
                <Select
                  value={settings.category || "22"}
                  onValueChange={(value) => onSettingsChange({ category: value })}
                  disabled={isRendering}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="22">People & Blogs</SelectItem>
                    <SelectItem value="24">Entertainment</SelectItem>
                    <SelectItem value="25">News & Politics</SelectItem>
                    <SelectItem value="26">Howto & Style</SelectItem>
                    <SelectItem value="27">Education</SelectItem>
                    <SelectItem value="28">Science & Technology</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Канал (только для Telegram) */}
            {selectedNetwork === "telegram" && (
              <div className="space-y-2">
                <Label>{t("dialogs.export.channel")}</Label>
                <Input
                  placeholder={t("dialogs.export.enterChannelId")}
                  value={settings.channelId || ""}
                  onChange={(e) => onSettingsChange({ channelId: e.target.value })}
                  disabled={isRendering}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Прогресс загрузки */}
      {isRendering && renderProgress && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>{t("dialogs.export.uploadProgress")}</span>
                <span>{Math.round(renderProgress.percentage)}%</span>
              </div>
              <Progress value={renderProgress.percentage} className="h-2" />
              {renderProgress.message && <div className="text-xs text-muted-foreground">{renderProgress.message}</div>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Кнопки управления */}
      <div className="flex gap-2 pt-4 border-t">
        {isRendering ? (
          <>
            <Button variant="outline" onClick={onCancelExport} className="flex-1">
              {t("dialogs.export.cancel")}
            </Button>
            <Button disabled className="flex-1">
              {t("dialogs.export.uploading")}...
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={onClose} className="flex-1">
              {t("dialogs.export.close")}
            </Button>
            <Button
              onClick={handleSocialExport}
              disabled={!hasProject || !loginStates[selectedNetwork]}
              className="flex-1 bg-[#00CCC0] hover:bg-[#00B8B0] text-black"
              data-testid="social-export-button"
            >
              <Upload className="h-4 w-4 mr-2" />
              {t("dialogs.export.uploadTo", { platform: selectedNetworkData?.name })}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
