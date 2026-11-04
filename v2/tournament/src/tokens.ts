// Prompt token count for the secondary factor (§4.2):
// tiktoken.get_encoding("cl100k_base").encode_ordinary(text), on the locked
// text exactly as submitted (no trim, no normalization). encode_ordinary
// encodes special-token look-alikes such as "<|endoftext|>" as plain text.
// The npm `tiktoken` package is the WASM build of the same Rust core as the
// Python library; the version is pinned in deno.json and must not change
// during an event.

import { get_encoding, type Tiktoken } from 'tiktoken'

export const TOKENIZER = 'tiktoken@1.0.22 cl100k_base encode_ordinary'

let encoder: Tiktoken | undefined

export function countTokens(text: string): number {
  encoder ??= get_encoding('cl100k_base')
  return encoder.encode_ordinary(text).length
}

export async function sha256(text: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(text),
  )
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}
