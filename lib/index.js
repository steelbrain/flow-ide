/* @flow */

import Path from 'path'
import { CompositeDisposable, Range, TextEditor } from 'atom'
import { exec, findCached, findCachedAsync } from 'atom-linter'
import { shouldTriggerAutocomplete } from 'atom-autocomplete'
import { INIT_MESSAGE, RECHECKING_MESSAGE, toLinterMessages, injectPosition, toAutocompleteSuggestions } from './helpers'
import CoverageView from './coverage-view'
import type { CoverageObject } from './coverage-view'

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
    this.subscriptions.add(atom.config.observe('flow-ide.hyperclickPriority', (hyperclickPriority) => {
      this.hyperclickPriority = hyperclickPriority
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

  provideLinter(): Object {
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
        } else {
          return []
        }

        const executable = await this.getExecutablePath(fileDirectory)

        let result
        try {
          result = await exec(executable, ['status', '--json'], {
            cwd: fileDirectory,
            ignoreExitCode: true,
            timeout: 60 * 1000,
            uniqueKey: 'flow-ide-linter',
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

  provideHyperclick(): HyperclickProvider {
    const provider = {
      grammarScopes: ['source.js', 'source.js.jsx'],
      getSuggestionForWord: async (textEditor: TextEditor, text: string, range: Range): Promise<?HyperclickSuggestion> => {
        const filePath = textEditor.getPath()
        const rootScope = textEditor.getRootScopeDescriptor().scopes[0]
        console.log(filePath, rootScope, !this.onlyIfAppropriate)
        if (
          !filePath
          || !['source.js', 'source.js.jsx'].includes(rootScope)
        ) {
          return null
        }

        const fileDirectory = Path.dirname(filePath)
        const configFile = await findCachedAsync(fileDirectory, '.flowconfig')
        if (!configFile) {
          return null
        }

        const flowOptions = [
          'get-def',
          '--json',
          filePath,
          range.start.row + 1,
          range.start.column + 1,
        ]

        console.log(flowOptions)

        let result
        try {
          result = await exec(await this.getExecutablePath(fileDirectory), flowOptions, {
            cwd: fileDirectory,
            ignoreExitCode: true,
            timeout: 60 * 1000,
            uniqueKey: 'flow-ide-hyperclick',
          })
          if (result === null) {
            return null
          }
        } catch (error) {
          if (error.message.indexOf(INIT_MESSAGE) !== -1 && configFile) {
            spawnedServers.add(Path.dirname(configFile))
          }
          if (error.message.indexOf(INIT_MESSAGE) !== -1 || error.message.indexOf(RECHECKING_MESSAGE) !== -1) {
            return provider.getSuggestionForWord(textEditor, text, range)
          }
          throw error
        }
        const jsonResult = JSON.parse(result)
        console.log('a', result, jsonResult.path === '')

        return jsonResult.path === ''
          ? null
          : {
            priority: this.hyperclickPriority,
            range,
            callback() {
              console.log('jumping to', jsonResult.path)
              atom.workspace.open(jsonResult.path).then((editor) => {
                editor.setCursorBufferPosition([jsonResult.line - 1, jsonResult.start - 1])
              })
            },
          }
      },
    }
    return provider
  },

  consumeStatusBar(statusBar: any): void {
    this.coverageView = new CoverageView()
    this.coverageView.initialize()
    this.statusBar = statusBar.addLeftTile({ item: this.coverageView, priority: 10 })

    this.subscriptions.add(atom.workspace.onDidChangeActivePaneItem((item: ?TextEditor): void => {
      if (item && item instanceof TextEditor) {
        this.updateCoverage(item)
      } else {
        this.coverageView.reset()
      }
    }))
    this.subscriptions.add(atom.workspace.observeTextEditors((textEditor: TextEditor): void => {
      textEditor.onDidSave(() => this.updateCoverage(textEditor))
    }))
  },

  async updateCoverage(textEditor: TextEditor) {
    const filePath: string = textEditor.getPath()
    if (!filePath) {
      // We do not process files without a path
      return
    }
    const fileDirectory: string = Path.dirname(filePath)

    const executable: string = await this.getExecutablePath(fileDirectory)
    try {
      const result: string = await exec(executable, ['coverage', filePath, '--json'], {
        cwd: fileDirectory,
        ignoreExitCode: true,
        timeout: 60 * 1000,
        uniqueKey: 'flow-ide-coverage',
      }).catch(() => null)

      if (result) {
        const coverage: CoverageObject = JSON.parse(result)
        this.coverageView.update(coverage)
      }
    } catch (error) {
      this.coverageView.reset()
      // Let the linter handle any flow errors.
    }
  },
}
