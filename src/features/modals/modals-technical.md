# Modals - Техническая документация

## 📁 Структура файлов

### ✅ Полная структура реализована
```
src/features/modals/
├── components/
│   ├── modal-container.tsx ✅
│   └── index.ts ✅
├── features/
│   ├── camera-capture/ ✅
│   ├── export/ ✅
│   ├── keyboard-shortcuts/ ✅
│   ├── project-settings/ ✅
│   ├── user-settings/ ✅
│   ├── voice-recording/ ✅
│   └── index.ts ✅
├── services/
│   ├── modal-machine.ts ✅
│   ├── modal-provider.tsx ✅
│   └── index.ts ✅
└── index.ts ✅
```

### 🧪 Тестовое покрытие
```
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
