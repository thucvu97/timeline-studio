import { vi } from "vitest"

export const mockPath = {
  dirname: vi.fn(),
  basename: vi.fn(),
  join: vi.fn(),
  resolve: vi.fn(),
  normalize: vi.fn(),
  isAbsolute: vi.fn(),
  relative: vi.fn(),
  extname: vi.fn(),
  sep: "/",
  // Tauri-specific path functions
  appDataDir: vi.fn(),
  appConfigDir: vi.fn(),
  appCacheDir: vi.fn(),
  appLogDir: vi.fn(),
  audioDir: vi.fn(),
  cacheDir: vi.fn(),
  configDir: vi.fn(),
  dataDir: vi.fn(),
  desktopDir: vi.fn(),
  documentDir: vi.fn(),
  downloadDir: vi.fn(),
  executableDir: vi.fn(),
  fontDir: vi.fn(),
  homeDir: vi.fn(),
  localDataDir: vi.fn(),
  pictureDir: vi.fn(),
  publicDir: vi.fn(),
  resourceDir: vi.fn(),
  runtimeDir: vi.fn(),
  templateDir: vi.fn(),
  videoDir: vi.fn(),
}

vi.mock("@tauri-apps/api/path", () => mockPath)

// Set up default implementations
mockPath.dirname.mockImplementation((path: string) => {
  const lastSlash = path.lastIndexOf("/")
  return lastSlash > 0 ? path.substring(0, lastSlash) : "/"
})

mockPath.basename.mockImplementation((path: string, ext?: string) => {
  const name = path.split("/").pop() || ""
  if (ext && name.endsWith(ext)) {
    return name.substring(0, name.length - ext.length)
  }
  return name
})

mockPath.join.mockImplementation((...paths: string[]) => {
  return paths.filter(Boolean).join("/").replace(/\/+/g, "/")
})

mockPath.resolve.mockImplementation((...paths: string[]) => {
  let resolved = ""
  for (const path of paths) {
    if (path.startsWith("/")) {
      resolved = path
    } else {
      resolved = resolved ? `${resolved}/${path}` : path
    }
  }
  return resolved || "/"
})

mockPath.normalize.mockImplementation((path: string) => {
  return path.replace(/\/+/g, "/").replace(/\/$/, "") || "/"
})

mockPath.isAbsolute.mockImplementation((path: string) => {
  return path.startsWith("/")
})

mockPath.relative.mockImplementation((from: string, to: string) => {
  // Simplified implementation for tests
  if (to.startsWith(from)) {
    return to.substring(from.length + 1)
  }
  return to
})

mockPath.extname.mockImplementation((path: string) => {
  const lastDot = path.lastIndexOf(".")
  const lastSlash = path.lastIndexOf("/")
  return lastDot > lastSlash ? path.substring(lastDot) : ""
})

// Set default Tauri paths (all return promises)
mockPath.appDataDir.mockResolvedValue("/Users/test/Library/Application Support/com.timeline-studio.app")
mockPath.appConfigDir.mockResolvedValue("/Users/test/Library/Application Support/com.timeline-studio.app")
mockPath.appCacheDir.mockResolvedValue("/Users/test/Library/Caches/com.timeline-studio.app")
mockPath.appLogDir.mockResolvedValue("/Users/test/Library/Logs/com.timeline-studio.app")
mockPath.audioDir.mockResolvedValue("/Users/test/Music")
mockPath.cacheDir.mockResolvedValue("/Users/test/Library/Caches")
mockPath.configDir.mockResolvedValue("/Users/test/Library/Application Support")
mockPath.dataDir.mockResolvedValue("/Users/test/Library/Application Support")
mockPath.desktopDir.mockResolvedValue("/Users/test/Desktop")
mockPath.documentDir.mockResolvedValue("/Users/test/Documents")
mockPath.downloadDir.mockResolvedValue("/Users/test/Downloads")
mockPath.executableDir.mockResolvedValue("/Applications/Timeline Studio.app/Contents/MacOS")
mockPath.fontDir.mockResolvedValue("/Users/test/Library/Fonts")
mockPath.homeDir.mockResolvedValue("/Users/test")
mockPath.localDataDir.mockResolvedValue("/Users/test/Library/Application Support")
mockPath.pictureDir.mockResolvedValue("/Users/test/Pictures")
mockPath.publicDir.mockResolvedValue("/Users/test/Public")
mockPath.resourceDir.mockResolvedValue("/Applications/Timeline Studio.app/Contents/Resources")
mockPath.runtimeDir.mockResolvedValue("/var/folders/xyz/runtime")
mockPath.templateDir.mockResolvedValue("/Users/test/Library/Application Support/com.timeline-studio.app/templates")
mockPath.videoDir.mockResolvedValue("/Users/test/Movies")

// Helper functions for common path operations
export const pathPresets = {
  unixPaths: () => {
    mockPath.sep = "/"
    mockPath.join.mockImplementation((...paths: string[]) => paths.filter(Boolean).join("/").replace(/\/+/g, "/"))
  },

  windowsPaths: () => {
    mockPath.sep = "\\"
    mockPath.join.mockImplementation((...paths: string[]) => paths.filter(Boolean).join("\\").replace(/\\+/g, "\\"))
  },

  projectPaths: () => {
    mockPath.dirname.mockResolvedValue("/project/dir")
    mockPath.join.mockImplementation((...paths: string[]) => paths.join("/"))
  },
}

// Helper to reset path mocks
export function resetPathMocks() {
  Object.values(mockPath).forEach((mock) => {
    if (typeof mock === "function" && "mockReset" in mock) {
      mock.mockReset()
    }
  })

  // Restore default implementations
  mockPath.dirname.mockImplementation((path: string) => {
    const lastSlash = path.lastIndexOf("/")
    return lastSlash > 0 ? path.substring(0, lastSlash) : "/"
  })

  mockPath.basename.mockImplementation((path: string) => path.split("/").pop() || "")
  mockPath.join.mockImplementation((...paths: string[]) => paths.join("/"))

  // Set default Tauri paths
  mockPath.appDataDir.mockResolvedValue("/Users/test/Library/Application Support/com.timeline-studio.app")
  mockPath.appConfigDir.mockResolvedValue("/Users/test/Library/Application Support/com.timeline-studio.app")
  mockPath.appCacheDir.mockResolvedValue("/Users/test/Library/Caches/com.timeline-studio.app")
  mockPath.appLogDir.mockResolvedValue("/Users/test/Library/Logs/com.timeline-studio.app")
  mockPath.audioDir.mockResolvedValue("/Users/test/Music")
  mockPath.cacheDir.mockResolvedValue("/Users/test/Library/Caches")
  mockPath.configDir.mockResolvedValue("/Users/test/Library/Application Support")
  mockPath.dataDir.mockResolvedValue("/Users/test/Library/Application Support")
  mockPath.desktopDir.mockResolvedValue("/Users/test/Desktop")
  mockPath.documentDir.mockResolvedValue("/Users/test/Documents")
  mockPath.downloadDir.mockResolvedValue("/Users/test/Downloads")
  mockPath.executableDir.mockResolvedValue("/Applications/Timeline Studio.app/Contents/MacOS")
  mockPath.fontDir.mockResolvedValue("/Users/test/Library/Fonts")
  mockPath.homeDir.mockResolvedValue("/Users/test")
  mockPath.localDataDir.mockResolvedValue("/Users/test/Library/Application Support")
  mockPath.pictureDir.mockResolvedValue("/Users/test/Pictures")
  mockPath.publicDir.mockResolvedValue("/Users/test/Public")
  mockPath.resourceDir.mockResolvedValue("/Applications/Timeline Studio.app/Contents/Resources")
  mockPath.runtimeDir.mockResolvedValue("/var/folders/xyz/runtime")
  mockPath.templateDir.mockResolvedValue("/Users/test/Library/Application Support/com.timeline-studio.app/templates")
  mockPath.videoDir.mockResolvedValue("/Users/test/Movies")
}
