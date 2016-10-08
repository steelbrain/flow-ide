/* @flow */

import Path from 'path'
import { CompositeDisposable } from 'atom'
import { findCachedAsync } from 'atom-linter'
import type { TextEditor } from 'atom'

import { toLinterMessages } from './helpers'
import { exec } from '../helpers'

export default class Linter {
  name = 'Flow IDE'
  scope = 'project'
  lintOnFly = false
  grammarScopes = ['source.js', 'source.js.jsx']
  subscriptions = new CompositeDisposable()
  executablePath: string

  constructor() {
    this.subscriptions.add(atom.config.observe('flow-ide.executablePath', (executablePath) => {
      this.executablePath = executablePath
    }))
  }

  async lint(textEditor: TextEditor) {
    const filePath = textEditor.getPath()
    const fileDirectory = Path.dirname(filePath)

    if (this.onlyIfAppropriate) {
      const configFile = await findCachedAsync(fileDirectory, '.flowconfig')
      if (!configFile) {
        return []
      }
    }

    const output = await exec(this.executablePath, fileDirectory, ['status', '--json'], {
      cwd: fileDirectory,
      ignoreExitCode: true,
    })

    return toLinterMessages(output)
  }
  dispose() {
    this.subscriptions.dispose()
  }
}
