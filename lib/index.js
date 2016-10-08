/* @flow */

import { CompositeDisposable } from 'atom'

import LinterProvider from './linter'
import AutocompleteProvider from './autocomplete'

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

  deactivate() {
    this.subscriptions.dispose()
  },

  provideLinter(): Object {
    return LinterProvider
  },

  provideAutocomplete(): Object {
    return AutocompleteProvider
  },
}
