import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Автоматическая очистка после каждого теста
afterEach(() => {
  cleanup()
})

// Мок для window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // устаревший
    removeListener: vi.fn(), // устаревший
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Мок для Tauri API
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn().mockImplementation((cmd: string, args?: Record<string, unknown>) => {
    if (cmd === 'get_app_language') {
      return Promise.resolve({
        language: 'ru',
        system_language: 'ru'
      })
    }
    if (cmd === 'set_app_language') {
      // Безопасное приведение типа
      const lang = args && 'lang' in args ? String(args.lang) : 'ru'
      return Promise.resolve({
        language: lang,
        system_language: 'ru'
      })
    }
    return Promise.resolve(null)
  })
}))

// Мок для react-hotkeys-hook
vi.mock('react-hotkeys-hook', () => ({
  useHotkeys: vi.fn()
}))

// Мок для react-i18next
vi.mock('react-i18next', () => ({
  // Этот мок заменяет хук useTranslation
  useTranslation: () => {
    return {
      t: (key: string) => key, // Просто возвращаем ключ перевода как есть
      i18n: {
        changeLanguage: vi.fn(),
        language: 'ru',
      },
    }
  },
  // Добавляем initReactI18next
  initReactI18next: {
    type: '3rdParty',
    init: vi.fn(),
  },
  // Добавляем I18nextProvider
  I18nextProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// Мок для localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      // Используем присвоение undefined вместо delete
      store = Object.fromEntries(
        Object.entries(store).filter(([k]) => k !== key)
      )
    },
    clear: () => {
      store = {}
    }
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})
