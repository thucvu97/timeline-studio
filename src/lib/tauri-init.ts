/**
 * Инициализация Tauri API
 */

// Проверяем и ждем загрузки Tauri
export async function waitForTauri(maxAttempts = 50): Promise<boolean> {
  console.log("[tauri-init] Waiting for Tauri API...")
  console.log("[tauri-init] Current URL:", typeof window !== "undefined" ? window.location.href : "SSR")
  console.log("[tauri-init] User Agent:", typeof navigator !== "undefined" ? navigator.userAgent : "SSR")
  
  // В Tauri v2, проверяем также window.__TAURI_INTERNALS__
  for (let i = 0; i < maxAttempts; i++) {
    if (typeof window !== "undefined") {
      // Логируем все свойства window для диагностики
      if (i === 0) {
        console.log("[tauri-init] Window properties:", Object.keys(window).filter(k => k.includes("TAURI") || k.includes("tauri")))
      }
      
      const windowWithTauri = window as any
      if (windowWithTauri.__TAURI__ || windowWithTauri.__TAURI_INTERNALS__) {
        console.log("[tauri-init] Tauri API loaded!", {
          __TAURI__: windowWithTauri.__TAURI__,
          __TAURI_INTERNALS__: windowWithTauri.__TAURI_INTERNALS__
        })
        return true
      }
    }
    
    // Ждем 100ms перед следующей попыткой
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  console.error("[tauri-init] Tauri API not loaded after", maxAttempts * 100, "ms")
  console.error("[tauri-init] This usually means the app is not running in Tauri context")
  return false
}

// Форсируем загрузку Tauri модулей
export async function initializeTauri() {
  try {
    // Пробуем импортировать основные модули Tauri v2
    const windowModule = await import("@tauri-apps/plugin-window")
    console.log("[tauri-init] Tauri window module imported:", windowModule)
    
    // В Tauri v2 проверяем доступные методы
    if ((windowModule as any).getCurrentWindow) {
      const currentWindow = (windowModule as any).getCurrentWindow()
      console.log("[tauri-init] Current window:", currentWindow)
    }
    
    // Проверяем, что мы в Tauri окружении
    const isInTauri = await waitForTauri()
    return isInTauri
  } catch (error) {
    console.error("[tauri-init] Failed to import Tauri modules:", error)
    return false
  }
}

// Автоматически инициализируем при загрузке модуля
if (typeof window !== "undefined") {
  // Проверяем сразу
  const windowWithTauri = window as any
  if (windowWithTauri.__TAURI__) {
    console.log("[tauri-init] Tauri already loaded!")
  } else {
    console.log("[tauri-init] Tauri not loaded yet, initializing...")
    void initializeTauri().then(loaded => {
      if (loaded) {
        console.log("[tauri-init] Tauri initialization complete!")
      } else {
        console.error("[tauri-init] Failed to initialize Tauri")
      }
    }).catch(() => {})
  }
}