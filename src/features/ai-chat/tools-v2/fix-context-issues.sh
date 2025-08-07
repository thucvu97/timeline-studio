#!/bin/bash

# Скрипт для исправления проблем с context в tools-v2

echo "Исправляем проблемы с context и logger..."

# Найти все файлы с проблемным вызовом
files=$(find /Users/aleksandrkireev/Apps/timeline-studio/src/features/ai-chat/tools-v2 -name "*.ts" -type f)

for file in $files; do
    # Удаляем параметр context из методов perform*
    sed -i '' 's/\(private async perform[^(]*(\)\([^)]*\),\s*context:\s*any\s*)/\1\2)/g' "$file"
    
    # Исправляем вызовы logger с контекстом
    # this.logger?.(context, ...) -> this.logger?.(...)
    sed -i '' 's/this\.logger?\.(\s*context,/this.logger?.(/g' "$file"
    
    # Исправляем executeWithErrorHandling - добавляем context параметр если его нет
    # async () => { -> async (context) => {
    sed -i '' 's/return this\.executeWithErrorHandling(\s*async\s*(\s*)\s*=>\s*{/return this.executeWithErrorHandling(async (context) => {/g' "$file"
    
    # Но если context уже есть, не добавляем его снова
    sed -i '' 's/async (context) (context)/async (context)/g' "$file"
    
    # Проверяем, были ли изменения
    if git diff --quiet "$file"; then
        echo "✓ Нет изменений в: $file"
    else
        echo "✓ Исправлено в: $file"
    fi
done

echo "Готово!"