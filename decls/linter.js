/* @flow */

declare module 'linter' {
  import type { Point, Range } from 'atom'

  declare type LinterProvider = {
  }

  declare type Message = {
    location: {
      file: string,
      position: Range,
    },
    reference: ?{
      file: string,
      position?: Point,
    },
    url?: string,
    icon?: string,
    excerpt: string,
    severity: 'error' | 'warning' | 'info',
    solutions?: Array<{
      title?: string,
      position: Range,
      priority?: number,
      currentText?: string,
      replaceWith: string,
    } | {
      title?: string,
      position: Range,
      priority?: number,
      apply: (() => any),
    }>,
    description?: string | (() => Promise<string> | string),
    linterName?: string,
  }
}
