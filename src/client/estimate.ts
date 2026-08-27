/**
 * Local browser-side tokenizer for the Token Meter panel.
 *
 * DSH ships no browser tokenizer, so the panel uses `gpt-tokenizer`'s p50k_base
 * encoding (a pure-JS, browser-safe BPE implementation — the GPT-3 vocab, a
 * compact ~0.6MB table that keeps the plugin bundle small) to count tokens
 * accurately while the model streams, far closer to real usage than a
 * characters-per-token density heuristic. Blocks are split by kind so the panel
 * separates in-flight *output* (text / tool-call) from in-flight *input*
 * (reasoning). It is preview-only: the authoritative `tokenUsage` projection
 * calibrates at step end.
 * @module @deepseek-ai/dsh-client-ui-token-meter/client/estimate
 */

import { encode } from 'gpt-tokenizer/encoding/p50k_base'
import type { AssistantBlock } from '@deepseek-ai/dsh-client-runtime/client'

/** Count tokens for one text value using the local tokenizer. */
function count(text: string): number {
  try {
    return encode(text).length
  } catch {
    // Fall back to a chars-per-token density on a tokenizer error.
    return Math.ceil(text.length / 4)
  }
}

/** Split estimated tokens into { output, input } buckets by block kind. */
export function estimateBlocks(blocks: readonly AssistantBlock[]): { output: number; input: number } {
  let output = 0
  let input = 0
  for (const block of blocks) {
    switch (block.kind) {
      case 'text':
        output += count(block.text)
        break
      case 'reasoning':
        input += count(block.text)
        break
      case 'tool-call':
        output += count(block.name) + count(block.argsRaw)
        break
      case 'image':
        output += 1
        break
      default:
        output += count(JSON.stringify(block.block))
    }
  }
  return { output, input }
}
