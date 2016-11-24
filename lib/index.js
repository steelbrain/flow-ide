/* @flow */

import Path from 'path'
import { CompositeDisposable, TextEditor } from 'atom'
import { exec, findCachedAsync } from 'atom-linter'
import { shouldTriggerAutocomplete } from 'atom-autocomplete'
import { INIT_MESSAGE, RECHECKING_MESSAGE, toLinterMessages, injectPosition, toAutocompleteSuggestions } from './helpers'
import CoverageView from './coverage-view'

type CoverageObject = {
  expressions?: {
    covered_count: number,
    uncovered_count: number,
  }
}

export default {
  activate() {
    // eslint-disable-next-line global-require
    require('atom-package-deps').install('flow-ide')

    this.subscriptions = new CompositeDisposable()
    this.subscriptions.add(atom.config.observe('flow-ide.executablePath', (executablePath) => {
      this.executablePath = executablePath
    }))
    this.subscriptions.add(atom.config.observe('flow-ide.onlyIfAppropriate', (onlyIfAppropriate) => {
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
      // eslint-disable-next-line arrow-parens
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
      },
    }
    return linter
  },

  provideAutocomplete(): Object {
    const provider = {
      selector: '.source.js, .source.js.jsx',
      disableForSelector: '.comment',
      inclusionPriority: 100,
      // eslint-disable-next-line arrow-parens
      getSuggestions: async (params) => {
        const { editor, bufferPosition, activatedManually } = params
        let prefix = params.prefix
        const filePath = editor.getPath()
        const fileDirectory = Path.dirname(filePath)
        const fileContents = injectPosition(editor.getText(), editor, bufferPosition)

        if (this.onlyIfAppropriate) {
          const configFile = await findCachedAsync(fileDirectory, '.flowconfig')
          if (!configFile) {
            return []
          }
        }

        // NOTE: Fix for class properties autocompletion
        if (prefix === '.') {
          prefix = ''
        }

        if (!shouldTriggerAutocomplete({ activatedManually, bufferPosition, editor })) {
          return []
        }

        let result
        try {
          result = await exec(await this.getExecutablePath(fileDirectory), ['autocomplete', '--json', filePath], { cwd: fileDirectory, stdin: fileContents })
        } catch (error) {
          if (error.message.indexOf(INIT_MESSAGE) !== -1 || error.message.indexOf(RECHECKING_MESSAGE) !== -1) {
            return await provider.getSuggestions(params)
          }
          throw error
        }

        return toAutocompleteSuggestions(result, prefix)
      },
    }
    return provider
  },

  consumeStatusBar(statusBar: any): void {
    this.coverageView = new CoverageView()
    this.coverageView.initialize()
    this.statusBar = statusBar.addLeftTile({ item: this.coverageView, priority: 10 })

    this.subscriptions.add(atom.workspace.onDidChangeActivePaneItem((item: TextEditor|null|any): void => {
      console.log(item)
      if (item && item instanceof TextEditor) {
        this.updateCoverage(item)
      }
    }))
    this.subscriptions.add(atom.workspace.observeTextEditors((textEditor: TextEditor): void => {
      textEditor.onDidSave(() => this.updateCoverage(textEditor))
    }))
  },

  updateCoverage(textEditor: TextEditor): void {
    const filePath: string = textEditor.getPath()
    const fileDirectory: string = Path.dirname(filePath)

    this.getExecutablePath(fileDirectory)
      .then((executable: string): void => {
        exec(executable, ['coverage', filePath, '--json'], { cwd: fileDirectory, ignoreExitCode: true })
          .then((result: string): void => {
            const coverage: CoverageObject = JSON.parse(result)

            if (coverage) {
              this.coverageView.update(coverage)
            }
          })
      })
  },
}
