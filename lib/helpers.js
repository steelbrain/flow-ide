/* @flow */

import { findCached, findCachedAsync } from 'atom-linter'
import * as Path from 'path'

const executable = process.platform === 'win32' ? 'flow.cmd' : 'flow'

export const defaultFlowFile = Path.resolve(__dirname, '..', 'vendor', '.flowconfig')
export const defaultFlowBinLocation = Path.join('node_modules', '.bin', executable)
export const grammarScopes = [
  'source.js', 'source.jsx', 'source.js.jsx',
  'source.flow', 'flow-javascript',
]

export async function getExecutablePath(fileDirectory: string): Promise<string> {
  return (
    (atom.config.get('flow-ide.executablePath'): any) ||
    await findCachedAsync(fileDirectory, defaultFlowBinLocation) ||
    'flow'
  )
}

export function getExecutablePathSync(fileDirectory: string): string {
  return (
    (atom.config.get('flow-ide.executablePath'): any) ||
    findCached(fileDirectory, defaultFlowBinLocation) ||
    'flow'
  )
}

export async function getConfigFile(fileDirectory: string): Promise<?string> {
  return findCachedAsync(fileDirectory, '.flowconfig')
}
