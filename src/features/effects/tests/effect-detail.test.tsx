import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { VideoEffect } from '@/types/effects';

import { EffectDetail } from '../components/effect-detail';

// Мокаем react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
    i18n: { language: 'en' }
  })
}));

// Мокаем UI компоненты
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: any) => <h2 data-testid="dialog-title">{children}</h2>
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children }: any) => <button>{children}</button>
}));

vi.mock('@/components/ui/separator', () => ({
  Separator: () => <hr data-testid="separator" />
}));

// Мокаем дочерние компоненты
vi.mock('../components/effect-indicators', () => ({
  EffectIndicators: () => <div data-testid="effect-indicators">indicators</div>
}));

vi.mock('../components/effect-preview', () => ({
  EffectPreview: () => <div data-testid="effect-preview">preview</div>
}));

vi.mock('../components/effect-presets', () => ({
  EffectPresets: () => <div data-testid="effect-presets">presets</div>
}));

vi.mock('../components/effect-parameter-controls', () => ({
  EffectParameterControls: () => <div data-testid="effect-parameter-controls">controls</div>
}));

describe('EffectDetail', () => {
  const mockEffect: VideoEffect = {
    id: 'test-effect',
    name: 'Test Effect',
    type: 'blur',
    duration: 1000,
    category: 'artistic',
    complexity: 'basic',
    tags: ['popular'],
    description: { ru: 'Тестовый эффект', en: 'Test effect' },
    ffmpegCommand: (params) => `blur=${params.intensity || 50}`,
    params: {
      intensity: 50,
      radius: 5
    },
    previewPath: '/test-preview.mp4',
    labels: {
      ru: 'Тестовый эффект',
      en: 'Test Effect',
      es: 'Efecto de prueba',
      fr: 'Effet de test',
      de: 'Testeffekt'
    }
  };

  const mockOnClose = vi.fn();
  const mockOnApplyEffect = vi.fn();

  it('should not render when effect is null', () => {
    const { container } = render(
      <EffectDetail
        effect={null}
        isOpen={true}
        onClose={mockOnClose}
        onApplyEffect={mockOnApplyEffect}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render effect detail dialog when open', () => {
    const { container } = render(
      <EffectDetail
        effect={mockEffect}
        isOpen={true}
        onClose={mockOnClose}
        onApplyEffect={mockOnApplyEffect}
      />
    );

    expect(container).toBeInTheDocument();
  });

  it('should not render when isOpen is false', () => {
    const { container } = render(
      <EffectDetail
        effect={mockEffect}
        isOpen={false}
        onClose={mockOnClose}
        onApplyEffect={mockOnApplyEffect}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render with effect that has no params', () => {
    const effectWithoutParams = { ...mockEffect, params: undefined };

    const { container } = render(
      <EffectDetail
        effect={effectWithoutParams}
        isOpen={true}
        onClose={mockOnClose}
        onApplyEffect={mockOnApplyEffect}
      />
    );

    expect(container).toBeInTheDocument();
  });

  it('should render with effect that has presets', () => {
    const effectWithPresets = {
      ...mockEffect,
      presets: {
        light: {
          name: { ru: 'Легкий', en: 'Light' },
          params: { intensity: 25, radius: 2 },
          description: { ru: 'Легкий эффект', en: 'Light effect' }
        }
      }
    };

    const { container } = render(
      <EffectDetail
        effect={effectWithPresets}
        isOpen={true}
        onClose={mockOnClose}
        onApplyEffect={mockOnApplyEffect}
      />
    );

    expect(container).toBeInTheDocument();
  });

  it('should render with complex effect data', () => {
    const complexEffect = {
      ...mockEffect,
      params: {
        intensity: 75,
        radius: 10,
        speed: 2.0,
        angle: 45,
        temperature: -20,
        tint: 15
      },
      presets: {
        light: {
          name: { ru: 'Легкий', en: 'Light' },
          params: { intensity: 25, radius: 2 },
          description: { ru: 'Легкий эффект', en: 'Light effect' }
        },
        heavy: {
          name: { ru: 'Сильный', en: 'Heavy' },
          params: { intensity: 90, radius: 20 },
          description: { ru: 'Сильный эффект', en: 'Heavy effect' }
        }
      }
    };

    const { container } = render(
      <EffectDetail
        effect={complexEffect}
        isOpen={true}
        onClose={mockOnClose}
        onApplyEffect={mockOnApplyEffect}
      />
    );

    expect(container).toBeInTheDocument();
  });
});
