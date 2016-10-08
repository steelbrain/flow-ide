/* @flow */

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
      type: firstMessage.level === 'error' ? 'Error' : 'Warning',
      filePath: firstMessage.path,
      range: toLinterRange(firstMessage),
      text: message,
      trace: toLinterTrace(error.message),
    }
  })
}
