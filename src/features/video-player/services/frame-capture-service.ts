/**
 * Frame Capture Service
 * Сервис для захвата кадров из video элемента для AI анализа
 */

export class FrameCaptureService {
  private canvas: HTMLCanvasElement | null = null
  private context: CanvasRenderingContext2D | null = null

  constructor() {
    // Создаем canvas для захвата кадров
    if (typeof window !== "undefined") {
      this.canvas = document.createElement("canvas")
      this.context = this.canvas.getContext("2d")
    }
  }

  /**
   * Захват текущего кадра из video элемента
   */
  public captureFrame(videoElement: HTMLVideoElement): ImageData | null {
    if (!this.canvas || !this.context || !videoElement) {
      return null
    }

    // Убеждаемся что видео загружено
    if (videoElement.readyState < 2) {
      return null
    }

    // Устанавливаем размеры canvas
    this.canvas.width = videoElement.videoWidth
    this.canvas.height = videoElement.videoHeight

    // Рисуем текущий кадр на canvas
    this.context.drawImage(videoElement, 0, 0, this.canvas.width, this.canvas.height)

    // Получаем ImageData
    return this.context.getImageData(0, 0, this.canvas.width, this.canvas.height)
  }

  /**
   * Захват кадра как Blob для отправки на сервер
   */
  public async captureFrameAsBlob(
    videoElement: HTMLVideoElement,
    format: "image/png" | "image/jpeg" = "image/jpeg",
    quality = 0.8,
  ): Promise<Blob | null> {
    if (!this.canvas || !this.context || !videoElement) {
      return null
    }

    // Убеждаемся что видео загружено
    if (videoElement.readyState < 2) {
      return null
    }

    // Устанавливаем размеры canvas
    this.canvas.width = videoElement.videoWidth
    this.canvas.height = videoElement.videoHeight

    // Рисуем текущий кадр на canvas
    this.context.drawImage(videoElement, 0, 0, this.canvas.width, this.canvas.height)

    // Конвертируем в Blob
    return new Promise((resolve) => {
      this.canvas!.toBlob((blob) => resolve(blob), format, quality)
    })
  }

  /**
   * Захват кадра как base64 строка
   */
  public captureFrameAsBase64(
    videoElement: HTMLVideoElement,
    format: "image/png" | "image/jpeg" = "image/jpeg",
    quality = 0.8,
  ): string | null {
    if (!this.canvas || !this.context || !videoElement) {
      return null
    }

    // Убеждаемся что видео загружено
    if (videoElement.readyState < 2) {
      return null
    }

    // Устанавливаем размеры canvas
    this.canvas.width = videoElement.videoWidth
    this.canvas.height = videoElement.videoHeight

    // Рисуем текущий кадр на canvas
    this.context.drawImage(videoElement, 0, 0, this.canvas.width, this.canvas.height)

    // Конвертируем в base64
    return this.canvas.toDataURL(format, quality)
  }

  /**
   * Захват уменьшенного кадра для быстрого анализа
   */
  public captureThumbnail(videoElement: HTMLVideoElement, maxWidth = 320, maxHeight = 240): ImageData | null {
    if (!this.canvas || !this.context || !videoElement) {
      return null
    }

    // Убеждаемся что видео загружено
    if (videoElement.readyState < 2) {
      return null
    }

    // Вычисляем размеры с сохранением соотношения сторон
    const aspectRatio = videoElement.videoWidth / videoElement.videoHeight
    let width = maxWidth
    let height = maxHeight

    if (aspectRatio > maxWidth / maxHeight) {
      height = maxWidth / aspectRatio
    } else {
      width = maxHeight * aspectRatio
    }

    // Устанавливаем размеры canvas
    this.canvas.width = Math.round(width)
    this.canvas.height = Math.round(height)

    // Рисуем уменьшенный кадр
    this.context.drawImage(videoElement, 0, 0, this.canvas.width, this.canvas.height)

    // Получаем ImageData
    return this.context.getImageData(0, 0, this.canvas.width, this.canvas.height)
  }

  /**
   * Очистка ресурсов
   */
  public dispose(): void {
    this.canvas = null
    this.context = null
  }
}
