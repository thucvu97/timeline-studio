"use client"

import React, { Suspense, lazy } from "react"

import { Skeleton } from "@/components/ui/skeleton"

// Ленивая загрузка Browser компонента
const BrowserComponent = lazy(() =>
  import("./browser").then((module) => ({
    default: module.Browser,
  })),
)

/**
 * Скелетон для загрузки Browser компонента
 */
function BrowserSkeleton() {
  return (
    <div className="h-full w-full flex flex-col">
      {/* Табы */}
      <div className="h-[50px] border-b bg-muted/30 flex items-center gap-0">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-full px-4 flex flex-col items-center justify-center gap-1">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-3 w-12" />
          </div>
        ))}
      </div>

      {/* Индикатор загрузки */}
      <div className="p-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-2 w-full mt-2 rounded-full" />
      </div>

      {/* Тулбар */}
      <div className="p-3 border-b bg-background flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </div>

      {/* Контент */}
      <div className="flex-1 p-3">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-video rounded" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Компонент ошибки загрузки Browser
 */
function BrowserErrorFallback({ error, retry }: { error: Error; retry?: () => void }) {
  return (
    <div className="h-full w-full flex items-center justify-center">
      <div className="text-center space-y-4 max-w-md">
        <div className="text-destructive text-lg font-medium">Ошибка загрузки Browser</div>
        <div className="text-muted-foreground text-sm">{error.message}</div>
        {retry && (
          <button
            onClick={retry}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
          >
            Повторить попытку
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * Ленивый Browser компонент с оптимизированной загрузкой
 */
export function BrowserLazy() {
  return (
    <Suspense fallback={<BrowserSkeleton />}>
      <ErrorBoundary>
        <BrowserComponent />
      </ErrorBoundary>
    </Suspense>
  )
}

/**
 * Error Boundary для обработки ошибок загрузки
 */
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error?: Error }> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Browser component failed to load:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <BrowserErrorFallback
          error={this.state.error || new Error("Unknown error")}
          retry={() => this.setState({ hasError: false, error: undefined })}
        />
      )
    }

    return this.props.children
  }
}

export default BrowserLazy
