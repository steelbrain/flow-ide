/* @flow */

const lc = (line, column) => ({ line, column })
const loc = (start, end, source = null) => ({ start, end, source })

/*
declare type LocalType = {
  foo: string,
  bar: string
}
*/
export const typeDecl = {
  type: 'Program',
  loc: loc(lc(3, 0), lc(6, 1)),
  range: [13, 70],
  body: [{
    type: 'DeclareTypeAlias',
    loc: loc(lc(3, 0), lc(6, 1)),
    range: [13, 70],
    id: {
      type: 'Identifier',
      loc: loc(lc(3, 13), lc(3, 22)),
      range: [26, 35],
      name: 'LocalType',
      optional: false,
    },
    right: {
      type: 'ObjectTypeAnnotation',
      loc: loc(lc(3, 25), lc(6, 1)),
      range: [38, 70],
      exact: false,
      properties: [{
        type: 'ObjectTypeProperty',
        loc: loc(lc(4, 2), lc(4, 13)),
        range: [42, 53],
        key: {
          type: 'Identifier',
          loc: loc(lc(4, 2), lc(4, 5)),
          range: [42, 45],
          name: 'foo',
          optional: false,
        },
        value: {
          type: 'StringTypeAnnotation',
          loc: loc(lc(4, 7), lc(4, 13)),
          range: [47, 53],
        },
        optional: false,
        static: false,
        kind: 'init',
      }, {
        type: 'ObjectTypeProperty',
        loc: loc(lc(5, 2), lc(5, 13)),
        range: [57, 68],
        key: {
          type: 'Identifier',
          loc: loc(lc(5, 2), lc(5, 5)),
          range: [57, 60],
          name: 'bar',
          optional: false,
        },
        value: {
          type: 'StringTypeAnnotation',
          loc: loc(lc(5, 7), lc(5, 13)),
          range: [62, 68],
        },
        optional: false,
        static: false,
        kind: 'init',
      }],
    },
  }],
}

/*
export type ExportedType = {
  foo: string
}
*/
export const exportedTypeDecl = {
  type: 'Program',
  loc: loc(lc(3, 0), lc(5, 1)),
  range: [13, 48],
  body: [{
    type: 'ExportNamedDeclaration',
    loc: loc(lc(3, 0), lc(5, 1)),
    range: [13, 48],
    declaration: {
      type: 'TypeAlias',
      loc: loc(lc(3, 7), lc(5, 1)),
      range: [20, 48],
      id: {
        type: 'Identifier',
        loc: loc(lc(3, 12), lc(3, 15)),
        range: [25, 28],
        name: 'ExportedType',
        optional: false,
      },
      right: {
        type: 'ObjectTypeAnnotation',
        loc: loc(lc(3, 18), lc(5, 1)),
        range: [31, 48],
        exact: false,
        properties: [{
          type: 'ObjectTypeProperty',
          loc: loc(lc(4, 2), lc(4, 13)),
          range: [35, 46],
          key: {
            type: 'Identifier',
            loc: loc(lc(4, 2), lc(4, 5)),
            range: [35, 38],
            name: 'foo',
            optional: false,
          },
          value: {
            type: 'StringTypeAnnotation',
            loc: loc(lc(4, 7), lc(4, 13)),
            range: [40, 46],
          },
          optional: false,
          static: false,
          kind: 'init',
        }],
        indexers: [],
        callProperties: [],
      },
    },
    specifiers: [],
    exportKind: 'type',
  }],
}

/*
function func(foo: string, bar: string) {
}
*/
export const func = {
  type: 'Program',
  loc: loc(lc(3, 0), lc(4, 1)),
  range: [13, 59],
  body: [{
    type: 'FunctionDeclaration',
    loc: loc(lc(3, 0), lc(4, 1)),
    range: [13, 59],
    id: {
      type: 'Identifier',
      loc: loc(lc(3, 9), lc(3, 16)),
      range: [22, 29],
      name: 'func',
      optional: false,
    },
    params: [{
      type: 'Identifier',
      loc: loc(lc(3, 17), lc(3, 28)),
      range: [30, 41],
      name: 'foo',
      typeAnnotation: {
        type: 'TypeAnnotation',
        loc: loc(lc(3, 20), lc(3, 28)),
        range: [33, 41],
        typeAnnotation: {
          type: 'StringTypeAnnotation',
          loc: loc(lc(3, 22), lc(3, 28)),
          range: [35, 41],
        },
      },
      optional: false,
    }, {
      type: 'Identifier',
      loc: loc(lc(3, 30), lc(3, 41)),
      range: [43, 54],
      name: 'bar',
      typeAnnotation: {
        type: 'TypeAnnotation',
        loc: loc(lc(3, 33), lc(3, 41)),
        range: [46, 54],
        typeAnnotation: {
          type: 'StringTypeAnnotation',
          loc: loc(lc(3, 35), lc(3, 41)),
          range: [48, 54],
        },
      },
      optional: false,
    }],
    body: {
      type: 'BlockStatement',
      loc: loc(lc(3, 43), lc(4, 1)),
      range: [56, 59],
      body: [],
    },
    async: false,
    generator: false,
    expression: false,
  }],
}

/*
export function exportedFunc(fooBar: FooBar) {
}
*/
export const exportedFunc = {
  type: 'Program',
  loc: loc(lc(3, 0), lc(4, 1)),
  range: [13, 62],
  body: [{
    type: 'ExportNamedDeclaration',
    loc: loc(lc(3, 0), lc(4, 1)),
    range: [13, 62],
    declaration: {
      type: 'FunctionDeclaration',
      loc: loc(lc(3, 7), lc(4, 1)),
      range: [20, 62],
      id: {
        type: 'Identifier',
        loc: loc(lc(3, 16), lc(3, 29)),
        range: [29, 42],
        name: 'exportedFunc',
        optional: false,
      },
      params: [{
        type: 'Identifier',
        loc: loc(lc(3, 30), lc(3, 44)),
        range: [43, 57],
        name: 'fooBar',
        typeAnnotation: {
          type: 'TypeAnnotation',
          loc: loc(lc(3, 36), lc(3, 44)),
          range: [49, 57],
          typeAnnotation: {
            type: 'GenericTypeAnnotation',
            loc: loc(lc(3, 38), lc(3, 44)),
            range: [51, 57],
            id: {
              type: 'Identifier',
              loc: loc(lc(3, 38), lc(3, 44)),
              range: [51, 57],
              name: 'FooBar',
              optional: false,
            },
          },
        },
        optional: false,
      }],
      body: {
        type: 'BlockStatement',
        loc: loc(lc(3, 46), lc(4, 1)),
        range: [59, 62],
        body: [],
      },
      async: false,
      generator: false,
      expression: false,
    },
    specifiers: [],
    exportKind: 'value',
  }],
}

/*
const constantValue = {}
let letValue = 1
var varValue = ''
*/
export const variables = {
  type: 'Program',
  loc: loc(lc(3, 0), lc(5, 17)),
  range: [13, 72],
  body: [{
    type: 'VariableDeclaration',
    loc: loc(lc(3, 0), lc(3, 24)),
    range: [13, 37],
    declarations: [{
      type: 'VariableDeclarator',
      loc: loc(lc(3, 6), lc(3, 24)),
      range: [19, 37],
      id: {
        type: 'Identifier',
        loc: loc(lc(3, 6), lc(3, 19)),
        range: [19, 32],
        name: 'constantValue',
        optional: false,
      },
      init: {
        type: 'ObjectExpression',
        loc: loc(lc(3, 22), lc(3, 24)),
        range: [35, 37],
        properties: [],
      },
    }],
    kind: 'const',
  }, {
    type: 'VariableDeclaration',
    loc: loc(lc(4, 0), lc(4, 16)),
    range: [38, 54],
    declarations: [{
      type: 'VariableDeclarator',
      loc: loc(lc(4, 4), lc(4, 16)),
      range: [42, 54],
      id: {
        type: 'Identifier',
        loc: loc(lc(4, 4), lc(4, 12)),
        range: [42, 50],
        name: 'letValue',
        optional: false,
      },
      init: {
        type: 'Literal',
        loc: loc(lc(4, 15), lc(4, 16)),
        range: [53, 54],
        value: 1,
        raw: '1',
      },
    }],
    kind: 'let',
  }, {
    type: 'VariableDeclaration',
    loc: loc(lc(5, 0), lc(5, 17)),
    range: [55, 72],
    declarations: [{
      type: 'VariableDeclarator',
      loc: loc(lc(5, 4), lc(5, 17)),
      range: [59, 72],
      id: {
        type: 'Identifier',
        loc: loc(lc(5, 4), lc(5, 12)),
        range: [59, 67],
        name: 'varValue',
        optional: false,
      },
      init: {
        type: 'Literal',
        loc: loc(lc(5, 15), lc(5, 17)),
        range: [70, 72],
        value: '',
        raw: "''",
      },
    }],
    kind: 'var',
  }],
}

/*
export const exportedConstantValue = {}
export let exportedLetValue = 1
export var exportedVarValue = ''
*/
export const exportedVariables = {
  errors: [],
  tokens: [],
  type: 'Program',
  loc: loc(lc(3, 0), lc(5, 30)),
  range: [13, 111],
  body: [{
    type: 'ExportNamedDeclaration',
    loc: loc(lc(3, 0), lc(3, 37)),
    range: [13, 50],
    declaration: {
      type: 'VariableDeclaration',
      loc: loc(lc(3, 7), lc(3, 37)),
      range: [20, 50],
      declarations: [{
        type: 'VariableDeclarator',
        loc: loc(lc(3, 13), lc(3, 37)),
        range: [26, 50],
        id: {
          type: 'Identifier',
          loc: loc(lc(3, 13), lc(3, 32)),
          range: [26, 45],
          name: 'exportedConstantValue',
          optional: false,
        },
        init: {
          type: 'ObjectExpression',
          loc: loc(lc(3, 35), lc(3, 37)),
          range: [48, 50],
          properties: [],
        },
      }],
      kind: 'const',
    },
    specifiers: [],
    exportKind: 'value',
  }, {
    type: 'ExportNamedDeclaration',
    loc: loc(lc(4, 0), lc(4, 29)),
    range: [51, 80],
    declaration: {
      type: 'VariableDeclaration',
      loc: loc(lc(4, 7), lc(4, 29)),
      range: [58, 80],
      declarations: [{
        type: 'VariableDeclarator',
        loc: loc(lc(4, 11), lc(4, 29)),
        range: [62, 80],
        id: {
          type: 'Identifier',
          loc: loc(lc(4, 11), lc(4, 25)),
          range: [62, 76],
          name: 'exportedLetValue',
          optional: false,
        },
        init: {
          type: 'Literal',
          loc: loc(lc(4, 28), lc(4, 29)),
          range: [79, 80],
          value: 1,
          raw: '1',
        },
      }],
      kind: 'let',
    },
    specifiers: [],
    exportKind: 'value',
  }, {
    type: 'ExportNamedDeclaration',
    loc: loc(lc(5, 0), lc(5, 30)),
    range: [81, 111],
    declaration: {
      type: 'VariableDeclaration',
      loc: loc(lc(5, 7), lc(5, 30)),
      range: [88, 111],
      declarations: [{
        type: 'VariableDeclarator',
        loc: loc(lc(5, 11), lc(5, 30)),
        range: [92, 111],
        id: {
          type: 'Identifier',
          loc: loc(lc(5, 11), lc(5, 25)),
          range: [92, 106],
          name: 'exportedVarValue',
          optional: false,
        },
        init: {
          type: 'Literal',
          loc: loc(lc(5, 28), lc(5, 30)),
          range: [109, 111],
          value: '',
          raw: "''",
        },
      }],
      kind: 'var',
    },
    specifiers: [],
    exportKind: 'value',
  }],
}

/*
export class Component extends React.Component {
  static propTypes = {
  }

  prop = 1

  constructor(props: any) {
  }

  handleChangeEvent = (ev: Event) => {
  }
}
*/
export const classDecl = {
  errors: [],
  tokens: [],
  type: 'Program',
  loc: loc(lc(3, 0), lc(14, 1)),
  range: [13, 172],
  body: [{
    type: 'ClassDeclaration',
    loc: loc(lc(3, 0), lc(14, 1)),
    range: [13, 172],
    id: {
      type: 'Identifier',
      loc: loc(lc(3, 6), lc(3, 15)),
      range: [19, 28],
      name: 'Component',
      optional: false,
    },
    body: {
      type: 'ClassBody',
      loc: loc(lc(3, 40), lc(14, 1)),
      range: [53, 172],
      body: [{
        type: 'ClassProperty',
        loc: loc(lc(4, 2), lc(5, 3)),
        range: [57, 81],
        key: {
          type: 'Identifier',
          loc: loc(lc(4, 9), lc(4, 18)),
          range: [64, 73],
          name: 'propTypes',
          optional: false,
        },
        value: {
          type: 'ObjectExpression',
          loc: loc(lc(4, 21), lc(5, 3)),
          range: [76, 81],
          properties: [],
        },
        computed: false,
        static: true,
      }, {
        type: 'ClassProperty',
        loc: loc(lc(7, 2), lc(7, 10)),
        range: [85, 93],
        key: {
          type: 'Identifier',
          loc: loc(lc(7, 2), lc(7, 6)),
          range: [85, 89],
          name: 'prop',
          optional: false,
        },
        value: {
          type: 'Literal',
          loc: loc(lc(7, 9), lc(7, 10)),
          range: [92, 93],
          value: 1,
          raw: '1',
        },
        computed: false,
        static: false,
      }, {
        type: 'MethodDefinition',
        loc: loc(lc(9, 2), lc(10, 3)),
        range: [97, 126],
        key: {
          type: 'Identifier',
          loc: loc(lc(9, 2), lc(9, 13)),
          range: [97, 108],
          name: 'constructor',
          optional: false,
        },
        value: {
          type: 'FunctionExpression',
          loc: loc(lc(9, 13), lc(10, 3)),
          range: [108, 126],
          params: [{
            type: 'Identifier',
            loc: loc(lc(9, 14), lc(9, 24)),
            range: [109, 119],
            name: 'props',
            typeAnnotation: {
              type: 'TypeAnnotation',
              loc: loc(lc(9, 19), lc(9, 24)),
              range: [114, 119],
              typeAnnotation: {
                type: 'AnyTypeAnnotation',
                loc: loc(lc(9, 21), lc(9, 24)),
                range: [116, 119],
              },
            },
            optional: false,
          }],
          body: {
            type: 'BlockStatement',
            loc: loc(lc(9, 26), lc(10, 3)),
            range: [121, 126],
            body: [],
          },
          async: false,
          generator: false,
          expression: false,
        },
        kind: 'constructor',
        static: false,
        computed: false,
        decorators: [],
      }, {
        type: 'ClassProperty',
        loc: loc(lc(12, 2), lc(13, 3)),
        range: [130, 170],
        key: {
          type: 'Identifier',
          loc: loc(lc(12, 2), lc(12, 19)),
          range: [130, 147],
          name: 'handleChangeEvent',
          optional: false,
        },
        value: {
          type: 'ArrowFunctionExpression',
          loc: loc(lc(12, 22), lc(13, 3)),
          range: [150, 170],
          params: [{
            type: 'Identifier',
            loc: loc(lc(12, 23), lc(12, 32)),
            range: [151, 160],
            name: 'ev',
            typeAnnotation: {
              type: 'TypeAnnotation',
              loc: loc(lc(12, 25), lc(12, 32)),
              range: [153, 160],
              typeAnnotation: {
                type: 'GenericTypeAnnotation',
                loc: loc(lc(12, 27), lc(12, 32)),
                range: [155, 160],
                id: {
                  type: 'Identifier',
                  loc: loc(lc(12, 27), lc(12, 32)),
                  range: [155, 160],
                  name: 'Event',
                  optional: false,
                },
              },
            },
            optional: false,
          }],
          body: {
            type: 'BlockStatement',
            loc: loc(lc(12, 37), lc(13, 3)),
            range: [165, 170],
            body: [],
          },
          async: false,
          generator: false,
          expression: false,
        },
        computed: false,
        static: false,
      }],
    },
    superClass: {
      type: 'MemberExpression',
      loc: loc(lc(3, 24), lc(3, 39)),
      range: [37, 52],
      object: {
        type: 'Identifier',
        loc: loc(lc(3, 24), lc(3, 29)),
        range: [37, 42],
        name: 'React',
        optional: false,
      },
      property: {
        type: 'Identifier',
        loc: loc(lc(3, 30), lc(3, 39)),
        range: [43, 52],
        name: 'Component',
        optional: false,
      },
      computed: false,
    },
    implements: [],
    decorators: [],
  }],
}

/*
export class ExportedComponent extends React.Component {
  static propTypes = {
  }

  prop = 1

  constructor(props: any) {
  }

  handleChangeEvent = (ev: Event) => {
  }
}
*/
export const exportedClassDecl = {
  type: 'Program',
  loc: loc(lc(3, 0), lc(14, 1)),
  range: [13, 179],
  body: [{
    type: 'ExportNamedDeclaration',
    loc: loc(lc(3, 0), lc(14, 1)),
    range: [13, 179],
    declaration: {
      type: 'ClassDeclaration',
      loc: loc(lc(3, 7), lc(14, 1)),
      range: [20, 179],
      id: {
        type: 'Identifier',
        loc: loc(lc(3, 13), lc(3, 22)),
        range: [26, 35],
        name: 'ExportedComponent',
        optional: false,
      },
      body: {
        type: 'ClassBody',
        loc: loc(lc(3, 47), lc(14, 1)),
        range: [60, 179],
        body: [{
          type: 'ClassProperty',
          loc: loc(lc(4, 2), lc(5, 3)),
          range: [64, 88],
          key: {
            type: 'Identifier',
            loc: loc(lc(4, 9), lc(4, 18)),
            range: [71, 80],
            name: 'propTypes',
            optional: false,
          },
          value: {
            type: 'ObjectExpression',
            loc: loc(lc(4, 21), lc(5, 3)),
            range: [83, 88],
            properties: [],
          },
          computed: false,
          static: true,
        }, {
          type: 'ClassProperty',
          loc: loc(lc(7, 2), lc(7, 10)),
          range: [92, 100],
          key: {
            type: 'Identifier',
            loc: loc(lc(7, 2), lc(7, 6)),
            range: [92, 96],
            name: 'prop',
            optional: false,
          },
          value: {
            type: 'Literal',
            loc: loc(lc(7, 9), lc(7, 10)),
            range: [99, 100],
            value: 1,
            raw: '1',
          },
          computed: false,
          static: false,
        }, {
          type: 'MethodDefinition',
          loc: loc(lc(9, 2), lc(10, 3)),
          range: [104, 133],
          key: {
            type: 'Identifier',
            loc: loc(lc(9, 2), lc(9, 13)),
            range: [104, 115],
            name: 'constructor',
            optional: false,
          },
          value: {
            type: 'FunctionExpression',
            loc: loc(lc(9, 13), lc(10, 3)),
            range: [115, 133],
            params: [{
              type: 'Identifier',
              loc: loc(lc(9, 14), lc(9, 24)),
              range: [116, 126],
              name: 'props',
              typeAnnotation: {
                type: 'TypeAnnotation',
                loc: loc(lc(9, 19), lc(9, 24)),
                range: [121, 126],
                typeAnnotation: {
                  type: 'AnyTypeAnnotation',
                  loc: loc(lc(9, 21), lc(9, 24)),
                  range: [123, 126],
                },
              },
              optional: false,
            }],
            body: {
              type: 'BlockStatement',
              loc: loc(lc(9, 26), lc(10, 3)),
              range: [128, 133],
              body: [],
            },
            async: false,
            generator: false,
            expression: false,
          },
          kind: 'constructor',
          static: false,
          computed: false,
          decorators: [],
        }, {
          type: 'ClassProperty',
          loc: loc(lc(12, 2), lc(13, 3)),
          range: [137, 177],
          key: {
            type: 'Identifier',
            loc: loc(lc(12, 2), lc(12, 19)),
            range: [137, 154],
            name: 'handleChangeEvent',
            optional: false,
          },
          value: {
            type: 'ArrowFunctionExpression',
            loc: loc(lc(12, 22), lc(13, 3)),
            range: [157, 177],
            params: [{
              type: 'Identifier',
              loc: loc(lc(12, 23), lc(12, 32)),
              range: [158, 167],
              name: 'ev',
              typeAnnotation: {
                type: 'TypeAnnotation',
                loc: loc(lc(12, 25), lc(12, 32)),
                range: [160, 167],
                typeAnnotation: {
                  type: 'GenericTypeAnnotation',
                  loc: loc(lc(12, 27), lc(12, 32)),
                  range: [162, 167],
                  id: {
                    type: 'Identifier',
                    loc: loc(lc(12, 27), lc(12, 32)),
                    range: [162, 167],
                    name: 'Event',
                    optional: false,
                  },
                },
              },
              optional: false,
            }],
            body: {
              type: 'BlockStatement',
              loc: loc(lc(12, 37), lc(13, 3)),
              range: [172, 177],
              body: [],
            },
            async: false,
            generator: false,
            expression: false,
          },
          computed: false,
          static: false,
        }],
      },
      superClass: {
        type: 'MemberExpression',
        loc: loc(lc(3, 31), lc(3, 46)),
        range: [44, 59],
        object: {
          type: 'Identifier',
          loc: loc(lc(3, 31), lc(3, 36)),
          range: [44, 49],
          name: 'React',
          optional: false,
        },
        property: {
          type: 'Identifier',
          loc: loc(lc(3, 37), lc(3, 46)),
          range: [50, 59],
          name: 'Component',
          optional: false,
        },
        computed: false,
      },
      implements: [],
      decorators: [],
    },
    specifiers: [],
    exportKind: 'value',
  }],
}
