# Translation Status Report

Generated on: 2025-06-17

## Summary

The English base file contains **1,524 translation keys**.

| Language | Total Keys | Missing Keys | Extra Keys | Completeness |
|----------|------------|--------------|------------|--------------|
| English (en) | 1,524 | - | - | 100.0% |
| German (de) | 1,658 | 0 | 134 | 100.0% |
| Spanish (es) | 1,531 | 0 | 7 | 100.0% |
| French (fr) | 1,583 | 10 | 69 | 99.3% |
| Portuguese (pt) | 1,524 | 0 | 0 | 100.0% |
| Russian (ru) | 1,524 | 0 | 0 | 100.0% |

## Details

### French (fr.json) - Missing Keys
The following 10 keys are missing from the French translation:
- `titles.Templates.bold`
- `titles.Templates.italic`
- `titles.Templates.strikethrough`
- `titles.Templates.underline`
- `ui.templates.diagonalSplit`
- `ui.templates.grid2x2`
- `ui.templates.grid3x3`
- `ui.templates.grid4x4`
- `ui.templates.horizontalSplit`
- `ui.templates.verticalSplit`

### German (de.json) - Extra Keys
German has 134 extra keys not present in English, including:
- Chat-related keys: `chat.copied`, `chat.copy`, `chat.errorGeneral`, etc.
- Modal keys: `modals.mediaGroup.title`, `modals.mediaImport.title`, etc.
- Speed options: `options.speed.enableSmooth`, `options.speed.performance`, etc.
- Various resource and template keys

### Spanish (es.json) - Extra Keys
Spanish has 7 extra keys:
- `options.speed.enableSmooth`
- `options.speed.performance`
- `options.speed.quality`
- `options.speed.smoothness`
- `options.speed.smoothPlayback`
- `ui.topBar.cameraCapture`
- `ui.topBar.voiceRecording`

### French (fr.json) - Extra Keys
French has 69 extra keys, primarily in:
- Speed options (same as Spanish)
- Style templates: `styleTemplates.animation`, `styleTemplates.background`, etc.
- Various style categories

### Perfect Translations
- **Portuguese (pt.json)** - Exact match with English (1,524 keys)
- **Russian (ru.json)** - Exact match with English (1,524 keys)

## Recommendations

1. **French**: Add the 10 missing keys to achieve 100% completeness
2. **German**: Review the 134 extra keys - they may be deprecated or specific to an older version
3. **Spanish & French**: The extra speed option keys might be new features that need to be added to English
4. **All languages**: Consider whether the extra keys in German represent features that should be added to all languages

## Key Patterns

Most missing/extra keys are in these categories:
- UI templates and layout options
- Speed/performance settings
- Chat functionality (German only)
- Modal dialogs (German only)
- Style templates (French only)