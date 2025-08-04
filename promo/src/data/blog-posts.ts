// Явный импорт всех постов блога

// English posts
import enIntroducingRaw from '../../content/blog/en/introducing-timeline-studio.md?raw'
import enAiEditingRaw from '../../content/blog/en/ai-video-editing-guide.md?raw'
import enAlphaReleaseRaw from '../../content/blog/en/alpha-release-ollama-integration.md?raw'

// Russian posts
import ruIntroducingRaw from '../../content/blog/ru/introducing-timeline-studio.md?raw'
import ruAiEditingRaw from '../../content/blog/ru/ai-video-editing-guide.md?raw'
import ruAlphaReleaseRaw from '../../content/blog/ru/alpha-release-ollama-integration.md?raw'

export const blogPostsRaw = {
  en: {
    'introducing-timeline-studio': enIntroducingRaw,
    'ai-video-editing-guide': enAiEditingRaw,
    'alpha-release-ollama-integration': enAlphaReleaseRaw,
    'getting-started-ai-editing': enAiEditingRaw, // alias for compatibility
  },
  ru: {
    'introducing-timeline-studio': ruIntroducingRaw,
    'ai-video-editing-guide': ruAiEditingRaw,
    'alpha-release-ollama-integration': ruAlphaReleaseRaw,
    'getting-started-ai-editing': ruAiEditingRaw, // alias for compatibility
  }
}

export const blogPostsList = {
  en: [
    enAlphaReleaseRaw,
    enIntroducingRaw,
    enAiEditingRaw,
  ],
  ru: [
    ruAlphaReleaseRaw,
    ruIntroducingRaw,
    ruAiEditingRaw,
  ]
}