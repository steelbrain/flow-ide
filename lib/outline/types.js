/* @flow */

import type { Point } from 'atom'

export type OutlineOptions = {
  showKeywords: {
    export: boolean,
    default: boolean,
    const: boolean,
    var: boolean,
    let: boolean,
    class: boolean,
    function: boolean,
    type: boolean,
  },
  showFunctionArgs: boolean
};

export type Extent = {|
  startPosition: Point,
  endPosition: Point,
|};
