'use babel'

export const INIT_MESSAGE = 'Spawned flow server'
import score from 'sb-string_score'

export function geType(value) {
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
      location: {
        file: firstMessage.path,
        position: toLinterRange(firstMessage),
      },
      excerpt: message,
      severity: firstMessage.level === 'error' ? 'error' : 'warning',
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

    if (isFunction) {
      const parsedParams = []
      const params = suggestion.func_details.params
      let i = 0
      for (; i < params.length; ++i) {
        const value = params[i]
        const type = geType(value)
        parsedParams.push(`\${${i + 1}:${value.name}: ${type}}`)
      }
      snippet = suggestion.name + '(' + parsedParams.join(', ') + ')$' + (i + 1)
    } else {
      text = suggestion.name
    }

    return {
      text: text,
      snippet: snippet,
      leftLabel: isFunction ? 'function' : geType(suggestion),
      type: isFunction ? 'function' : 'property',
      replacementPrefix: prefix,
      score: hasPrefix ? score(suggestion.name, prefix) : 1
    }
  })
  return suggestions.sort(function(a, b) {
    return b.score - a.score
  }).filter(item => item.score)
}
