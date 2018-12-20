# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2018-12-20

### Added

- support for real time games
- support for giving up on a game

## [0.1.0] - 2018-12-08

### Removed
- dependency on [`solid-auth-client`](https://github.com/solid/solid-auth-client), so you can use custom fetch function
- dependency on [LDflex for Solid](https://github.com/solid/query-ldflex) to make it independent of Solid

## [0.0.7] - 2018-11-16

### Added

- link move and game via [schema:subEvent](http://schema.org/subEvent)

## [0.0.6] - 2018-11-09

### Added

- use [LDflex for Solid](https://github.com/solid/query-ldflex) where possible
- make Loader.findWebIdOfOpponent public

### Fixed

- typos in documentation

## [0.0.5] - 2018-11-09

### Fixed

- support Object as input for doMove

## [0.0.4] - 2018-11-09

### Fixed

- issues with version numbers

## [0.0.3] - 2018-11-09

### Fixed

- workaround for chess.js + Webpack (see [Github issue](https://github.com/jhlywa/chess.js/issues/196))

## [0.0.2] - 2018-11-08

### Added

- add resulting position (encoded using FEN) after move to SPARQL update

[0.2.0]: https://github.com/pheyvaer/semantic-chess-js/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/pheyvaer/semantic-chess-js/compare/v0.0.7...v0.1.0
[0.0.7]: https://github.com/pheyvaer/semantic-chess-js/compare/v0.0.6...v0.0.7
[0.0.6]: https://github.com/pheyvaer/semantic-chess-js/compare/v0.0.5...v0.0.6
[0.0.5]: https://github.com/pheyvaer/semantic-chess-js/compare/v0.0.4...v0.0.5
[0.0.4]: https://github.com/pheyvaer/semantic-chess-js/compare/v0.0.3...v0.0.4
[0.0.3]: https://github.com/pheyvaer/semantic-chess-js/compare/v0.0.2...v0.0.3
[0.0.2]: https://github.com/pheyvaer/semantic-chess-js/compare/v0.0.1...v0.0.2
