'use babel'

export const INIT_MESSAGE = 'flow server'
export const RECHECKING_MESSAGE = 'flow is'
import score from 'sb-string_score'

export function getType(value) {
  return value.type && value.type.substr(0, 1) === '{' ? 'Object' : value.type || 'any'
}

export function toLinterMessages(contents) {
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
      type: firstMessage.level === 'error' ? 'Error' : 'Warning',
      filePath: firstMessage.path,
      range: toLinterRange(firstMessage),
      text: message,
      trace: toLinterTrace(error.message)
    }
  })
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
        range: toLinterRange(value)
      })
    }

  }
  return toReturn
}

function toLinterRange(item) {
  return [
    [item.line - 1, item.start - 1],
    [item.endline - 1, item.end]
  ]
}

export function injectPosition(text, editor, bufferPosition) {
  const characterIndex = editor.getBuffer().characterIndexForPosition(bufferPosition)
  return text.slice(0, characterIndex) + 'AUTO332' + text.slice(characterIndex)
}

export function toAutocompleteSuggestions(text, prefix) {
  const parsed = JSON.parse(text)
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
      text: text,
      type: isFunction ? 'function' : 'property',
      score: hasPrefix ? score(suggestion.name, prefix) : 1,
      snippet: snippet,
      leftLabel: isFunction ? 'function' : getType(suggestion),
      displayText,
      replacementPrefix: prefix,
    }
  })
  return suggestions.sort(function(a, b) {
    return b.score - a.score
  }).filter(item => item.score)
}
