#!/bin/bash

# Скрипт для исправления вызовов logger в tools-v2

echo "Исправляем вызовы logger..."

# Найти все файлы с проблемным вызовом
files=$(find /Users/aleksandrkireev/Apps/timeline-studio/src/features/ai-chat/tools-v2 -name "*.ts" -type f)

for file in $files; do
    # Исправляем вызовы logger
    # this.logger?.("info", ...) -> this.logger?.info(...)
    sed -i '' 's/this\.logger?\.\("info",/this.logger?.info(/g' "$file"
    sed -i '' 's/this\.logger?\.\("warn",/this.logger?.warn(/g' "$file"
    sed -i '' 's/this\.logger?\.\("error",/this.logger?.error(/g' "$file"
    
    # Альтернативный синтаксис без точки
    sed -i '' 's/this\.logger?\.("info",/this.logger?.info(/g' "$file"
    sed -i '' 's/this\.logger?\.("warn",/this.logger?.warn(/g' "$file"
    sed -i '' 's/this\.logger?\.("error",/this.logger?.error(/g' "$file"
    
    # Проверяем, были ли изменения
    if git diff --quiet "$file"; then
        echo "✓ Нет изменений в: $file"
    else
        echo "✓ Исправлено в: $file"
    fi
done

echo "Готово!"