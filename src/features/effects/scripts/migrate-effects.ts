/**
 * Скрипт миграции эффектов из старой системы в новую
 * Использование: bun run src/features/effects/scripts/migrate-effects.ts
 */

import { readFileSync, writeFileSync } from "fs"
import { join } from "path"

import { EffectMigrator } from "../services/effect-migrator"

import type { BaseEffect } from "../types/unified-effects"

// Интерфейс старого эффекта
interface OldEffect {
  id: string
  name: string
  type: string
  duration: number
  category: string
  complexity: string
  tags: string[]
  description: {
    ru: string
    en: string
    [key: string]: string
  }
  ffmpegCommand?: string
  cssFilter?: string
  params?: Record<string, any>
  previewPath?: string
  labels: {
    ru: string
    en: string
    [key: string]: string
  }
  presets?: Record<
    string,
    {
      name: Record<string, string>
      params: Record<string, any>
      description?: Record<string, string>
    }
  >
}

// Путь к файлам
const DATA_DIR = join(process.cwd(), "src/features/effects/data")
const OLD_EFFECTS_PATH = join(DATA_DIR, "effects.json")
const MIGRATED_EFFECTS_DIR = join(DATA_DIR, "effects")

// Функция для чтения старых эффектов
function readOldEffects(): OldEffect[] {
  try {
    const content = readFileSync(OLD_EFFECTS_PATH, "utf-8")
    const data = JSON.parse(content)
    return data.effects || []
  } catch (error) {
    console.error("Ошибка чтения файла эффектов:", error)
    return []
  }
}

// Функция для сохранения мигрированных эффектов
function saveMigratedEffects(category: string, effects: BaseEffect[], stats: ReturnType<EffectMigrator["getStats"]>) {
  const outputPath = join(MIGRATED_EFFECTS_DIR, `${category}-effects.json`)

  const data = {
    version: "2.0.0",
    category,
    migratedAt: new Date().toISOString(),
    stats: {
      total: stats.migrated + stats.skipped,
      migrated: stats.migrated,
      skipped: stats.skipped,
      successRate: `${stats.successRate.toFixed(2)}%`,
      errors: stats.errors,
    },
    effects,
  }

  writeFileSync(outputPath, JSON.stringify(data, null, 2))
  console.log(`✅ Сохранено ${effects.length} эффектов в ${outputPath}`)
}

// Функция для миграции по категориям
async function migrateByCategory(category: string) {
  console.log(`\n🔄 Начинаем миграцию категории: ${category}`)

  const migrator = new EffectMigrator()
  const oldEffects = readOldEffects()

  // Фильтруем эффекты по категории
  const categoryEffects = oldEffects.filter((e) => e.category === category)
  console.log(`📊 Найдено ${categoryEffects.length} эффектов в категории ${category}`)

  // Мигрируем
  const migratedEffects = migrator.migrateEffects(categoryEffects)

  // Получаем статистику
  const stats = migrator.getStats()

  console.log("\n📈 Статистика миграции:")
  console.log(`   - Успешно мигрировано: ${stats.migrated}`)
  console.log(`   - Пропущено: ${stats.skipped}`)
  console.log(`   - Успешность: ${stats.successRate.toFixed(2)}%`)

  if (stats.errors.length > 0) {
    console.log("\n⚠️  Ошибки при миграции:")
    stats.errors.forEach((err) => {
      console.log(`   - ${err.effectId}: ${err.error}`)
    })
  }

  // Сохраняем результаты
  if (migratedEffects.length > 0) {
    saveMigratedEffects(category, migratedEffects, stats)
  }

  return { migratedEffects, stats }
}

// Функция для тестовой миграции одной категории
async function testMigration() {
  console.log("🚀 Запуск тестовой миграции эффектов...\n")

  // Мигрируем категорию color-correction как тест
  const testCategory = "color-correction"

  try {
    const { migratedEffects, stats } = await migrateByCategory(testCategory)

    // Выводим примеры мигрированных эффектов
    if (migratedEffects.length > 0) {
      console.log("\n📋 Примеры мигрированных эффектов:")
      migratedEffects.slice(0, 3).forEach((effect) => {
        console.log(`\n   🎨 ${effect.name.en} (${effect.name.ru})`)
        console.log(`      ID: ${effect.id}`)
        console.log(`      Категория: ${effect.category}`)
        console.log(`      Область: ${effect.scope.join(", ")}`)
        console.log(`      Процессоры: ${Object.keys(effect.processors).join(", ")}`)
        console.log(`      Параметры: ${effect.parameters.length}`)
      })
    }

    console.log("\n✅ Тестовая миграция завершена успешно!")
    console.log("\n💡 Для миграции других категорий используйте:")
    console.log("   bun run migrate-effects.ts --category=<category>")
    console.log("\n   Доступные категории:")
    console.log("   - color-correction")
    console.log("   - vintage")
    console.log("   - artistic")
    console.log("   - cinematic")
    console.log("   - creative")
    console.log("   - technical")
    console.log("   - motion")
    console.log("   - distortion")
  } catch (error) {
    console.error("❌ Ошибка при миграции:", error)
  }
}

// Основная функция
async function main() {
  const args = process.argv.slice(2)
  const categoryArg = args.find((arg) => arg.startsWith("--category="))

  if (categoryArg) {
    const category = categoryArg.split("=")[1]
    await migrateByCategory(category)
  } else {
    await testMigration()
  }
}

// Запускаем
main().catch(console.error)
