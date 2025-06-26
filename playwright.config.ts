import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./e2e",
  // Запускаем тесты последовательно для стабильности
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : 2,
  reporter: [["html"], ["list"], ["junit", { outputFile: "test-results/junit.xml" }]],

  use: {
    baseURL: "http://localhost:3001",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",

    // Увеличиваем таймауты для стабильности
    navigationTimeout: 30000,
    actionTimeout: 15000,

    // Размер окна браузера
    viewport: { width: 1920, height: 1080 },

    // Опции запуска
    launchOptions: {
      slowMo: process.env.CI ? 0 : 50,
    },
  },

  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Добавляем permissions для clipboard и file access
        permissions: ["clipboard-read", "clipboard-write"],
      },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },

    // Проект для запуска с реальным Tauri приложением
    {
      name: "tauri",
      use: {
        ...devices["Desktop Chrome"],
        // Для Tauri тестов используем другой порт
        baseURL: "http://localhost:1420",
      },
      // Не запускаем dev сервер для Tauri тестов
      testMatch: "**/e2e/tauri/**/*.spec.ts",
    },
  ],

  webServer: {
    command: "bun run dev -- --port 3001",
    url: "http://localhost:3001",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    stdout: "pipe",
    stderr: "pipe",
    // Добавляем больше времени для ожидания запуска сервера
    waitUntil: "networkidle",
  },

  // Глобальный setup/teardown
  globalSetup: "./e2e/global-setup",
  globalTeardown: "./e2e/global-teardown",
})
