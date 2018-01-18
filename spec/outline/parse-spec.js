/* @flow */
/* eslint-env jasmine */

import {
  typeDecl, exportedTypeDecl,
  func, exportedFunc,
  variables, exportedVariables,
  classDecl, exportedClassDecl,
} from './parse-sample-ast'
import * as Parse from '../../lib/outline/parse'

function buildOptions(exported, args) {
  return {
    showKeywords: {
      export: exported,
      default: false,
      const: false,
      var: false,
      let: false,
      class: false,
      function: false,
      type: false,
    },
    showFunctionArgs: args,
  }
}

function toOutlineText(item, prefix) {
  const output = []
  const { tokenizedText } = item
  if (!tokenizedText) {
    return []
  }
  const text = tokenizedText.map(tt => tt.value).join('')
  output.push(prefix + text)

  return output.concat(
    toOutlineTexts(item.children, prefix + '  '), // eslint-disable-line
  )
}

function toOutlineTexts(tree, prefix = '') {
  return tree.reduce(
    (output, item) => output.concat(toOutlineText(item, prefix)),
    [],
  )
}

describe('outline/parse', function() {
  describe('types', function() {
    it('local', function() {
      expect(toOutlineTexts(
        Parse.astToOutline(buildOptions(false, false), typeDecl).outlineTrees,
      )).toEqual(
        ['LocalType'],
      )
      expect(toOutlineTexts(
        Parse.astToOutline(buildOptions(true, false), typeDecl).outlineTrees,
      )).toEqual(
        ['LocalType'],
      )
      expect(toOutlineTexts(
        Parse.astToOutline(buildOptions(false, true), typeDecl).outlineTrees,
      )).toEqual(
        ['LocalType'],
      )
      expect(toOutlineTexts(
        Parse.astToOutline(buildOptions(true, true), typeDecl).outlineTrees,
      )).toEqual(
        ['LocalType'],
      )
    })

    it('exported', function() {
      expect(toOutlineTexts(
        Parse.astToOutline(buildOptions(false, false), exportedTypeDecl).outlineTrees,
      )).toEqual(
        ['ExportedType'],
      )
      expect(toOutlineTexts(
        Parse.astToOutline(buildOptions(true, false), exportedTypeDecl).outlineTrees,
      )).toEqual(
        ['export ExportedType'],
      )
      expect(toOutlineTexts(
        Parse.astToOutline(buildOptions(false, true), exportedTypeDecl).outlineTrees,
      )).toEqual(
        ['ExportedType'],
      )
      expect(toOutlineTexts(
        Parse.astToOutline(buildOptions(true, true), exportedTypeDecl).outlineTrees,
      )).toEqual(
        ['export ExportedType'],
      )
    })
  })

  describe('functions', function() {
    it('local', function() {
      expect(toOutlineTexts(
        Parse.astToOutline(buildOptions(false, false), func).outlineTrees,
      )).toEqual(
        ['func'],
      )
      expect(toOutlineTexts(
        Parse.astToOutline(buildOptions(true, false), func).outlineTrees,
      )).toEqual(
        ['func'],
      )
      expect(toOutlineTexts(
        Parse.astToOutline(buildOptions(false, true), func).outlineTrees,
      )).toEqual(
        ['func(foo, bar)'],
      )
      expect(toOutlineTexts(
        Parse.astToOutline(buildOptions(true, true), func).outlineTrees,
      )).toEqual(
        ['func(foo, bar)'],
      )
    })

    it('exported', function() {
      expect(toOutlineTexts(
        Parse.astToOutline(buildOptions(false, false), exportedFunc).outlineTrees,
      )).toEqual(
        ['exportedFunc'],
      )
      expect(toOutlineTexts(
        Parse.astToOutline(buildOptions(true, false), exportedFunc).outlineTrees,
      )).toEqual(
        ['export exportedFunc'],
      )
      expect(toOutlineTexts(
        Parse.astToOutline(buildOptions(false, true), exportedFunc).outlineTrees,
      )).toEqual(
        ['exportedFunc(fooBar)'],
      )
      expect(toOutlineTexts(
        Parse.astToOutline(buildOptions(true, true), exportedFunc).outlineTrees,
      )).toEqual(
        ['export exportedFunc(fooBar)'],
      )
    })
  })

  describe('variables', function() {
    it('local', function() {
      expect(toOutlineTexts(
        Parse.astToOutline(buildOptions(false, false), variables).outlineTrees,
      )).toEqual(
        ['constantValue', 'letValue', 'varValue'],
      )
      expect(toOutlineTexts(
        Parse.astToOutline(buildOptions(true, false), variables).outlineTrees,
      )).toEqual(
        ['constantValue', 'letValue', 'varValue'],
      )
      expect(toOutlineTexts(
        Parse.astToOutline(buildOptions(false, true), variables).outlineTrees,
      )).toEqual(
        ['constantValue', 'letValue', 'varValue'],
      )
      expect(toOutlineTexts(
        Parse.astToOutline(buildOptions(true, true), variables).outlineTrees,
      )).toEqual(
        ['constantValue', 'letValue', 'varValue'],
      )
    })

    it('exported', function() {
      expect(toOutlineTexts(
        Parse.astToOutline(buildOptions(false, false), exportedVariables).outlineTrees,
      )).toEqual(
        ['exportedConstantValue', 'exportedLetValue', 'exportedVarValue'],
      )
      expect(toOutlineTexts(
        Parse.astToOutline(buildOptions(true, false), exportedVariables).outlineTrees,
      )).toEqual(
        ['export exportedConstantValue', 'export exportedLetValue', 'export exportedVarValue'],
      )
      expect(toOutlineTexts(
        Parse.astToOutline(buildOptions(false, true), exportedVariables).outlineTrees,
      )).toEqual(
        ['exportedConstantValue', 'exportedLetValue', 'exportedVarValue'],
      )
      expect(toOutlineTexts(
        Parse.astToOutline(buildOptions(true, true), exportedVariables).outlineTrees,
      )).toEqual(
        ['export exportedConstantValue', 'export exportedLetValue', 'export exportedVarValue'],
      )
    })
  })

  describe('class', function() {
    it('local', function() {
      expect(toOutlineTexts(
        Parse.astToOutline(buildOptions(false, false), classDecl).outlineTrees,
      )).toEqual([
        'Component',
        '  propTypes',
        '  prop',
        '  constructor',
        '  handleChangeEvent',
      ])
      expect(toOutlineTexts(
        Parse.astToOutline(buildOptions(true, false), classDecl).outlineTrees,
      )).toEqual([
        'Component',
        '  propTypes',
        '  prop',
        '  constructor',
        '  handleChangeEvent',
      ])
      expect(toOutlineTexts(
        Parse.astToOutline(buildOptions(false, true), classDecl).outlineTrees,
      )).toEqual([
        'Component',
        '  propTypes',
        '  prop',
        '  constructor(props)',
        '  handleChangeEvent(ev)',
      ])
      expect(toOutlineTexts(
        Parse.astToOutline(buildOptions(true, true), classDecl).outlineTrees,
      )).toEqual([
        'Component',
        '  propTypes',
        '  prop',
        '  constructor(props)',
        '  handleChangeEvent(ev)',
      ])
    })

    it('exported', function() {
      expect(toOutlineTexts(
        Parse.astToOutline(buildOptions(false, false), exportedClassDecl).outlineTrees,
      )).toEqual([
        'ExportedComponent',
        '  propTypes',
        '  prop',
        '  constructor',
        '  handleChangeEvent',
      ])
      expect(toOutlineTexts(
        Parse.astToOutline(buildOptions(true, false), exportedClassDecl).outlineTrees,
      )).toEqual([
        'export ExportedComponent',
        '  propTypes',
        '  prop',
        '  constructor',
        '  handleChangeEvent',
      ])
      expect(toOutlineTexts(
        Parse.astToOutline(buildOptions(false, true), exportedClassDecl).outlineTrees,
      )).toEqual([
        'ExportedComponent',
        '  propTypes',
        '  prop',
        '  constructor(props)',
        '  handleChangeEvent(ev)',
      ])
      expect(toOutlineTexts(
        Parse.astToOutline(buildOptions(true, true), exportedClassDecl).outlineTrees,
      )).toEqual([
        'export ExportedComponent',
        '  propTypes',
        '  prop',
        '  constructor(props)',
        '  handleChangeEvent(ev)',
      ])
    })
  })
})
