/* @flow */

import { findCachedAsync } from 'atom-linter'

export const INIT_MESSAGE = 'flow server'
export const RECHECKING_MESSAGE = 'flow is'

export async function getExecutablePath(fileDirectory: string): Promise<string> {
  return (
    await findCachedAsync(fileDirectory, 'node_modules/.bin/flow') ||
    this.executablePath ||
    'flow'
  )
}
