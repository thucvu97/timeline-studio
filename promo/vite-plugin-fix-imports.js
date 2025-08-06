export function fixImports() {
  return {
    name: "fix-imports",
    transform(code, id) {
      // Fix zustand's import of use-sync-external-store
      if (id.includes("zustand") && id.endsWith("traditional.mjs")) {
        return code.replace(
          "import useSyncExternalStoreExports from 'use-sync-external-store/shim/with-selector.js';",
          "import * as useSyncExternalStoreExports from 'use-sync-external-store/shim/with-selector.js';",
        )
      }
      return null
    },
  }
}
