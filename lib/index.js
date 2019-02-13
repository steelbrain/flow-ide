/* @flow */

import { CompositeDisposable } from 'atom'
import type { TextEditor, Point, Range } from 'atom'
import { shouldTriggerAutocomplete } from 'atom-autocomplete'
import { exec } from 'atom-linter'
import type { HyperclickProvider, HyperclickSuggestion } from 'atom-ide-ui/hyperclick'
import type { OutlineProvider } from 'atom-ide-ui/outline'
import * as Path from 'path'
import type { Message } from 'linter'
import prettyPrintTypes from 'flow-language-server/lib/pkg/nuclide-flow-rpc/lib/prettyPrintTypes'
import score from 'sb-string_score'
import * as semver from 'semver'
import CoverageView from './coverage-view'
import * as LinterV1 from './linter/v1'
import * as LinterV2 from './linter/v2'
import * as Helpers from './helpers'
import { toOutline } from './outline'
import type { OutlineOptions } from './outline/types'
import type { CoverageObject, TypeAtPosObject } from './types'

export const INIT_MESSAGE = 'flow server'
export const RECHECKING_MESSAGE = 'flow is'

type Server = {
  version: ?Promise<string>,
}
const servers: Map<string, Server> = new Map()

export class Flow {
  subscriptions: CompositeDisposable
  executablePath: string
  onlyIfAppropriate: boolean
  hyperclickPriority: number
  showUncovered: boolean
  coverageView: any
  coverages: WeakMap<TextEditor, CoverageObject>
  statusBar: ?atom$StatusBarTile

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
      const editor = atom.workspace.getActiveTextEditor()
      if (!editor) {
        return
      }
      const view = atom.views.getView(editor)
      if (view) {
        atom.commands.dispatch(view, 'linter:lint')
      }
    }))
    this.subscriptions.add(atom.workspace.onDidChangeActivePaneItem((item: any): void => {
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
  }

  async getConfigFile(fileDirectory: string): Promise<?string> {
    const configFile = await Helpers.getConfigFile(fileDirectory)
    if (configFile != null) {
      const dir = Path.dirname(configFile)
      if (!servers.has(dir)) {
        servers.set(Path.dirname(configFile), { version: null })
      }
    }
    return configFile
  }

  deactivate() {
    this.subscriptions.dispose()
    if (atom.config.get('flow-ide.stopServer')) {
      this.stopServer()
    }
  }

  stopServer() {
    servers.forEach((server, rootDirectory) => {
      const executable = Helpers.getExecutablePathSync(rootDirectory)
      exec(executable, ['stop'], {
        cwd: rootDirectory,
        timeout: 60 * 1000,
        detached: true,
        ignoreExitCode: true,
      }).catch(() => null) // <-- ignore all errors
    })
  }

  async getVersion(configFile: string, executable: string): Promise<?string> {
    const dir = Path.dirname(configFile)
    const server = servers.get(dir)
    if (server && server.version != null) {
      return server.version
    }

    const p = exec(executable, ['version', '--json'], {
      timeout: 60 * 1000,
      uniqueKey: 'flow-ide-version',
      ignoreExitCode: true,
    }).then((result) => {
      if (result === null) {
        // reset the version because something went wrong...
        servers.set(dir, { ...server, version: null })
        return null
      }
      return JSON.parse(result).semver
    })
    .catch((error) => {
      this.handleError(error, configFile)
      return this.getVersion(configFile, executable)
    })

    servers.set(dir, { ...server, version: p })
    return p
  }

  provideLinter(): Object[] {
    return [this.provideStatusLinter(), this.provideCoverageLinter()]
  }

  provideStatusLinter(): Object {
    const linter = {
      name: 'Flow IDE',
      scope: 'project',
      grammarScopes: Helpers.grammarScopes,
      lintsOnChange: false,
      // eslint-disable-next-line arrow-parens
      lint: async (textEditor: TextEditor) => {
        const filePath = textEditor.getPath()
        if (filePath == null) {
          return []
        }

        const fileDirectory = Path.dirname(filePath)

        let configFile = await this.getConfigFile(fileDirectory)
        if (configFile == null) {
          if (this.onlyIfAppropriate) {
            return []
          }
          configFile = ((configFile: any): string)
        }

        const executable = await Helpers.getExecutablePath(fileDirectory)

        const version = await this.getVersion(configFile, executable)
        if (version == null) {
          return null
        }

        return semver.gte(version, '0.66.0')
          ? this.lintV2(textEditor, filePath, fileDirectory, configFile, executable)
          : this.lintV1(textEditor, filePath, fileDirectory, configFile, executable)
      },
    }
    return linter
  }
  async lintV1(textEditor: TextEditor, filePath: string, fileDirectory: string, configFile: string, executable: string) {
    let result
    try {
      result = await exec(executable, ['status', '--json'], {
        cwd: fileDirectory,
        timeout: 60 * 1000,
        uniqueKey: 'flow-ide-linter',
        ignoreExitCode: true,
      })
    } catch (error) {
      this.handleError(error, configFile)
      return this.lintV1(textEditor, filePath, fileDirectory, configFile, executable)
    }

    if (result === null) {
      return null
    }
    return LinterV1.toLinterMessages(result)
  }
  async lintV2(textEditor: TextEditor, filePath: string, fileDirectory: string, configFile: string, executable: string) {
    let result
    try {
      result = await exec(executable, ['status', '--json', '--json-version=2'], {
        cwd: fileDirectory,
        timeout: 60 * 1000,
        uniqueKey: 'flow-ide-linter',
        ignoreExitCode: true,
      })
    } catch (error) {
      this.handleError(error, configFile)
      return this.lintV2(textEditor, filePath, fileDirectory, configFile, executable)
    }

    if (result === null) {
      return null
    }
    return LinterV2.toLinterMessages(result, filePath)
  }

  provideCoverageLinter(): Object {
    const linter = {
      name: 'Flow IDE Coverage',
      scope: 'file',
      grammarScopes: Helpers.grammarScopes,
      lintsOnChange: false,
      lint: async (textEditor: TextEditor) => {
        const filePath = textEditor.getPath()
        if (filePath == null) {
          return []
        }

        const fileDirectory = Path.dirname(filePath)

        let configFile
        if (this.onlyIfAppropriate) {
          configFile = await this.getConfigFile(fileDirectory)
          if (configFile == null) {
            return []
          }
        }

        const executable = await Helpers.getExecutablePath(fileDirectory)

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
          this.handleError(error, configFile)
          return linter.lint(textEditor)
        }

        const coverage: CoverageObject = JSON.parse(result)
        this.coverages.set(textEditor, coverage)
        if (this.coverageView) {
          this.coverageView.update(coverage)
        }
        return this.showUncovered ? this.toCoverageLinterMessages(coverage) : []
      },
    }
    return linter
  }

  provideAutocomplete(): Object {
    const provider = {
      selector: Helpers.grammarScopes.map(x => (x.includes('.') ? `.${x}` : x)).join(', '),
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
        const fileContents = this.injectPosition(editor.getText(), editor, bufferPosition)
        let flowOptions = ['autocomplete', '--json', filePath]

        let configFile = await this.getConfigFile(fileDirectory)
        if (configFile == null) {
          if (this.onlyIfAppropriate) {
            return []
          }
          configFile = ((configFile: any): string)
          flowOptions = ['autocomplete', '--root', Helpers.defaultFlowFile, '--json', filePath]
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
          result = await exec(await Helpers.getExecutablePath(fileDirectory), flowOptions, {
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
          this.handleError(error, configFile)
          return provider.getSuggestions(params)
        }

        return this.toAutocompleteSuggestions(result, prefix)
      },
    }
    return provider
  }
  injectPosition(text: string, editor: Object, bufferPosition: Object) {
    const characterIndex = editor.getBuffer().characterIndexForPosition(bufferPosition)
    return text.slice(0, characterIndex) + 'AUTO332' + text.slice(characterIndex)
  }
  toAutocompleteSuggestions(contents: string, prefix: string) {
    if (contents.slice(0, 1) !== '{') {
      // Invalid server response
      return []
    }

    const parsed = JSON.parse(contents)
    const hasPrefix = prefix.trim().length
    const suggestions = parsed.result.map((suggestion) => {
      const isFunction = suggestion.func_details !== null
      let text = null
      let snippet = null
      let displayText = null
      let description = null

      if (isFunction) {
        const functionParams = suggestion.func_details.params
        displayText = `${suggestion.name}(${functionParams.map(value => value.name).join(', ')})`
        const snippetArgs = functionParams.map((value, i) => `\${${i + 1}:${value.name}}`).join(', ')
        snippet = `${suggestion.name}(${snippetArgs})$${functionParams.length + 1}`

        const params = functionParams.map(param => param.name + (param.type ? `: ${param.type}` : ''))
        const match = suggestion.type.match(/\(.*?\) => (.*)/)
        const returnType = match ? `=> ${match[1]}` : ''

        description = `(${params.join(', ')}) ${returnType}`
      } else {
        text = suggestion.name
      }

      return {
        text,
        type: isFunction ? 'function' : 'property',
        score: hasPrefix ? score(suggestion.name, prefix) : 1,
        snippet,
        leftLabel: isFunction ? 'function' : this.getType(suggestion),
        displayText,
        replacementPrefix: prefix,
        description,
      }
    })
    return suggestions.sort((a, b) => b.score - a.score).filter(item => item.score)
  }
  getType(value: { value: string, type: string }) {
    return value.type && value.type.substr(0, 1) === '{' ? 'Object' : value.type || 'any'
  }

  provideHyperclick(): HyperclickProvider {
    const provider = {
      priority: this.hyperclickPriority,
      grammarScopes: Helpers.grammarScopes,
      getSuggestionForWord: async (textEditor: TextEditor, text: string, range: Range): Promise<?HyperclickSuggestion> => {
        const filePath = textEditor.getPath()
        if (filePath == null) {
          return null
        }

        const fileDirectory = Path.dirname(filePath)
        const configFile = await this.getConfigFile(fileDirectory)
        if (configFile == null) {
          return null
        }

        const pos = this.adjustPosition(range.start, textEditor)
        const flowOptions = [
          'get-def',
          '--json',
          '--path=' + filePath,
          pos.row + 1,
          pos.column + 1,
        ]

        let result
        try {
          result = await exec(await Helpers.getExecutablePath(fileDirectory), flowOptions, {
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
          this.handleError(error, configFile)
          return provider.getSuggestionForWord(textEditor, text, range)
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
  }
  adjustPosition(pos: atom$Point, editor: TextEditor) {
    // Flow fails to determine the position if the cursor is at the end of a word
    // e.g. "path.dirname ()"
    //                   ↑ the cursor is here, between "dirname" and "("
    // In order to avoid this problem we have to check whether the char
    // at the given position is considered a part of an identifier.
    // If not step back 1 char as it might contain a valid identifier.
    const char = editor.getTextInBufferRange([
      pos,
      pos.translate([0, 1]),
    ])
    const nonWordChars = editor.getNonWordCharacters(pos)
    if (nonWordChars.indexOf(char) >= 0 || /\s/.test(char)) {
      return pos.translate([0, -1])
    }
    return pos
  }

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
      grammarScopes: Helpers.grammarScopes,
      updateOnEdit: true,
      getOutline: async (editor: TextEditor) => {
        const filePath = editor.getPath()
        if (filePath == null) {
          return null
        }

        const fileDirectory = Path.dirname(filePath)
        const configFile = await this.getConfigFile(fileDirectory)
        if (configFile == null) {
          return null
        }

        const flowOptions = ['ast']

        let result
        try {
          result = await exec(await Helpers.getExecutablePath(fileDirectory), flowOptions, {
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
          this.handleError(error, configFile)
          return provider.getOutline(editor)
        }

        return toOutline(result, outlineOptions)
      },
    }
    return provider
  }

  consumeDatatip(datatipService: any) {
    const provider = {
      providerName: 'flow-ide',
      priority: 1,
      grammarScopes: Helpers.grammarScopes,
      datatip: async (editor: TextEditor, point: Point): Promise<any> => {
        const filePath = editor.getPath()
        if (filePath == null) {
          return null
        }

        const fileDirectory = Path.dirname(filePath)
        const configFile = await this.getConfigFile(fileDirectory)
        if (configFile == null) {
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
          result = await exec(await Helpers.getExecutablePath(fileDirectory), flowOptions, {
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
          this.handleError(error, configFile)
          return provider.datatip(editor, point)
        }

        return this.toDatatip(editor, point, result)
      },
    }
    this.subscriptions.add(datatipService.addProvider(provider))
  }
  toDatatip(editor: TextEditor, point: Point, result: string) {
    const parsed: TypeAtPosObject = JSON.parse(result)

    const { type, loc } = parsed
    if (type === '(unknown)') {
      return null
    }

    return {
      range: LinterV1.locationToRange(loc),
      markedStrings: [{
        type: 'snippet',
        grammar: editor.getGrammar(),
        value: prettyPrintTypes(type),
      }],
    }
  }

  consumeStatusBar(statusBar: atom$StatusBar): void {
    this.coverageView = new CoverageView()
    this.coverageView.initialize()
    this.statusBar = statusBar.addLeftTile({ item: this.coverageView, priority: 10 })
    this.subscriptions.add({
      dispose: () => {
        if (this.statusBar) {
          this.statusBar.destroy()
        }
      },
    })
  }

  handleError(error: { message: string, code: string }, configFile: ?string) {
    if (error.message.indexOf(INIT_MESSAGE) !== -1 && typeof configFile === 'string') {
      servers.set(Path.dirname(configFile), { version: null })
    }
    if (error.message.indexOf(INIT_MESSAGE) !== -1 || error.message.indexOf(RECHECKING_MESSAGE) !== -1) {
      // continue...
    } else if (error.code === 'ENOENT') {
      throw new Error('Unable to find `flow` executable.')
    } else {
      throw error
    }
  }

  toCoverageLinterMessages(coverage: CoverageObject): Message[] {
    return coverage.expressions.uncovered_locs.map(loc => ({
      severity: 'info',
      location: LinterV1.toLinterLocation(loc),
      excerpt: 'Uncovered code',
      reference: null,
    }))
  }
}
