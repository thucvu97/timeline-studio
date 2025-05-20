# Руководство по стилям и CSS

Этот документ описывает подход к стилизации компонентов в проекте Timeline Studio, а также правила и рекомендации по работе с CSS.

## Обзор

Проект использует следующие технологии для стилизации:

- **Tailwind CSS** - утилитарный CSS-фреймворк
- **CSS Variables** - для управления темами и цветовыми схемами
- **Stylelint** - для проверки CSS кода
- **shadcn/ui** - библиотека компонентов на основе Radix UI

## Структура стилей

### Глобальные стили

Глобальные стили находятся в файле `src/styles/globals.css`. Этот файл содержит:

- Импорт Tailwind CSS
- Определение CSS переменных для тем
- Базовые стили для HTML-элементов
- Стили для скрытия полос прокрутки
- Стили для ползунков и других специфичных элементов

### Компонентные стили

Стили для компонентов определяются с помощью Tailwind CSS классов непосредственно в JSX:

```tsx
<div className="flex items-center justify-between p-4 bg-background text-foreground">
  <h1 className="text-2xl font-bold">Заголовок</h1>
  <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md">
    Кнопка
  </button>
</div>
```

## Темы и цветовые схемы

Проект поддерживает светлую и темную темы. Цветовые схемы определены в файле `src/styles/globals.css` с помощью CSS переменных:

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 20 14.3% 4.1%;
    --card: 0 0% 100%;
    --card-foreground: 20 14.3% 4.1%;
    /* ... другие переменные ... */
  }

  .dark {
    --background: #1b1a1f;
    --foreground: 60 9.1% 97.8%;
    --card: 20 14.3% 4.1%;
    --card-foreground: 60 9.1% 97.8%;
    /* ... другие переменные ... */
  }
}
```

Для использования этих переменных в компонентах:

```tsx
<div className="bg-background text-foreground">
  <div className="bg-card text-card-foreground">
    Карточка
  </div>
</div>
```

## Tailwind CSS

### Конфигурация

Конфигурация Tailwind CSS находится в файле `tailwind.config.js`. Она включает:

- Настройку темы
- Расширение цветовой палитры
- Определение пользовательских плагинов
- Настройку префиксов

### Утилитарные классы

Основные группы утилитарных классов:

- **Лейаут**: `flex`, `grid`, `container`, `p-*`, `m-*`, `w-*`, `h-*`
- **Типографика**: `text-*`, `font-*`, `leading-*`
- **Цвета**: `bg-*`, `text-*`, `border-*`
- **Эффекты**: `shadow-*`, `opacity-*`, `transition-*`

### Пример использования

```tsx
<div className="flex flex-col space-y-4 p-6 bg-card rounded-lg shadow-md">
  <h2 className="text-2xl font-bold text-card-foreground">Заголовок</h2>
  <p className="text-muted-foreground">Описание</p>
  <div className="flex justify-end">
    <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
      Кнопка
    </button>
  </div>
</div>
```

## Компоненты UI

Проект использует библиотеку shadcn/ui, которая предоставляет набор доступных и настраиваемых компонентов на основе Radix UI.

### Основные компоненты

- **Button** - кнопки различных стилей и размеров
- **Dialog** - модальные окна
- **Tabs** - вкладки
- **Select** - выпадающие списки
- **Checkbox** - флажки
- **Switch** - переключатели

### Пример использования

```tsx
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export function ExampleDialog() {
  return (
    <Dialog>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Заголовок диалога</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          Содержимое диалога
        </div>
        <Button type="submit">Сохранить</Button>
      </DialogContent>
    </Dialog>
  )
}
```

## Модальные окна

Для модальных окон используется специальный класс для задания размеров:

```tsx
<Dialog>
  <DialogContent className="h-[max(600px,min(50vh,800px))]">
    {/* Содержимое */}
  </DialogContent>
</Dialog>
```

## Линтинг CSS

Проект использует Stylelint для проверки CSS кода. Конфигурация находится в файле `.stylelintrc.json`.

### Основные правила

- Поддержка Tailwind CSS директив
- Игнорирование дублирующихся селекторов для совместимости с Tailwind
- Автоматическое исправление ошибок при сохранении файла (в VS Code)

### Запуск линтера

```bash
# Проверка CSS кода
bun lint:css

# Исправление ошибок
bun lint:css:fix
```

## Лучшие практики

1. **Используйте Tailwind CSS** - Предпочитайте утилитарные классы Tailwind CSS вместо написания собственных стилей.

2. **Следуйте компонентному подходу** - Создавайте переиспользуемые компоненты с консистентными стилями.

3. **Используйте CSS переменные для тем** - Все цвета и другие переменные темы должны быть определены через CSS переменные.

4. **Избегайте инлайн-стилей** - Вместо `style={{ color: 'red' }}` используйте классы Tailwind CSS.

5. **Используйте модификаторы для состояний** - Например, `hover:bg-primary/90` для изменения цвета при наведении.

6. **Следуйте принципу Mobile First** - Начинайте с мобильных стилей и добавляйте стили для больших экранов с помощью медиа-запросов.

7. **Используйте семантические классы** - Например, `bg-primary` вместо `bg-blue-500`.

8. **Запускайте линтер перед коммитом** - Убедитесь, что ваш CSS код соответствует стандартам проекта.

## Примеры

### Карточка

```tsx
<div className="bg-card rounded-lg shadow-md p-6">
  <h3 className="text-xl font-semibold text-card-foreground">Заголовок карточки</h3>
  <p className="mt-2 text-muted-foreground">Описание карточки</p>
  <div className="mt-4 flex justify-end">
    <Button variant="outline" className="mr-2">Отмена</Button>
    <Button>Подтвердить</Button>
  </div>
</div>
```

### Форма

```tsx
<form className="space-y-6">
  <div className="space-y-2">
    <Label htmlFor="name">Имя</Label>
    <Input id="name" placeholder="Введите имя" />
  </div>
  <div className="space-y-2">
    <Label htmlFor="email">Email</Label>
    <Input id="email" type="email" placeholder="Введите email" />
  </div>
  <div className="flex items-center space-x-2">
    <Checkbox id="terms" />
    <Label htmlFor="terms">Я согласен с условиями</Label>
  </div>
  <Button type="submit" className="w-full">Отправить</Button>
</form>
```
