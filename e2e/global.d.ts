// Global types for E2E tests

declare global {
  interface Window {
    // Test helper properties for media files
    __TEST_ADD_MEDIA_FILE__?: any
    __TEST_ADD_CYRILLIC_FILE__?: any
    __LOAD_TEST_PROJECT__?: any
    
    // Test helper for tracking timeline calls
    __TIMELINE_CALLS__?: string[]
    
    // Timeline functions that may be available in test environment
    addMediaToTimeline?: (...args: any[]) => any
    addSingleMediaToTimeline?: (...args: any[]) => any
  }
}

export {}