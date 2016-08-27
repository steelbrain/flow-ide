'use babel'

/* @flow */

import Path from 'path'
import { CompositeDisposable } from 'atom'
import { exec, findCachedAsync } from 'atom-linter'
import { shouldTriggerAutocomplete } from 'atom-autocomplete'
import { INIT_MESSAGE, RECHECKING_MESSAGE, shouldRunAutocomplete, toLinterMessages, injectPosition, toAutocompleteSuggestions } from './helpers'

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
      default: ''
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

  async getExecutablePath(fileDirectory: string): Promise<string> {
    return (
      await findCachedAsync(fileDirectory, 'node_modules/.bin/flow') ||
      this.executablePath ||
      'flow'
    )
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

        const executable = await this.getExecutablePath(fileDirectory)

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
      }
    }
    return linter
  },

  provideAutocomplete(): Object {
    const provider = {
      selector: '.source.js, .source.js.jsx',
      disableForSelector: '.comment',
      inclusionPriority: 100,
      getSuggestions: async (params) => {
        const { editor, bufferPosition, prefix, activatedManually } = params
        const filePath = editor.getPath()
        const fileDirectory = Path.dirname(filePath)
        const fileContents = injectPosition(editor.getText(), editor, bufferPosition)

        if (this.onlyIfAppropriate) {
          const configFile = await findCachedAsync(fileDirectory, '.flowconfig')
          if (!configFile) {
            return []
          }
        }
        if (!shouldTriggerAutocomplete({ activatedManually, bufferPosition, editor })) {
          return []
        }

        let result
        try {
          result = await exec(await this.getExecutablePath(fileDirectory), ['autocomplete', '--json', filePath], { cwd: fileDirectory, stdin: fileContents })
        } catch (error) {
          if (error.message.indexOf(INIT_MESSAGE) !== -1 || error.message.indexOf(RECHECKING_MESSAGE) !== -1) {
            return await provider.getSuggestions(editor)
          }
          throw error
        }

        return toAutocompleteSuggestions(result, prefix)
      }
    }
    return provider
  }
}
