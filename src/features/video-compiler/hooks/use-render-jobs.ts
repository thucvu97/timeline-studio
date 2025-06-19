import { useCallback, useEffect, useState } from "react"

import { invoke } from "@tauri-apps/api/core"

import { RenderStatus } from "../types/render"

import type { RenderJob } from "../types/render"


interface UseRenderJobsReturn {
  jobs: RenderJob[]
  isLoading: boolean
  error: string | null
  refreshJobs: () => Promise<void>
  getJob: (jobId: string) => Promise<RenderJob | null>
  cancelJob: (jobId: string) => Promise<boolean>
}

export function useRenderJobs(): UseRenderJobsReturn {
  const [jobs, setJobs] = useState<RenderJob[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Получить список активных задач
  const refreshJobs = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const activeJobs = await invoke<RenderJob[]>("get_active_jobs")
      setJobs(activeJobs)
    } catch (err) {
      console.error("Failed to get active jobs:", err)
      setError(err instanceof Error ? err.message : "Не удалось получить список задач")
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Получить конкретную задачу по ID
  const getJob = useCallback(async (jobId: string): Promise<RenderJob | null> => {
    try {
      const job = await invoke<RenderJob | null>("get_render_job", { jobId })
      return job
    } catch (err) {
      console.error(`Failed to get job ${jobId}:`, err)
      return null
    }
  }, [])

  // Отменить задачу
  const cancelJob = useCallback(
    async (jobId: string): Promise<boolean> => {
      try {
        const success = await invoke<boolean>("cancel_render", { jobId })
        if (success) {
          // Обновляем список после отмены
          await refreshJobs()
        }
        return success
      } catch (err) {
        console.error(`Failed to cancel job ${jobId}:`, err)
        return false
      }
    },
    [refreshJobs],
  )

  // Автоматическое обновление списка задач
  useEffect(() => {
    void refreshJobs()

    // Обновляем список каждые 2 секунды
    const interval = setInterval(refreshJobs, 2000)

    return () => clearInterval(interval)
  }, [refreshJobs])

  return {
    jobs,
    isLoading,
    error,
    refreshJobs,
    getJob,
    cancelJob,
  }
}

// Вспомогательные функции для работы с задачами

export function getJobStatusLabel(status: RenderStatus, t: (key: string) => string): string {
  switch (status) {
    case RenderStatus.Pending:
      return t("videoCompiler.status.pending")
    case RenderStatus.Processing:
      return t("videoCompiler.status.processing")
    case RenderStatus.Completed:
      return t("videoCompiler.status.completed")
    case RenderStatus.Failed:
      return t("videoCompiler.status.failed")
    case RenderStatus.Cancelled:
      return t("videoCompiler.status.cancelled")
    default:
      return t("videoCompiler.status.unknown")
  }
}

export function getJobStatusColor(status: RenderStatus): string {
  switch (status) {
    case RenderStatus.Pending:
      return "text-yellow-600 dark:text-yellow-400"
    case RenderStatus.Processing:
      return "text-blue-600 dark:text-blue-400"
    case RenderStatus.Completed:
      return "text-green-600 dark:text-green-400"
    case RenderStatus.Failed:
      return "text-red-600 dark:text-red-400"
    case RenderStatus.Cancelled:
      return "text-gray-600 dark:text-gray-400"
    default:
      return "text-gray-500"
  }
}

export function formatJobDuration(startTime: string, endTime?: string, t?: (key: string) => string): string {
  const start = new Date(startTime).getTime()
  const end = endTime ? new Date(endTime).getTime() : Date.now()
  const duration = Math.floor((end - start) / 1000)

  if (duration < 60) {
    return t ? t("videoCompiler.duration.seconds").replace("{{count}}", duration.toString()) : `${duration} sec`
  }
  if (duration < 3600) {
    const minutes = Math.floor(duration / 60)
    const seconds = duration % 60
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }
  const hours = Math.floor(duration / 3600)
  const minutes = Math.floor((duration % 3600) / 60)
  return `${hours}:${minutes.toString().padStart(2, "0")}:${(duration % 60).toString().padStart(2, "0")}`
}
