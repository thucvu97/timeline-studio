import { useState } from "react"

import Image from "next/image"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

import { SOCIAL_NETWORKS } from "../constants/export-constants"
import { SocialExportSettings } from "../types/export-types"

interface SocialExportTabProps {
  settings: SocialExportSettings
  onSettingsChange: (updates: Partial<SocialExportSettings>) => void
  onLogin: (network: string) => void
  onExport: () => void
  isRendering: boolean
}

export function SocialExportTab({ settings, onSettingsChange, onLogin, onExport, isRendering }: SocialExportTabProps) {
  const { t } = useTranslation()
  const [showExportForm, setShowExportForm] = useState(false)

  const selectedNetwork = SOCIAL_NETWORKS.find((n) => n.id === settings.socialNetwork)

  const handleLogin = () => {
    onLogin(settings.socialNetwork)
    // Имитируем успешный вход (в реальном приложении это будет OAuth)
    onSettingsChange({
      isLoggedIn: true,
      accountName: `user@${settings.socialNetwork}.com`,
    })
    setShowExportForm(true)
  }

  const handleLogout = () => {
    onSettingsChange({
      isLoggedIn: false,
      accountName: undefined,
    })
    setShowExportForm(false)
  }

  return (
    <div className="grid grid-cols-[250px,1fr] gap-6">
      <div className="space-y-2">
        {SOCIAL_NETWORKS.map((network) => (
          <div
            key={network.id}
            className={`flex cursor-pointer items-center gap-2 rounded p-2 ${
              settings.socialNetwork === network.id ? "bg-accent" : "hover:bg-accent"
            }`}
            onClick={() => onSettingsChange({ socialNetwork: network.id })}
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

              <div className="pt-4 border-t">
                <Button
                  onClick={onExport}
                  disabled={isRendering || !settings.title}
                  className="w-full bg-[#00CCC0] hover:bg-[#00B8B0] text-black"
                >
                  {isRendering
                    ? t("dialogs.export.uploading")
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
