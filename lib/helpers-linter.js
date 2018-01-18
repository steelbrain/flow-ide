/* @flow */

// Note: the following code is based on
// https://github.com/facebook/flow/blob/v0.47.0/tsrc/flowResult.js
// and adjusted to output nicely formatted markdown.

import { format } from 'util'
import type { StatusError, StatusExtra, StatusMessage, Location } from './types'

const regexMarkdownChars = /[*#()[\]<>_]/g
const escapeChars = { '<': '&lt;', '>': '&gt;' }

function fileUrl({ source, start }: Location): string {
  // build a link that can be opened by the linter ui.
  // e.g. atom://linter?file=<path>&row=<number>&column=<number>
  const params = ['file=' + encodeURIComponent(source)]
  if (start.line > 0) {
    params.push('row=' + (start.line - 1))
    if (start.column > 0) {
      params.push('column=' + (start.column - 1))
    }
  }
  return 'atom://linter?' + params.join('&')
}
function linterLink(loc: Location, text: string) {
  return '[' + text + '](' + fileUrl(loc) + ')'
}
function fileLink(loc: Location): string {
  return linterLink(loc, atom.project.relativize(loc.source))
}
function lineLink(loc: Location): string {
  return linterLink(loc, loc.start.line.toString())
}

export function mainMessageOfError(error: StatusError): StatusMessage {
  return error.operation || error.message[0]
}

export function mainLocOfError(error: StatusError): ?Location {
  return mainMessageOfError(error).loc
}

function getExtraMessages(extra: ?StatusExtra[]): StatusMessage[] {
  if (extra) {
    const messages = extra.reduce((acc, current) => {
      const childrenMessages = getExtraMessages(current.children)
      return acc.concat(current.message, childrenMessages)
    }, [])
    messages.forEach((message) => {
      const msg = message
      msg.indent = (msg.indent || 0) + 2
    })
    return messages
  }
  return []
}

function getTraceReasons(trace: ?StatusMessage[]): StatusMessage[] {
  if (trace != null && trace.length > 0) {
    return ([{ descr: 'Trace:', type: 'Blame' }].concat(trace): any)
  }
  return []
}

function mkComment(descr: string): StatusMessage {
  return ({ descr, type: 'Comment' }: any)
}

function getOpReason(op: ?StatusMessage): StatusMessage[] {
  if (op) {
    return [
      op,
      mkComment('Error:'),
    ]
  }
  return []
}

function getHeader(mainLoc: ?Location, kind: string, level: string): StatusMessage[] {
  let line = -1
  let filename = ''
  if (mainLoc) {
    const { source, start } = mainLoc
    line = start.line
    if (source) {
      filename = fileLink(mainLoc)
    }
  }
  if (!filename) {
    filename = format('%s:%d', '[No file]', line)
  }

  let prefix = ''
  if (kind === 'internal' && level === 'error') {
    prefix = 'Internal error (see logs):\n'
  } else if (mainLoc && mainLoc.type === 'LibFile') {
    if (kind === 'parse' && level === 'error') {
      prefix = 'Library parse error:\n'
    } else if (kind === 'infer') {
      prefix = 'Library type error:\n'
    }
  }

  return [mkComment(format('%s%s', prefix, filename))]
}

function prettyPrintMessage(mainFile: string, { context, descr, loc, indent }: StatusMessage): string {
  const indentation = ' '.repeat(indent || 0)
  if (loc) {
    const startCol = loc.start.column - 1
    let contextStr = indentation
    if (context !== null && typeof context === 'string') {
      // On Windows this might have \r
      let ctx = context.trimRight()
      // Replace tabs with spaces
      ctx = ctx.replace(/\t/g, ' ')
      // escape certain chars that serve a purpose in markdown
      ctx = ctx.replace(regexMarkdownChars, m => escapeChars[m] || '\\' + m)

      const { line } = loc.start
      const prefix = line < 100 ? ' '.repeat(3 - line.toString().length) : ''

      let padding = Array((prefix + line + ': ').length + 1).join(' ')
      if (ctx.length > startCol) {
        padding += ctx.substr(0, startCol).replace(/[^\t ]/g, ' ')
      }

      const underlineSize = line === loc.end.line ?
        Math.max(1, loc.end.column - startCol) :
        1
      const underline = '^'.repeat(underlineSize)

      contextStr = format(
        '%s%s%s: %s\n%s%s%s ',
        indentation,
        prefix,
        lineLink(loc),
        ctx,
        indentation,
        padding,
        underline,
      )
    }
    const seeAnotherFile = loc.source === mainFile ?
      '' :
      format(
        '. See%s: %s',
        loc.type === 'LibFile' ? ' lib' : '',
        fileLink(loc),
      )
    return format('%s%s%s', contextStr, descr, seeAnotherFile)
  }
  return indentation + descr
}

export function mergedMessagesOfError(error: StatusError): StatusMessage[] {
  const { level, kind, message, operation, trace, extra } = error
  const mainLoc = mainLocOfError(error)
  const messages = [].concat(
    getHeader(mainLoc, kind, level),
    getOpReason(operation),
    message,
    getExtraMessages(extra),
    getTraceReasons(trace),
  )
  // Merge comments into blames
  return messages.reduce((acc, msg) => {
    const { descr, loc, type } = msg
    if (loc || acc.length === 0 || type === 'Blame') {
      acc.push(msg)
    } else if (descr !== 'Error:') {
      const prev = acc[acc.length - 1]
      prev.descr = prev.descr === '' ? descr : format('%s. %s', prev.descr, descr)
    }
    return acc
  }, [])
}

export function prettyPrintError(error: StatusError): string {
  const mainLoc = mainLocOfError(error)
  const mainFile = (mainLoc && mainLoc.source) || '[No file]'
  const messages = mergedMessagesOfError(error)
  return '<div style="white-space: pre-wrap">' + messages.map(msg => prettyPrintMessage(mainFile, msg)).join('\n') + '</div>'
}
