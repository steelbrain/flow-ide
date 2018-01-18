#### 1.10.0

- [Outline](https://github.com/facebook-atom/atom-ide-ui/blob/2767934/docs/outline-view.md) of classes, functions, types and variables (using [atom-ide-ui](https://github.com/facebook-atom/atom-ide-ui/))
- Minor bug fixes regarding markdown rendering of flow errors

#### 1.9.0

- Support [datatip](https://github.com/facebook-atom/atom-ide-ui/blob/508ecfd6aa8121ae2e423b2becbe22e34cf191fb/docs/datatips.md) from [atom-ide-ui](https://github.com/facebook-atom/atom-ide-ui/)
- Fix wrong coverage (#112)
- Fix minor markdown rendering issue

#### 1.8.1

- Hide coverage view instead of emptying to fix extra padding

#### 1.8.0

- Add linting in flow support
- Show a restart notification after `hyperclickPriority` is updated

#### 1.7.0

- Change search order of `flow` executable (_Executable Path_ setting > `node_modules/.bin/flow` > global `flow`)

#### 1.6.0

- Add "jump to definition" via `hyperclick`
- Show the complete flow error message as error description

#### 1.5.0

- Add option to show uncovered code
- Fix process exited with non-zero status code for autocomplete
- Fix invalid behavior of `onlyIfAppropriate` config

#### 1.4.2

- Limit concurrent spawned processes

#### 1.4.1

- Increase exec timeout to 60 seconds

#### 1.4.0

- Upgrade for linter v2 support

#### 1.3.0

- Terminate flow servers on deactivate
- Fix path.dirname deprecation by ignoring autocomplete requests on files not yet saved

#### 1.2.4

- Had to bump version because of some issues in deployment (network)

#### 1.2.2

- Handle coverage count zero (#52)

#### 1.2.1

- Fix flow type checking (#49)

#### 1.2

- Add Flow coverage view

#### 1.1.10
- Provide a default .flowconfig file if onlyIfAppropriate is enabled and a .flowconfig file is not found already

#### 1.1.9

- Fix autocompletion for properties (#33)
- Remove types from function params (#8)

#### 1.1.8

- APM was having hiccups back then so didn't publish properly

#### 1.1.7

- Fix a bug in last release

#### 1.1.6

- Workaround a Atom's builtin babel bug

#### 1.1.5

- Just another patch to catch more flow errors gracefully

#### 1.1.4

- Handle flow crashes/respawns gracefully

#### 1.1.3

- Show entire linter error message

#### 1.1.1-1.1.2

- Fix a bug introduced in 1.1.0 where autocomplete wouldn't work
- Fix a reference to undefined variable in case of error ( Fixes #12 )

#### 1.1.0

- Add support for locally installed flow bins
- Bump `atom-linter` to v5

#### 1.0.6

- Show a correct type for Objects in autocomplete
- Only run autocomplete at appropriate times ( Fixes #3 )

#### 1.0.5

- Fix a bug in retrying for server
- Fix a bug where deep nested objects would mess up autocomplete

#### 1.0.4

- Bump `atom-package-deps` version

#### 1.0.3

- Bump `atom-linter` dependency to include fix for projects that don't have a `.flowcofig`

#### 1.0.2

- Improve handling of fatal errors

#### 1.0.1

- Implement smart sorting and filtering of autocomplete suggestions
- Make linter messages more user friendly

#### 1.0.0

- Linting support added
- Autocomplete support added
