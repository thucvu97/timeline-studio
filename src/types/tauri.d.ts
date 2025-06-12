// Tauri global type declarations

declare global {
  interface Window {
    __TAURI__?: {
      core: any
      event: any
      path: any
      tauri: any
      // Add other Tauri APIs as needed
    }
  }
}

export {}
