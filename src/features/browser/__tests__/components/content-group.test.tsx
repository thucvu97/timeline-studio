import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { ContentGroup } from "../../components/content-group"

// Мокаем зависимости
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "common.allFilesAdded": "All files added",
        "common.add": "Add",
      }
      return translations[key] || key
    },
  }),
}))

vi.mock("lucide-react", () => ({
  CopyPlus: ({ className }: { className: string }) => (
    <div data-testid="copy-plus-icon" className={className}>
      CopyPlus Icon
    </div>
  ),
}))

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, className, onClick, disabled, ...props }: any) => (
    <button className={className} onClick={onClick} disabled={disabled} data-testid="group-button" {...props}>
      {children}
    </button>
  ),
}))

vi.mock("@/lib/utils", () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(" "),
}))

// Тестовые данные
interface TestItem {
  id: string
  name: string
}

const createTestItems = (count: number): TestItem[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `item-${i + 1}`,
    name: `Item ${i + 1}`,
  }))

const defaultRenderItem = (item: TestItem) => (
  <div key={item.id} data-testid={`item-${item.id}`}>
    {item.name}
  </div>
)

describe("ContentGroup", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("основной рендеринг", () => {
    it("должен возвращать null для пустой группы", () => {
      const { container } = render(<ContentGroup title="Test Group" items={[]} renderItem={defaultRenderItem} />)

      expect(container.firstChild).toBeNull()
    })

    it("должен рендерить группу с заголовком и элементами", () => {
      const items = createTestItems(3)
      render(<ContentGroup title="Test Group" items={items} renderItem={defaultRenderItem} />)

      expect(screen.getByText("Test Group")).toBeInTheDocument()
      expect(screen.getByTestId("item-item-1")).toBeInTheDocument()
      expect(screen.getByTestId("item-item-2")).toBeInTheDocument()
      expect(screen.getByTestId("item-item-3")).toBeInTheDocument()
    })

    it("должен рендерить только элементы без обертки, если нет заголовка", () => {
      const items = createTestItems(2)
      const { container } = render(<ContentGroup title="" items={items} renderItem={defaultRenderItem} />)

      // Проверяем, что нет заголовка
      expect(screen.queryByRole("heading")).not.toBeInTheDocument()

      // Проверяем, что элементы рендерятся
      expect(screen.getByTestId("item-item-1")).toBeInTheDocument()
      expect(screen.getByTestId("item-item-2")).toBeInTheDocument()

      // Проверяем, что нет обертки с классом mb-4
      expect(container.querySelector(".mb-4")).not.toBeInTheDocument()
    })
  })

  describe("режимы отображения", () => {
    it("должен применять правильные классы для режима thumbnails", () => {
      const items = createTestItems(2)
      render(<ContentGroup title="Test Group" items={items} viewMode="thumbnails" renderItem={defaultRenderItem} />)

      const itemsContainer = screen.getByTestId("item-item-1").parentElement
      expect(itemsContainer).toHaveClass("flex", "flex-wrap", "justify-between", "gap-3")
    })

    it("должен применять правильные классы для режима grid", () => {
      const items = createTestItems(2)
      render(<ContentGroup title="Test Group" items={items} viewMode="grid" renderItem={defaultRenderItem} />)

      const itemsContainer = screen.getByTestId("item-item-1").parentElement
      expect(itemsContainer).toHaveClass("items-left", "flex", "flex-wrap", "gap-3")
    })

    it("должен применять правильные классы для режима list", () => {
      const items = createTestItems(2)
      render(<ContentGroup title="Test Group" items={items} viewMode="list" renderItem={defaultRenderItem} />)

      const itemsContainer = screen.getByTestId("item-item-1").parentElement
      expect(itemsContainer).toHaveClass("space-y-1")
    })

    it("должен использовать режим thumbnails по умолчанию", () => {
      const items = createTestItems(2)
      render(<ContentGroup title="Test Group" items={items} renderItem={defaultRenderItem} />)

      const itemsContainer = screen.getByTestId("item-item-1").parentElement
      expect(itemsContainer).toHaveClass("flex", "flex-wrap", "justify-between", "gap-3")
    })
  })

  describe("кнопка добавления всех элементов", () => {
    it("должен отображать кнопку добавления при наличии onAddAll", () => {
      const items = createTestItems(2)
      const onAddAll = vi.fn()

      render(<ContentGroup title="Test Group" items={items} renderItem={defaultRenderItem} onAddAll={onAddAll} />)

      const button = screen.getByTestId("group-button")
      expect(button).toBeInTheDocument()
      expect(button).toHaveTextContent("Add")
      expect(screen.getByTestId("copy-plus-icon")).toBeInTheDocument()
    })

    it("не должен отображать кнопку добавления без onAddAll", () => {
      const items = createTestItems(2)

      render(<ContentGroup title="Test Group" items={items} renderItem={defaultRenderItem} />)

      expect(screen.queryByTestId("group-button")).not.toBeInTheDocument()
    })

    it("должен вызывать onAddAll при клике на кнопку", () => {
      const items = createTestItems(2)
      const onAddAll = vi.fn()

      render(<ContentGroup title="Test Group" items={items} renderItem={defaultRenderItem} onAddAll={onAddAll} />)

      const button = screen.getByTestId("group-button")
      fireEvent.click(button)

      expect(onAddAll).toHaveBeenCalledWith(items)
    })

    it("должен отображать состояние когда все элементы добавлены", () => {
      const items = createTestItems(2)
      const onAddAll = vi.fn()
      const areAllItemsAdded = vi.fn(() => true)

      render(
        <ContentGroup
          title="Test Group"
          items={items}
          renderItem={defaultRenderItem}
          onAddAll={onAddAll}
          areAllItemsAdded={areAllItemsAdded}
        />,
      )

      const button = screen.getByTestId("group-button")
      expect(button).toHaveTextContent("All files added")
      expect(button).toBeDisabled()
      expect(button).toHaveClass("cursor-not-allowed", "opacity-50")
    })

    it("должен использовать кастомный текст для кнопок", () => {
      const items = createTestItems(2)
      const onAddAll = vi.fn()

      const { rerender } = render(
        <ContentGroup
          title="Test Group"
          items={items}
          renderItem={defaultRenderItem}
          onAddAll={onAddAll}
          addButtonText="Add All Items"
        />,
      )

      expect(screen.getByTestId("group-button")).toHaveTextContent("Add All Items")

      // Перерендериваем с состоянием "все добавлены"
      const areAllItemsAdded = vi.fn(() => true)
      rerender(
        <ContentGroup
          title="Test Group"
          items={items}
          renderItem={defaultRenderItem}
          onAddAll={onAddAll}
          areAllItemsAdded={areAllItemsAdded}
          addedButtonText="Everything Added"
        />,
      )

      expect(screen.getByTestId("group-button")).toHaveTextContent("Everything Added")
    })
  })

  describe("кастомные стили и классы", () => {
    it("должен применять кастомные классы для контейнера элементов", () => {
      const items = createTestItems(2)

      render(
        <ContentGroup
          title="Test Group"
          items={items}
          renderItem={defaultRenderItem}
          itemsContainerClassName="custom-class-1 custom-class-2"
        />,
      )

      const itemsContainer = screen.getByTestId("item-item-1").parentElement
      expect(itemsContainer).toHaveClass("custom-class-1", "custom-class-2")
    })

    it("должен применять кастомные стили для контейнера элементов", () => {
      const items = createTestItems(2)
      const customStyle = {
        backgroundColor: "red",
        padding: "20px",
      }

      render(
        <ContentGroup
          title="Test Group"
          items={items}
          renderItem={defaultRenderItem}
          itemsContainerStyle={customStyle}
        />,
      )

      const itemsContainer = screen.getByTestId("item-item-1").parentElement
      expect(itemsContainer).toHaveStyle({
        padding: "20px",
      })
      // backgroundColor проверяем отдельно из-за особенностей toHaveStyle
      expect(itemsContainer).toHaveAttribute("style", expect.stringContaining("background-color: red"))
    })

    it("должен применять кастомные классы и стили одновременно", () => {
      const items = createTestItems(2)

      render(
        <ContentGroup
          title="Test Group"
          items={items}
          renderItem={defaultRenderItem}
          itemsContainerClassName="custom-class"
          itemsContainerStyle={{ marginTop: "10px" }}
        />,
      )

      const itemsContainer = screen.getByTestId("item-item-1").parentElement
      expect(itemsContainer).toHaveClass("custom-class")
      expect(itemsContainer).toHaveStyle({ marginTop: "10px" })
    })
  })

  describe("renderItem callback", () => {
    it("должен передавать правильный индекс в renderItem", () => {
      const items = createTestItems(3)
      const renderItem = vi.fn((item: TestItem, index: number) => (
        <div key={item.id} data-index={index}>
          {item.name}
        </div>
      ))

      render(<ContentGroup title="Test Group" items={items} renderItem={renderItem} />)

      expect(renderItem).toHaveBeenCalledTimes(3)
      expect(renderItem).toHaveBeenNthCalledWith(1, items[0], 0)
      expect(renderItem).toHaveBeenNthCalledWith(2, items[1], 1)
      expect(renderItem).toHaveBeenNthCalledWith(3, items[2], 2)
    })
  })

  describe("интеграционные тесты", () => {
    it("должен корректно обрабатывать динамическое изменение элементов", () => {
      const { rerender } = render(
        <ContentGroup title="Test Group" items={createTestItems(2)} renderItem={defaultRenderItem} />,
      )

      expect(screen.getByTestId("item-item-1")).toBeInTheDocument()
      expect(screen.getByTestId("item-item-2")).toBeInTheDocument()
      expect(screen.queryByTestId("item-item-3")).not.toBeInTheDocument()

      // Добавляем элемент
      rerender(<ContentGroup title="Test Group" items={createTestItems(3)} renderItem={defaultRenderItem} />)

      expect(screen.getByTestId("item-item-3")).toBeInTheDocument()
    })

    it("должен корректно обрабатывать изменение состояния areAllItemsAdded", () => {
      const items = createTestItems(2)
      const onAddAll = vi.fn()
      let allAdded = false
      const areAllItemsAdded = vi.fn(() => allAdded)

      const { rerender } = render(
        <ContentGroup
          title="Test Group"
          items={items}
          renderItem={defaultRenderItem}
          onAddAll={onAddAll}
          areAllItemsAdded={areAllItemsAdded}
        />,
      )

      const button = screen.getByTestId("group-button")
      expect(button).not.toBeDisabled()
      expect(button).toHaveTextContent("Add")

      // Изменяем состояние
      allAdded = true
      rerender(
        <ContentGroup
          title="Test Group"
          items={items}
          renderItem={defaultRenderItem}
          onAddAll={onAddAll}
          areAllItemsAdded={areAllItemsAdded}
        />,
      )

      expect(button).toBeDisabled()
      expect(button).toHaveTextContent("All files added")
    })

    it("должен корректно работать с разными типами данных", () => {
      interface CustomItem {
        uuid: string
        title: string
        data: { value: number }
      }

      const customItems: CustomItem[] = [
        { uuid: "uuid-1", title: "Custom 1", data: { value: 100 } },
        { uuid: "uuid-2", title: "Custom 2", data: { value: 200 } },
      ]

      const renderCustomItem = (item: CustomItem) => (
        <div key={item.uuid} data-testid={item.uuid}>
          {item.title}: {item.data.value}
        </div>
      )

      render(<ContentGroup title="Custom Group" items={customItems} renderItem={renderCustomItem} />)

      expect(screen.getByText("Custom 1: 100")).toBeInTheDocument()
      expect(screen.getByText("Custom 2: 200")).toBeInTheDocument()
    })
  })
})
