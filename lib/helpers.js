/* @flow */

import score from 'sb-string_score'

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

function toLinterTrace(messages) {
  const toReturn = []
  const messagesCount = messages.length

  for (let i = 1; i < messagesCount; ++i) {
    const value = messages[i]

    if (value.path) {
      toReturn.push({
        type: 'Trace',
        text: value.descr,
        filePath: value.path,
        range: toLinterRange(value),
      })
    }
  }
  return toReturn
}

export function toLinterMessages(contents: string) {
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
      type: error.level === 'error' ? 'Error' : 'Warning',
      filePath: firstMessage.path,
      range: toLinterRange(firstMessage),
      text: message,
      trace: toLinterTrace(error.message),
    }
  })
}

export function injectPosition(text: string, editor: Object, bufferPosition: Object) {
  const characterIndex = editor.getBuffer().characterIndexForPosition(bufferPosition)
  return text.slice(0, characterIndex) + 'AUTO332' + text.slice(characterIndex)
}

export function toAutocompleteSuggestions(contents: string, prefix: string) {
  const parsed = JSON.parse(contents)
  const hasPrefix = prefix.trim().length
  const suggestions = parsed.result.map(function(suggestion) {
    const isFunction = suggestion.func_details !== null
    let text = null
    let snippet = null
    let displayText = null

    if (isFunction) {
      const functionParams = suggestion.func_details.params
      displayText = `${suggestion.name}(${functionParams.map(value => value.name).join(', ')})`
      snippet = `${suggestion.name}(${functionParams.map(function(value, i) {
        return `\${${i + 1}:${value.name}}`
      }).join(', ')})$${functionParams.length + 1}`
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
    }
  })
  return suggestions.sort(function(a, b) {
    return b.score - a.score
  }).filter(item => item.score)
}
