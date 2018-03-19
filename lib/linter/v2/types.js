/* @flow */

export type Position = {
  line: number,
  column: number,
  offset: number
}

export type Location = {
  source: string,
  type: "SourceFile", // TODO: others?
  start: Position,
  end: Position,
  context: string
}

export type ReferenceId = string

export type ReferenceLocs = { [id: ReferenceId]: Location }

// CodeMarkup represents text that originates from the actual source code.
// Typically should be rendered in a fixed-width font (e.g. in markdown using `...`)
export type CodeMarkup = {
  kind: "Code",
  text: string
}
// TextMarkup just represents text, most likely used in combination with other markups
export type TextMarkup = {
  kind: "Text",
  text: string
}
// ReferenceMarkup can be used to reference to source code (e.g. via links)
export type ReferenceMarkup = {
  kind: "Reference",
  referenceId: ReferenceId,
  message: InlineMarkup[] // eslint-disable-line no-use-before-define
}

// UnorderedListMarkup represents a `message` and a list of bullet points (`items`)
export type UnorderedListMarkup = {
  kind: 'UnorderedList',
  message: InlineMarkup[], // eslint-disable-line no-use-before-define
  items: MessageMarkup[] // eslint-disable-line no-use-before-define
}

// InlineMarkup represents a single line of text
export type InlineMarkup = CodeMarkup | TextMarkup | ReferenceMarkup
// BlockMarkup represents a larger block of text.
// Typically this is suitable for linter `description`
export type BlockMarkup = UnorderedListMarkup

export type MessageMarkup =
  InlineMarkup[] |
  BlockMarkup

export type Error = {
  kind: "lint" | "infer",
  level: "warning" | "error",
  suppressions: [], // TODO: I probably have to turn on some suppressions to see this...
  classic: boolean,
  primaryLoc: Location,
  rootLoc: ?Location,
  messageMarkup: MessageMarkup,
  referenceLocs: ReferenceLocs
}

export type StatusResult = {
  flowVersion: string, // e.g 0.66.0
  jsonVersion: "2",
  errors: Error[],
  passed: true
};
