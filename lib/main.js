/* @flow */

const useLSP = atom.config.get('flow-ide.useLSP')

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
