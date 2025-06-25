import { renderHook } from '@testing-library/react'
import { useIsMobile } from '../use-mobile'
import { vi } from 'vitest'

function mockMatchMedia(matches: boolean) {
  return vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia
}

describe('useIsMobile', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns true when viewport width is below breakpoint', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 500 })
    window.matchMedia = mockMatchMedia(true)
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(true)
  })

  it('returns false when viewport width is above breakpoint', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 })
    window.matchMedia = mockMatchMedia(false)
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)
  })
})
