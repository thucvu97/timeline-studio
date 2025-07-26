// Extended Window interface for Playwright E2E tests

declare global {
  interface Window {
    // Test helper properties for media files
    __TEST_ADD_MEDIA_FILE__?: {
      id: string
      path: string
      name: string
      type: string
      size: number
      duration: number
      isLoadingMetadata: boolean
      probeData?: any
    }
    
    __TEST_ADD_CYRILLIC_FILE__?: {
      id: string
      path: string
      name: string
      type: string
      size: number
      duration: number
      isLoadingMetadata: boolean
    }
    
    __LOAD_TEST_PROJECT__?: {
      id: string
      name: string
      timeline: {
        tracks: Array<{
          id: string
          name: string
          type: string
          clips: Array<{
            id: string
            name: string
            mediaFile: {
              id: string
              path: string
              name: string
              type: string
              isLoadingMetadata: boolean
            }
            startTime: number
            duration: number
          }>
        }>
      }
    }
    
    // Test helper for tracking timeline calls
    __TIMELINE_CALLS__?: string[]
    
    // Timeline functions that may be available in test environment
    addMediaToTimeline?: (...args: any[]) => any
    addSingleMediaToTimeline?: (...args: any[]) => any
  }
}

export {}