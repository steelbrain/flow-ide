/* @flow */

import type { TokenKind, TextToken } from 'atom-ide-ui/outline'

function buildToken(kind: TokenKind, value: string): TextToken {
  return { kind, value }
}

export function keyword(value: string): TextToken {
  return buildToken('keyword', value)
}

export function className(value: string): TextToken {
  return buildToken('class-name', value)
}

export function constructor(value: string): TextToken {
  return buildToken('constructor', value)
}

export function method(value: string): TextToken {
  return buildToken('method', value)
}

export function param(value: string): TextToken {
  return buildToken('param', value)
}

export function string(value: string): TextToken {
  return buildToken('string', value)
}

export function whitespace(value: string): TextToken {
  return buildToken('whitespace', value)
}

export function plain(value: string): TextToken {
  return buildToken('plain', value)
}

export function type(value: string): TextToken {
  return buildToken('type', value)
}
