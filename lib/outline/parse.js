/* @flow */

// NOTE: the following code is based on
// https://github.com/flowtype/flow-language-server/blob/fbd1bc3/src/pkg/nuclide-flow-rpc/lib/astToOutline.js
// and adjusted to toggle keywords and function arguments

import { Point } from 'atom'
import invariant from 'assert'
import type { Outline, OutlineTree, TokenizedText } from 'atom-ide-ui/outline'
import * as Text from './text'
import type { OutlineOptions } from './types'

type Extent = {
  startPosition: Point,
  endPosition: Point,
};

function exportDeclaration(
  options: OutlineOptions,
  item: Object,
  extent: Extent,
  isDefault: boolean,
): ?OutlineTree {
  const tree = itemToTree(options, item.declaration) // eslint-disable-line
  if (tree == null) {
    return null
  }
  // Flow always has tokenizedText
  invariant(tree.tokenizedText != null)

  const tokenizedText = []
  if (options.showKeywords.export) {
    tokenizedText.push(Text.keyword('export'), Text.whitespace(' '))
  }
  if (options.showKeywords.default && isDefault) {
    tokenizedText.push(Text.keyword('default'), Text.whitespace(' '))
  }
  tokenizedText.push(...tree.tokenizedText)

  return {
    kind: tree.kind,
    tokenizedText,
    representativeName: tree.representativeName,
    children: tree.children,
    ...extent,
  }
}

function declarationsTokenizedText(options: OutlineOptions, declarations: Array<Object>): TokenizedText {
  return declarations.reduce((els, dec, i, decs) =>
    declarationReducer(options, els, dec, i, decs), // eslint-disable-line
    [],
  )
}

function declarationReducer(
  options: OutlineOptions,
  textElements: TokenizedText,
  p: Object,
  index: number,
  declarations: Array<Object>,
): TokenizedText {
  switch (p.type) {
    case 'Identifier':
      textElements.push(Text.param(p.name))
      break
    case 'ObjectPattern':
      textElements.push(Text.plain('{'))
      textElements.push(
        ...declarationsTokenizedText(options, p.properties.map(obj => obj.key)),
      )
      textElements.push(Text.plain('}'))
      break
    case 'ArrayPattern':
      textElements.push(Text.plain('['))
      textElements.push(...declarationsTokenizedText(options, p.elements))
      textElements.push(Text.plain(']'))
      break
    case 'AssignmentPattern':
      return declarationReducer(options, textElements, p.left, index, declarations)
    case 'RestElement':
      textElements.push(Text.plain('...'))
      return declarationReducer(options, textElements, p.argument, index, declarations)
    default:
      throw new Error(`encountered unexpected argument type ${p.type}`)
  }
  if (index < declarations.length - 1) {
    textElements.push(Text.plain(','))
    textElements.push(Text.whitespace(' '))
  }
  return textElements
}

function getExtent(item: Object): Extent {
  return {
    startPosition: new Point(
      // It definitely makes sense that the lines we get are 1-based and the columns are
      // 0-based... convert to 0-based all around.
      item.loc.start.line - 1,
      item.loc.start.column,
    ),
    endPosition: new Point(item.loc.end.line - 1, item.loc.end.column),
  }
}

function functionOutline(
  options: OutlineOptions,
  name: string,
  params: Array<Object>,
  extent: Extent,
): OutlineTree {
  const tokenizedText = []

  if (options.showKeywords.function || !name) {
    tokenizedText.push(Text.keyword('function'))
    if (name) {
      tokenizedText.push(Text.whitespace(' '))
    }
  }
  if (name) {
    tokenizedText.push(Text.method(name))
  }
  if (options.showFunctionArgs) {
    tokenizedText.push(
      Text.plain('('),
      ...declarationsTokenizedText(options, params),
      Text.plain(')'),
    )
  }

  return {
    kind: 'function',
    tokenizedText,
    representativeName: name,
    children: [],
    ...extent,
  }
}

function typeAliasOutline(options: OutlineOptions, typeAliasExpression: Object): OutlineTree {
  invariant(typeAliasExpression.type === 'TypeAlias' || typeAliasExpression.type === 'DeclareTypeAlias')
  const name = typeAliasExpression.id.name

  const tokenizedText = []
  if (options.showKeywords.type) {
    tokenizedText.push(Text.keyword('type'), Text.whitespace(' '))
  }
  tokenizedText.push(Text.type(name))

  return {
    kind: 'interface',
    tokenizedText,
    representativeName: name,
    children: [],
    ...getExtent(typeAliasExpression),
  }
}

function isModuleExports(left: Object): boolean {
  return (
    left.type === 'MemberExpression' &&
    left.object.type === 'Identifier' &&
    left.object.name === 'module' &&
    left.property.type === 'Identifier' &&
    left.property.name === 'exports'
  )
}

function moduleExportsPropertyOutline(options: OutlineOptions, property: Object): ?OutlineTree {
  invariant(property.type === 'Property')
  if (property.key.type !== 'Identifier') {
    return null
  }
  const propName = property.key.name

  if (property.shorthand) {
    // This happens when the shorthand `{ foo }` is used for `{ foo: foo }`
    return {
      kind: 'method',
      tokenizedText: [Text.string(propName)],
      representativeName: propName,
      children: [],
      ...getExtent(property),
    }
  }

  if (
    property.value.type === 'FunctionExpression' ||
    property.value.type === 'ArrowFunctionExpression'
  ) {
    const tokenizedText = [Text.method(propName)]
    if (options.showFunctionArgs) {
      tokenizedText.push(
        Text.plain('('),
        ...declarationsTokenizedText(options, property.value.params),
        Text.plain(')'),
      )
    }

    return {
      kind: 'method',
      tokenizedText,
      representativeName: propName,
      children: [],
      ...getExtent(property),
    }
  }

  return {
    kind: 'field',
    tokenizedText: [Text.string(propName), Text.plain(':')],
    representativeName: propName,
    children: [],
    ...getExtent(property),
  }
}

function moduleExportsOutline(options: OutlineOptions, assignmentStatement: Object): ?OutlineTree {
  invariant(assignmentStatement.type === 'AssignmentExpression')

  const left = assignmentStatement.left
  if (!isModuleExports(left)) {
    return null
  }

  const right = assignmentStatement.right
  if (right.type !== 'ObjectExpression') {
    return null
  }
  const properties: Array<Object> = right.properties
  return {
    kind: 'module',
    tokenizedText: [Text.plain('module.exports')],
    children: properties.map(prop => moduleExportsPropertyOutline(options, prop)).filter(Boolean),
    ...getExtent(assignmentStatement),
  }
}

// Return the function name as written as a string. Intended to stringify patterns like `describe`
// and `describe.only` even though `describe.only` is a MemberExpression rather than an Identifier.
function getFunctionName(callee: Object): ?string {
  switch (callee.type) {
    case 'Identifier':
      return callee.name
    case 'MemberExpression':
      if (
        callee.object.type !== 'Identifier' ||
        callee.property.type !== 'Identifier'
      ) {
        return null
      }
      return `${callee.object.name}.${callee.property.name}`
    default:
      return null
  }
}

function isDescribe(functionName: string): boolean {
  switch (functionName) {
    case 'describe':
    case 'fdescribe':
    case 'ddescribe':
    case 'xdescribe':
    case 'describe.only':
    case 'describe.skip':
    case 'test.cb':
    case 'test.serial':
    case 'test.todo':
    case 'test.failing':
    case 'test':
    case 'test.concurrent':
    case 'test.only':
    case 'test.skip':
    case 'suite':
    case 'suite.only':
    case 'suite.skip':
    case 'xtest':
    case 'xtest.concurrent':
    case 'xtest.only':
    case 'xtest.skip':
      return true
    default:
      return false
  }
}

function isIt(functionName: string): boolean {
  switch (functionName) {
    case 'it':
    case 'fit':
    case 'iit':
    case 'pit':
    case 'xit':
    case 'it.only':
    case 'it.skip':
      return true
    default:
      return false
  }
}

/** If the given AST Node is a string literal, return its literal value. Otherwise return null */
function getStringLiteralValue(literal: ?Object): ?string {
  if (literal == null) {
    return null
  }
  if (literal.type !== 'Literal') {
    return null
  }
  const value = literal.value
  if (typeof value !== 'string') {
    return null
  }
  return value
}

function getFunctionBody(fn: ?Object): ?Array<Object> {
  if (fn == null) {
    return null
  }
  if (
    fn.type !== 'ArrowFunctionExpression' &&
    fn.type !== 'FunctionExpression'
  ) {
    return null
  }
  return fn.body.body
}

function specOutline(
  options: OutlineOptions,
  expressionStatement: Object,
  describeOnly: boolean = false,
): ?OutlineTree {
  const expression = expressionStatement.expression
  if (expression.type !== 'CallExpression') {
    return null
  }
  const functionName = getFunctionName(expression.callee)
  if (functionName == null) {
    return null
  }
  if (!isDescribe(functionName)) {
    if (describeOnly || !isIt(functionName)) {
      return null
    }
  }
  const description = getStringLiteralValue(expression.arguments[0])
  const specBody = getFunctionBody(expression.arguments[1])
  if (description == null || specBody == null) {
    return null
  }
  let children
  if (isIt(functionName)) {
    children = []
  } else {
    children =
      specBody
        .filter(item => item.type === 'ExpressionStatement')
        .map(item => specOutline(options, item))
        .filter(Boolean)
  }
  return {
    kind: 'function',
    tokenizedText: [Text.method(functionName), Text.whitespace(' '), Text.string(description)],
    representativeName: description,
    children,
    ...getExtent(expressionStatement),
  }
}

function topLevelExpressionOutline(options: OutlineOptions, expressionStatement: Object): ?OutlineTree {
  switch (expressionStatement.expression.type) {
    case 'CallExpression':
      return specOutline(options, expressionStatement, /* describeOnly */ true)
    case 'AssignmentExpression':
      return moduleExportsOutline(options, expressionStatement.expression)
    default:
      return null
  }
}

function variableDeclaratorOutline(
  options: OutlineOptions,
  declarator: Object,
  kind: string,
  extent: Extent,
): ?OutlineTree {
  if (
    declarator.init != null &&
    (declarator.init.type === 'FunctionExpression' ||
      declarator.init.type === 'ArrowFunctionExpression')
  ) {
    return functionOutline(options, declarator.id.name, declarator.init.params, extent)
  }

  const { id } = declarator

  const tokenizedText = []
  if (options.showKeywords[kind]) {
    tokenizedText.push(
      Text.keyword(kind),
      Text.whitespace(' '),
    )
  }
  tokenizedText.push(...declarationsTokenizedText(options, [id]))

  const representativeName = id.type === 'Identifier' ? id.name : undefined
  return {
    kind: kind === 'const' ? 'constant' : 'variable',
    tokenizedText,
    representativeName,
    children: [],
    ...extent,
  }
}

function variableDeclarationOutline(options: OutlineOptions, declaration: Object): ?OutlineTree {
  // If there are multiple var declarations in one line, just take the first.
  return variableDeclaratorOutline(
    options,
    declaration.declarations[0],
    declaration.kind,
    getExtent(declaration),
  )
}

function itemToTree(options: OutlineOptions, item: Object): ?OutlineTree {
  if (item == null) {
    return null
  }
  const extent = getExtent(item)
  switch (item.type) {
    case 'FunctionDeclaration':
    case 'ArrowFunctionExpression':
      return functionOutline(
        options,
        item.id != null ? item.id.name : '',
        item.params,
        extent,
      )
    case 'ClassDeclaration':
    case 'ClassExpression': {
      let representativeName
      if (item.id != null) {
        representativeName = item.id.name
      }

      const tokenizedText = []
      if (options.showKeywords.class || !representativeName) {
        tokenizedText.push(Text.keyword('class'))
      }
      if (representativeName) {
        if (options.showKeywords.class) {
          tokenizedText.push(Text.whitespace(' '))
        }
        tokenizedText.push(Text.className(representativeName))
      }
      return {
        kind: 'class',
        tokenizedText,
        representativeName,
        children: itemsToTrees(options, item.body.body), // eslint-disable-line
        ...extent,
      }
    }
    case 'ClassProperty': {
      if (item.value && item.value.type === 'ArrowFunctionExpression') {
        const tokenizedText = [Text.method(item.key.name)]
        if (options.showFunctionArgs) {
          tokenizedText.push(
            Text.plain('('),
            ...declarationsTokenizedText(options, item.value.params),
            Text.plain(')'),
          )
        }
        return {
          kind: 'method',
          tokenizedText,
          representativeName: item.key.name,
          children: [],
          ...extent,
        }
      }
      return {
        kind: 'property',
        tokenizedText: [Text.param(item.key.name)],
        representativeName: item.key.name,
        children: [],
        ...extent,
      }
    }
    case 'MethodDefinition': {
      const tokenizedText = [Text.method(item.key.name)]
      if (options.showFunctionArgs) {
        tokenizedText.push(
          Text.plain('('),
          ...declarationsTokenizedText(options, item.value.params),
          Text.plain(')'),
        )
      }
      return {
        kind: 'method',
        tokenizedText,
        representativeName: item.key.name,
        children: [],
        ...extent,
      }
    }
    case 'ExportDeclaration':
    case 'ExportNamedDeclaration':
      return exportDeclaration(options, item, extent, Boolean(item.default))
    case 'ExportDefaultDeclaration':
      return exportDeclaration(options, item, extent, true)
    case 'ExpressionStatement':
      return topLevelExpressionOutline(options, item)
    case 'DeclareTypeAlias':
    case 'TypeAlias':
      return typeAliasOutline(options, item)
    case 'VariableDeclaration':
      return variableDeclarationOutline(options, item)
    default:
      return null
  }
}

function itemsToTrees(options: OutlineOptions, items: Array<Object>): Array<OutlineTree> {
  return items.map(item => itemToTree(options, item)).filter(Boolean)
}

export function astToOutline(options: OutlineOptions, ast: Object): Outline {
  return {
    outlineTrees: itemsToTrees(options, ast.body),
  }
}
