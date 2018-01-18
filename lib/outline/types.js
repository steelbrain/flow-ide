/* @flow */

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
