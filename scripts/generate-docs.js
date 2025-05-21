#!/usr/bin/env node

/**
 * Скрипт для генерации документации с помощью TypeDoc
 * Исключает тестовые файлы и файлы в директории test
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Создаем временный файл конфигурации TypeScript для TypeDoc
const tsconfig = {
  compilerOptions: {
    skipLibCheck: true
  },
  include: ["src/**/*.ts", "src/**/*.tsx"],
  exclude: ["src/**/*.test.ts", "src/**/*.test.tsx", "src/**/*.spec.ts", "src/**/*.spec.tsx", "src/test/**"]
};

const tsconfigPath = path.join(__dirname, '..', 'tsconfig.typedoc.json');
fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));

try {
  // Запускаем TypeDoc с временной конфигурацией
  console.log('Generating documentation...');
  execSync('npx typedoc --tsconfig tsconfig.typedoc.json --skipErrorChecking', { stdio: 'inherit' });
  console.log('Documentation generated successfully!');
} catch (error) {
  console.error('Error generating documentation:', error);
  process.exit(1);
} finally {
  // Удаляем временный файл конфигурации
  fs.unlinkSync(tsconfigPath);
}
