/* @flow */

export type Declaration = {
  name: string,
  position: { start: { line: number, column: number }, end: { line: number, column: number } },
  source: {
    name: ?string,
    filePath: ?string,
    position: { start: { line: number, column: number }, end: { line: number, column: number } },
  }
}
