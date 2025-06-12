# Modals - Техническая документация

## 📁 Структура файлов

### ✅ Полная структура реализована
```
src/features/modals/
├── components/
│   ├── modal-container.tsx ✅
│   └── index.ts ✅
├── services/
│   ├── modal-machine.ts ✅
│   ├── modal-provider.tsx ✅
│   └── index.ts ✅
└── index.ts ✅
```

**Примечание**: Сами модальные окна реализованы в соответствующих модулях:
- `@/features/camera-capture` - CameraCaptureModal
- `@/features/export` - ExportModal  
- `@/features/keyboard-shortcuts` - KeyboardShortcutsModal
- `@/features/project-settings` - ProjectSettingsModal
- `@/features/user-settings` - UserSettingsModal
- `@/features/voice-recording` - VoiceRecordModal

### 🧪 Тестовое покрытие
```
├── components/
│   └── modal-container.test.tsx ✅
└── services/
    ├── modal-machine.test.ts ✅
    └── modal-provider.test.tsx ✅
```

## 🔧 Машина состояний

### ModalMachine
**Файл**: `services/modal-machine.ts`
**Статус**: ✅ Полностью реализован

**Контекст**:
```typescript
interface ModalContext {
  activeModal: string | null
  modalData: any
  isOpen: boolean
  canClose: boolean
}
```

## 🏗️ Архитектура

### ModalContainer
**Файл**: `components/modal-container.tsx`
**Статус**: ✅ Полностью реализован

### ModalProvider
**Файл**: `services/modal-provider.tsx`
**Статус**: ✅ Полностью реализован

## 📦 Модальные окна

### Доступные модалы
- Camera Capture
- Export
- Keyboard Shortcuts
- Project Settings
- User Settings
- Voice Recording
