/* @flow */

import { exec as execProcess, findCachedAsync } from 'atom-linter'

export const INIT_MESSAGE = 'flow server'
export const RECHECKING_MESSAGE = 'flow is'

export async function getExecutablePath(executablePath: string, fileDirectory: string): Promise<string> {
  return (
    await findCachedAsync(fileDirectory, 'node_modules/.bin/flow') ||
    executablePath ||
    'flow'
  )
}

export async function exec(executablePath: string, fileDirectory: string, parameters: Array<string>, options: Object): Promise<string> {
  try {
    return await execProcess(await getExecutablePath(executablePath, fileDirectory), parameters, options)
  } catch (error) {
    if (error.message.indexOf(INIT_MESSAGE) !== -1 || error.message.indexOf(RECHECKING_MESSAGE) !== -1) {
      return await exec(executablePath, fileDirectory, parameters, options)
    } else if (error.code === 'ENOENT') {
      throw new Error('Unable to find `flow` executable.')
    } else {
      throw error
    }
  }
}
