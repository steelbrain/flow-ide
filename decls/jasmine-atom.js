/* @flow */

declare function waitsForPromise(
  optionsOrFunc: {timeout?: number, shouldReject?: boolean, label?: string} | () => Promise<mixed>,
  func?: () => Promise<mixed>
): void;
