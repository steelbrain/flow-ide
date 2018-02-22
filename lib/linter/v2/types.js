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

export type CodeMarkup = {
  kind: "Code",
  text: string
}
export type TextMarkup = {
  kind: "Text",
  text: string
}

export type ReferenceMarkup = {
  kind: "Reference",
  referenceId: ReferenceId,
  message: MessageMarkup[]
}

export type MessageMarkup = CodeMarkup | TextMarkup | ReferenceMarkup

export type Error = {
  kind: "lint" | "infer",
  level: "warning" | "error",
  suppressions: [], // TODO: I probably have to turn on some suppressions to see this...
  classic: boolean, // TODO: what is this? until now this always was 'false'
  primaryLoc: Location,
  rootLoc: ?Location,
  messageMarkup: MessageMarkup[],
  referenceLocs: ReferenceLocs
}

export type StatusResult = {
  flowVersion: string, // e.g 0.66.0
  jsonVersion: "2",
  errors: Error[],
  passed: true
};
