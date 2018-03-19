/* @flow */

import type { Location } from '../../types'

export type StatusMessage = {
  context: ?string,
  descr: string,
  type: string,
  loc?: Location,
  path: string,
  line: number,
  endline: number,
  start: number,
  end: number,
  indent?: number,
}

export type StatusExtra = {
  message: StatusMessage[],
  children?: StatusExtra[],
}

export type StatusError = {
  kind: string,
  level: string,
  message: StatusMessage[],
  operation?: StatusMessage,
  extra?: StatusExtra[],
  trace?: StatusMessage[],
}

export type StatusObject = {
  flowVersion: string,
  errors: StatusError[],
  passed: boolean,
}
