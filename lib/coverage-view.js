/* @flow */

import { CompositeDisposable } from 'atom'

export type CoverageObject = {
  expressions: {
    covered_count: number,
    uncovered_count: number,
  }
}

class CoverageView extends HTMLElement {
  tooltipDisposable: CompositeDisposable|null = null;

  initialize(): void {
    this.classList.add('inline-block')
  }

  update(json: CoverageObject): void {
    const covered: number = json.expressions.covered_count
    const uncovered: number = json.expressions.uncovered_count
    const total: number = covered + uncovered
    const percent: number = total === 0 ? 0 : Math.round((covered / total) * 100)

    this.textContent = `Flow Coverage: ${percent}%`

    if (this.tooltipDisposable) {
      this.tooltipDisposable.dispose()
    }

    this.tooltipDisposable = atom.tooltips.add(this, {
      title: `Covered ${percent}% (${covered} of ${total} expressions)`,
    })
  }

  reset() {
    this.textContent = ''
  }

  destroy(): void {
    if (this.tooltipDisposable) {
      this.tooltipDisposable.dispose()
    }
  }
}

export default document.registerElement('flow-ide-coverage', {
  prototype: CoverageView.prototype,
  extends: 'div',
})
