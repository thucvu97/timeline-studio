#!/usr/bin/env node

import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Пути к файлам (2 уровня вверх от scripts/ci/)
const sourceChangelog = path.join(__dirname, "..", "..", "CHANGELOG.md")
const targetDir = path.join(__dirname, "..", "..", "promo", "content", "changelog")
const targetFile = path.join(targetDir, "latest.md")

// Создаём директорию, если её нет
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true })
}

// Копируем CHANGELOG.md
if (fs.existsSync(sourceChangelog)) {
  const content = fs.readFileSync(sourceChangelog, "utf8")
  fs.writeFileSync(targetFile, content)
  console.log("✅ CHANGELOG.md синхронизирован с промо-сайтом")
} else {
  console.log("⚠️  CHANGELOG.md не найден")
}
