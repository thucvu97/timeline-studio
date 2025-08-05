/**
 * Tests for Shader Pool
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { ShaderPool, BUILTIN_SHADERS } from "../shader-pool"
import { contextManager } from "../context-manager"

// Mock WebGL2 context
const createMockGL = () => ({
  VERTEX_SHADER: 0x8B31,
  FRAGMENT_SHADER: 0x8B30,
  COMPILE_STATUS: 0x8B81,
  LINK_STATUS: 0x8B82,
  VALIDATE_STATUS: 0x8B83,
  CURRENT_PROGRAM: 0x8B8D,
  INVALID_INDEX: 0xFFFFFFFF,
  
  createShader: vi.fn(() => ({})),
  shaderSource: vi.fn(),
  compileShader: vi.fn(),
  getShaderParameter: vi.fn(() => true),
  getShaderInfoLog: vi.fn(() => ""),
  deleteShader: vi.fn(),
  
  createProgram: vi.fn(() => ({})),
  attachShader: vi.fn(),
  linkProgram: vi.fn(),
  validateProgram: vi.fn(),
  getProgramParameter: vi.fn(() => true),
  getProgramInfoLog: vi.fn(() => ""),
  deleteProgram: vi.fn(),
  
  getUniformLocation: vi.fn(() => ({})),
  getAttribLocation: vi.fn(() => 0),
  getUniformBlockIndex: vi.fn(() => 0),
  
  useProgram: vi.fn(),
})

// Mock context manager
vi.mock("../context-manager", () => ({
  contextManager: {
    getContext: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  }
}))

describe("ShaderPool", () => {
  let pool: ShaderPool
  let mockGL: ReturnType<typeof createMockGL>

  beforeEach(() => {
    pool = new ShaderPool()
    mockGL = createMockGL()
    vi.mocked(contextManager.getContext).mockReturnValue(mockGL as any)
  })

  afterEach(() => {
    pool.clear()
    vi.clearAllMocks()
  })

  describe("program compilation", () => {
    it("should compile and cache shader program", () => {
      const source = {
        vertex: "attribute vec2 a_position;",
        fragment: "void main() { gl_FragColor = vec4(1.0); }"
      }
      
      const program = pool.getProgram("test", source)
      
      expect(program).toBeDefined()
      expect(program?.refCount).toBe(1)
      expect(mockGL.createShader).toHaveBeenCalledTimes(2)
      expect(mockGL.createProgram).toHaveBeenCalled()
    })

    it("should return cached program on second call", () => {
      const source = {
        vertex: "attribute vec2 a_position;",
        fragment: "void main() { gl_FragColor = vec4(1.0); }"
      }
      
      const program1 = pool.getProgram("test", source)
      const program2 = pool.getProgram("test", source)
      
      expect(program1).toBe(program2)
      expect(program2?.refCount).toBe(2)
      expect(mockGL.createProgram).toHaveBeenCalledTimes(1)
    })

    it("should handle shader compilation errors", () => {
      mockGL.getShaderParameter = vi.fn(() => false)
      mockGL.getShaderInfoLog = vi.fn(() => "Shader compilation failed")
      
      const source = {
        vertex: "invalid vertex shader",
        fragment: "invalid fragment shader"
      }
      
      const program = pool.getProgram("test", source)
      
      expect(program).toBeNull()
    })

    it("should handle program linking errors", () => {
      mockGL.getProgramParameter = vi.fn(() => false)
      mockGL.getProgramInfoLog = vi.fn(() => "Program linking failed")
      
      const source = {
        vertex: "attribute vec2 a_position;",
        fragment: "void main() { gl_FragColor = vec4(1.0); }"
      }
      
      const program = pool.getProgram("test", source)
      
      expect(program).toBeNull()
    })
  })

  describe("built-in shaders", () => {
    it("should get built-in shader by name", () => {
      const program = pool.getProgram("copy")
      
      expect(program).toBeDefined()
      expect(mockGL.createProgram).toHaveBeenCalled()
    })

    it("should preload all built-in shaders", () => {
      pool.preloadBuiltinShaders()
      
      const builtinCount = Object.keys(BUILTIN_SHADERS).length
      expect(mockGL.createProgram).toHaveBeenCalledTimes(builtinCount)
    })
  })

  describe("uniform/attribute locations", () => {
    it("should cache uniform locations", () => {
      const program = pool.getProgram("copy")
      
      const location1 = pool.getUniformLocation(program!, "u_texture")
      const location2 = pool.getUniformLocation(program!, "u_texture")
      
      expect(location1).toBe(location2)
      expect(mockGL.getUniformLocation).toHaveBeenCalledTimes(1)
    })

    it("should cache attribute locations", () => {
      const program = pool.getProgram("copy")
      
      const location1 = pool.getAttributeLocation(program!, "a_position")
      const location2 = pool.getAttributeLocation(program!, "a_position")
      
      expect(location1).toBe(location2)
      expect(mockGL.getAttribLocation).toHaveBeenCalledTimes(1)
    })

    it("should cache uniform block indices", () => {
      const program = pool.getProgram("copy")
      
      const index1 = pool.getUniformBlockIndex(program!, "Matrices")
      const index2 = pool.getUniformBlockIndex(program!, "Matrices")
      
      expect(index1).toBe(index2)
      expect(mockGL.getUniformBlockIndex).toHaveBeenCalledTimes(1)
    })
  })

  describe("program release", () => {
    it("should decrement ref count on release", () => {
      const source = {
        vertex: "attribute vec2 a_position;",
        fragment: "void main() { gl_FragColor = vec4(1.0); }"
      }
      
      // Получаем программу дважды - refCount = 2
      pool.getProgram("test", source)
      pool.getProgram("test", source)
      
      // Освобождаем один раз - refCount = 1, программа не должна быть удалена
      pool.releaseProgram("test")
      
      expect(mockGL.deleteProgram).not.toHaveBeenCalled()
    })

    it("should delete program when ref count reaches zero", () => {
      const source = {
        vertex: "attribute vec2 a_position;",
        fragment: "void main() { gl_FragColor = vec4(1.0); }"
      }
      
      const program = pool.getProgram("test", source)
      pool.releaseProgram("test")
      
      expect(mockGL.deleteProgram).toHaveBeenCalledWith(program?.program)
    })
  })

  describe("context loss handling", () => {
    it("should clear programs on context lost", () => {
      pool.getProgram("copy")
      pool.getProgram("blur")
      
      // Get the context lost handler
      const contextLostHandler = vi.mocked(contextManager.on).mock.calls.find(
        call => call[0] === "contextLost"
      )?.[1]
      
      contextLostHandler?.()
      
      // Programs should be cleared
      expect(pool.getProgram("copy")).toBeDefined() // Will recompile
      expect(mockGL.createProgram).toHaveBeenCalledTimes(3) // 2 initial + 1 recompile
    })

    it("should preload built-ins on context restored", () => {
      // Get the context restored handler
      const contextRestoredHandler = vi.mocked(contextManager.on).mock.calls.find(
        call => call[0] === "contextRestored"
      )?.[1]
      
      contextRestoredHandler?.()
      
      const builtinCount = Object.keys(BUILTIN_SHADERS).length
      expect(mockGL.createProgram).toHaveBeenCalledTimes(builtinCount)
    })
  })

  describe("cleanup", () => {
    it("should delete all programs on clear", () => {
      const program1 = pool.getProgram("copy")
      const program2 = pool.getProgram("blur")
      
      pool.clear()
      
      expect(mockGL.deleteProgram).toHaveBeenCalledWith(program1?.program)
      expect(mockGL.deleteProgram).toHaveBeenCalledWith(program2?.program)
      expect(mockGL.deleteShader).toHaveBeenCalled()
    })
  })

  describe("shader validation", () => {
    it("should validate program after linking", () => {
      pool.getProgram("copy")
      
      expect(mockGL.validateProgram).toHaveBeenCalled()
    })

    it("should log warning for invalid program", () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation()
      mockGL.getProgramParameter = vi.fn((program, param) => {
        if (param === mockGL.LINK_STATUS) return true
        if (param === mockGL.VALIDATE_STATUS) return false
        return true
      })
      mockGL.getProgramInfoLog = vi.fn(() => "Program validation warning")
      
      pool.getProgram("test", {
        vertex: "attribute vec2 a_position;",
        fragment: "void main() { gl_FragColor = vec4(1.0); }"
      })
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("валидации"),
        expect.any(String)
      )
      
      consoleSpy.mockRestore()
    })
  })
})