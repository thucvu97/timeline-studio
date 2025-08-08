/**
 * Vision Analysis Service
 * Адаптер для компьютерного зрения и анализа изображений
 */

// Экспорт object tracking и onnx runtime
export * from "./object-tracking"
export * from "./onnx-runtime"

// Экспорт Vision адаптера
export { createVisionService, VisionAdapter } from "./vision-adapter"
