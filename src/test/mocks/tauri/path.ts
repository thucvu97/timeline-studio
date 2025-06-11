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
}
