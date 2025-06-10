import React from "react"

import { AlertCircle, CheckCircle2, Clock, FileVideo, Loader2, StopCircle, XCircle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

import { formatJobDuration, getJobStatusColor, getJobStatusLabel, useRenderJobs } from "../hooks/use-render-jobs"
import { RenderStatus } from "../types/render"

export function RenderJobsDropdown() {
  const { jobs, isLoading, error, cancelJob } = useRenderJobs()

  // Количество активных задач
  const activeJobsCount = jobs.filter(
    (job) => job.status === RenderStatus.Pending || job.status === RenderStatus.Processing,
  ).length

  // Иконка для статуса задачи
  const getStatusIcon = (status: RenderStatus) => {
    switch (status) {
      case RenderStatus.Pending:
        return <Clock className="h-4 w-4" />
      case RenderStatus.Processing:
        return <Loader2 className="h-4 w-4 animate-spin" />
      case RenderStatus.Completed:
        return <CheckCircle2 className="h-4 w-4" />
      case RenderStatus.Failed:
        return <XCircle className="h-4 w-4" />
      case RenderStatus.Cancelled:
        return <StopCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  // Обработчик отмены задачи
  const handleCancelJob = async (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const confirmed = window.confirm("Отменить задачу рендеринга?")
    if (confirmed) {
      await cancelJob(jobId)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <FileVideo className="h-4 w-4 mr-2" />
          Задачи
          {activeJobsCount > 0 && (
            <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
              {activeJobsCount}
            </Badge>
          )}
          {jobs.some((job) => job.status === RenderStatus.Processing) && (
            <Loader2 className="absolute -top-1 -right-1 h-3 w-3 animate-spin text-blue-500" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Задачи рендеринга</span>
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <ScrollArea className="h-[400px]">
          {error ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 text-red-500" />
              <p>Ошибка загрузки задач</p>
              <p className="text-xs mt-1">{error}</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              <FileVideo className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Нет активных задач</p>
            </div>
          ) : (
            <div className="space-y-2 p-2">
              {jobs.map((job) => (
                <div key={job.id} className="rounded-lg border p-3 space-y-2 hover:bg-accent/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={cn("flex items-center gap-1", getJobStatusColor(job.status))}>
                          {getStatusIcon(job.status)}
                          <span className="text-xs font-medium">{getJobStatusLabel(job.status)}</span>
                        </span>
                        <span className="text-xs text-muted-foreground">{formatJobDuration(job.created_at)}</span>
                      </div>
                      <p className="text-sm font-medium line-clamp-1">{job.project_name}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{job.output_path}</p>
                    </div>
                    {(job.status === RenderStatus.Pending || job.status === RenderStatus.Processing) && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => handleCancelJob(job.id, e)}
                        className="h-7 px-2"
                      >
                        <StopCircle className="h-3 w-3" />
                      </Button>
                    )}
                  </div>

                  {job.status === RenderStatus.Processing && job.progress && (
                    <div className="space-y-1">
                      <Progress value={job.progress.percentage} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{job.progress.stage}</span>
                        <span>
                          {job.progress.current_frame}/{job.progress.total_frames} кадров
                        </span>
                      </div>
                      {job.progress.message && (
                        <p className="text-xs text-muted-foreground line-clamp-1">{job.progress.message}</p>
                      )}
                    </div>
                  )}

                  {job.status === RenderStatus.Failed && job.error_message && (
                    <p className="text-xs text-red-500 line-clamp-2">{job.error_message}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {jobs.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Всего задач:</span>
                <span>{jobs.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Активных:</span>
                <span>{activeJobsCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Завершено:</span>
                <span>{jobs.filter((j) => j.status === RenderStatus.Completed).length}</span>
              </div>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
