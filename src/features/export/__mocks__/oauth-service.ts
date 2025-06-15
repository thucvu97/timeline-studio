// Mock OAuth service for testing

export interface OAuthToken {
  accessToken: string
  refreshToken?: string
  expiresIn: number
  tokenType: string
}

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class OAuthService {
  private static mockTokens: Record<string, OAuthToken | null> = {}

  static async loginToNetwork(network: string): Promise<OAuthToken | null> {
    // Simulate successful OAuth login
    const mockToken: OAuthToken = {
      accessToken: `mock_access_token_${network}`,
      refreshToken: `mock_refresh_token_${network}`,
      expiresIn: 3600,
      tokenType: "Bearer",
    }

    OAuthService.mockTokens[network] = mockToken
    localStorage.setItem(`oauth_token_${network}`, JSON.stringify(mockToken))

    return mockToken
  }

  static getStoredToken(network: string): OAuthToken | null {
    // Check in-memory mock first
    if (OAuthService.mockTokens[network]) {
      return OAuthService.mockTokens[network]
    }

    // Check localStorage
    const stored = localStorage.getItem(`oauth_token_${network}`)
    if (stored) {
      return JSON.parse(stored)
    }

    return null
  }

  static logout(network: string): void {
    OAuthService.mockTokens[network] = null
    localStorage.removeItem(`oauth_token_${network}`)
  }

  static async refreshToken(network: string): Promise<OAuthToken | null> {
    const currentToken = OAuthService.getStoredToken(network)
    if (!currentToken) return null

    // Simulate token refresh
    const refreshedToken: OAuthToken = {
      ...currentToken,
      accessToken: `refreshed_access_token_${network}`,
      expiresIn: 3600,
    }

    OAuthService.mockTokens[network] = refreshedToken
    localStorage.setItem(`oauth_token_${network}`, JSON.stringify(refreshedToken))

    return refreshedToken
  }

  static isTokenExpired(token: OAuthToken): boolean {
    // For testing, assume tokens never expire
    return false
  }
}
