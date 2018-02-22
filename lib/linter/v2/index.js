/* @flow */

import { Range, TextEditor, Point } from 'atom'

import type { Error, Location, MessageMarkup, ReferenceLocs, StatusResult } from './types'
import type { Message } from 'linter'

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

function createExcerpt(messages: MessageMarkup[], references: ReferenceLocs): string {
  return messages.map((message) => {
    switch (message.kind) {
      case 'Text':
        return message.text

      case 'Code':
        return message.text

      case 'Reference':
        const ref = references[message.referenceId]
        if (!ref) {
          return ''
        }
        return createExcerpt(message.message, references)

      default:
        return ''
    }
  }).join('')
}

export function toLinterMessages(json: string) {
  const result: StatusResult = JSON.parse(json)

  if (result.passed && result.errors.length === 0) {
    return []
  }

  return result.errors.map((err) => {
    return {
      location: locactionToLinterLocation(err.primaryLoc),
      // TODO: any?
      // reference: ?{
      //   file: string,
      //   position?: Point,
      // },
      excerpt: createExcerpt(err.messageMarkup, err.referenceLocs),
      severity: err.level,
      // TODO: is there anything left that we could show?
      // description: createMarkup(err.messageMarkup, err.referenceLocs),
    }
  })
}
