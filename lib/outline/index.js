/* @flow */

import type { Outline } from 'atom-ide-ui/outline'
import { astToOutline } from './parse'
import type { OutlineOptions } from './types'

export function toOutline(result: string, options: OutlineOptions): Outline {
  const parsed = JSON.parse(result)
  return astToOutline(options, parsed)
}
