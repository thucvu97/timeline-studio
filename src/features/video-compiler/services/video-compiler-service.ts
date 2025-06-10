/**
 * Сервис для работы с Video Compiler (Rust backend)
 */

import { invoke } from "@tauri-apps/api/core"

import type { ProjectSchema } from "@/types/video-compiler"

import { RenderStatus } from "../types/render"

import type { RenderProgress } from "../types/render"

/**
 * Запуск рендеринга проекта
 */
export async function renderProject(project: ProjectSchema, outputPath: string): Promise<string> {
  try {
    const jobId = await invoke<string>("compile_video", {
      projectSchema: project,
      outputPath,
    })

    return jobId
  } catch (error) {
    console.error("Failed to start video compilation:", error)
    throw error
  }
}

/**
 * Отслеживание прогресса рендеринга
 */
export async function trackRenderProgress(
  jobId: string,
  onProgress: (progress: RenderProgress) => void,
): Promise<void> {
  const checkProgress = async () => {
    try {
      const progress = await invoke<RenderProgress | null>("get_render_progress", { jobId })

      if (progress) {
        onProgress(progress)

        // Если рендеринг еще идет, проверяем снова через 500ms
        if (progress.status === RenderStatus.Processing) {
          setTimeout(checkProgress, 500)
        }
      }
    } catch (error) {
      console.error("Failed to get render progress:", error)
    }
  }

  // Начинаем отслеживание
  void checkProgress()
}

/**
 * Генерация превью кадра
 */
export async function generatePreview(
  project: ProjectSchema,
  timestamp: number,
  quality?: number,
): Promise<Uint8Array> {
  try {
    const jpegData = await invoke<number[]>("generate_preview", {
      projectSchema: project,
      timestamp,
      quality: quality || 75,
    })

    return new Uint8Array(jpegData)
  } catch (error) {
    console.error("Failed to generate preview:", error)
    throw error
  }
}

/**
 * Отмена рендеринга
 */
export async function cancelRender(jobId: string): Promise<boolean> {
  try {
    return await invoke<boolean>("cancel_render", { jobId })
  } catch (error) {
    console.error("Failed to cancel render:", error)
    return false
  }
}

/**
 * Получение списка активных задач
 */
export async function getActiveJobs() {
  try {
    return await invoke("get_active_jobs")
  } catch (error) {
    console.error("Failed to get active jobs:", error)
    throw error
  }
}

/**
 * Получение информации о задаче
 */
export async function getRenderJob(jobId: string) {
  try {
    return await invoke("get_render_job", { jobId })
  } catch (error) {
    console.error("Failed to get render job:", error)
    return null
  }
}
