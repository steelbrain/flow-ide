/* @flow */

import Path from 'path'
import { exec, findCachedAsync } from 'atom-linter'
import type { TextEditor } from 'atom'

import { toLinterMessages } from './helpers'
import { getExecutablePath, INIT_MESSAGE, RECHECKING_MESSAGE } from '../helpers'

const linter = {
  name: 'Flow IDE',
  grammarScopes: ['source.js', 'source.js.jsx'],
  scope: 'project',
  lintOnFly: false,
  // eslint-disable-next-line arrow-parens
  lint: async (textEditor: TextEditor) => {
    const filePath = textEditor.getPath()
    const fileDirectory = Path.dirname(filePath)

    if (this.onlyIfAppropriate) {
      const configFile = await findCachedAsync(fileDirectory, '.flowconfig')
      if (!configFile) {
        return []
      }
    }

    const executable = await getExecutablePath(fileDirectory)

    let result
    try {
      result = await exec(executable, ['status', '--json'], { cwd: fileDirectory, ignoreExitCode: true })
    } catch (error) {
      if (error.message.indexOf(INIT_MESSAGE) !== -1 || error.message.indexOf(RECHECKING_MESSAGE) !== -1) {
        return await linter.lint(textEditor)
      } else if (error.code === 'ENOENT') {
        throw new Error('Unable to find `flow` executable.')
      } else {
        throw error
      }
    }

    return toLinterMessages(result)
  },
}

export default linter
