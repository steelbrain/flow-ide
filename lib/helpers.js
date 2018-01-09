/* @flow */

import score from 'sb-string_score'
import prettyPrintTypes from 'flow-language-server/lib/pkg/nuclide-flow-rpc/lib/prettyPrintTypes'
import { Range, TextEditor, Point } from 'atom'
import { prettyPrintError, mainMessageOfError } from './helpers-linter'
import type { StatusObject, Location, CoverageObject, TypeAtPosObject } from './types'

export const INIT_MESSAGE = 'flow server'
export const RECHECKING_MESSAGE = 'flow is'

export function getType(value: { value: string, type: string }) {
  return value.type && value.type.substr(0, 1) === '{' ? 'Object' : value.type || 'any'
}

export function locationToRange({ start, end }: Location) {
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

function toLinterReference(messages) {
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

export function toStatusLinterMessages(contents: string) {
  const parsed: StatusObject = JSON.parse(contents)
  if (!Array.isArray(parsed.errors) || !parsed.errors.length) {
    return []
  }

  return parsed.errors.map((error) => {
    const mainMsg = mainMessageOfError(error)
    let excerpt = error.message.map(msg => msg.descr).join(' ')
    if (error.operation && mainMsg === error.operation) {
      excerpt = error.operation.descr + ' ' + excerpt
    }

    return {
      severity: error.level === 'error' ? 'error' : 'warning',
      location: mainMsg.loc && toLinterLocation(mainMsg.loc),
      excerpt,
      description: prettyPrintError(error),
      reference: toLinterReference(error.message),
    }
  })
}

export function toCoverageLinterMessages(coverage: CoverageObject) {
  return coverage.expressions.uncovered_locs.map(loc => ({
    severity: 'info',
    location: toLinterLocation(loc),
    excerpt: 'Uncovered code',
  }))
}

export function injectPosition(text: string, editor: Object, bufferPosition: Object) {
  const characterIndex = editor.getBuffer().characterIndexForPosition(bufferPosition)
  return text.slice(0, characterIndex) + 'AUTO332' + text.slice(characterIndex)
}

export function toAutocompleteSuggestions(contents: string, prefix: string) {
  if (contents.slice(0, 1) !== '{') {
    // Invalid server response
    return []
  }

  const parsed = JSON.parse(contents)
  const hasPrefix = prefix.trim().length
  const suggestions = parsed.result.map(function(suggestion) {
    const isFunction = suggestion.func_details !== null
    let text = null
    let snippet = null
    let displayText = null
    let description = null

    if (isFunction) {
      const functionParams = suggestion.func_details.params
      displayText = `${suggestion.name}(${functionParams.map(value => value.name).join(', ')})`
      snippet = `${suggestion.name}(${functionParams.map(function(value, i) {
        return `\${${i + 1}:${value.name}}`
      }).join(', ')})$${functionParams.length + 1}`

      const params = functionParams.map(param => param.name + (param.type ? `: ${param.type}` : ''))
      const match = suggestion.type.match(/\(.*?\) => (.*)/)
      const returnType = match ? `=> ${match[1]}` : ''

      description = `(${params.join(', ')}) ${returnType}`
    } else {
      text = suggestion.name
    }

    return {
      text,
      type: isFunction ? 'function' : 'property',
      score: hasPrefix ? score(suggestion.name, prefix) : 1,
      snippet,
      leftLabel: isFunction ? 'function' : getType(suggestion),
      displayText,
      replacementPrefix: prefix,
      description,
    }
  })
  return suggestions.sort(function(a, b) {
    return b.score - a.score
  }).filter(item => item.score)
}

export function toDatatip(editor: TextEditor, point: Point, result: string) {
  const parsed: TypeAtPosObject = JSON.parse(result)

  const { type, loc } = parsed
  if (type === '(unknown)') {
    return null
  }

  return {
    range: locationToRange(loc),
    markedStrings: [{
      type: 'snippet',
      grammar: editor.getGrammar(),
      value: prettyPrintTypes(type),
    }],
  }
}
