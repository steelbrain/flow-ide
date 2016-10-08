/* @flow */

import Path from 'path'
import { Range, CompositeDisposable } from 'atom'
import { scanDeclarations } from 'declarations-javascript'
import type { TextEditor } from 'atom'
import { processDeclaration } from './helpers'
import { exec } from '../helpers'

export default class Declarations {
  grammarScopes = ['source.js', 'source.js.jsx']
  subscriptions = new CompositeDisposable()
  executablePath: string

  constructor() {
    this.subscriptions.add(atom.config.observe('flow-ide.executablePath', (executablePath) => {
      this.executablePath = executablePath
    }))
  }
  async getDeclarations({ textEditor, visibleRange }: { textEditor: TextEditor, visibleRange: Range }) {
    if (textEditor.getText().indexOf('/* @flow */') === -1) {
      return []
    }
    const filePath = textEditor.getPath()
    const scannedDeclarations = scanDeclarations(filePath, textEditor.getText(), function(node) {
      return visibleRange.containsPoint([node.loc.start.line - 1, node.loc.start.column])
    })
    // eslint-disable-next-line arrow-parens
    return processDeclaration(filePath, scannedDeclarations, async (givenRange) => {
      const range = Range.fromObject(givenRange)
      const fileDirectory = Path.dirname(filePath)
      const output = await exec(this.executablePath, fileDirectory, [
        'get-def',
        '--json',
        '--path',
        filePath,
        range.start.row + 1,
        range.start.column + 1,
      ], {
        cwd: fileDirectory,
        stdin: textEditor.getText(),
      })
      const parsed = JSON.parse(output)
      return {
        filePath: parsed.path,
        position: [parsed.line - 1, parsed.start - 1],
      }
    })
  }
  dispose() {
    this.subscriptions.dispose()
  }
}
