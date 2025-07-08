import { ReactNode, createContext, useCallback, useContext, useEffect, useState } from "react"

import { useHotkeys } from "react-hotkeys-hook"

import { EDIT_MODES, EDIT_MODE_CONFIGS, EditMode } from "../types/edit-modes"

interface UseEditModeReturn {
  editMode: EditMode
  setEditMode: (mode: EditMode) => void
  isEditMode: (mode: EditMode) => boolean
  cursor: string
}

export function useEditMode(initialMode: EditMode = EDIT_MODES.SELECT): UseEditModeReturn {
  const [editMode, setEditMode] = useState<EditMode>(initialMode)

  // Get cursor style for current mode
  const cursor = EDIT_MODE_CONFIGS[editMode].cursor

  // Helper to check if we're in a specific mode
  const isEditMode = useCallback((mode: EditMode) => editMode === mode, [editMode])

  // Set up keyboard shortcuts for all edit modes
  Object.values(EDIT_MODE_CONFIGS).forEach((config) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useHotkeys(
      config.hotkey.toLowerCase(),
      () => setEditMode(config.mode),
      {
        preventDefault: true,
        enableOnFormTags: false,
      },
      [setEditMode],
    )
  })

  // Update document cursor based on edit mode
  useEffect(() => {
    const prevCursor = document.body.style.cursor
    document.body.style.cursor = cursor

    return () => {
      document.body.style.cursor = prevCursor
    }
  }, [cursor])

  // Escape key to return to select mode
  useHotkeys(
    "escape",
    () => setEditMode(EDIT_MODES.SELECT),
    {
      preventDefault: true,
      enableOnFormTags: false,
    },
    [setEditMode],
  )

  return {
    editMode,
    setEditMode,
    isEditMode,
    cursor,
  }
}

// Context for sharing edit mode across timeline components
const EditModeContext = createContext<UseEditModeReturn | undefined>(undefined)

export function EditModeProvider({ children }: { children: ReactNode }) {
  const editMode = useEditMode()

  return <EditModeContext.Provider value={editMode}>{children}</EditModeContext.Provider>
}

export function useEditModeContext() {
  const context = useContext(EditModeContext)
  if (!context) {
    throw new Error("useEditModeContext must be used within EditModeProvider")
  }
  return context
}
