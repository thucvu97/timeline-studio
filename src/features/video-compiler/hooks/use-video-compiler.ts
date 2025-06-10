import { useCallback, useState } from "react"

import { invoke } from "@tauri-apps/api/core"
import { toast } from "sonner"

import type { ProjectSchema } from "@/types/video-compiler"

import { renderProject, trackRenderProgress } from "../services/video-compiler-service"
import { RenderStatus } from "../types/render"

import type { RenderJob, RenderProgress } from "../types/render"

interface UseVideoCompilerReturn {
  // Состояние
  isRendering: boolean
  renderProgress: RenderProgress | null
  activeJobs: RenderJob[]

  // Методы
  startRender: (project: ProjectSchema, outputPath: string) => Promise<string>
  cancelRender: (jobId: string) => Promise<void>
  generatePreview: (project: ProjectSchema, timestamp: number) => Promise<Blob>
  refreshActiveJobs: () => Promise<void>
}

export function useVideoCompiler(): UseVideoCompilerReturn {
  const [isRendering, setIsRendering] = useState(false)
  const [renderProgress, setRenderProgress] = useState<RenderProgress | null>(null)
  const [activeJobs, setActiveJobs] = useState<RenderJob[]>([])
  const [currentJobId, setCurrentJobId] = useState<string | null>(null)

  // Запуск рендеринга
  const startRender = useCallback(async (project: ProjectSchema, outputPath: string): Promise<string> => {
    try {
      setIsRendering(true)

      // Запускаем рендеринг
      const jobId = await renderProject(project, outputPath)
      setCurrentJobId(jobId)

      toast.success("Рендеринг запущен", {
        description: `Проект: ${project.metadata.name}`,
      })

      // Отслеживаем прогресс
      void trackRenderProgress(jobId, (progress) => {
        setRenderProgress(progress)

        // Обновляем состояние при завершении
        if (progress.status === RenderStatus.Completed) {
          setIsRendering(false)
          toast.success("Рендеринг завершен!", {
            description: `Видео сохранено: ${outputPath}`,
          })
        } else if (progress.status === RenderStatus.Failed) {
          setIsRendering(false)
          toast.error("Ошибка рендеринга", {
            description: progress.message || "Неизвестная ошибка",
          })
        } else if (progress.status === RenderStatus.Cancelled) {
          setIsRendering(false)
          toast.info("Рендеринг отменен")
        }
      })

      return jobId
    } catch (error) {
      setIsRendering(false)
      toast.error("Не удалось запустить рендеринг", {
        description: error instanceof Error ? error.message : "Неизвестная ошибка",
      })
      throw error
    }
  }, [])

  // Отмена рендеринга
  const cancelRender = useCallback(async (jobId: string) => {
    try {
      const success = await invoke<boolean>("cancel_render", { jobId })

      if (success) {
        toast.info("Рендеринг отменен")
        setIsRendering(false)
        setRenderProgress(null)
      } else {
        toast.error("Не удалось отменить рендеринг")
      }
    } catch (error) {
      console.error("Failed to cancel render:", error)
      toast.error("Ошибка при отмене рендеринга")
    }
  }, [])

  // Генерация превью кадра
  const generatePreview = useCallback(async (project: ProjectSchema, timestamp: number): Promise<Blob> => {
    try {
      const jpegData = await invoke<number[]>("generate_preview", {
        projectSchema: project,
        timestamp,
      })

      // Конвертируем массив байтов в Blob
      const uint8Array = new Uint8Array(jpegData)
      return new Blob([uint8Array], { type: "image/jpeg" })
    } catch (error) {
      console.error("Failed to generate preview:", error)
      toast.error("Не удалось сгенерировать превью")
      throw error
    }
  }, [])

  // Получение списка активных задач
  const refreshActiveJobs = useCallback(async () => {
    try {
      const jobs = await invoke<RenderJob[]>("get_active_jobs")
      setActiveJobs(jobs)
    } catch (error) {
      console.error("Failed to get active jobs:", error)
    }
  }, [])

  return {
    isRendering,
    renderProgress,
    activeJobs,
    startRender,
    cancelRender,
    generatePreview,
    refreshActiveJobs,
  }
}
