# 12. Тестирование

Документация по тестированию Timeline Studio.

## 📋 Содержание

- [backend-testing.md](backend-testing.md) - Архитектура тестирования backend
- [test-memory-issues.md](test-memory-issues.md) - Решение проблем с памятью в тестах
- [test-summary.md](test-summary.md) - Итоги реализации тестирования с реальными медиафайлами  
- [testing-real-media.md](testing-real-media.md) - Тестирование с реальными медиафайлами
- [testing.md](testing.md) - Общее руководство по тестированию

## 🎯 Типы тестирования

1. **Unit-тесты** - Тестирование отдельных компонентов
2. **Integration-тесты** - Тестирование взаимодействия модулей
3. **E2E-тесты** - Сквозное тестирование пользовательских сценариев
4. **Performance-тесты** - Тестирование производительности
5. **Media-тесты** - Тестирование с реальными медиафайлами

## 🚀 Быстрый старт

```bash
# Frontend тесты
bun run test

# Backend тесты  
cd src-tauri && cargo test

# E2E тесты
bun run test:e2e

# Покрытие кода
bun run test:coverage
```

---

[← К разработке](../05_development/README.md) | [К CI/CD →](../13_ci_cd/README.md)