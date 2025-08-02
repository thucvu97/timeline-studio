#!/usr/bin/env node

/**
 * Синхронизация версии между package.json, Cargo.toml и tauri.conf.json
 */

import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Получаем версию из аргументов или из package.json
const packageJsonPath = path.join(__dirname, "..", "..", "package.json")
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"))
const version = process.argv[2] || packageJson.version

console.log(`Синхронизация версии: ${version}`)

// Обновляем Cargo.toml
const cargoTomlPath = path.join(__dirname, "..", "..", "src-tauri", "Cargo.toml")
let cargoToml = fs.readFileSync(cargoTomlPath, "utf8")
cargoToml = cargoToml.replace(/^version = ".*"$/m, `version = "${version}"`)
fs.writeFileSync(cargoTomlPath, cargoToml)
console.log("✓ Обновлен Cargo.toml")

// Обновляем tauri.conf.json
const tauriConfPath = path.join(__dirname, "..", "..", "src-tauri", "tauri.conf.json")
const tauriConf = JSON.parse(fs.readFileSync(tauriConfPath, "utf8"))
tauriConf.version = version
fs.writeFileSync(tauriConfPath, JSON.stringify(tauriConf, null, 2) + "\n")
console.log("✓ Обновлен tauri.conf.json")

// Обновляем version.json
const versionJsonPath = path.join(__dirname, "..", "..", "version.json")
const versionJson = { version }
fs.writeFileSync(versionJsonPath, JSON.stringify(versionJson, null, 2) + "\n")
console.log("✓ Обновлен version.json")

// Обновляем Cargo.lock
const cargoLockPath = path.join(__dirname, "..", "..", "src-tauri", "Cargo.lock")
if (fs.existsSync(cargoLockPath)) {
  let cargoLock = fs.readFileSync(cargoLockPath, "utf8")
  // Ищем и заменяем версию для пакета timeline-studio
  const regex = /(\[\[package\]\]\nname = "timeline-studio"\nversion = )"[^"]+"/
  cargoLock = cargoLock.replace(regex, `$1"${version}"`)
  fs.writeFileSync(cargoLockPath, cargoLock)
  console.log("✓ Обновлен Cargo.lock")
}

console.log("Синхронизация версий завершена!")
