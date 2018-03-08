/* @flow */

import { Range } from 'atom'
import type { Message } from 'linter'

import type { Location, MessageMarkup, InlineMarkup, ReferenceLocs, StatusResult } from './types'

function locationToRange({ start, end }: Location): Range {
  return new Range(
    [start.line - 1, start.column - 1],
    [end.line - 1, end.column],
  )
}

function locactionToLinterLocation(loc: Location) {
  return {
    file: loc.source,
    position: locationToRange(loc),
  }
}

function plainText(messages: InlineMarkup[], references: ReferenceLocs): string {
  return messages.map((message) => {
    switch (message.kind) {
      case 'Text':
        return message.text

      case 'Code':
        return message.text

      case 'Reference': {
        const ref = references[message.referenceId]
        if (!ref) {
          return ''
        }
        return plainText(message.message, references)
      }

      default:
        return ''
    }
  }).join('')
}

function fileUrl(loc: Location, path: string): string {
  // build a link that can be opened by the linter ui.
  // e.g. atom://linter?file=<path>&row=<number>&column=<number>
  let { source } = loc
  if (source === '-') {
    source = path
  }
  const params = ['file=' + encodeURIComponent(source)]
  const { start } = loc
  if (start.line > 0) {
    params.push('row=' + (start.line - 1))
    if (start.column > 0) {
      params.push('column=' + (start.column - 1))
    }
  }
  return 'atom://linter?' + params.join('&')
}

function markup(messages: MessageMarkup, references: ReferenceLocs, path: string): string {
  if (Array.isArray(messages)) {
    return messages.map((message) => {
      switch (message.kind) {
        case 'Text':
          return message.text

        case 'Code':
          return '`' + message.text + '`'

        case 'Reference': {
          const ref = references[message.referenceId]
          if (!ref) {
            return ''
          }
          return `[${markup(message.message, references, path)}](${fileUrl(ref, path)})`
        }

        default:
          return ''
      }
    }).join('')
  }

  if (messages.kind === 'UnorderedList') {
    // `messages.message` is already part of the excerpt
    return messages.items.map(msg => markup(msg, references, path))
      .map(msg => ` - ${msg}`).join('\n')
  }
  return ''
}

export function toLinterMessages(json: string, path: string): Message[] {
  const result: StatusResult = JSON.parse(json)

  if (result.passed && result.errors.length === 0) {
    return []
  }

  return result.errors.map((err) => {
    const location = locactionToLinterLocation(err.primaryLoc)
    const severity = err.level
    const { messageMarkup } = err
    if (Array.isArray(messageMarkup)) {
      return {
        location,
        excerpt: plainText(messageMarkup, err.referenceLocs),
        severity,
        reference: null,
      }
    }

    return {
      location,
      excerpt: plainText(messageMarkup.message, err.referenceLocs),
      severity,
      description: markup(messageMarkup, err.referenceLocs, path),
      reference: null,
    }
  })
}
