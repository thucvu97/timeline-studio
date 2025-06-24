"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

import {
  useEffects,
  useFilters,
  useLoadingState,
  useResourceSources,
  useResourcesStats,
  useTransitions,
} from "../hooks/use-resources"
import { EffectsProvider } from "../providers/effects-provider"

/**
 * Компонент для демонстрации загруженных эффектов
 */
function EffectsDemo() {
  const { effects, loading } = useEffects()

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">Эффекты ({effects.length})</div>
      <div className="grid grid-cols-2 gap-2 max-h-40 overflow-auto">
        {effects.slice(0, 8).map((effect) => (
          <div key={effect.id} className="p-2 border rounded text-xs">
            <div className="font-medium truncate">{effect.name}</div>
            <div className="text-muted-foreground truncate">{effect.category}</div>
            <Badge variant="outline" className="text-xs">
              {effect.complexity}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Компонент для демонстрации загруженных фильтров
 */
function FiltersDemo() {
  const { filters, loading } = useFilters()

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">Фильтры ({filters.length})</div>
      <div className="grid grid-cols-2 gap-2 max-h-40 overflow-auto">
        {filters.slice(0, 8).map((filter) => (
          <div key={filter.id} className="p-2 border rounded text-xs">
            <div className="font-medium truncate">{filter.name}</div>
            <div className="text-muted-foreground truncate">{filter.category}</div>
            <Badge variant="outline" className="text-xs">
              {filter.complexity}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Компонент для демонстрации загруженных переходов
 */
function TransitionsDemo() {
  const { transitions, loading } = useTransitions()

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">Переходы ({transitions.length})</div>
      <div className="grid grid-cols-2 gap-2 max-h-40 overflow-auto">
        {transitions.slice(0, 8).map((transition) => (
          <div key={transition.id} className="p-2 border rounded text-xs">
            <div className="font-medium truncate">
              {transition.labels?.ru || transition.labels?.en || transition.name || transition.id}
            </div>
            <div className="text-muted-foreground truncate">{transition.category}</div>
            <Badge variant="outline" className="text-xs">
              {transition.complexity}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Компонент для отображения состояния загрузки
 */
function LoadingStatus() {
  const loadingState = useLoadingState()
  const stats = useResourcesStats()
  const { loadingState: sources } = useResourceSources()

  return (
    <div className="space-y-4">
      <div>
        <div className="text-sm font-medium mb-2">Состояние загрузки</div>
        <div className="space-y-1 text-xs">
          <div>Загружается: {loadingState.isLoading ? "Да" : "Нет"}</div>
          <div>Прогресс: {Math.round(loadingState.progress)}%</div>
          <div>Загружено источников: {loadingState.loadedSources.size}</div>
          <div>Очередь загрузки: {loadingState.loadingQueue.length}</div>
          {loadingState.error && <div className="text-red-500">Ошибка: {loadingState.error}</div>}
        </div>
      </div>

      <div>
        <div className="text-sm font-medium mb-2">Статистика</div>
        <div className="space-y-1 text-xs">
          <div>Всего ресурсов: {stats.total}</div>
          <div>Эффекты: {stats.byType.effects}</div>
          <div>Фильтры: {stats.byType.filters}</div>
          <div>Переходы: {stats.byType.transitions}</div>
          <div>Размер кэша: {Math.round(stats.cacheSize / 1024)} KB</div>
        </div>
      </div>

      <div>
        <div className="text-sm font-medium mb-2">Источники данных</div>
        <div className="space-y-1">
          {Object.entries(stats.bySource).map(([source, count]) => (
            <div key={source} className="flex justify-between text-xs">
              <span>{source}:</span>
              <Badge variant={count > 0 ? "default" : "secondary"} className="text-xs">
                {count}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Компонент содержимого демо (должен быть внутри EffectsProvider)
 */
function DemoContent() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Статистика */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Статистика</CardTitle>
          <CardDescription>Состояние EffectsProvider</CardDescription>
        </CardHeader>
        <CardContent>
          <LoadingStatus />
        </CardContent>
      </Card>

      {/* Эффекты */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Эффекты</CardTitle>
          <CardDescription>Загруженные видеоэффекты</CardDescription>
        </CardHeader>
        <CardContent>
          <EffectsDemo />
        </CardContent>
      </Card>

      {/* Фильтры */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Фильтры</CardTitle>
          <CardDescription>Загруженные видеофильтры</CardDescription>
        </CardHeader>
        <CardContent>
          <FiltersDemo />
        </CardContent>
      </Card>

      {/* Переходы */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Переходы</CardTitle>
          <CardDescription>Загруженные переходы</CardDescription>
        </CardHeader>
        <CardContent>
          <TransitionsDemo />
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Главный компонент демо EffectsProvider
 */
export function EffectsProviderDemo() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">EffectsProvider Demo</h1>
        <p className="text-muted-foreground">
          Демонстрация работы нового EffectsProvider с унифицированной загрузкой ресурсов
        </p>
      </div>

      <EffectsProvider
        config={{
          initialSources: ["built-in"],
          backgroundLoadDelay: 2000,
          enableCaching: true,
        }}
        onError={(error) => {
          console.error("EffectsProvider Error:", error)
        }}
      >
        <DemoContent />
      </EffectsProvider>
    </div>
  )
}
