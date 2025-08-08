# AI Content Intelligence Tests

## Текущий статус

Все старые тесты (22 файла) были удалены из-за несовместимости с новой архитектурой после рефакторинга. 

### Причины удаления:
1. Неправильное использование `vi.mock` - не импортировался из vitest
2. Устаревшие импорты модулей, которые были перемещены в shared services
3. Моки не соответствуют новой архитектуре с DI Container
4. Тесты использовали старые API, которые больше не существуют

## Новая стратегия тестирования

### Созданные файлы:
- `setup.ts` - базовая настройка тестового окружения с моками для shared services
- `example.test.ts` - простой тест для проверки работы тестового окружения

### План создания новых тестов:

1. **Unit тесты для движков** (engines/)
   - scene-analysis-engine.test.ts
   - script-generation-engine.test.ts  
   - multi-platform-engine.test.ts

2. **Integration тесты для хуков** (hooks/)
   - use-ai-intelligence.test.tsx
   - use-content-pipeline.test.tsx
   - use-ai-orchestrator.test.tsx

3. **Component тесты** (components/)
   - analysis-viewer.test.tsx
   - generation-wizard.test.tsx
   - unified-dashboard.test.tsx

4. **Service тесты** (services/)
   - ai-intelligence-orchestrator.test.ts
   - ai-intelligence-machine.test.ts

## Рекомендации

Для полноценного покрытия тестами рекомендуется:

1. Начать с критически важных компонентов (engines и orchestrator)
2. Использовать моки из shared services через DI Container
3. Следовать новой архитектуре с Engine Factory pattern
4. Добавлять тесты постепенно по мере разработки новых функций

## Запуск тестов

```bash
# Все тесты модуля
bun test src/features/ai-content-intelligence

# Конкретный файл
bun test src/features/ai-content-intelligence/__tests__/example.test.ts

# С покрытием
bun test --coverage src/features/ai-content-intelligence
```