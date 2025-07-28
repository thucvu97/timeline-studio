// Функция для динамической загрузки markdown файлов
// В развернутом виде можно использовать import.meta.glob для Vite

export async function loadMarkdownFile(path: string): Promise<string> {
  try {
    const response = await fetch(path)
    if (!response.ok) {
      throw new Error(`Failed to load ${path}`)
    }
    return await response.text()
  } catch (error) {
    console.error('Error loading markdown file:', error)
    return ''
  }
}

// Для использования с Vite glob imports в будущем:
// const blogPosts = import.meta.glob('/content/blog/*.md')
// const changelogEntries = import.meta.glob('/content/changelog/*.md')