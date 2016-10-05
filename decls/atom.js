/* @flow */

// Global Atom Object
declare var atom: Object;

// Global Chromium CSS Object
declare var CSS: Object;

declare module 'atom' {
  declare var Point: any;
  declare var Range: any;
  declare var Panel: any;
  declare var TextEditor: any;
  declare var TextBuffer: any;
  declare var BufferMarker: any;
  declare var TextEditorGutter: any;
  declare var TextEditorMarker: any;
  declare var CompositeDisposable: any;
}
