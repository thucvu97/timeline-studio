import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

import { MidiSetup } from "./midi-setup"

interface MidiConfigurationModalProps {
  open: boolean
  onClose: () => void
}

export function MidiConfigurationModal({ open, onClose }: MidiConfigurationModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>MIDI Configuration</DialogTitle>
          <DialogDescription>Configure MIDI devices and mappings for Fairlight Audio</DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[60vh] pr-2">
          <MidiSetup />
        </div>
      </DialogContent>
    </Dialog>
  )
}
