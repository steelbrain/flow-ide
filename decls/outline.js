/* @flow */
import type {
  Point as atom$Point,
  TextEditor as atom$TextEditor
} from 'atom'

type TokenKind =
  | 'keyword'
  | 'class-name'
  | 'constructor'
  | 'method'
  | 'param'
  | 'string'
  | 'whitespace'
  | 'plain'
  | 'type';

type TextToken = {
  kind: TokenKind,
  value: string,
};

type TokenizedText = Array<TextToken>;

type OutlineTreeKind =
  | 'file'
  | 'module'
  | 'namespace'
  | 'package'
  | 'class'
  | 'method'
  | 'property'
  | 'field'
  | 'constructor'
  | 'enum'
  | 'interface'
  | 'function'
  | 'variable'
  | 'constant'
  | 'string'
  | 'number'
  | 'boolean'
  | 'array';

type OutlineTree = {
  icon?: string, // from atom$Octicon (that type's not allowed over rpc so we use string)
  kind?: OutlineTreeKind, // kind you can pass to the UI for theming

  // Must be one or the other. If both are present, tokenizedText is preferred.
  plainText?: string,
  tokenizedText?: TokenizedText,

  // If user has atom-ide-outline-view.nameOnly then representativeName is used instead.
  representativeName?: string,

  startPosition: atom$Point,
  endPosition?: atom$Point,
  landingPosition?: atom$Point,
  children: Array<OutlineTree>,
};

type Outline = {
  outlineTrees: Array<OutlineTree>,
};

type OutlineProvider = {
  name: string,
  // If there are multiple providers for a given grammar, the one with the highest priority will be
  // used.
  priority: number,
  grammarScopes: Array<string>,
  updateOnEdit?: boolean,
  getOutline(editor: atom$TextEditor): Promise<?Outline>,
};
