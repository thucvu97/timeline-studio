import { useTranslation } from "react-i18next"

import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

import { useApiKeys } from "../../hooks/use-api-keys"
import { ApiKeyInput } from "../widgets/api-key-input"
import { OAuthConnection } from "../widgets/oauth-connection"

/**
 * Вкладка настроек социальных сетей
 * Управление OAuth ключами для различных платформ
 */
export function SocialNetworksTab() {
  const { t } = useTranslation()
  const {
    youtubeCredentials,
    tiktokCredentials,
    vimeoCredentials,
    telegramCredentials,
    updateYoutubeCredentials,
    updateTiktokCredentials,
    updateVimeoCredentials,
    updateTelegramCredentials,
  } = useApiKeys()

  return (
    <div className="space-y-6">
      {/* Заголовок и описание */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{t("dialogs.userSettings.tabs.socialNetworks", "Социальные сети")}</h3>
        <p className="text-sm text-muted-foreground">
          {t("dialogs.userSettings.socialNetworksDescription", 
            "Настройте OAuth подключения для автоматической публикации видео в социальных сетях."
          )}
        </p>
      </div>

      <Separator />

      {/* YouTube OAuth */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">YouTube (Google OAuth)</Label>
          <p className="text-xs text-muted-foreground">
            {t("dialogs.userSettings.youtubeDescription", 
              "Прямая загрузка видео на ваш YouTube канал. Требует OAuth приложение в Google Console."
            )}
          </p>
        </div>
        
        <OAuthConnection
          service="youtube"
          credentials={youtubeCredentials}
          onUpdate={updateYoutubeCredentials}
          fields={[
            {
              key: "clientId",
              label: "Client ID",
              placeholder: "your_google_oauth_client_id",
            },
            {
              key: "clientSecret", 
              label: "Client Secret",
              placeholder: "your_google_oauth_client_secret",
              type: "password",
            }
          ]}
          links={[
            {
              text: t("dialogs.userSettings.createOAuthApp", "Создать OAuth приложение"),
              url: "https://console.developers.google.com/"
            }
          ]}
        />
      </div>

      <Separator />

      {/* TikTok OAuth */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">TikTok for Developers</Label>
          <p className="text-xs text-muted-foreground">
            {t("dialogs.userSettings.tiktokDescription", 
              "Автоматическая публикация в TikTok через API. Требует регистрацию приложения."
            )}
          </p>
        </div>
        
        <OAuthConnection
          service="tiktok"
          credentials={tiktokCredentials}
          onUpdate={updateTiktokCredentials}
          fields={[
            {
              key: "clientId",
              label: "Client Key",
              placeholder: "your_tiktok_client_key",
            },
            {
              key: "clientSecret",
              label: "Client Secret", 
              placeholder: "your_tiktok_client_secret",
              type: "password",
            }
          ]}
          links={[
            {
              text: t("dialogs.userSettings.registerApp", "Зарегистрировать приложение"),
              url: "https://developers.tiktok.com/"
            }
          ]}
        />
      </div>

      <Separator />

      {/* Vimeo API */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Vimeo API</Label>
          <p className="text-xs text-muted-foreground">
            {t("dialogs.userSettings.vimeoDescription", 
              "Загрузка видео на Vimeo. Поддерживает как OAuth, так и Personal Access Token."
            )}
          </p>
        </div>
        
        <OAuthConnection
          service="vimeo"
          credentials={vimeoCredentials}
          onUpdate={updateVimeoCredentials}
          fields={[
            {
              key: "clientId",
              label: "Client ID",
              placeholder: "your_vimeo_client_id",
            },
            {
              key: "clientSecret",
              label: "Client Secret",
              placeholder: "your_vimeo_client_secret", 
              type: "password",
            },
            {
              key: "accessToken",
              label: "Personal Access Token",
              placeholder: "your_vimeo_personal_access_token",
              type: "password",
              optional: true,
            }
          ]}
          links={[
            {
              text: t("dialogs.userSettings.createApp", "Создать приложение"),
              url: "https://developer.vimeo.com/"
            }
          ]}
        />
      </div>

      <Separator />

      {/* Telegram Bot */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Telegram Bot</Label>
          <p className="text-xs text-muted-foreground">
            {t("dialogs.userSettings.telegramDescription", 
              "Отправка видео в Telegram каналы или чаты через Bot API."
            )}
          </p>
        </div>
        
        <div className="space-y-3">
          <ApiKeyInput
            value={telegramCredentials.botToken}
            onChange={(value) => updateTelegramCredentials({ ...telegramCredentials, botToken: value })}
            placeholder="your_telegram_bot_token"
            service="telegram"
            label="Bot Token"
            testable={true}
            links={[
              {
                text: t("dialogs.userSettings.createBot", "Создать бота"),
                url: "https://t.me/BotFather"
              }
            ]}
          />
          
          <ApiKeyInput
            value={telegramCredentials.chatId}
            onChange={(value) => updateTelegramCredentials({ ...telegramCredentials, chatId: value })}
            placeholder="@your_channel_or_chat_id"
            service="telegram"
            label="Chat ID / Channel ID"
            testable={false}
          />
        </div>
      </div>

      {/* Дополнительная информация */}
      <div className="mt-6 p-4 bg-muted/50 rounded-md">
        <h4 className="text-sm font-medium mb-2">
          {t("dialogs.userSettings.oauthNote", "OAuth авторизация")}
        </h4>
        <p className="text-xs text-muted-foreground">
          {t("dialogs.userSettings.oauthNoteText", 
            "После ввода Client ID и Secret вы сможете пройти OAuth авторизацию для получения токенов доступа."
          )}
        </p>
      </div>
    </div>
  )
}