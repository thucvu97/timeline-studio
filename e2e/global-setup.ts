import { FullConfig } from "@playwright/test"

async function globalSetup(_config: FullConfig) {
  console.log("🚀 Starting e2e tests...")

  // Устанавливаем переменные окружения для тестов
  process.env.NEXT_PUBLIC_E2E_TEST = "true"

  // Можем добавить дополнительную логику:
  // - Создание тестовой БД
  // - Подготовка тестовых данных
  // - Запуск mock серверов

  return async () => {
    // Cleanup функция будет вызвана после всех тестов
    console.log("🧹 Cleaning up after tests...")
  }
}

export default globalSetup
