import { memo, useMemo } from "react"

import { UniversalList } from "@/features/browser/components/universal-list"

import { useTemplatesAdapter } from "../../adapters/use-templates-adapter"

export const TemplatesAdapterContent = memo(() => {
  const adapter = useTemplatesAdapter()
  const handleItemSelect = useMemo(() => () => {}, [])
  
  return <UniversalList adapter={adapter} onItemSelect={handleItemSelect} />
})

TemplatesAdapterContent.displayName = "TemplatesAdapterContent"