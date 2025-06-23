import { renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { useSafeTimeline } from "../../hooks/use-safe-timeline"

describe("useSafeTimeline", () => {
  it("должен возвращать null когда Timeline недоступен", () => {
    const { result } = renderHook(() => useSafeTimeline())

    // В тестовой среде Timeline Provider недоступен, поэтому ожидаем null
    expect(result.current).toBeNull()
  })

  it("не должен выбрасывать ошибку при отсутствии Timeline Provider", () => {
    expect(() => {
      renderHook(() => useSafeTimeline())
    }).not.toThrow()
  })

  it("должен стабильно возвращать одно и то же значение", () => {
    const { result, rerender } = renderHook(() => useSafeTimeline())

    const firstResult = result.current
    rerender()
    const secondResult = result.current

    expect(firstResult).toBe(secondResult)
  })
})
