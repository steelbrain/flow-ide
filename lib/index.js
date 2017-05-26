/* @flow */

import Path from 'path'
import { CompositeDisposable, TextEditor } from 'atom'
import { exec, findCached, findCachedAsync } from 'atom-linter'
import { shouldTriggerAutocomplete } from 'atom-autocomplete'
import {
  INIT_MESSAGE,
  RECHECKING_MESSAGE,
  injectPosition,
  toStatusLinterMessages,
  toCoverageLinterMessages,
  toAutocompleteSuggestions,
} from './helpers'
import CoverageView from './coverage-view'
import type { CoverageObject } from './types'

const spawnedServers: Set<string> = new Set()
const defaultFlowFile = Path.resolve(__dirname, '..', 'vendor', '.flowconfig')

export default {
  activate() {
    // eslint-disable-next-line global-require
    require('atom-package-deps').install('flow-ide', true)

    this.subscriptions = new CompositeDisposable()
    this.subscriptions.add(atom.config.observe('flow-ide.executablePath', (executablePath) => {
      this.executablePath = executablePath
    }))
    this.subscriptions.add(atom.config.observe('flow-ide.onlyIfAppropriate', (onlyIfAppropriate) => {
      this.onlyIfAppropriate = onlyIfAppropriate
    }))
    this.subscriptions.add(atom.config.observe('flow-ide.showUncovered', (showUncovered) => {
      this.showUncovered = showUncovered
      // lint again so that the coverage actually updates
      const view = atom.views.getView(atom.workspace.getActiveTextEditor())
      if (view) {
        atom.commands.dispatch(view, 'linter:lint')
      }
    }))
    this.subscriptions.add(atom.workspace.onDidChangeActivePaneItem((item: ?TextEditor): void => {
      if (this.coverageView) {
        const coverage = this.coverages.get(item)
        if (coverage) {
          this.coverageView.update(coverage)
        } else {
          this.coverageView.reset()
        }
      }
    }))

    this.coverages = new WeakMap()
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
    spawnedServers.forEach((rootDirectory) => {
      const executable = findCached(rootDirectory, 'node_modules/.bin/flow') || this.executablePath || 'flow'
      exec(executable, ['stop'], {
        cwd: rootDirectory,
        timeout: 60 * 1000,
        detached: true,
        ignoreExitCode: true,
      }).catch(() => null) // <-- ignore all errors
    })
  },

  provideLinter(): Object[] {
    return [this.provideStatusLinter(), this.provideCoverageLinter()]
  },

  provideStatusLinter(): Object {
    const linter = {
      name: 'Flow IDE',
      scope: 'project',
      grammarScopes: ['source.js', 'source.js.jsx'],
      lintsOnChange: false,
      // eslint-disable-next-line arrow-parens
      lint: async (textEditor) => {
        let configFile
        const filePath = textEditor.getPath()
        const fileDirectory = Path.dirname(filePath)

        if (this.onlyIfAppropriate) {
          configFile = await findCachedAsync(fileDirectory, '.flowconfig')
          if (!configFile) {
            return []
          }
        }

        const executable = await this.getExecutablePath(fileDirectory)

        let result
        try {
          result = await exec(executable, ['status', '--json'], {
            cwd: fileDirectory,
            timeout: 60 * 1000,
            uniqueKey: 'flow-ide-linter',
            ignoreExitCode: true,
          })
          if (result === null) {
            return null
          }
        } catch (error) {
          if (error.message.indexOf(INIT_MESSAGE) !== -1 && configFile) {
            spawnedServers.add(Path.dirname(configFile))
          }
          if (error.message.indexOf(INIT_MESSAGE) !== -1 || error.message.indexOf(RECHECKING_MESSAGE) !== -1) {
            return linter.lint(textEditor)
          } else if (error.code === 'ENOENT') {
            throw new Error('Unable to find `flow` executable.')
          } else {
            throw error
          }
        }

        return toStatusLinterMessages(result)
      },
    }
    return linter
  },
  provideCoverageLinter(): Object {
    const linter = {
      name: 'Flow IDE Coverage',
      scope: 'file',
      grammarScopes: ['source.js', 'source.js.jsx'],
      lintsOnChange: false,
      lint: async (textEditor: TextEditor) => {
        let configFile
        const filePath = textEditor.getPath()
        const fileDirectory = Path.dirname(filePath)

        if (this.onlyIfAppropriate) {
          configFile = await findCachedAsync(fileDirectory, '.flowconfig')
          if (!configFile) {
            return []
          }
        }

        const executable = await this.getExecutablePath(fileDirectory)

        let result: string
        try {
          result = await exec(executable, ['coverage', filePath, '--json'], {
            cwd: fileDirectory,
            timeout: 60 * 1000,
            uniqueKey: 'flow-ide-coverage',
            ignoreExitCode: true,
          })
          if (result === null) {
            return null
          }
        } catch (error) {
          if (error.message.indexOf(INIT_MESSAGE) !== -1 && configFile) {
            spawnedServers.add(Path.dirname(configFile))
          }
          if (error.message.indexOf(INIT_MESSAGE) !== -1 || error.message.indexOf(RECHECKING_MESSAGE) !== -1) {
            return linter.lint(textEditor)
          } else if (error.code === 'ENOENT') {
            throw new Error('Unable to find `flow` executable.')
          } else {
            throw error
          }
        }

        const coverage: CoverageObject = JSON.parse(result)
        this.coverages.set(textEditor, coverage)
        if (this.coverageView) {
          this.coverageView.update(coverage)
        }
        return this.showUncovered ? toCoverageLinterMessages(coverage) : []
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
        if (!filePath) {
          // We not process files without filepath
          return []
        }

        const fileDirectory = Path.dirname(filePath)
        const fileContents = injectPosition(editor.getText(), editor, bufferPosition)
        let flowOptions = ['autocomplete', '--json', filePath]

        const configFile = await findCachedAsync(fileDirectory, '.flowconfig')
        if (!configFile) {
          if (this.onlyIfAppropriate) {
            return []
          }
          flowOptions = ['autocomplete', '--root', defaultFlowFile, '--json', filePath]
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
          result = await exec(await this.getExecutablePath(fileDirectory), flowOptions, {
            cwd: fileDirectory,
            stdin: fileContents,
            timeout: 60 * 1000,
            uniqueKey: 'flow-ide-autocomplete',
            ignoreExitCode: true,
          })
          if (result === null) {
            return []
          }
        } catch (error) {
          if (error.message.indexOf(INIT_MESSAGE) !== -1 && configFile) {
            spawnedServers.add(Path.dirname(configFile))
          }
          if (error.message.indexOf(INIT_MESSAGE) !== -1 || error.message.indexOf(RECHECKING_MESSAGE) !== -1) {
            return provider.getSuggestions(params)
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
  },
}
