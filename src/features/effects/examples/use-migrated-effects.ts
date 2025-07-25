/**
 * Пример использования мигрированных эффектов
 */

import {
  createEffectManager,
  createEffectRenderer,
  findMigratedEffect,
  getMigratedEffectsByCategory,
  getMigratedEffectsByTags,
  migrationStats,
} from "../index"

// Создаем менеджер эффектов с загрузкой всех эффектов
const effectManager = createEffectManager({
  loadBasicEffects: true,
  loadMigratedEffects: true,
  loadProfessionalEffects: true,
})

// Создаем рендерер
const renderer = createEffectRenderer()

// Показываем статистику миграции
console.log("📊 Статистика миграции эффектов:")
console.log(`   Всего категорий: ${migrationStats.totalCategories}`)
console.log(`   Всего эффектов: ${migrationStats.totalEffects}`)
console.log("\n   По категориям:")
Object.entries(migrationStats.effectsByCategory).forEach(([category, count]) => {
  console.log(`   - ${category}: ${String(count)} эффектов`)
})

// Примеры использования
console.log("\n🎨 Примеры эффектов:")

// 1. Находим эффект по ID
const brightnessEffect = findMigratedEffect("effect_brightness")
if (brightnessEffect) {
  console.log(`\n1. Эффект яркости: ${brightnessEffect.name.ru}`)
  console.log(`   Категория: ${brightnessEffect.category}`)
  console.log(`   Параметры: ${brightnessEffect.parameters.map((p) => p.name.ru).join(", ")}`)
}

// 2. Получаем все эффекты цветокоррекции
const colorEffects = getMigratedEffectsByCategory("color_correction")
console.log(`\n2. Эффекты цветокоррекции (${colorEffects.length}):`)
colorEffects.forEach((effect) => {
  console.log(`   - ${effect.name.ru} (${effect.id})`)
})

// 3. Находим популярные эффекты
const popularEffects = getMigratedEffectsByTags(["popular"])
console.log(`\n3. Популярные эффекты (${popularEffects.length}):`)
popularEffects.slice(0, 5).forEach((effect) => {
  console.log(`   - ${effect.name.ru} (${effect.category})`)
})

// 4. Применяем эффект к клипу
console.log("\n4. Применение эффекта:")
const appliedEffect = effectManager.applyEffect("effect_sepia", "clip_123", "clip")
if (appliedEffect) {
  console.log(`   ✅ Эффект "${appliedEffect.effectId}" применен к клипу`)

  // Настраиваем параметры
  effectManager.setEffectParameter(appliedEffect.id, "intensity", 0.8)
  console.log("   ✅ Параметры настроены")
}

// 5. Создаем стек эффектов
console.log("\n5. Создание стека эффектов:")
const effectStack = effectManager.createEffectStack("clip_123", "clip")
if (effectStack) {
  // Добавляем эффекты в стек
  effectManager.applyEffect("effect_brightness", effectStack.id, "clip", {})
  effectManager.applyEffect("effect_contrast", effectStack.id, "clip", {})
  effectManager.applyEffect("effect_vintage_film", effectStack.id, "clip", {})

  console.log(`   ✅ Создан стек с ${effectStack.effects.length} эффектами`)
}

// 6. Рендеринг с эффектами (пример)
console.log("\n6. Рендеринг эффектов:")
async function renderExample() {
  // Создаем тестовое изображение
  const canvas = document.createElement("canvas")
  canvas.width = 1920
  canvas.height = 1080
  const ctx = canvas.getContext("2d")!

  // Заполняем градиентом
  const gradient = ctx.createLinearGradient(0, 0, 1920, 1080)
  gradient.addColorStop(0, "#ff0000")
  gradient.addColorStop(0.5, "#00ff00")
  gradient.addColorStop(1, "#0000ff")
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 1920, 1080)

  // Конвертируем в ImageBitmap
  const imageBitmap = await createImageBitmap(canvas)

  // Рендерим с эффектами
  const context = {
    timestamp: 0,
    targetType: "clip" as const,
    targetId: "clip_123",
  }

  const result = await renderer.renderEffectStack(effectStack.effects, new Map(), context)

  if (result.success && result.output) {
    console.log("   ✅ Рендеринг успешен")
    console.log(`   Время рендеринга: ${result.renderTime}ms`)
  }
}

// Запускаем рендеринг если в браузере
if (typeof window !== "undefined") {
  renderExample().catch(console.error)
}

// 7. Экспорт конфигурации эффектов
console.log("\n7. Экспорт конфигурации:")
const exportData = effectManager.exportEffectStack(effectStack.id)
if (exportData) {
  console.log("   ✅ Конфигурация экспортирована")
  console.log(`   Размер: ${JSON.stringify(exportData).length} байт`)
}

console.log("\n✨ Готово! Система эффектов работает с мигрированными эффектами.")
