import type { TM } from './registry/index'

/** 给组件打标记：`<button {...tm('E.save-button')}>`。id 必须在 registry 里登记过（运行时不检查，registry.test.ts 会；这里只做类型引用，登记表本身留在 overlay 分块里）。 */
export function tm(id: keyof typeof TM & string): { 'data-tm': string } {
  return { 'data-tm': id }
}
