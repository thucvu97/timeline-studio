interface ParsedVersion {
  version: string
  date: string
  features: string[]
  fixes: string[]
  improvements: string[]
  breaking?: string[]
}

export function parseChangelog(markdown: string): ParsedVersion[] {
  const versions: ParsedVersion[] = []
  const versionBlocks = markdown.split(/^#{1,2} \[/m).filter(block => block.trim())
  
  for (const block of versionBlocks) {
    const versionMatch = block.match(/^(\d+\.\d+\.\d+)\].*?\((\d{4}-\d{2}-\d{2})\)/)
    if (!versionMatch) continue
    
    const [, version, date] = versionMatch
    const features: string[] = []
    const fixes: string[] = []
    const improvements: string[] = []
    const breaking: string[] = []
    
    // Parse features
    const featuresMatch = block.match(/### Features([\s\S]*?)(?=###|$)/i)
    if (featuresMatch) {
      const items = featuresMatch[1].match(/^\* (.+)$/gm) || []
      features.push(...items.map(item => {
        // Remove commit prefix like "**promo:**" and hash
        return item
          .replace(/^\* /, '')
          .replace(/\*\*[^:]+:\*\* /, '')
          .replace(/ \([a-f0-9]{7,}\)$/, '')
          .trim()
      }))
    }
    
    // Parse fixes
    const fixesMatch = block.match(/### Bug Fixes([\s\S]*?)(?=###|$)/i)
    if (fixesMatch) {
      const items = fixesMatch[1].match(/^\* (.+)$/gm) || []
      fixes.push(...items.map(item => {
        return item
          .replace(/^\* /, '')
          .replace(/\*\*[^:]+:\*\* /, '')
          .replace(/ \([a-f0-9]{7,}\)$/, '')
          .trim()
      }))
    }
    
    // Parse improvements (can be under "Performance", "Refactor", etc.)
    const improvementsMatch = block.match(/### (Performance|Refactor|Improvements)([\s\S]*?)(?=###|$)/i)
    if (improvementsMatch) {
      const items = improvementsMatch[2].match(/^\* (.+)$/gm) || []
      improvements.push(...items.map(item => {
        return item
          .replace(/^\* /, '')
          .replace(/\*\*[^:]+:\*\* /, '')
          .replace(/ \([a-f0-9]{7,}\)$/, '')
          .trim()
      }))
    }
    
    // Parse breaking changes
    const breakingMatch = block.match(/### BREAKING CHANGES?([\s\S]*?)(?=###|$)/i)
    if (breakingMatch) {
      const items = breakingMatch[1].match(/^\* (.+)$/gm) || []
      breaking.push(...items.map(item => {
        return item
          .replace(/^\* /, '')
          .replace(/\*\*[^:]+:\*\* /, '')
          .replace(/ \([a-f0-9]{7,}\)$/, '')
          .trim()
      }))
    }
    
    const parsedVersion: ParsedVersion = {
      version,
      date,
      features: features.filter(f => f.length > 0),
      fixes: fixes.filter(f => f.length > 0),
      improvements: improvements.filter(f => f.length > 0),
    }
    
    if (breaking.length > 0) {
      parsedVersion.breaking = breaking.filter(f => f.length > 0)
    }
    
    versions.push(parsedVersion)
  }
  
  return versions
}

// Capitalize first letter helper
export function capitalizeFirst(text: string): string {
  if (!text) return text
  return text.charAt(0).toUpperCase() + text.slice(1)
}