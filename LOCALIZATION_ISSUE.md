# Add support for 13 languages and complete existing translations

## 🌍 Multi-language Support Enhancement

Timeline Studio currently has README documentation in 13 languages, but the application itself only supports 6 languages. Additionally, existing translations are incomplete.

### Current Status

#### 📚 README Languages (13 total)
- ✅ Supported in app: English (en), German (de), French (fr), Russian (ru), Spanish (es), Portuguese (pt)
- ❌ Not supported in app: Chinese (zh), Japanese (ja), Korean (ko), Turkish (tr), Thai (th), Arabic (ar), Persian/Farsi (fa)

#### 📊 Translation Completeness (Updated Final Count)
Based on English (en.json) with **1,566 keys**:

| Language | Keys | Missing | Completeness |
|----------|------|---------|--------------|
| 🇷🇺 Russian | 1,566 | 0 | 100.0% |
| 🇪🇸 Spanish | 1,566 | 0 | 100.0% |
| 🇫🇷 French | 1,633 | 0 | 100.0% ✅ |
| 🇩🇪 German | 1,542 | 0 | 100.0% ✅ |
| 🇵🇹 Portuguese | ~1,457 | ~87 | 91.8% |

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
- [x] 🇷🇺 Russian - Sync with English ✅ COMPLETED (1566 keys - 100% complete!)
- [x] 🇪🇸 Spanish - Add 12 missing keys ✅ COMPLETED (1566 keys - 100% complete!)
- [x] 🇫🇷 French - ✅ COMPLETED! 1,204 → 1,633 keys (100% complete + extended coverage)
  - [x] ✅ Added ui.dialogs.export section (45 keys)
  - [x] ✅ Added modals error handling (8 keys)
  - [x] ✅ Added dialogs sections (camera, voice, keyboard shortcuts)
  - [x] ✅ Added templates sections (screens, labels, descriptions)
  - [x] ✅ Added top-level sections: resources, chat, source, styleTemplates, subtitles
  - [x] ✅ Added browser enhancements (cache management, toolbar options)
  - [x] ✅ Fixed template descriptions structure (25 keys)
  - [x] ✅ Added complete subtitles system with filters/errors (21 keys)
  - [x] ✅ Added options.speed with motion blur and presets (12 keys)
- [x] 🇩🇪 German - ✅ COMPLETED! 1,542 keys (100% complete + extended coverage)
- [ ] 🇵🇹 Portuguese - Add ~87 missing keys (~1457/1566 keys - 91.8% complete)
  - [x] ✅ Добавлена секция modals (16 ключей)
  - [x] ✅ Дополнены dialogs.cameraCapture и voiceRecord (6 ключей)
  - [x] ✅ Добавлена ui.templates (6 ключей)
  - [x] ✅ Расширена templates секция (130+ ключей)
  - [x] ✅ Добавлены templates.screens числовые значения (9 ключей)
  - [x] ✅ Добавлены templates.templateLabels (100+ макетов)
  - [x] ✅ Добавлены templates.templateDescriptions (12 описаний)
  - [ ] 🔄 Осталось: timeline, titles, styleTemplates и другие (~87 ключей)

#### Phase 2: Add New Languages
- [ ] 🇨🇳 Chinese (zh) - Create zh.json with all 1,566 keys
- [ ] 🇯🇵 Japanese (ja) - Create ja.json with all 1,566 keys
- [ ] 🇰🇷 Korean (ko) - Create ko.json with all 1,566 keys
- [ ] 🇹🇷 Turkish (tr) - Create tr.json with all 1,566 keys
- [ ] 🇹🇭 Thai (th) - Create th.json with all 1,566 keys
- [ ] 🇸🇦 Arabic (ar) - Create ar.json with all 1,566 keys (RTL support needed)
- [ ] 🇮🇷 Persian/Farsi (fa) - Create fa.json with all 1,566 keys (RTL support needed)

#### Phase 3: Technical Implementation
- [ ] Update i18n configuration to support new languages
- [ ] Add language switcher UI for all 13 languages
- [ ] Implement RTL support for Arabic and Persian
- [ ] Update build process to include all language files
- [ ] Add language detection based on system locale

### Priority Order
1. **High Priority**: Complete existing translations (especially Russian with only 31 missing keys)
2. **Medium Priority**: Add Asian languages (Chinese, Japanese, Korean) due to large user base
3. **Lower Priority**: Add remaining languages (Turkish, Thai, Arabic, Persian)

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