"use client"

import { useState } from "react"
import {
  DefaultMediaEditor,
  DualMediaEditor,
  OptionsMediaEditor,
  VerticalMediaEditor,
} from "./layouts"

export function MediaStudio() {
  const [layoutMode, setLayoutMode] = useState("default")

  return (
    <div className="m-0 flex h-screen flex-col p-0">
      {/* <TopNavBar /> */}
      {layoutMode === "default" && <DefaultMediaEditor />}
      {layoutMode === "options" && <OptionsMediaEditor />}
      {layoutMode === "vertical" && <VerticalMediaEditor />}
      {layoutMode === "dual" && <DualMediaEditor />}
    </div>
  )
}
