/* @flow */

import { CompositeDisposable } from 'atom'
import type { CoverageObject } from './types'

class CoverageView extends HTMLElement {
  tooltipDisposable: CompositeDisposable|null = null;

  initialize(): void {
    this.classList.add('inline-block')

    this.addEventListener('click', () => {
      atom.config.set('flow-ide.showUncovered', !atom.config.get('flow-ide.showUncovered'))
    })
  }

  update(json: CoverageObject): void {
    const covered: number = json.expressions.covered_count
    const uncovered: number = json.expressions.uncovered_count
    const total: number = covered + uncovered
    const percent: number = total === 0 ? 100 : Math.round((covered / total) * 100)

    this.textContent = `Flow Coverage: ${percent}%`

    if (this.tooltipDisposable) {
      this.tooltipDisposable.dispose()
    }

    this.classList.remove('flow-ide-hide')
    this.tooltipDisposable = atom.tooltips.add(this, {
      title: `Covered ${percent}% (${covered} of ${total} expressions)<br>Click to toggle uncovered code`,
    })
  }

  reset() {
    this.classList.add('flow-ide-hide')
    this.textContent = ''
    if (this.tooltipDisposable) {
      this.tooltipDisposable.dispose()
    }
  }

  destroy(): void {
    if (this.tooltipDisposable) {
      this.tooltipDisposable.dispose()
    }
  }
}

export default document.registerElement('flow-ide-coverage', {
  prototype: CoverageView.prototype,
  extends: 'a',
})
