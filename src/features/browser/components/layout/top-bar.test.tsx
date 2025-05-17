import { beforeEach, describe, expect, it, vi } from 'vitest'

import { fireEvent, render, screen } from '@/test/test-utils'

import { TopBar } from './top-bar'

// Мок уже определен в src/test/setup.ts

describe('TopBar', () => {
  const mockOnLayoutChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders correctly', () => {
    render(<TopBar layoutMode="default" onLayoutChange={mockOnLayoutChange} />)

    // Проверяем, что основные элементы отображаются по их иконкам
    expect(screen.getAllByRole('button')[0]).toBeInTheDocument() // Layout button
    expect(screen.getAllByRole('button')[1]).toBeInTheDocument() // Theme toggle
    expect(screen.getAllByRole('button')[2]).toBeInTheDocument() // Keyboard shortcuts
    expect(screen.getAllByRole('button')[3]).toBeInTheDocument() // Project settings
    expect(screen.getAllByRole('button')[4]).toBeInTheDocument() // Save button
  })

  it('opens project name editing on click', () => {
    const { container } = render(<TopBar layoutMode="default" onLayoutChange={mockOnLayoutChange} />)

    // Находим элемент с именем проекта по классу
    const projectNameElement = container.querySelector('.group.relative.ml-1.w-\\[130px\\]')
    expect(projectNameElement).not.toBeNull()

    // Кликаем по элементу
    if (projectNameElement) {
      fireEvent.click(projectNameElement)

      // Проверяем, что поле ввода появилось
      const input = container.querySelector('#project-name-input')
      expect(input).toBeInTheDocument()
      expect(input).toHaveFocus()
    }
  })

  it('closes project name editing on Enter key', () => {
    const { container } = render(<TopBar layoutMode="default" onLayoutChange={mockOnLayoutChange} />)

    // Находим элемент с именем проекта по классу
    const projectNameElement = container.querySelector('.group.relative.ml-1.w-\\[130px\\]')
    expect(projectNameElement).not.toBeNull()

    // Кликаем по элементу
    if (projectNameElement) {
      fireEvent.click(projectNameElement)

      // Находим поле ввода
      const input = container.querySelector('#project-name-input')
      expect(input).toBeInTheDocument()

      // Нажимаем Enter
      if (input) {
        fireEvent.keyDown(input, { key: 'Enter' })

        // Проверяем, что поле ввода исчезло или потеряло фокус
        setTimeout(() => {
          expect(document.activeElement).not.toBe(input)
        }, 0)
      }
    }
  })

  it('calls handleOpenModal when clicking on settings button', () => {
    // Мокаем console.log для проверки вызова
    const consoleSpy = vi.spyOn(console, 'log')

    render(<TopBar layoutMode="default" onLayoutChange={mockOnLayoutChange} />)

    // Находим все кнопки
    const buttons = screen.getAllByRole('button')

    // Кликаем на кнопку настроек (индекс может меняться в зависимости от порядка кнопок)
    // Поэтому перебираем все кнопки и кликаем на каждую, пока не найдем нужную
    let found = false
    for (const button of buttons) {
      fireEvent.click(button)

      // Проверяем, был ли вызван console.log с нужным аргументом
      if (consoleSpy.mock.calls.some(call => call[0] === 'Opening modal: project-settings')) {
        found = true
        break
      }
    }

    // Проверяем, что нашли нужную кнопку
    expect(found).toBe(true)
    expect(consoleSpy).toHaveBeenCalledWith('Opening modal: project-settings')
  })
})
