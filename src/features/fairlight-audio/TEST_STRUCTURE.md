# Fairlight Audio Test Structure

This document outlines the test structure for the fairlight-audio module, listing all files that need tests organized by their directory structure.

## Test Directory Structure Created

```
fairlight-audio/
├── components/__tests__/
│   ├── automation/
│   ├── editor/
│   ├── effects/
│   ├── meters/
│   ├── midi/
│   ├── mixer/
│   ├── routing/
│   ├── timeline/
│   └── waveform/
├── hooks/__tests__/
└── services/__tests__/
    ├── effects/
    ├── meters/
    ├── midi/
    ├── noise-reduction/
    └── surround/
```

## Files Requiring Tests

### Components Tests

#### automation/
- [ ] `automation-panel.test.tsx` - Test for components/automation/automation-panel.tsx
- [ ] `automation-view.test.tsx` - Test for components/automation/automation-view.tsx
- [ ] `automation-lane.test.tsx` - Test for components/automation/automation-lane.tsx

#### editor/
- [ ] `audio-clip-editor.test.tsx` - Test for components/editor/audio-clip-editor.tsx

#### effects/
- [ ] `compressor.test.tsx` - Test for components/effects/compressor.tsx
- [ ] `equalizer.test.tsx` - Test for components/effects/equalizer.tsx
- [ ] `reverb.test.tsx` - Test for components/effects/reverb.tsx
- [ ] `noise-reduction.test.tsx` - Test for components/effects/noise-reduction.tsx
- [ ] `channel-noise-reduction.test.tsx` - Test for components/effects/channel-noise-reduction.tsx
- [ ] `effects-rack.test.tsx` - Test for components/effects/effects-rack.tsx

#### meters/
- [ ] `level-meter.test.tsx` - Test for components/meters/level-meter.tsx

#### midi/
- [ ] `midi-configuration-modal.test.tsx` - Test for components/midi/midi-configuration-modal.tsx
- [ ] `midi-mapping-editor.test.tsx` - Test for components/midi/midi-mapping-editor.tsx
- [ ] `midi-indicator.test.tsx` - Test for components/midi/midi-indicator.tsx
- [ ] `midi-learn-dialog.test.tsx` - Test for components/midi/midi-learn-dialog.tsx
- [ ] `midi-sequencer-view.test.tsx` - Test for components/midi/midi-sequencer-view.tsx
- [ ] `midi-setup.test.tsx` - Test for components/midi/midi-setup.tsx
- [ ] `midi-router-view.test.tsx` - Test for components/midi/midi-router-view.tsx

#### mixer/
- [x] `surround-panner.test.tsx` - Already exists
- [ ] `fader.test.tsx` - Test for components/mixer/fader.tsx
- [ ] `channel-strip.test.tsx` - Test for components/mixer/channel-strip.tsx
- [ ] `channel-with-audio.test.tsx` - Test for components/mixer/channel-with-audio.tsx
- [ ] `master-section.test.tsx` - Test for components/mixer/master-section.tsx
- [ ] `mixer-console.test.tsx` - Test for components/mixer/mixer-console.tsx
- [ ] `mixer-with-routing.test.tsx` - Test for components/mixer/mixer-with-routing.tsx

#### routing/
- [ ] `routing-matrix.test.tsx` - Test for components/routing/routing-matrix.tsx
- [ ] `send-panel.test.tsx` - Test for components/routing/send-panel.tsx
- [ ] `group-strip.test.tsx` - Test for components/routing/group-strip.tsx

#### timeline/
- [ ] `audio-clip.test.tsx` - Test for components/timeline/audio-clip.tsx
- [ ] `audio-timeline.test.tsx` - Test for components/timeline/audio-timeline.tsx

#### waveform/
- [ ] `simple-waveform.test.tsx` - Test for components/waveform/simple-waveform.tsx

### Hooks Tests

- [ ] `use-audio-engine.test.ts` - Test for hooks/use-audio-engine.ts
- [ ] `use-midi-integration.test.ts` - Test for hooks/use-midi-integration.ts
- [ ] `use-midi.test.ts` - Test for hooks/use-midi.ts
- [ ] `use-midi-engine.test.ts` - Test for hooks/use-midi-engine.ts
- [ ] `use-noise-reduction.test.ts` - Test for hooks/use-noise-reduction.ts
- [ ] `use-mixer-state.test.ts` - Test for hooks/use-mixer-state.ts
- [ ] `use-audio-clip-editor.test.ts` - Test for hooks/use-audio-clip-editor.ts
- [ ] `use-automation.test.ts` - Test for hooks/use-automation.ts
- [ ] `use-bus-routing.test.ts` - Test for hooks/use-bus-routing.ts
- [ ] `use-channel-audio.test.ts` - Test for hooks/use-channel-audio.ts
- [ ] `use-channel-effects.test.ts` - Test for hooks/use-channel-effects.ts

### Services Tests

#### Root level services
- [x] `audio-engine.test.ts` - Already exists
- [ ] `audio-file-manager.test.ts` - Test for services/audio-file-manager.ts
- [ ] `timeline-sync-service.test.ts` - Test for services/timeline-sync-service.ts
- [ ] `bus-router.test.ts` - Test for services/bus-router.ts
- [ ] `audio-clip-editor.test.ts` - Test for services/audio-clip-editor.ts
- [ ] `automation-engine.test.ts` - Test for services/automation-engine.ts

#### effects/
- [ ] `equalizer-processor.test.ts` - Test for services/effects/equalizer-processor.ts
- [ ] `reverb-processor.test.ts` - Test for services/effects/reverb-processor.ts
- [ ] `compressor-processor.test.ts` - Test for services/effects/compressor-processor.ts

#### meters/
- [ ] `level-meter.test.ts` - Test for services/meters/level-meter.ts
- [ ] `lufs-meter.test.ts` - Test for services/meters/lufs-meter.ts
- [ ] `phase-meter.test.ts` - Test for services/meters/phase-meter.ts
- [ ] `spectrum-analyzer.test.ts` - Test for services/meters/spectrum-analyzer.ts

#### midi/
- [ ] `midi-engine.test.ts` - Test for services/midi/midi-engine.ts
- [ ] `midi-router.test.ts` - Test for services/midi/midi-router.ts
- [ ] `midi-sequencer.test.ts` - Test for services/midi/midi-sequencer.ts
- [ ] `midi-file.test.ts` - Test for services/midi/midi-file.ts
- [ ] `midi-clock.test.ts` - Test for services/midi/midi-clock.ts

#### noise-reduction/
- [ ] `noise-reduction-engine.test.ts` - Test for services/noise-reduction/noise-reduction-engine.ts
- [ ] `fft-processor.test.ts` - Test for services/noise-reduction/fft-processor.ts
- [ ] `noise-reduction-processor.test.ts` - Test for services/noise-reduction/worklets/noise-reduction-processor.ts

#### surround/
- [x] `surround-processor.test.ts` - Already exists

### Other Files
- [ ] `index.test.ts` - Test for index.ts (module exports)
- [ ] `types/index.test.ts` - Test for types/index.ts (type definitions and utilities)

## Test Priority

### High Priority (Core functionality)
1. Services: audio-engine.test.ts ✓
2. Services: bus-router.test.ts
3. Services: automation-engine.test.ts
4. Hooks: use-audio-engine.test.ts
5. Components: mixer/channel-strip.test.tsx
6. Components: timeline/audio-timeline.test.tsx

### Medium Priority (Important features)
1. Services: midi/midi-engine.test.ts
2. Services: effects/*.test.ts
3. Services: meters/*.test.ts
4. Components: effects/*.test.tsx
5. Components: automation/*.test.tsx
6. Hooks: use-mixer-state.test.ts

### Low Priority (Supporting features)
1. Components: midi/*.test.tsx
2. Components: waveform/*.test.tsx
3. Services: noise-reduction/*.test.ts
4. Other hook tests

## Test Guidelines

1. **Component Tests**: Use React Testing Library with user interaction focus
2. **Service Tests**: Test business logic, state management, and API interactions
3. **Hook Tests**: Test state changes, side effects, and integration with services
4. **Mock Strategy**: Use the centralized mocks from `src/test/mocks/`
5. **Audio Context**: Use the audio testing utilities from `src/test/utils/`

## Next Steps

1. Start with high-priority tests
2. Ensure each test follows the project's testing patterns
3. Use existing test files as templates
4. Add integration tests for complex workflows
5. Maintain test coverage above 80%