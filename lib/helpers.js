'use babel'

export const INIT_MESSAGE = 'Spawned flow server'

export function toLinterMessages(contents) {
  const parsed = JSON.parse(contents)
  if (parsed.passed) {
    return []
  }

  return parsed.errors.map(function(error) {
    const firstMessage = error.message[0]

    return {
      type: firstMessage.level === 'error' ? 'Error' : 'Warning',
      filePath: firstMessage.path,
      range: toLinterRange(firstMessage),
      text: error.message.reduce(toLinterText, ''),
      trace: toLinterTrace(error.message)
    }
  })
}

function toLinterText(text, item) {
  return text += ' ' + item.descr
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
        parsedParams.push(`\${${i + 1}:${value.name}: ${value.type || 'any'}}`)
      }
      snippet = suggestion.name + '(' + parsedParams.join(', ') + ')$' + (i + 1)
    } else {
      text = suggestion.name
    }


    return {
      text: text,
      snippet: snippet,
      leftLabel: suggestion.type || 'unknown',
      type: isFunction ? 'function' : 'property',
      replacementPrefix: prefix
    }
  })
  return suggestions
}

function trimParameterSignature(param) {
  return param.name + ':' + (param.type || 'any')
}
