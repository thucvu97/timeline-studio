// Примеры использования import.meta.glob в Vite

// 1. Загрузить все .md файлы из папки content/blog
const blogPosts = import.meta.glob("/content/blog/*.md")
// Результат: объект с путями как ключами и функциями импорта как значениями
// {
//   '/content/blog/post1.md': () => import('/content/blog/post1.md'),
//   '/content/blog/post2.md': () => import('/content/blog/post2.md'),
// }

// 2. Загрузить сразу (не лениво)
const blogPostsEager = import.meta.glob("/content/blog/*.md", { eager: true })
// Результат: объект с уже загруженными модулями
// {
//   '/content/blog/post1.md': { default: '# Post content...', metadata: {...} },
//   '/content/blog/post2.md': { default: '# Post content...', metadata: {...} },
// }

// 3. Загрузить как строки (raw text)
const blogPostsRaw = import.meta.glob("/content/blog/*.md", { as: "raw" })
// Результат: промисы, которые возвращают содержимое файлов как строки

// 4. Пример использования в компоненте
export async function loadAllBlogPosts() {
  const posts = import.meta.glob("/content/blog/*.md", { as: "raw" })

  const loadedPosts = []
  for (const path in posts) {
    const content = await posts[path]()
    const filename = path.split("/").pop()?.replace(".md", "")
    loadedPosts.push({
      slug: filename,
      content: content as string,
      path,
    })
  }

  return loadedPosts
}

// 5. С типизацией TypeScript
interface MarkdownModule {
  default: string
  metadata?: Record<string, any>
}

const typedPosts = import.meta.glob<MarkdownModule>("/content/blog/*.md")

// 6. Исключить файлы
const filteredPosts = import.meta.glob([
  "/content/blog/*.md",
  "!/content/blog/draft-*.md", // исключить черновики
])
