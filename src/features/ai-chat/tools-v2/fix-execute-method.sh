#!/bin/bash

# Скрипт для исправления методов executeWithErrorHandling в tools-v2

echo "Исправляем вызовы executeWithErrorHandling..."

# Найти все файлы с проблемным вызовом
files=$(find /Users/aleksandrkireev/Apps/timeline-studio/src/features/ai-chat/tools-v2 -name "*.ts" -type f)

for file in $files; do
    # Исправляем вызовы executeWithErrorHandling с правильной сигнатурой
    # Метод executeWithErrorHandling принимает callback и options
    
    # Паттерн 1: return this.executeWithErrorHandling(input.operation, async () => {
    # Заменяем на: return this.executeWithErrorHandling(async () => {
    sed -i '' 's/return this\.executeWithErrorHandling([^,]*,\s*async\s*(\s*)\s*=>\s*{/return this.executeWithErrorHandling(async () => {/g' "$file"
    
    # Паттерн 2: Убираем operation как первый параметр в других местах
    sed -i '' 's/this\.executeWithErrorHandling(\s*operation,/this.executeWithErrorHandling(/g' "$file"
    sed -i '' 's/this\.executeWithErrorHandling(\s*input\.operation,/this.executeWithErrorHandling(/g' "$file"
    
    # Проверяем, были ли изменения
    if git diff --quiet "$file"; then
        echo "✓ Нет изменений в: $file"
    else
        echo "✓ Исправлено в: $file"
    fi
done

echo "Готово!"