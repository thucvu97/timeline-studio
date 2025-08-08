/**
 * Simple example test to verify setup
 */

import { describe, it, expect } from "vitest"

describe("AI Content Intelligence - Basic Test", () => {
  it("should pass basic test", () => {
    expect(1 + 1).toBe(2)
  })

  it("should have proper test environment", () => {
    expect(typeof describe).toBe("function")
    expect(typeof it).toBe("function")
    expect(typeof expect).toBe("function")
  })
})