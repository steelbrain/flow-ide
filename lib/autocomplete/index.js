/* @flow */

import Path from 'path'
import { exec, findCachedAsync } from 'atom-linter'
import { shouldTriggerAutocomplete } from 'atom-autocomplete'

import { injectPosition, toAutocompleteSuggestions } from './helpers'
import { getExecutablePath, INIT_MESSAGE, RECHECKING_MESSAGE } from '../helpers'

const provider = {
  selector: '.source.js, .source.js.jsx',
  disableForSelector: '.comment',
  inclusionPriority: 100,
  // eslint-disable-next-line arrow-parens
  getSuggestions: async (params: Object) => {
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
      result = await exec(await getExecutablePath(fileDirectory), ['autocomplete', '--json', filePath], { cwd: fileDirectory, stdin: fileContents })
    } catch (error) {
      if (error.message.indexOf(INIT_MESSAGE) !== -1 || error.message.indexOf(RECHECKING_MESSAGE) !== -1) {
        return await provider.getSuggestions(editor)
      }
      throw error
    }

    return toAutocompleteSuggestions(result, prefix)
  },
}

export default provider
