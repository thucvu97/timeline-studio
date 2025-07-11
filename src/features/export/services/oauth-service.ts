// OAuth service для авторизации в социальных сетях

import { toast } from "sonner"

import { SecureTokenStorage } from "./secure-token-storage"

interface OAuthConfig {
  clientId: string
  redirectUri: string
  scope: string[]
  authUrl: string
}

interface OAuthToken {
  accessToken: string
  refreshToken?: string
  expiresIn: number
  tokenType: string
}

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class OAuthService {
  private static configs: Record<string, OAuthConfig> = {
    youtube: {
      clientId: process.env.NEXT_PUBLIC_YOUTUBE_CLIENT_ID || "",
      redirectUri: process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URI || "http://localhost:3000/oauth/callback",
      scope: ["https://www.googleapis.com/auth/youtube.upload", "https://www.googleapis.com/auth/youtube"],
      authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    },
    tiktok: {
      clientId: process.env.NEXT_PUBLIC_TIKTOK_CLIENT_ID || "",
      redirectUri: process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URI || "http://localhost:3000/oauth/callback",
      scope: ["video.upload", "user.info.basic"],
      authUrl: "https://www.tiktok.com/v2/auth/authorize/",
    },
    vimeo: {
      clientId: process.env.NEXT_PUBLIC_VIMEO_CLIENT_ID || "",
      redirectUri: process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URI || "http://localhost:3000/oauth/callback",
      scope: ["public", "private", "upload", "edit", "delete"],
      authUrl: "https://api.vimeo.com/oauth/authorize",
    },
    telegram: {
      clientId: process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN || "",
      redirectUri: "",
      scope: [],
      authUrl: "",
    },
  }

  static async loginToNetwork(network: string): Promise<OAuthToken | null> {
    const config = OAuthService.configs[network]
    if (!config) {
      throw new Error(`Unsupported network: ${network}`)
    }

    if (!config.clientId) {
      toast.error(`OAuth not configured for ${network}. Please check environment variables.`)
      return null
    }

    try {
      // Создаем URL для авторизации
      const authUrl = new URL(config.authUrl)
      authUrl.searchParams.set("client_id", config.clientId)
      authUrl.searchParams.set("redirect_uri", config.redirectUri)
      authUrl.searchParams.set("scope", config.scope.join(" "))
      authUrl.searchParams.set("response_type", "code")
      authUrl.searchParams.set("state", `${network}_${Date.now()}`)

      // Открываем окно авторизации
      const authWindow = window.open(authUrl.toString(), "oauth", "width=600,height=700,scrollbars=yes,resizable=yes")

      if (!authWindow) {
        throw new Error("Failed to open authentication window")
      }

      // Ожидаем завершения авторизации
      // eslint-disable-next-line @typescript-eslint/return-await
      return new Promise((resolve, reject) => {
        const checkClosed = setInterval(() => {
          if (authWindow.closed) {
            clearInterval(checkClosed)
            reject(new Error("Authentication cancelled"))
          }
        }, 1000)

        // Слушаем сообщения от OAuth callback
        const messageHandler = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return

          if (event.data.type === "oauth_success") {
            clearInterval(checkClosed)
            window.removeEventListener("message", messageHandler)
            authWindow.close()
            resolve(event.data.token)
          } else if (event.data.type === "oauth_error") {
            clearInterval(checkClosed)
            window.removeEventListener("message", messageHandler)
            authWindow.close()
            reject(new Error(event.data.error))
          }
        }

        window.addEventListener("message", messageHandler)
      })
    } catch (error) {
      console.error(`OAuth login failed for ${network}:`, error)
      throw error
    }
  }

  static async refreshToken(network: string, refreshToken: string): Promise<OAuthToken | null> {
    // Реализация обновления токена
    try {
      switch (network) {
        case "youtube":
          return await OAuthService.refreshGoogleToken(refreshToken)
        case "tiktok":
          return await OAuthService.refreshTikTokToken(refreshToken)
        case "vimeo":
          return await OAuthService.refreshVimeoToken(refreshToken)
        case "telegram":
          // Telegram bot tokens не истекают, не требуют refresh
          return null
        default:
          throw new Error(`Token refresh not implemented for ${network}`)
      }
    } catch (error) {
      console.error(`Token refresh failed for ${network}:`, error)
      return null
    }
  }

  private static async refreshGoogleToken(refreshToken: string): Promise<OAuthToken> {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: OAuthService.configs.youtube.clientId,
        client_secret: process.env.NEXT_PUBLIC_YOUTUBE_CLIENT_SECRET || "",
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to refresh Google token")
    }

    const data = await response.json()
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
      expiresIn: data.expires_in,
      tokenType: data.token_type,
    }
  }

  private static async refreshTikTokToken(refreshToken: string): Promise<OAuthToken> {
    const response = await fetch("https://open-api.tiktok.com/oauth/refresh_token/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_key: OAuthService.configs.tiktok.clientId,
        client_secret: process.env.NEXT_PUBLIC_TIKTOK_CLIENT_SECRET || "",
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to refresh TikTok token")
    }

    const data = await response.json()
    return {
      accessToken: data.data.access_token,
      refreshToken: data.data.refresh_token,
      expiresIn: data.data.expires_in,
      tokenType: "Bearer",
    }
  }

  private static async refreshVimeoToken(refreshToken: string): Promise<OAuthToken> {
    const response = await fetch("https://api.vimeo.com/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: OAuthService.configs.vimeo.clientId,
        client_secret: process.env.NEXT_PUBLIC_VIMEO_CLIENT_SECRET || "",
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to refresh Vimeo token")
    }

    const data = await response.json()
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      tokenType: data.token_type,
    }
  }

  static async logout(network: string): Promise<void> {
    // Очищаем сохраненные токены через безопасное хранилище
    await SecureTokenStorage.removeToken(network)
    toast.success(`Logged out from ${network}`)
  }

  static async getStoredToken(network: string): Promise<OAuthToken | null> {
    return await SecureTokenStorage.getStoredToken(network)
  }

  static async storeToken(network: string, token: OAuthToken): Promise<void> {
    await SecureTokenStorage.storeToken(network, token)
  }
}
