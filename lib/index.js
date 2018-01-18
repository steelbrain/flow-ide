/* @flow */

import Path from 'path'
import { CompositeDisposable } from 'atom'
import type { TextEditor, Point, Range } from 'atom'
import { exec, findCached, findCachedAsync } from 'atom-linter'
import { shouldTriggerAutocomplete } from 'atom-autocomplete'
import type { HyperclickProvider, HyperclickSuggestion } from 'atom-ide-ui/hyperclick'
import type { OutlineProvider } from 'atom-ide-ui/outline'
import {
  INIT_MESSAGE,
  RECHECKING_MESSAGE,
  injectPosition,
  toStatusLinterMessages,
  toCoverageLinterMessages,
  toAutocompleteSuggestions,
  toDatatip,
} from './helpers'
import CoverageView from './coverage-view'
import { toOutline } from './outline'
import type { OutlineOptions } from './outline/types'
import type { CoverageObject } from './types'

const spawnedServers: Set<string> = new Set()
const defaultFlowFile = Path.resolve(__dirname, '..', 'vendor', '.flowconfig')
const defaultFlowBinLocation = 'node_modules/.bin/flow'
const grammarScopes = ['source.js', 'source.js.jsx']

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

    this.hyperclickPriority = null
    let restartNotification
    this.subscriptions.add(atom.config.observe('flow-ide.hyperclickPriority', (hyperclickPriority) => {
      if (this.hyperclickPriority != null) {
        if (hyperclickPriority !== this.hyperclickPriority && restartNotification === undefined) {
          restartNotification = atom.notifications.addSuccess('Restart atom to update flow-ide priority?', {
            dismissable: true,
            buttons: [{
              text: 'Restart',
              onDidClick: () => atom.restartApplication(),
            }],
          })
          restartNotification.onDidDismiss(() => { restartNotification = undefined })
        }
      }
      this.hyperclickPriority = hyperclickPriority
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
      this.executablePath ||
      await findCachedAsync(fileDirectory, defaultFlowBinLocation) ||
      'flow'
    )
  },

  deactivate() {
    this.subscriptions.dispose()
    spawnedServers.forEach((rootDirectory) => {
      const executable = this.executablePath || findCached(rootDirectory, defaultFlowBinLocation) || 'flow'
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
      grammarScopes,
      lintsOnChange: false,
      // eslint-disable-next-line arrow-parens
      lint: async (textEditor) => {
        const filePath = textEditor.getPath()
        if (!filePath) {
          return []
        }

        const fileDirectory = Path.dirname(filePath)

        let configFile
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
      grammarScopes,
      lintsOnChange: false,
      lint: async (textEditor: TextEditor) => {
        const filePath = textEditor.getPath()
        if (!filePath) {
          return []
        }

        const fileDirectory = Path.dirname(filePath)

        let configFile
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
      selector: grammarScopes.map(item => `.${item}`).join(', '),
      disableForSelector: '.comment',
      inclusionPriority: 100,
      // eslint-disable-next-line arrow-parens
      getSuggestions: async (params) => {
        const { editor, bufferPosition, activatedManually } = params
        let prefix = params.prefix
        const filePath = editor.getPath()
        if (!filePath) {
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

  provideHyperclick(): HyperclickProvider {
    const provider = {
      priority: this.hyperclickPriority,
      grammarScopes,
      getSuggestionForWord: async (textEditor: TextEditor, text: string, range: Range): Promise<?HyperclickSuggestion> => {
        const filePath = textEditor.getPath()
        if (!filePath) {
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
          '--path=' + filePath,
          range.start.row + 1,
          range.start.column + 1,
        ]

        let result
        try {
          result = await exec(await this.getExecutablePath(fileDirectory), flowOptions, {
            cwd: fileDirectory,
            stdin: textEditor.getText(),
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

        if (!jsonResult.path) {
          return null
        }

        return {
          range,
          callback() {
            atom.workspace.open(jsonResult.path, { searchAllPanes: true }).then((editor) => {
              editor.setCursorBufferPosition([jsonResult.line - 1, jsonResult.start - 1])
            })
          },
        }
      },
    }
    return provider
  },

  provideOutlines(): OutlineProvider {
    const outlineOptions: OutlineOptions = {
      showKeywords: {
        export: false,
        default: false,
        const: false,
        var: false,
        let: false,
        class: false,
        function: false,
        type: false,
      },
      showFunctionArgs: false,
    }
    this.subscriptions.add(atom.config.observe('flow-ide.outline', (outline) => {
      outlineOptions.showKeywords.export = outline.showExport
      outlineOptions.showFunctionArgs = outline.showFunctionArgs
    }))

    const provider = {
      name: 'flow-ide',
      priority: 1,
      grammarScopes,
      updateOnEdit: true,
      getOutline: async (editor: TextEditor) => {
        const filePath = editor.getPath()
        if (!filePath) {
          return null
        }

        const fileDirectory = Path.dirname(filePath)
        const configFile = await findCachedAsync(fileDirectory, '.flowconfig')
        if (!configFile) {
          return null
        }

        const flowOptions = ['ast']

        let result
        try {
          result = await exec(await this.getExecutablePath(fileDirectory), flowOptions, {
            cwd: fileDirectory,
            stdin: editor.getText(),
            timeout: 60 * 1000,
            uniqueKey: 'flow-ide-ast',
            ignoreExitCode: true,
          })
          if (result === null) {
            return { outlineTrees: [] }
          }
        } catch (error) {
          if (error.message.indexOf(INIT_MESSAGE) !== -1 && configFile) {
            spawnedServers.add(Path.dirname(configFile))
          }
          if (error.message.indexOf(INIT_MESSAGE) !== -1 || error.message.indexOf(RECHECKING_MESSAGE) !== -1) {
            return provider.getOutline(editor)
          }
          throw error
        }

        return toOutline(result, outlineOptions)
      },
    }
    return provider
  },

  consumeDatatip(datatipService: any) {
    const provider = {
      providerName: 'flow-ide',
      priority: 1,
      grammarScopes,
      datatip: async (editor: TextEditor, point: Point): Promise<any> => {
        const filePath = editor.getPath()
        if (!filePath) {
          return null
        }

        const fileDirectory = Path.dirname(filePath)
        const configFile = await findCachedAsync(fileDirectory, '.flowconfig')
        if (!configFile) {
          return null
        }

        const flowOptions = [
          'type-at-pos',
          '--json',
          '--path=' + filePath,
          point.row + 1,
          point.column + 1,
        ]

        let result
        try {
          result = await exec(await this.getExecutablePath(fileDirectory), flowOptions, {
            cwd: fileDirectory,
            stdin: editor.getText(),
            timeout: 60 * 1000,
            uniqueKey: 'flow-ide-type-at-pos',
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
            return provider.datatip(editor, point)
          }
          throw error
        }

        return toDatatip(editor, point, result)
      },
    }
    this.subscriptions.add(datatipService.addProvider(provider))
  },

  consumeStatusBar(statusBar: any): void {
    this.coverageView = new CoverageView()
    this.coverageView.initialize()
    this.statusBar = statusBar.addLeftTile({ item: this.coverageView, priority: 10 })
  },
}
