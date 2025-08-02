/**
 * Version control manager component
 * Main interface for version control functionality
 */

import { AlertCircle, Clock, GitBranch, GitCommit, GitMerge, History, Settings } from "lucide-react"
import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useVersionControl } from "@/features/app-state/hooks/use-version-control"

import { VersionHistoryPanel } from "./version-history-panel"

interface VersionControlManagerProps {
  className?: string
}

export function VersionControlManager({ className }: VersionControlManagerProps) {
  const {
    currentVersionId,
    branchName,
    hasUncommittedChanges,
    lastSnapshotTime,
    autoSaveEnabled,
    autoSaveIntervalSeconds,
    isLoading,
    error,
  } = useVersionControl()

  const [activeTab, setActiveTab] = useState("history")

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitCommit className="h-5 w-5" />
              Контроль версий
            </div>
            <div className="flex items-center gap-2">
              {hasUncommittedChanges && (
                <Badge variant="destructive" className="text-xs">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Есть изменения
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                {currentVersionId.slice(0, 8)}
              </Badge>
            </div>
          </CardTitle>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <GitBranch className="h-3 w-3" />
              <span>{branchName}</span>
            </div>

            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Автосохранение: {autoSaveEnabled ? `${autoSaveIntervalSeconds}с` : "выкл"}</span>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="h-3 w-3" />
                История
              </TabsTrigger>
              <TabsTrigger value="branches" className="flex items-center gap-2">
                <GitBranch className="h-3 w-3" />
                Ветки
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-3 w-3" />
                Настройки
              </TabsTrigger>
            </TabsList>

            <TabsContent value="history" className="mt-4">
              <VersionHistoryPanel />
            </TabsContent>

            <TabsContent value="branches" className="mt-4">
              <BranchManager />
            </TabsContent>

            <TabsContent value="settings" className="mt-4">
              <VersionControlSettings />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

// Branch management component
function BranchManager() {
  const { branchName, createBranch, switchBranch, isLoading } = useVersionControl()

  const [newBranchName, setNewBranchName] = useState("")

  const handleCreateBranch = async () => {
    if (!newBranchName.trim()) return

    const success = await createBranch(newBranchName.trim())
    if (success) {
      setNewBranchName("")
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-medium mb-2">Текущая ветка</h4>
        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
          <GitBranch className="h-4 w-4" />
          <span className="font-medium">{branchName}</span>
          <Badge variant="secondary">Активная</Badge>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium mb-2">Создать новую ветку</h4>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Название ветки"
            value={newBranchName}
            onChange={(e) => setNewBranchName(e.target.value)}
            className="flex-1 px-3 py-2 text-sm border rounded-md"
            disabled={isLoading}
          />
          <Button onClick={handleCreateBranch} disabled={isLoading || !newBranchName.trim()} size="sm">
            <GitBranch className="h-3 w-3 mr-1" />
            Создать
          </Button>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium mb-2">Слияние веток</h4>
        <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
          <GitMerge className="h-4 w-4 inline mr-2" />
          Функция слияния веток пока не реализована
        </div>
      </div>
    </div>
  )
}

// Version control settings component
function VersionControlSettings() {
  const { autoSaveEnabled, autoSaveIntervalSeconds, enableAutoSave, setAutoSaveInterval, isLoading } =
    useVersionControl()

  const intervalOptions = [
    { value: 30, label: "30 секунд" },
    { value: 60, label: "1 минута" },
    { value: 120, label: "2 минуты" },
    { value: 300, label: "5 минут" },
    { value: 600, label: "10 минут" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-medium mb-3">Автоматическое сохранение</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <div className="font-medium text-sm">Включить автосохранение</div>
              <div className="text-xs text-muted-foreground">
                Автоматически создавать снапшоты через заданные интервалы
              </div>
            </div>
            <Button
              variant={autoSaveEnabled ? "default" : "outline"}
              size="sm"
              onClick={() => enableAutoSave(!autoSaveEnabled)}
              disabled={isLoading}
            >
              {autoSaveEnabled ? "Включено" : "Выключено"}
            </Button>
          </div>

          {autoSaveEnabled && (
            <div className="p-3 border rounded-lg">
              <div className="font-medium text-sm mb-2">Интервал автосохранения</div>
              <div className="grid grid-cols-2 gap-2">
                {intervalOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant={autoSaveIntervalSeconds === option.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAutoSaveInterval(option.value)}
                    disabled={isLoading}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium mb-3">Хранение версий</h4>
        <div className="space-y-2 p-3 border rounded-lg">
          <div className="flex justify-between text-sm">
            <span>Максимальное количество версий:</span>
            <span>100 (по умолчанию)</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Сжатие старых версий:</span>
            <span>Включено</span>
          </div>
          <div className="text-xs text-muted-foreground">Старые версии автоматически сжимаются для экономии места</div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium mb-3">Экспорт / Импорт</h4>
        <div className="space-y-2">
          <Button variant="outline" size="sm" disabled>
            Экспортировать историю версий
          </Button>
          <Button variant="outline" size="sm" disabled>
            Импортировать версии
          </Button>
          <div className="text-xs text-muted-foreground">Функции экспорта/импорта пока не реализованы</div>
        </div>
      </div>
    </div>
  )
}
