'use babel'

import {CompositeDisposable} from 'atom'
import {exec} from 'atom-linter'

module.exports = {
  executablePath: 'flow',
  config: {
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
  },
  deactivate() {
    this.subscriptions.dispose()
  },
  provideLinter() {

    return {
      name: 'Flow IDE',
      grammarScopes: ['source.js', 'source.js.jsx'],
      scope: 'project',
      lintOnFly: false,
      lint: async (textEditor) => {
        console.log(this.executablePath)
        return [{
          type: 'Error',
          text: 'Something went wrong',
          range:[[0,0], [0,1]],
          filePath: textEditor.getPath()
        }]
      }
    }
  }
}
