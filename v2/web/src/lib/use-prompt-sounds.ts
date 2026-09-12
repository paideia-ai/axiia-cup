import { type CompositionEvent, type FormEvent, useRef } from 'react'

import { PromptSoundObserver } from './prompt-sound'

// Only the strategy textarea receives these handlers. Ordinary account inputs,
// programmatic draft restores, navigation, and the rest of the page stay quiet.
export function usePromptSounds() {
  const observer = useRef<PromptSoundObserver | null>(null)
  if (observer.current == null) observer.current = new PromptSoundObserver()
  return {
    onInput: (event: FormEvent<HTMLTextAreaElement>) => {
      const native = event.nativeEvent as InputEvent
      observer.current!.input(
        event.currentTarget.value,
        native.inputType ?? '',
        native.isComposing,
      )
    },
    onCompositionStart: (event: CompositionEvent<HTMLTextAreaElement>) => {
      observer.current!.beginComposition(event.currentTarget.value)
    },
    onCompositionEnd: (event: CompositionEvent<HTMLTextAreaElement>) => {
      observer.current!.endComposition(event.currentTarget.value)
    },
  }
}
