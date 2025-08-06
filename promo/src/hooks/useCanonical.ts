import { useEffect } from "react"
import { useLocation } from "react-router-dom"

export function useCanonical() {
  const location = useLocation()

  useEffect(() => {
    // Удаляем существующий canonical, если есть
    const existingCanonical = document.querySelector('link[rel="canonical"]')
    if (existingCanonical) {
      existingCanonical.remove()
    }

    // Создаем новый canonical link
    const canonicalURL = `https://timelinestudio.pro${location.pathname}`
    const link = document.createElement("link")
    link.rel = "canonical"
    link.href = canonicalURL.replace(/\/$/, "") // Убираем trailing slash
    document.head.appendChild(link)

    // Cleanup при размонтировании
    return () => {
      const canonical = document.querySelector('link[rel="canonical"]')
      if (canonical) {
        canonical.remove()
      }
    }
  }, [location.pathname])
}
