/* @flow */

import Path from 'path'
import { findCachedAsync } from 'atom-linter'
import { CompositeDisposable } from 'atom'
import { shouldTriggerAutocomplete } from 'atom-autocomplete'

import { injectPosition, toAutocompleteSuggestions } from './helpers'
import { exec } from '../helpers'

export default class Autocomplete {
  selector = '.source.js, .source.js.jsx'
  inclusionPriority = 100
  disableForSelector = '.comment'
  subscriptions = new CompositeDisposable()
  executablePath: string

  constructor() {
    this.subscriptions.add(atom.config.observe('flow-ide.executablePath', (executablePath) => {
      this.executablePath = executablePath
    }))
  }
  async getSuggestions(params: Object) {
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

    const output = await exec(this.executablePath, fileDirectory, ['autocomplete', '--json', filePath], {
      cwd: fileDirectory,
      stdin: fileContents,
    })

    return toAutocompleteSuggestions(output, prefix)
  }
  dispose() {
    this.subscriptions.dispose()
  }
}
