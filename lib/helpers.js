/* @flow */

import score from 'sb-string_score'
import type { CoverageObject } from './types'

export const INIT_MESSAGE = 'flow server'
export const RECHECKING_MESSAGE = 'flow is'

export function getType(value: { value: string, type: string }) {
  return value.type && value.type.substr(0, 1) === '{' ? 'Object' : value.type || 'any'
}

export function toLinterRange(item: { start: number, line: number, end: number, endline: number }) {
  return [
    [item.line - 1, item.start - 1],
    [item.endline - 1, item.end],
  ]
}

function toLinterReference(messages) {
  for (let i = 1, length = messages.length; i < length; i++) {
    const message = messages[i]
    if (message.path) {
      return {
        file: message.path,
        position: toLinterRange(message)[0],
      }
    }
  }
  return null
}

export function toStatusLinterMessages(contents: string) {
  const parsed = JSON.parse(contents)
  if (parsed.passed) {
    return []
  }

  return parsed.errors.map(function(error) {
    const firstMessage = error.message[0]
    const message = error.message.reduce(function(chunks, entry) {
      chunks.push(entry.descr)
      return chunks
    }, []).join(' ')

    return {
      severity: error.level === 'error' ? 'error' : 'warning',
      location: {
        file: firstMessage.path,
        position: toLinterRange(firstMessage),
      },
      excerpt: message,
      reference: toLinterReference(error.message),
    }
  })
}

export function toCoverageLinterMessages(coverage: CoverageObject) {
  return coverage.expressions.uncovered_locs.map(({ start, end, source }) => ({
    severity: 'info',
    location: {
      file: source,
      position: [
        [start.line - 1, start.column - 1],
        [end.line - 1, end.column],
      ],
    },
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
