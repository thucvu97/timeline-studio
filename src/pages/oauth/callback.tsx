// OAuth callback страница для обработки авторизации

import { useEffect } from "react"

import { useRouter } from "next/router"

export default function OAuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search)
        const code = urlParams.get("code")
        const state = urlParams.get("state")
        const error = urlParams.get("error")

        if (error) {
          // Отправляем ошибку в родительское окно
          window.opener?.postMessage(
            {
              type: "oauth_error",
              error: error,
            },
            window.location.origin,
          )
          window.close()
          return
        }

        if (!code || !state) {
          throw new Error("Missing authorization code or state")
        }

        // Извлекаем network из state
        const [network] = state.split("_")

        // Обмениваем код на токен
        const token = await exchangeCodeForToken(network, code)

        if (token) {
          // Отправляем токен в родительское окно
          window.opener?.postMessage(
            {
              type: "oauth_success",
              token: token,
            },
            window.location.origin,
          )
        } else {
          throw new Error("Failed to exchange code for token")
        }

        window.close()
      } catch (error) {
        console.error("OAuth callback error:", error)
        window.opener?.postMessage(
          {
            type: "oauth_error",
            error: error instanceof Error ? error.message : "Unknown error",
          },
          window.location.origin,
        )
        window.close()
      }
    }

    // Запускаем обработку после загрузки страницы
    if (typeof window !== "undefined") {
      void handleOAuthCallback()
    }
  }, [])

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
        <h2 className="text-xl font-semibold mb-2">Completing authorization...</h2>
        <p className="text-gray-600">Please wait while we complete the authorization process.</p>
      </div>
    </div>
  )
}

async function exchangeCodeForToken(network: string, code: string): Promise<any> {
  try {
    switch (network) {
      case "youtube":
        return await exchangeYouTubeCode(code)
      case "tiktok":
        return await exchangeTikTokCode(code)
      default:
        throw new Error(`Token exchange not implemented for ${network}`)
    }
  } catch (error) {
    console.error(`Token exchange failed for ${network}:`, error)
    throw error
  }
}

async function exchangeYouTubeCode(code: string): Promise<any> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_YOUTUBE_CLIENT_ID || "",
      client_secret: process.env.NEXT_PUBLIC_YOUTUBE_CLIENT_SECRET || "",
      code: code,
      grant_type: "authorization_code",
      redirect_uri: process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URI || "http://localhost:3000/oauth/callback",
    }),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(`YouTube token exchange failed: ${errorData.error_description || "Unknown error"}`)
  }

  const data = await response.json()
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
    tokenType: data.token_type,
  }
}

async function exchangeTikTokCode(code: string): Promise<any> {
  const response = await fetch("https://open-api.tiktok.com/oauth/access_token/", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_key: process.env.NEXT_PUBLIC_TIKTOK_CLIENT_ID || "",
      client_secret: process.env.NEXT_PUBLIC_TIKTOK_CLIENT_SECRET || "",
      code: code,
      grant_type: "authorization_code",
      redirect_uri: process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URI || "http://localhost:3000/oauth/callback",
    }),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(`TikTok token exchange failed: ${errorData.error_description || "Unknown error"}`)
  }

  const data = await response.json()
  
  if (data.error) {
    throw new Error(`TikTok token exchange failed: ${data.error_description || data.error}`)
  }

  return {
    accessToken: data.data.access_token,
    refreshToken: data.data.refresh_token,
    expiresIn: data.data.expires_in,
    tokenType: "Bearer",
  }
}