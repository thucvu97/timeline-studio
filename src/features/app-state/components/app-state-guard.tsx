"use client"

import { ReactNode } from "react"

import { AppProvider } from "../services/app-provider"

interface AppStateGuardProps {
  children: ReactNode
}

export function AppStateGuard({ children }: AppStateGuardProps) {
  return <AppProvider>{children}</AppProvider>
}