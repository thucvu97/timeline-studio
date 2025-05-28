import React from "react"

// import { Geist, Geist_Mono } from "next/font/google"

import "@/styles/globals.css"
import { ThemeProvider } from "@/components/theme/theme-context"
import { Providers } from "@/features/media-studio/services/providers"

// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// })
// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// })
// className={`${geistSans.variable} ${geistMono.variable} antialiased`}>

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <Providers>
          <ThemeProvider>{children}</ThemeProvider>
        </Providers>
      </body>
    </html>
  )
}
