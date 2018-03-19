/* @flow */

import { Range } from 'atom'
import type { Message } from 'linter'

import { mainMessageOfError, prettyPrintError } from './pretty'
import type { StatusMessage, StatusObject } from './types'
import type { Location } from '../../types'

export function locationToRange({ start, end }: Location): Range {
  return new Range(
    [start.line - 1, start.column - 1],
    [end.line - 1, end.column],
  )
}
export function toLinterLocation(loc: Location) {
  return {
    file: loc.source,
    position: locationToRange(loc),
  }
}

function toLinterReference(messages: StatusMessage[]) {
  for (let i = 1, length = messages.length; i < length; i++) {
    const message = messages[i]
    if (message.loc) {
      return {
        file: message.loc.source,
        position: locationToRange(message.loc).start,
      }
    }
  }
  return null
}

export function toLinterMessages(contents: string): Message[] {
  const parsed: StatusObject = JSON.parse(contents)
  if (!Array.isArray(parsed.errors) || !parsed.errors.length) {
    return []
  }

  return parsed.errors.map((error) => {
    const mainMsg = mainMessageOfError(error)
    const { loc } = mainMsg
    if (!loc) {
      return null
    }

    let excerpt = error.message.map(msg => msg.descr).join(' ')
    if (error.operation && mainMsg === error.operation) {
      excerpt = error.operation.descr + ' ' + excerpt
    }

    return {
      severity: error.level === 'error' ? 'error' : 'warning',
      location: toLinterLocation(loc),
      excerpt,
      description: prettyPrintError(error),
      reference: toLinterReference(error.message),
    }
  }).filter(Boolean)
}
