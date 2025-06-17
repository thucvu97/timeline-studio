# Add support for 13 languages and complete existing translations

## 🌍 Multi-language Support Enhancement

Timeline Studio currently has README documentation in 13 languages, but the application itself only supports 6 languages. Additionally, existing translations are incomplete.

### Current Status

#### 📚 README Languages (13 total)
- ✅ Supported in app: English (en), German (de), French (fr), Russian (ru), Spanish (es), Portuguese (pt)
- ❌ Not supported in app: Chinese (zh), Japanese (ja), Korean (ko), Turkish (tr), Thai (th), Arabic (ar), Persian/Farsi (fa)

#### 📊 Translation Completeness (Актуальное состояние)
Базовый файл English (en.json) содержит **1,524 ключа**:

| Язык | Всего ключей | Отсутствует | Дополнительно | Готовность |
|----------|--------------|-------------|---------------|------------|
| 🇷🇺 Русский | 1,524 | 0 | 0 | ✅ 100% |
| 🇩🇪 Немецкий | 1,599 | 0 | +75 | ✅ 100% + доп. функции |
| 🇫🇷 Французский | 1,583 | 0 | +59 | ✅ 100% + доп. функции |
| 🇪🇸 Испанский | 1,531 | 0 | +7 | ✅ 100% + доп. функции |
| 🇵🇹 Португальский | 1,524 | 0 | 0 | ✅ 100% |

**Примечание:** Некоторые языки содержат дополнительные функции (чат, управление кэшем), которых нет в английской версии.

### Статус переводов

✅ **Все существующие языки завершены на 100%!**

Завершены переводы для всех 6 поддерживаемых языков:
- 🇷🇺 Русский - 1,524 ключа
- 🇩🇪 Немецкий - 1,599 ключей (+ дополнительные функции чата)
- 🇫🇷 Французский - 1,583 ключа (+ расширенное управление кэшем)
- 🇪🇸 Испанский - 1,531 ключ (+ дополнительные UI функции)
- 🇵🇹 Португальский - 1,524 ключа (полная совместимость)

### Tasks

#### Phase 0: Sync English Base File
- [x] 🇬🇧 English - Add ~64 missing keys from Russian localization ✅ COMPLETED
  - [x] Add common.browse
  - [x] Add browser.toolbar sorting/grouping options
  - [x] Add titles.styles section
  - [x] Add extended timeline.resources section
  - [x] Add extended timeline.chat section
  - [x] Add templates.screens section
  - [x] Add styleTemplates.styles and filters sections
  - [x] Add missing subtitles sections (filters, errors, messages, detail)

#### Phase 1: Complete Existing Translations
- [x] 🇷🇺 Русский - ✅ ЗАВЕРШЕНО (1,524 ключа - 100% готово!)
- [x] 🇩🇪 Немецкий - ✅ ЗАВЕРШЕНО (1,599 ключей - 100% + дополнительные функции чата)
  - [x] Удалена дублирующаяся секция ui.dialogs.keyboardShortcuts (59 ключей)
- [x] 🇫🇷 Французский - ✅ ЗАВЕРШЕНО (1,583 ключа - 100% + расширенное управление кэшем)
  - [x] Удалены дублирующиеся ключи кэша из browser.toolbar (35 ключей)
  - [x] Удалена дублирующаяся секция ui.templates (51 ключ)
  - [x] Удалена дублирующаяся секция ui.dialogs.keyboardShortcuts (67 ключей)
  - [x] Удалена дублирующаяся секция titles.Templates (6 ключей)
  - [x] Удалена лишняя top-level секция cache (28 ключей)
- [x] 🇪🇸 Испанский - ✅ ЗАВЕРШЕНО (1,531 ключ - 100% + дополнительные функции)
  - [x] Добавлены все 8 недостающих категорий субтитров
  - [x] Содержит 7 дополнительных ключей (UI элементы и настройки скорости)
  - [x] Исправлены дублирующиеся ключи interpolation и motionBlur в options.speed
- [x] 🇵🇹 Португальский - ✅ ЗАВЕРШЕНО (1,524 ключа - 100% готово!)
  - [x] Добавлены все 105 недостающих ключей горячих клавиш
  - [x] Очищены устаревшие ключи
  - [x] Добавлены переводы секций timeline, titles, styleTemplates

#### Phase 2: Add New Languages
- [ ] 🇨🇳 Китайский (zh) - Создать zh.json со всеми 1,524 ключами
- [ ] 🇯🇵 Японский (ja) - Создать ja.json со всеми 1,524 ключами
- [ ] 🇰🇷 Корейский (ko) - Создать ko.json со всеми 1,524 ключами
- [ ] 🇹🇷 Турецкий (tr) - Создать tr.json со всеми 1,524 ключами
- [ ] 🇹🇭 Тайский (th) - Создать th.json со всеми 1,524 ключами
- [ ] 🇸🇦 Арабский (ar) - Создать ar.json со всеми 1,524 ключами (требуется поддержка RTL)
- [ ] 🇮🇷 Персидский/Фарси (fa) - Создать fa.json со всеми 1,524 ключами (требуется поддержка RTL)

#### Phase 3: Technical Implementation
- [ ] Update i18n configuration to support new languages
- [ ] Add language switcher UI for all 13 languages
- [ ] Implement RTL support for Arabic and Persian
- [ ] Update build process to include all language files
- [ ] Add language detection based on system locale

### Порядок приоритетов
1. **Высокий приоритет**: Добавить азиатские языки (китайский, японский, корейский)
2. **Средний приоритет**: Синхронизировать дополнительные функции между языками
3. **Обычный приоритет**: Добавить остальные языки (турецкий, тайский, арабский, персидский)
4. **Низкий приоритет**: Реализация технических улучшений (RTL поддержка, автоопределение языка)

### Contributing
We welcome contributions from native speakers! Please:
1. Fork the repository
2. Create a new branch for your language
3. Copy `src/i18n/locales/en.json` as a template
4. Translate all keys maintaining the same structure
5. Submit a pull request

### Resources
- Translation files location: `src/i18n/locales/`
- Base file for reference: `en.json`
- README files for context: `README.*.md` in project root