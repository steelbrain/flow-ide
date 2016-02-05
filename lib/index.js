'use babel'

/* @flow */

import Path from 'path'
import {CompositeDisposable} from 'atom'
import {exec, findCachedAsync} from 'atom-linter'
import {INIT_MESSAGE, toLinterMessages} from './helpers'

module.exports = {
  executablePath: 'flow',
  onlyIfAppropriate: true,

  config: {
    onlyIfAppropriate: {
      title: "Only activate when .flowconfig exists",
      type: 'boolean',
      default: true
    },
    executablePath: {
      type: 'string',
      description: 'Path to `flow` executable',
      default: 'flow'
    }
  },

  activate() {
    require('atom-package-deps').install()

    this.subscriptions = new CompositeDisposable()
    this.subscriptions.add(atom.config.observe('flow-ide.executablePath', executablePath => {
      this.executablePath = executablePath
    }))
    this.subscriptions.add(atom.config.observe('flow-ide.onlyIfAppropriate', onlyIfAppropriate => {
      this.onlyIfAppropriate = onlyIfAppropriate
    }))
  },

  deactivate() {
    this.subscriptions.dispose()
  },

  provideLinter(): Object {
    const linter = {
      name: 'Flow IDE',
      grammarScopes: ['source.js', 'source.js.jsx'],
      scope: 'project',
      lintOnFly: false,
      lint: async (textEditor) => {
        const filePath = textEditor.getPath()
        const fileDirectory = Path.dirname(filePath)

        if (this.onlyIfAppropriate) {
          const configFile = await findCachedAsync(fileDirectory, '.flowconfig')
          if (!configFile) {
            return []
          }
        }

        let result
        try {
          result = await exec(this.executablePath, ['status', '--json', filePath], {cwd: fileDirectory})
        } catch (_) {
          if (_.message.indexOf(INIT_MESSAGE) !== -1) {
            return linter.lint(textEditor)
          } else throw _
        }

        return toLinterMessages(result)
      }
    }
    return linter
  }
}
