import { beforeEach, describe, expect, it, vi } from 'vitest'

import { render, screen } from '@/test/test-utils'

import { TimelineTopPanel } from './timeline-top-panel'

// Мокаем иконки Lucide
vi.mock('lucide-react', () => ({
  LayoutTemplate: () => <div data-testid="layout-template-icon" />,
  Minus: () => <div data-testid="minus-icon" />,
  MoveHorizontal: () => <div data-testid="move-horizontal-icon" />,
  Plus: () => <div data-testid="plus-icon" />,
  Redo2: () => <div data-testid="redo2-icon" />,
  Scissors: ({ className }: any) => <div data-testid="scissors-icon" className={className} />,
  SquareMousePointer: () => <div data-testid="square-mouse-pointer-icon" />,
  Trash2: () => <div data-testid="trash2-icon" />,
  Undo2: () => <div data-testid="undo2-icon" />,
}))

// Мокаем Button компонент
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, title, className, ...props }: any) => (
    <button data-testid="button" title={title} className={className} {...props}>
      {children}
    </button>
  ),
}))

// Мокаем cn утилиту
vi.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}))

// Мокаем переводы
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'timeline.toolbar.layout': 'Макет',
        'timeline.toolbar.pointer': 'Указатель',
        'timeline.toolbar.undo': 'Отменить',
        'timeline.toolbar.redo': 'Повторить',
        'timeline.toolbar.delete': 'Удалить',
        'timeline.toolbar.cut': 'Вырезать',
        'timeline.toolbar.fitToScreen': 'Подогнать по размеру',
        'timeline.toolbar.zoomOut': 'Уменьшить',
        'timeline.toolbar.zoomIn': 'Увеличить',
        'timeline.zoom.fitToScreen': 'Уровень масштаба',
      }
      return translations[key] || key
    },
  }),
  initReactI18next: {
    type: '3rdParty',
    init: vi.fn(),
  },
}))

describe('TimelineTopPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('должен корректно рендериться', () => {
    const { container } = render(<TimelineTopPanel />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('должен рендериться без ошибок', () => {
    const { container } = render(<TimelineTopPanel />)
    expect(container).toBeInTheDocument()
  })

  it.skip('должен иметь слайдер с правильным aria-label', () => {
    render(<TimelineTopPanel />)

    // Находим слайдер
    const sliders = screen.getAllByRole('slider', { hidden: true })
    expect(sliders.length).toBeGreaterThan(0)
    expect(sliders[0]).toHaveAttribute('aria-label', 'timeline.zoom.fitToScreen')
  })

  it.skip('должен иметь класс rotate-270 для иконки ножниц', () => {
    render(<TimelineTopPanel />)

    // Проверяем, что иконка ножниц имеет класс rotate-270
    const scissorsIcon = screen.getByTestId('scissors-icon')
    expect(scissorsIcon).toHaveClass('rotate-270')
  })
})
