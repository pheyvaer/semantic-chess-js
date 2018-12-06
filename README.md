# Semantic Chess

A semantic representation of a chess game in JavaScript that allows doing and loading moves.
It will generate the corresponding RDF, SPARQL updates, and inbox notifications.
It is used in [solid-chess](https://github.com/pheyvaer/solid-chess), 
a decentralized chess game, based on [Solid](https://solid.inrupt.com/).

The full documentation can be found [here](https://pheyvaer.github.io/semantic-chess-js).

## Install

You can install the library via

```shell
npm i semantic-chess
```

## Usage

### Create a new chess game

In the example below we create a new game and do a single move.
We print the corresponding SPARQL update for that move 
together the notification that should be send to the inbox of the opponent.

```JavaScript
const SemanticChess = require('semantic-chess').SemanticChess;

const chess = new SemanticChess({
  url: 'http://example.org/mygame',
  userWebId: 'http://example.org/user1/#me',
  userDataUrl: 'http://example.org/storage/chess.ttl',
  opponentsWebId: 'http://example.org/user2/#me',
  name: 'My first chess game!'
});

const move = chess.doMove('e4');

console.log(move.sparqlUpdate);
// INSERT DATA {
//   <http://example.org/mygame> <http://purl.org/NET/rdfchess/ontology/hasHalfMove> <http://example.org/storage/chess.ttl#ufulmwjo8f4vo7>;
//     <http://purl.org/NET/rdfchess/ontology/hasFirstHalfMove> <http://example.org/storage/chess.ttl#ufulmwjo8f4vo7>.
//
//   <http://example.org/storage/chess.ttl#ufulmwjo8f4vo7> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://purl.org/NET/rdfchess/ontology/HalfMove>;
//     <http://purl.org/NET/rdfchess/ontology/hasSANRecord> "e4"^^<http://www.w3.org/2001/XMLSchema#string>.
// }
 

console.log(move.notification);
// <http://example.org/mygame> <http://purl.org/NET/rdfchess/ontology/hasFirstHalfMove> <http://example.org/storage/chess.ttl#ufulmwjo8f4vo7>.

```

Note that the URLs of the moves might be different for every run, as a unique id is generated for every move.

### Load a chess game via its url

In the example below we load a game from its url.
The Loader needs a fetch function that will be used to fetch the data.
The fetch from `solid-auth-client` is a possibility.
We also need to provide the WebId of the current user, so the game know when a move is valid.
Furthermore, the base URL that is used for new moves is also provided.
This can either be a string or a function that returns a string.

```JavaScript
const Loader = require('semantic-chess').Loader;
const auth = require('solid-auth-client);

const loader = new Loader(auth.fetch);
const chess = await loader.loadFromUrl('http://example.org/mygame', 'http://example.org/user1/#me', 'http://example.org/storage/chess.ttl');
```

## Tests

The test are executed via

```shell
npm test
```

The test files can be found in the folder `lib` and have the extension `test.js`.

## Documentation

The documentation is generated via 

```shell
npm run doc
```

You can find the resulting HTML in the folder `docs`.

## License

© 2018 [Pieter Heyvaert](https://pieterheyvaert.com), [MIT License](https://github.com/pheyvaer/semantic-chess-js/blob/master/LICENSE.md)
