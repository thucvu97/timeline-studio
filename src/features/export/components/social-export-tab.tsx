import { useEffect, useState } from "react"

import Image from "next/image"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

import { SOCIAL_NETWORKS } from "../constants/export-constants"
import { useSocialExport } from "../hooks/use-social-export"
import { SocialExportSettings } from "../types/export-types"

interface SocialExportTabProps {
  settings: SocialExportSettings
  onSettingsChange: (updates: Partial<SocialExportSettings>) => void
  onExport: () => void
  isRendering: boolean
}

export function SocialExportTab({ settings, onSettingsChange, onExport, isRendering }: SocialExportTabProps) {
  const { t } = useTranslation()
  const [showExportForm, setShowExportForm] = useState(false)

  const {
    loginToSocialNetwork,
    logoutFromSocialNetwork,
    isLoggedIn,
    getUserInfo,
    getOptimalSettings,
    uploadProgress,
    isUploading,
  } = useSocialExport()

  const selectedNetwork = SOCIAL_NETWORKS.find((n) => n.id === settings.socialNetwork)

  const handleLogin = async () => {
    const success = await loginToSocialNetwork(settings.socialNetwork)
    if (success) {
      const updatedUserInfo = getUserInfo(settings.socialNetwork)
      onSettingsChange({
        isLoggedIn: true,
        accountName: updatedUserInfo?.name || updatedUserInfo?.display_name || `user@${settings.socialNetwork}.com`,
      })
      setShowExportForm(true)
    }
  }

  const handleLogout = () => {
    void logoutFromSocialNetwork(settings.socialNetwork)
    onSettingsChange({
      isLoggedIn: false,
      accountName: undefined,
    })
    setShowExportForm(false)
  }

  const handleNetworkChange = (networkId: string) => {
    const optimalSettings = getOptimalSettings(networkId)
    onSettingsChange({
      socialNetwork: networkId,
      ...optimalSettings,
    })
  }

  // Синхронизируем состояние авторизации при изменении сети
  useEffect(() => {
    const checkAuthStatus = async () => {
      const loggedIn = await isLoggedIn(settings.socialNetwork)
      const info = getUserInfo(settings.socialNetwork)

      if (loggedIn !== settings.isLoggedIn) {
        onSettingsChange({
          isLoggedIn: loggedIn,
          accountName:
            info?.name || info?.display_name || (loggedIn ? `user@${settings.socialNetwork}.com` : undefined),
        })
      }
    }

    void checkAuthStatus()
  }, [settings.socialNetwork, isLoggedIn, getUserInfo, onSettingsChange, settings.isLoggedIn])

  return (
    <div className="grid grid-cols-[250px,1fr] gap-6">
      <div className="space-y-2">
        {SOCIAL_NETWORKS.map((network) => (
          <div
            key={network.id}
            className={`flex cursor-pointer items-center gap-2 rounded p-2 ${
              settings.socialNetwork === network.id ? "bg-accent" : "hover:bg-accent"
            }`}
            onClick={() => handleNetworkChange(network.id)}
          >
            <Image src={network.icon} width={24} height={24} className="h-6 w-6" alt={network.name} />
            <div>
              <div>{t(`dialogs.export.${network.id}`)}</div>
              <div className="text-muted-foreground text-xs">
                {settings.socialNetwork === network.id && settings.isLoggedIn
                  ? settings.accountName
                  : t("dialogs.export.notLoggedIn")}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center">
        {!settings.isLoggedIn ? (
          <div className="space-y-4 text-center">
            <Image
              src={selectedNetwork?.icon || ""}
              width={96}
              height={96}
              className="mx-auto h-24 w-24"
              alt={selectedNetwork?.name || ""}
            />
            <div>{t(`dialogs.export.loginPrompt.${settings.socialNetwork}`)}</div>
            <Button onClick={handleLogin}>{t("dialogs.export.login")}</Button>
          </div>
        ) : showExportForm ? (
          <div className="w-full max-w-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {t("dialogs.export.exportTo")} {selectedNetwork?.name}
              </h3>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                {t("dialogs.export.logout")}
              </Button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t("dialogs.export.videoTitle")}</Label>
                <Input
                  value={settings.title || settings.fileName}
                  onChange={(e) => onSettingsChange({ title: e.target.value })}
                  placeholder={t("dialogs.export.enterTitle")}
                  disabled={isRendering}
                />
              </div>

              <div className="space-y-2">
                <Label>{t("dialogs.export.description")}</Label>
                <Textarea
                  value={settings.description || ""}
                  onChange={(e) => onSettingsChange({ description: e.target.value })}
                  placeholder={t("dialogs.export.enterDescription")}
                  rows={4}
                  disabled={isRendering}
                />
              </div>

              <div className="space-y-2">
                <Label>{t("dialogs.export.tags")}</Label>
                <Input
                  value={settings.tags?.join(", ") || ""}
                  onChange={(e) =>
                    onSettingsChange({
                      tags: e.target.value
                        .split(",")
                        .map((tag) => tag.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder={t("dialogs.export.enterTags")}
                  disabled={isRendering}
                />
              </div>

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
                    <SelectItem value="public">{t("dialogs.export.privacy.public")}</SelectItem>
                    <SelectItem value="unlisted">{t("dialogs.export.privacy.unlisted")}</SelectItem>
                    <SelectItem value="private">{t("dialogs.export.privacy.private")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("dialogs.export.aspectRatio")}</Label>
                  <Select defaultValue={selectedNetwork?.aspectRatios[0]}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedNetwork?.aspectRatios.map((ratio) => (
                        <SelectItem key={ratio} value={ratio}>
                          {ratio}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t("dialogs.export.quality")}</Label>
                  <Select
                    value={settings.quality}
                    onValueChange={(value) => onSettingsChange({ quality: value as any })}
                    disabled={isRendering}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">{t("dialogs.export.normal")}</SelectItem>
                      <SelectItem value="good">{t("dialogs.export.good")}</SelectItem>
                      <SelectItem value="best">{t("dialogs.export.best")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t("dialogs.export.thumbnail")}</Label>
                <div className="flex items-center gap-4">
                  <div className="bg-muted flex h-24 w-40 items-center justify-center rounded">
                    {settings.thumbnail ? (
                      <Image
                        src={settings.thumbnail}
                        alt="Thumbnail"
                        width={160}
                        height={96}
                        className="h-full w-full object-cover rounded"
                      />
                    ) : (
                      <span className="text-muted-foreground text-sm">{t("dialogs.export.noThumbnail")}</span>
                    )}
                  </div>
                  <Button variant="outline" size="sm">
                    {t("dialogs.export.chooseThumbnail")}
                  </Button>
                </div>
              </div>

              {/* TikTok специфичные настройки */}
              {settings.socialNetwork === "tiktok" && (
                <div className="space-y-4 border-t pt-4">
                  <h4 className="font-medium">{t("dialogs.export.tiktokSettings")}</h4>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="useVerticalResolution"
                      checked={settings.useVerticalResolution || false}
                      onCheckedChange={(checked) => onSettingsChange({ useVerticalResolution: !!checked })}
                    />
                    <Label htmlFor="useVerticalResolution">{t("dialogs.export.useVerticalResolution")}</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="uploadDirectlyToTikTok"
                      checked={settings.uploadDirectlyToTikTok || false}
                      onCheckedChange={(checked) => onSettingsChange({ uploadDirectlyToTikTok: !!checked })}
                    />
                    <Label htmlFor="uploadDirectlyToTikTok">{t("dialogs.export.uploadDirectlyToTikTok")}</Label>
                  </div>
                </div>
              )}

              {/* YouTube специфичные настройки */}
              {settings.socialNetwork === "youtube" && (
                <div className="space-y-4 border-t pt-4">
                  <h4 className="font-medium">{t("dialogs.export.youtubeSettings")}</h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t("dialogs.export.category")}</Label>
                      <Select
                        value={settings.category || "22"}
                        onValueChange={(value) => onSettingsChange({ category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="22">People & Blogs</SelectItem>
                          <SelectItem value="24">Entertainment</SelectItem>
                          <SelectItem value="26">Howto & Style</SelectItem>
                          <SelectItem value="10">Music</SelectItem>
                          <SelectItem value="25">News & Politics</SelectItem>
                          <SelectItem value="29">Nonprofits & Activism</SelectItem>
                          <SelectItem value="23">Comedy</SelectItem>
                          <SelectItem value="27">Education</SelectItem>
                          <SelectItem value="28">Science & Technology</SelectItem>
                          <SelectItem value="17">Sports</SelectItem>
                          <SelectItem value="19">Travel & Events</SelectItem>
                          <SelectItem value="20">Gaming</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>{t("dialogs.export.language")}</Label>
                      <Select
                        value={settings.language || "en"}
                        onValueChange={(value) => onSettingsChange({ language: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="ru">Русский</SelectItem>
                          <SelectItem value="es">Español</SelectItem>
                          <SelectItem value="fr">Français</SelectItem>
                          <SelectItem value="de">Deutsch</SelectItem>
                          <SelectItem value="it">Italiano</SelectItem>
                          <SelectItem value="pt">Português</SelectItem>
                          <SelectItem value="ja">日本語</SelectItem>
                          <SelectItem value="ko">한국어</SelectItem>
                          <SelectItem value="zh">中文</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {/* Общие настройки */}
              <div className="space-y-4 border-t pt-4">
                <h4 className="font-medium">{t("dialogs.export.advancedSettings")}</h4>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="useProxyMedia"
                    checked={settings.useProxyMedia || false}
                    onCheckedChange={(checked) => onSettingsChange({ useProxyMedia: !!checked })}
                  />
                  <Label htmlFor="useProxyMedia">{t("dialogs.export.useProxyMedia")}</Label>
                </div>
              </div>

              <div className="pt-4 border-t space-y-4">
                {/* Прогресс загрузки */}
                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{t("dialogs.export.uploading")}</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="w-full" />
                  </div>
                )}

                <Button
                  onClick={onExport}
                  disabled={isRendering || isUploading || !settings.title}
                  className="w-full bg-[#00CCC0] hover:bg-[#00B8B0] text-black"
                >
                  {isUploading
                    ? t("dialogs.export.uploading")
                    : isRendering
                      ? t("dialogs.export.rendering")
                      : t("dialogs.export.publishTo", { network: selectedNetwork?.name })}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 text-center">
            <div className="text-muted-foreground">
              {t("dialogs.export.loggedInAs", { account: settings.accountName })}
            </div>
            <Button onClick={() => setShowExportForm(true)}>{t("dialogs.export.continueToExport")}</Button>
          </div>
        )}
      </div>
    </div>
  )
}
