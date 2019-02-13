/* @flow */

import { TextEditor } from 'atom'
import { AutoLanguageClient } from '@lloiser/atom-languageclient'
import { findCachedAsync } from 'atom-linter'
import { spawn } from 'child_process'
import * as Path from 'path'
import * as Helpers from './helpers'

export class FlowLanguageClient extends AutoLanguageClient {
  getGrammarScopes() { return Helpers.grammarScopes }
  getLanguageName() { return 'Flowtype' }
  getServerName() { return 'flow' }

  async startServerProcess(projectPath: string) {
    return spawn(
      await Helpers.getExecutablePath(projectPath),
      ['lsp'],
      { cwd: projectPath },
    )
  }

  async determineProjectPath(textEditor: TextEditor) {
    const path = textEditor.getPath()
    if (path == null) {
      return null
    }

    const configFile: ?string = await findCachedAsync(path, '.flowconfig')
    if (configFile != null) {
      return Path.dirname(configFile)
    }
    return null
  }
}
