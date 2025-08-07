#!/bin/bash

# Скрипт для исправления вызовов logger в tools-v2

echo "Исправляем вызовы logger..."

# Найти все файлы с проблемным вызовом
files=$(find /Users/aleksandrkireev/Apps/timeline-studio/src/features/ai-chat/tools-v2 -name "*.ts" -type f)

for file in $files; do
    # Исправляем вызовы logger?.( на logger?.method(
    perl -i -pe 's/this\.logger\?\.\(/this.logger?.info(/g' "$file"
    
    # Проверяем, были ли изменения
    if git diff --quiet "$file"; then
        echo "✓ Нет изменений в: $file"
    else
        echo "✓ Исправлено в: $file"
    fi
done

echo "Готово!"