/* @flow */

import Path from 'path'
import resolve from 'resolve'
import type { Range } from 'atom'

export function locToPoint(loc: Object): [number, number] {
  return [loc.line - 1, loc.column]
}

export function locToRange(loc: Object): [[number, number], [number, number]] {
  return [locToPoint(loc.start), locToPoint(loc.end)]
}

export function processDeclaration(sourceFile: string, entries: Array<Object>, callback: ((range: Range) => Promise<Object>)): Array<Object> {
  const toReturn = []
  for (let i = 0, length = entries.length; i < length; ++i) {
    const entry = entries[i]
    let filePath = entry.source.filePath
    if (filePath) {
      if (resolve.isCore(filePath)) {
        continue
      }
      try {
        filePath = resolve.sync(filePath, {
          basedir: Path.dirname(sourceFile),
        })
      } catch (_) {
        continue
      }
    }
    const range = locToRange(entry.position)
    if (filePath) {
      toReturn.push({
        range,
        source: {
          filePath,
          position: null,
        },
      })
    } else {
      toReturn.push({
        range,
        source() {
          return callback(range)
        },
      })
    }
  }
  return toReturn
}
