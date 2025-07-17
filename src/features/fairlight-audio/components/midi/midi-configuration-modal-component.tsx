import { MidiSetup } from "./midi-setup"

export function MidiConfigurationModalComponent() {
  return (
    <div className="max-w-2xl max-h-[80vh] overflow-hidden">
      <div className="overflow-y-auto max-h-[60vh] pr-2">
        <MidiSetup />
      </div>
    </div>
  )
}
