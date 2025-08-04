import { useEffect, useState } from "react"
import type { Post, PostMetadata } from "../utils/markdown"
import { parseMarkdown } from "../utils/markdown"
import { blogPostsList, blogPostsRaw } from "../data/blog-posts"

// Загрузка всех постов блога
export function useBlogPosts() {
  const [posts, setPosts] = useState<PostMetadata[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadPosts() {
      try {
        // Используем явно импортированные посты
        const loadedPosts: PostMetadata[] = []
        
        for (const content of blogPostsList) {
          const { metadata } = parseMarkdown(content)
          
          // Если slug не задан, генерируем из заголовка
          if (!metadata.slug) {
            metadata.slug = metadata.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
          }
          
          loadedPosts.push(metadata)
        }

        // Сортируем по дате (новые первые)
        loadedPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        setPosts(loadedPosts)
      } catch (error) {
        console.error("Error loading blog posts:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadPosts()
  }, [])

  return { posts, isLoading }
}

// Загрузка одного поста
export function useBlogPost(slug: string) {
  const [post, setPost] = useState<Post | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadPost() {
      try {
        // Используем явные импорты
        const content = blogPostsRaw[slug as keyof typeof blogPostsRaw]
        
        if (content) {
          const parsedPost = parseMarkdown(content)
          setPost(parsedPost)
        } else {
          console.error("Post not found for slug:", slug)
        }
      } catch (error) {
        console.error("Error loading blog post:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadPost()
  }, [slug])

  return { post, isLoading }
}

// Загрузка changelog записей
export function useChangelogEntries() {
  const [entries, setEntries] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadEntries() {
      try {
        const changelogFiles = import.meta.glob("../../content/changelog/*.md", { 
          as: "raw"
        })

        const loadedEntries: Post[] = []

        for (const path in changelogFiles) {
          const content = await changelogFiles[path]() as string
          const entry = parseMarkdown(content)
          loadedEntries.push(entry)
        }

        // Сортируем по версии или дате
        loadedEntries.sort((a, b) => {
          if (a.metadata.version && b.metadata.version) {
            return b.metadata.version.localeCompare(a.metadata.version)
          }
          return new Date(b.metadata.date).getTime() - new Date(a.metadata.date).getTime()
        })

        setEntries(loadedEntries)
      } catch (error) {
        console.error("Error loading changelog entries:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadEntries()
  }, [])

  return { entries, isLoading }
}