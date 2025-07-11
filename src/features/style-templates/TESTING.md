# Тестирование Style Templates

## 📊 Обзор

Модуль `style-templates` имеет полное покрытие тестами с **92 тестами** в **7 файлах**.

## 🏗️ Архитектура тестов

### Организация тестов

Тесты организованы по типам функциональности:

```
tests/
├── components/     # UI компоненты (29 тестов)
├── hooks/          # React хуки (28 тестов)
└── utils/          # Утилиты (35 тестов)
```

### Принципы тестирования

1. **Изоляция**: Каждый тест независим
2. **Моки**: Внешние зависимости замокированы
3. **Читаемость**: Тесты на русском языке
4. **Покрытие**: Все функции и edge cases покрыты

## 🧪 Компоненты (29 тестов)

### StyleTemplateList (5 тестов)

**Файл**: `components/style-template-list.test.tsx`

**Моки**:

- `useStyleTemplates` - основной хук
- `StyleTemplatePreview` - дочерний компонент
- `useBrowserState` - состояние браузера
- `useMedia` - медиа функции
- `react-i18next` - интернационализация
- `ContentGroup` - группировка контента

**Тестируемые сценарии**:

- ✅ Отображение индикатора загрузки
- ✅ Обработка ошибок загрузки
- ✅ Отображение списка шаблонов
- ✅ Сообщение об отсутствии результатов
- ✅ Обработка выбора шаблона

### StyleTemplatePreview (13 тестов)

**Файл**: `components/style-template-preview.test.tsx`

**Моки**:

- `AddMediaButton` - кнопка добавления
- `FavoriteButton` - кнопка избранного
- `useResources` - ресурсы
- `react-i18next` - переводы

**Тестируемые сценарии**:

- ✅ Отображение превью с миниатюрой
- ✅ Заглушка при отсутствии миниатюры
- ✅ Отображение названия шаблона
- ✅ Индикаторы стиля и категории
- ✅ Кнопка воспроизведения при наведении
- ✅ Обработка клика для выбора
- ✅ Кнопки избранного и добавления
- ✅ Применение правильных размеров
- ✅ Обработка разных категорий и стилей
- ✅ События мыши (hover)
- ✅ Поддержка английского языка

### StyleTemplateLoading (4 теста)

**Файл**: `components/style-template-loading.test.tsx`

**Тестируемые сценарии**:

- ✅ Отображение текста загрузки
- ✅ Анимированный спиннер
- ✅ Правильная структура компонента
- ✅ Центрирование содержимого

### StyleTemplateErrorBoundary (7 тестов)

**Файл**: `components/style-template-error-boundary.test.tsx`

**Тестируемые сценарии**:

- ✅ Отображение дочерних компонентов без ошибки
- ✅ Отображение сообщения об ошибке
- ✅ Кнопка повторной попытки
- ✅ Сброс ошибки при нажатии кнопки
- ✅ Правильная структура при ошибке
- ✅ Центрирование содержимого ошибки
- ✅ Отображение иконки ошибки

## 🎣 Хуки (28 тестов)

### useStyleTemplates (14 тестов)

**Файл**: `hooks/use-style-templates.test.ts`

**Моки**:

- Динамический импорт JSON файла
- Fallback данные при ошибке

**Тестируемые сценарии**:

- ✅ Инициализация с правильными значениями
- ✅ Загрузка шаблонов из JSON
- ✅ Фильтрация по категории
- ✅ Фильтрация по стилю
- ✅ Фильтрация по наличию текста
- ✅ Фильтрация по длительности
- ✅ Сортировка по названию
- ✅ Сортировка по длительности
- ✅ Поиск шаблона по ID
- ✅ Поиск несуществующего ID
- ✅ Поиск шаблонов по категории
- ✅ Поиск в несуществующей категории
- ✅ Комбинированные фильтры
- ✅ Обработка ошибок загрузки

### useStyleTemplatesImport (14 тестов)

**Файл**: `hooks/use-style-templates-import.test.ts`

**Моки**:

- `@tauri-apps/api/dialog` - диалоги выбора файлов
- `@tauri-apps/plugin-fs` - файловая система

**Тестируемые сценарии**:

- ✅ Инициализация с правильными значениями
- ✅ Импорт JSON файла с шаблонами
- ✅ Установка флага загрузки
- ✅ Обработка отмены выбора файла
- ✅ Логирование выбранного файла
- ✅ Обработка ошибок импорта JSON
- ✅ Защита от параллельного импорта JSON
- ✅ Импорт отдельных файлов шаблонов
- ✅ Обработка множественного выбора
- ✅ Обработка одиночного файла
- ✅ Обработка отмены выбора файлов
- ✅ Обработка ошибок импорта файлов
- ✅ Защита от параллельного импорта файлов
- ✅ Параллельные вызовы разных методов

## 🛠️ Утилиты (35 тестов)

### style-template-utils.test.ts

**Файл**: `utils/style-template-utils.test.ts`

**Тестируемые функции**:

#### getCategoryAbbreviation (2 теста)

- ✅ Правильные сокращения для всех категорий
- ✅ Пустая строка для неизвестной категории

#### getStyleAbbreviation (2 теста)

- ✅ Правильные сокращения для всех стилей
- ✅ Пустая строка для неизвестного стиля

#### filterTemplates (7 тестов)

- ✅ Возврат всех шаблонов без фильтров
- ✅ Фильтрация по категории
- ✅ Фильтрация по стилю
- ✅ Фильтрация по наличию текста
- ✅ Фильтрация по наличию анимации
- ✅ Фильтрация по длительности
- ✅ Комбинированные фильтры

#### sortTemplates (7 тестов)

- ✅ Сортировка по названию (возрастание)
- ✅ Сортировка по названию (убывание)
- ✅ Сортировка по длительности (возрастание)
- ✅ Сортировка по длительности (убывание)
- ✅ Сортировка по категории
- ✅ Сортировка по стилю
- ✅ Обработка неизвестного поля

#### getCategoryName (3 теста)

- ✅ Русские названия категорий
- ✅ Английские названия категорий
- ✅ Русские названия по умолчанию

#### getStyleName (2 теста)

- ✅ Русские названия стилей
- ✅ Английские названия стилей

#### groupTemplates (3 теста)

- ✅ Группировка по категориям
- ✅ Группировка по стилям
- ✅ Все шаблоны в одной группе для 'none'

#### searchTemplates (4 теста)

- ✅ Поиск по названию
- ✅ Поиск по тегам
- ✅ Возврат всех для пустого запроса
- ✅ Поиск на английском языке

#### validateTemplate (3 теста)

- ✅ Валидация корректного шаблона
- ✅ Отклонение некорректного шаблона
- ✅ Отклонение null

#### generateTemplateId (2 теста)

- ✅ Генерация ID на основе свойств
- ✅ Обработка отсутствующих свойств

## 🚀 Запуск тестов

```bash
# Все тесты
bun run test src/features/style-templates/tests/

# По категориям
bun run test src/features/style-templates/tests/components/
bun run test src/features/style-templates/tests/hooks/
bun run test src/features/style-templates/tests/utils/

# Отдельные файлы
bun run test src/features/style-templates/tests/components/style-template-list.test.tsx
bun run test src/features/style-templates/tests/hooks/use-style-templates.test.ts
bun run test src/features/style-templates/tests/utils/style-template-utils.test.ts

# С подробным выводом
bun run test src/features/style-templates/tests/ --reporter=verbose

# Режим наблюдения
bun run test src/features/style-templates/tests/ --watch
```

## 🛡️ Качество тестов

### Покрытие

- ✅ **100% функций** покрыто тестами
- ✅ **Все edge cases** протестированы
- ✅ **Ошибки** обрабатываются корректно

### Надежность

- ✅ **Стабильные тесты** - не флакают
- ✅ **Быстрое выполнение** - все тесты за ~1.5 сек
- ✅ **Изолированность** - тесты не влияют друг на друга

### Поддержка

- ✅ **Читаемые названия** на русском языке
- ✅ **Понятная структура** тестов
- ✅ **Хорошие моки** для внешних зависимостей
