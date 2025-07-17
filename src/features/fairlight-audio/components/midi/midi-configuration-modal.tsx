import { Button } from "@/components/ui/button"
import { useModal } from "@/features/modals/services"

export function MidiConfigurationModal() {
  const { openModal } = useModal()

  const handleOpen = () => {
    openModal("midi-configuration")
  }

  return (
    <Button variant="outline" onClick={handleOpen}>
      Настройки MIDI
    </Button>
  )
}
