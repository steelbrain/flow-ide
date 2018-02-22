/* @flow */

export type Position = {
  line: number,
  column: number,
  offset: number,
  end: number,
}

export type Location = {
  source: string,
  type: string,
  start: Position,
  end: Position,
}

export type CoverageObject = {
  expressions: {
    covered_count: number,
    uncovered_count: number,
    uncovered_locs: Location[],
  }
}

export type TypeAtPosObject = {
  type: string,
  reasons: Array<{
    desc: string,
    loc: Location,
    path: string,
    line: number,
    endline: number,
    start: number,
    end: number,
  }>,
  loc: Location,
  path: string,
  line: number,
  endline: number,
  start: number,
  end: number,
}
