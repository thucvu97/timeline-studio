#!/usr/bin/env node

/**
 * Скрипт для исправления импортов Tauri v2
 * Меняет @tauri-apps/plugin-fs на @tauri-apps/plugin-fs
 */

const fs = require("fs")
const path = require("path")

console.log("🔍 Поиск файлов с устаревшими импортами Tauri...")

let filesUpdated = 0
let totalFilesChecked = 0

// Рекурсивная функция для обхода директорий
function walkDir(dir, callback) {
  const files = fs.readdirSync(dir)

  files.forEach((file) => {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)

    if (stat.isDirectory()) {
      // Пропускаем node_modules и dist
      if (file !== "node_modules" && file !== "dist" && file !== ".next") {
        walkDir(filePath, callback)
      }
    } else if (stat.isFile() && (file.endsWith(".ts") || file.endsWith(".tsx"))) {
      callback(filePath)
    }
  })
}

// Обходим src директорию
walkDir(path.join(__dirname, "..", "src"), (file) => {
  totalFilesChecked++
  const content = fs.readFileSync(file, "utf8")

  // Проверяем, есть ли устаревший импорт
  if (content.includes("@tauri-apps/plugin-fs")) {
    // Заменяем импорт
    const updatedContent = content.replace(/@tauri-apps\/plugin-fs/g, "@tauri-apps/plugin-fs")

    // Сохраняем файл
    fs.writeFileSync(file, updatedContent)
    filesUpdated++
    console.log(`✅ Обновлен: ${file}`)
  }
})

console.log("\n📊 Итоги:")
console.log(`Проверено файлов: ${totalFilesChecked}`)
console.log(`Обновлено файлов: ${filesUpdated}`)

if (filesUpdated > 0) {
  console.log("\n💡 Рекомендации:")
  console.log("1. Запустите тесты: npm test")
  console.log("2. Проверьте изменения: git diff")
  console.log('3. Создайте коммит: git commit -am "fix: update Tauri v2 imports"')
}

console.log("\n✨ Готово!")
