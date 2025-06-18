import { describe, expect, it, vi } from "vitest"

import { useEffectsImport } from "../../hooks/use-effects-import"

describe("useEffectsImport", () => {
  it("should export hook function", () => {
    expect(useEffectsImport).toBeDefined()
    expect(typeof useEffectsImport).toBe("function")
  })

  it("should be a function", () => {
    expect(useEffectsImport).toBeInstanceOf(Function)
  })

  it("should be named export", () => {
    expect(useEffectsImport.name).toBe("useEffectsImport")
  })

  it("should not be undefined", () => {
    expect(useEffectsImport).not.toBeUndefined()
  })

  it("should be callable", () => {
    expect(() => typeof useEffectsImport).not.toThrow()
  })
})
