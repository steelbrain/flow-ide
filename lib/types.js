/* @flow */

export type Location = {
  line: number,
  column: number,
  offset: number,
  end: number,
}
export type UncoveredLocation = {
  source: string,
  type: string,
  start: Location,
  end: Location,
}
export type CoverageObject = {
  expressions: {
    covered_count: number,
    uncovered_count: number,
    uncovered_locs: UncoveredLocation[],
  }
}
