'use babel'

module.exports = {
  config: {

  },
  activate() {
    require('atom-package-deps').install()
  },
  deactivate() {

  },
  provideLinter() {
    return []
  }
}
