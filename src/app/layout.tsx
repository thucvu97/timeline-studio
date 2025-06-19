import React from "react"

import "@/styles/globals.css"

import { AppErrorBoundary } from "@/components/error-boundary"
import { Providers } from "@/features/media-studio/services/providers"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <Providers>
          <AppErrorBoundary>{children}</AppErrorBoundary>
        </Providers>
      </body>
    </html>
  )
}
