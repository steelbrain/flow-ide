Flow-IDE
=======

Flow IDE is a lightweight package that provides IDE features for [FlowType][FlowType] for [Atom Editor][Atom]. It's pretty lightweight and robust.

#### Installation
```
apm install flow-ide
```

#### Features

 - Linting
 - Autocomplete
 - Jump to declaration (using [facebooknuclide/hyperclick][hyperclick])

#### Roadmap

 - Show types on mouseover

#### Differences to other packages

Differences to [facebook/nuclide][nuclide]
 - Nuclide is nice and all but it's mostly bloatware for lightweight flow programming

Differences to [AtomLinter/linter-flow][linter-flow]
 - It tries to manage flow servers by itself, I find it annoying

Differences to [nmn/autocomplete-flow][autocomplete-flow]
 - Never worked for me

Differences to [LukeHoban/ide-flow][ide-flow]
 - Outdated and buggy
 - No longer maintained

#### Screenshots

![Autocomplete](https://cloud.githubusercontent.com/assets/4278113/12857027/bb8e2c80-cc69-11e5-918d-4451d0679e66.png)


#### License

This project is licensed under the terms of MIT License. Check the LICENSE file for more info.

[FlowType]:http://flowtype.org/
[Atom]:https://atom.io/
[nuclide]:https://github.com/facebook/nuclide
[hyperclick]:https://github.com/facebooknuclide/hyperclick
[ide-flow]:https://github.com/lukehoban/atom-ide-flow
[linter-flow]:https://github.com/AtomLinter/linter-flow
[autocomplete-flow]:https://github.com/nmn/autocomplete-flow
