# 13. CI/CD

Документация по непрерывной интеграции и развертыванию Timeline Studio.

## 📋 Содержание

- [ci-cd-setup.md](ci-cd-setup.md) - Настройка CI/CD pipeline
- [semantic-release.md](semantic-release.md) - Автоматическое версионирование и релизы
- [codecov-components.md](codecov-components.md) - Настройка покрытия кода

## 🔄 CI/CD Процессы

### Continuous Integration
- Автоматические тесты при каждом коммите
- Проверка качества кода (lint, format)
- Сборка на всех поддерживаемых платформах
- Проверка безопасности зависимостей

### Continuous Deployment
- Автоматическая сборка релизных версий
- Создание дистрибутивов для Windows, macOS, Linux
- Публикация в GitHub Releases
- Обновление документации

## 🚀 GitHub Actions Workflows

### Main Workflows
- **ci.yml** - Основной CI pipeline
- **quick-check.yml** - Быстрая валидация
- **windows-build.yml** - Специализированная сборка Windows

### Release Workflows
- **release.yml** - Создание релизов
- **nightly.yml** - Ночные сборки для тестирования

## 🛠️ Настройка

```bash
# Локальная проверка перед push
bun run check:all

# Запуск тестов локально
bun run test:ci
```

---

[← К тестированию](../12_testing/README.md) | [К QA →](../14_quality_assurance/README.md)