#!/usr/bin/env node

/**
 * Скрипт для централизованного обновления версии приложения
 * Использование: npm run update-version 0.27.0
 */

const fs = require("fs")
const path = require("path")

// Базовая директория проекта (2 уровня вверх от scripts/ci/)
const rootDir = path.join(__dirname, "..", "..")

// Получаем новую версию из аргументов
const newVersion = process.argv[2]

if (!newVersion) {
  console.error("❌ Ошибка: Укажите версию как аргумент")
  console.log("Использование: npm run update-version <версия>")
  console.log("Пример: npm run update-version 0.27.0")
  process.exit(1)
}

// Валидация версии
const versionRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9-.]+)?$/
if (!versionRegex.test(newVersion)) {
  console.error("❌ Ошибка: Неверный формат версии")
  console.log("Версия должна быть в формате: X.Y.Z или X.Y.Z-suffix")
  process.exit(1)
}

console.log(`🚀 Обновление версии приложения до ${newVersion}`)

// Файлы для обновления
const filesToUpdate = [
  {
    path: path.join(rootDir, "package.json"),
    type: "json",
    field: "version",
  },
  {
    path: path.join(rootDir, "src-tauri/Cargo.toml"),
    type: "toml",
    pattern: /^version = ".*"$/m,
    replacement: `version = "${newVersion}"`,
  },
  {
    path: path.join(rootDir, "src-tauri/tauri.conf.json"),
    type: "json",
    field: "version",
  },
  {
    path: path.join(rootDir, "version.json"),
    type: "json",
    field: "version",
  },
  {
    path: path.join(rootDir, "src/test/mocks/tauri/api/app.ts"),
    type: "typescript",
    pattern: /\.mockResolvedValue\("[\d.]+(?:-[a-zA-Z0-9-.]+)?"\)/,
    replacement: `.mockResolvedValue("${newVersion}")`,
  },
]

let successCount = 0
let errorCount = 0

// Функция для обновления JSON файлов
function updateJsonFile(filePath, field, version) {
  try {
    const content = fs.readFileSync(filePath, "utf8")
    const data = JSON.parse(content)
    data[field] = version
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n")
    console.log(`✅ Обновлен: ${filePath}`)
    successCount++
  } catch (error) {
    console.error(`❌ Ошибка при обновлении ${filePath}: ${error.message}`)
    errorCount++
  }
}

// Функция для обновления файлов с регулярными выражениями
function updateFileWithRegex(filePath, pattern, replacement) {
  try {
    const content = fs.readFileSync(filePath, "utf8")
    const updatedContent = content.replace(pattern, replacement)

    if (content === updatedContent) {
      console.warn(`⚠️  Предупреждение: Паттерн не найден в ${filePath}`)
      return
    }

    fs.writeFileSync(filePath, updatedContent)
    console.log(`✅ Обновлен: ${filePath}`)
    successCount++
  } catch (error) {
    console.error(`❌ Ошибка при обновлении ${filePath}: ${error.message}`)
    errorCount++
  }
}

// Обновляем каждый файл
filesToUpdate.forEach((file) => {
  // file.path уже содержит полный путь после наших изменений
  const fullPath = file.path

  if (!fs.existsSync(fullPath)) {
    console.warn(`⚠️  Файл не найден: ${fullPath}`)
    return
  }

  switch (file.type) {
    case "json":
      updateJsonFile(fullPath, file.field, newVersion)
      break
    case "toml":
    case "typescript":
      updateFileWithRegex(fullPath, file.pattern, file.replacement)
      break
  }
})

// Специальная обработка для файла с TODO
const projectServicePath = path.join(rootDir, "src/features/app-state/services/timeline-studio-project-service.ts")
if (fs.existsSync(projectServicePath)) {
  console.log("\n📋 Проверка timeline-studio-project-service.ts...")
  const content = fs.readFileSync(projectServicePath, "utf8")

  // Проверяем, используется ли getVersion()
  if (content.includes("getVersion()")) {
    console.log("✅ Файл уже использует getVersion() - отлично!")
  } else if (content.includes('version: "1.0.0"')) {
    console.warn('⚠️  ВНИМАНИЕ: В файле timeline-studio-project-service.ts найдена жестко закодированная версия "1.0.0"')
    console.log("   Рекомендуется заменить на: version: await getVersion()")
    console.log("   См. файл VERSION_MANAGEMENT.md для инструкций")
  }
}

// Итоги
console.log("\n📊 Итоги:")
console.log(`✅ Успешно обновлено файлов: ${successCount}`)
if (errorCount > 0) {
  console.log(`❌ Файлов с ошибками: ${errorCount}`)
}

// Рекомендации
console.log("\n💡 Рекомендации:")
console.log("1. Проверьте изменения: git diff")
console.log("2. Запустите тесты: npm test")
console.log('3. Создайте коммит: git commit -am "chore: update version to ' + newVersion + '"')
console.log("4. Создайте тег: git tag v" + newVersion)

console.log("\n✨ Готово!")
