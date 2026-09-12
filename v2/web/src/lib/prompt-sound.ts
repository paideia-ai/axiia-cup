import { playSound } from './sound'

// A real prompt edit is audible once; draft hydration and IME candidate updates
// are not. Keeping this state outside React avoids rerendering on every keystroke.
export class PromptSoundObserver {
  private composing = false
  private value: string | null = null
  beginComposition(value: string) {
    this.composing = true
    this.value = value
  }
  endComposition(value: string) {
    const changed = this.composing && value !== this.value
    this.composing = false
    this.value = value
    if (changed) playSound('type')
  }
  input(value: string, inputType: string, isComposing = false) {
    if (this.composing || isComposing || value === this.value) return
    this.value = value
    if (inputType.startsWith('delete')) playSound('delete')
    else if (inputType.startsWith('insert')) playSound('type')
  }
}
