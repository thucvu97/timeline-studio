import { FullConfig } from "@playwright/test"

async function globalTeardown(_config: FullConfig) {
  console.log("✅ E2E tests completed")

  // Дополнительная очистка если нужна:
  // - Удаление временных файлов
  // - Остановка mock серверов
  // - Очистка тестовой БД
}

export default globalTeardown
