import { useEffect, useState } from "react"

import { Activity } from "lucide-react"

import { useMidi } from "../../hooks/use-midi"

export function MidiIndicator() {
  const { onMidiMessage } = useMidi()
  const [isActive, setIsActive] = useState(false)
  const [lastActivity, setLastActivity] = useState<number>(0)

  useEffect(() => {
    const unsubscribe = onMidiMessage(() => {
      setIsActive(true)
      setLastActivity(Date.now())
    })

    return unsubscribe
  }, [onMidiMessage])

  // Auto-hide indicator after 100ms
  useEffect(() => {
    if (isActive) {
      const timer = setTimeout(() => {
        if (Date.now() - lastActivity >= 100) {
          setIsActive(false)
        }
      }, 100)

      return () => clearTimeout(timer)
    }
  }, [isActive, lastActivity])

  return (
    <div className="flex items-center gap-2">
      <Activity className={`w-4 h-4 transition-colors ${isActive ? "text-green-400" : "text-zinc-600"}`} />
      <span className="text-xs text-zinc-500">MIDI</span>
    </div>
  )
}
