import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useEffectsImport } from '../hooks/use-effects-import';

// Мокаем Tauri dialog
vi.mock('@tauri-apps/plugin-dialog', () => ({
  open: vi.fn()
}));

// Мокаем fetch
vi.mock('global', () => ({
  fetch: vi.fn()
}));

describe('useEffectsImport', () => {
  it('should initialize with correct default values', () => {
    const { result } = renderHook(() => useEffectsImport());

    expect(result.current.isImporting).toBe(false);
    expect(result.current.progress).toBe(0);
    expect(typeof result.current.importEffectsFile).toBe('function');
    expect(typeof result.current.importEffectFile).toBe('function');
  });

  it('should have importEffectsFile function', () => {
    const { result } = renderHook(() => useEffectsImport());
    expect(result.current.importEffectsFile).toBeDefined();
  });

  it('should have importEffectFile function', () => {
    const { result } = renderHook(() => useEffectsImport());
    expect(result.current.importEffectFile).toBeDefined();
  });

  it('should track importing state', () => {
    const { result } = renderHook(() => useEffectsImport());
    expect(result.current.isImporting).toBe(false);
  });

  it('should track progress', () => {
    const { result } = renderHook(() => useEffectsImport());
    expect(result.current.progress).toBe(0);
  });
});
