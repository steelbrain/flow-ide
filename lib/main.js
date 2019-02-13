/* @flow */

const useLSP = atom.config.get('flow-ide.useLSP')

// notify to restart if the value changes
atom.config.onDidChange('flow-ide.useLSP', () => {
  const buttons = [{
    text: 'Restart',
    onDidClick () { return atom.restartApplication() },
  }]
  atom.notifications.addInfo('Changing this value requires a restart of atom.', { dismissable: true, buttons })
})

// possible improvement: check if flow really supports lsp

if (useLSP === true) {
  // eslint-disable-next-line global-require
  const { FlowLanguageClient } = require('./language-client')
  module.exports = new FlowLanguageClient()
} else {
  // eslint-disable-next-line global-require
  const { Flow } = require('./index')
  module.exports = new Flow()
}
