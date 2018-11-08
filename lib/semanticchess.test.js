/**
 * author: Pieter Heyvaert (pheyvaer.heyvaert@ugent.be)
 * Ghent University - imec - IDLab
 */

const assert = require('assert');
const SemanticChess = require('./semanticchess');
const Utils = require('./utils');

describe('Semantic Chess', function() {
  it('default', async function() {
    const chess = new SemanticChess({
      url: 'http://example.org/myGame',
      moveBaseUrl: 'http://example.org/myfile',
      userWebId: 'http://example.org/#me',
      opponentWebId: 'http://example.org/#other',
      name: 'My game',
      uniqid: Utils.customUniqid()
    });

    const rdf = chess.getMinimumRDF();
    const expectedRDF = `<http://example.org/myGame>  <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://purl.org/NET/rdfchess/ontology/ChessGame>;
<http://purl.org/NET/rdfchess/ontology/providesAgentRole> <http://example.org/myfile#1>, <http://example.org/myfile#2>.

<http://example.org/myfile#1> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://purl.org/NET/rdfchess/ontology/WhitePlayerRole>;
<http://purl.org/NET/rdfchess/ontology/performedBy> <http://example.org/#me>.

<http://example.org/myfile#2> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://purl.org/NET/rdfchess/ontology/BlackPlayerRole>;
<http://purl.org/NET/rdfchess/ontology/performedBy> <http://example.org/#other>.

<http://example.org/myGame> <http://schema.org/name> "My game".
<http://example.org/myGame> <http://purl.org/NET/rdfchess/ontology/startPosition> "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1".
<http://example.org/myGame> <http://purl.org/NET/rdfchess/ontology/starts> <http://example.org/myfile#1>.`;

    assert.equal(await Utils.compareRDF(rdf, expectedRDF), true, 'The minimum RDF should be the same.');
    const startPosition = chess.getStartPosition();
    assert.equal(startPosition, 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', 'The start position should be the default.');
    assert.equal(chess.getUserColor(), 'w', 'The user should have the color white.');
    assert.equal(chess.getOpponentColor(), 'b', 'The opponent should have the color black.');
    assert.equal(chess.getUrl(), 'http://example.org/myGame', 'The url of the game is not correct.');
    assert.equal(chess.getName(), 'My game', 'The name of the game is not correct.');
  });

  it('user is black', async function() {
    const chess = new SemanticChess({
      url: 'http://example.org/myGame',
      moveBaseUrl: 'http://example.org/myfile',
      userWebId: 'http://example.org/#me',
      opponentWebId: 'http://example.org/#other',
      name: 'My game',
      colorOfUser: 'b',
      uniqid: Utils.customUniqid()
    });

    const rdf = chess.getMinimumRDF();
    const expectedRDF = `<http://example.org/myGame> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://purl.org/NET/rdfchess/ontology/ChessGame>;
<http://purl.org/NET/rdfchess/ontology/providesAgentRole> <http://example.org/myfile#1>, <http://example.org/myfile#2>.

<http://example.org/myfile#1> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://purl.org/NET/rdfchess/ontology/WhitePlayerRole>;
<http://purl.org/NET/rdfchess/ontology/performedBy> <http://example.org/#other>.

<http://example.org/myfile#2> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://purl.org/NET/rdfchess/ontology/BlackPlayerRole>;
<http://purl.org/NET/rdfchess/ontology/performedBy> <http://example.org/#me>.

<http://example.org/myGame> <http://schema.org/name> "My game".
<http://example.org/myGame> <http://purl.org/NET/rdfchess/ontology/startPosition> "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1".
<http://example.org/myGame> <http://purl.org/NET/rdfchess/ontology/starts> <http://example.org/myfile#1>.`;

    assert.equal(await Utils.compareRDF(rdf, expectedRDF), true, 'The minimum RDF should be the same.');
    const startPosition = chess.getStartPosition();
    assert.equal(startPosition, 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', 'The start position should be the default.');
    assert.equal(chess.getUserColor(), 'b', 'The user should have the color black.');
    assert.equal(chess.getOpponentColor(), 'w', 'The opponent should have the color white.');
  });

  it('load valid move', async function() {
    const chess = new SemanticChess({
      url: 'http://example.org/myGame',
      moveBaseUrl: 'http://example.org/myfile',
      userWebId: 'http://example.org/#me',
      opponentWebId: 'http://example.org/#other',
      name: 'My game',
      uniqid: Utils.customUniqid
    });

    const startPosition = chess.getStartPosition();
    assert.equal(startPosition, 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', 'The start position should be the default.');
    assert.equal(chess.getUserColor(), 'w', 'The user should have the color white.');
    assert.equal(chess.getOpponentColor(), 'b', 'The opponent should have the color black.');

    chess.loadMove('e4', {url: 'http://exmaple.org/move/1'});
    assert.deepEqual(chess.getLastMove(), {san: 'e4', url: 'http://exmaple.org/move/1'});
  });

  it('load invalid move', async function() {
    const chess = new SemanticChess({
      url: 'http://example.org/myGame',
      moveBaseUrl: 'http://example.org/myfile',
      userWebId: 'http://example.org/#me',
      opponentWebId: 'http://example.org/#other',
      name: 'My game',
    });

    const startPosition = chess.getStartPosition();
    assert.equal(startPosition, 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', 'The start position should be the default.');
    assert.equal(chess.getUserColor(), 'w', 'The user should have the color white.');
    assert.equal(chess.getOpponentColor(), 'b', 'The opponent should have the color black.');

    const r = chess.loadMove('dflklklfdfd', {url: 'http://exmaple.org/move/1'});
    assert.equal(r, null, 'This should be an invalid move.');
    assert.deepEqual(chess.getLastMove(), null);
  });

  it('do valid move', async function() {
    const chess = new SemanticChess({
      url: 'http://example.org/myGame',
      moveBaseUrl: 'http://example.org/myfile',
      userWebId: 'http://example.org/#me',
      opponentWebId: 'http://example.org/#other',
      name: 'My game',
      uniqid: Utils.customUniqid()
    });

    const move = chess.doMove('e4');
    const expectedNotification = `<http://example.org/myGame> <http://purl.org/NET/rdfchess/ontology/hasFirstHalfMove> <http://example.org/myfile#1>.`;
    const expectedSPARQLUpdate = `INSERT DATA {
<http://example.org/myGame> <http://purl.org/NET/rdfchess/ontology/hasHalfMove> <http://example.org/myfile#1>.

    <http://example.org/myfile#1> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://purl.org/NET/rdfchess/ontology/HalfMove>;
      <http://purl.org/NET/rdfchess/ontology/hasSANRecord> "e4"^^<http://www.w3.org/2001/XMLSchema#string>.
<http://example.org/myGame> <http://purl.org/NET/rdfchess/ontology/hasFirstHalfMove> <http://example.org/myfile#1>.
}`;

    assert.equal(move.sparqlUpdate, expectedSPARQLUpdate, 'The SPARQL update should be the sanme.');
    assert.equal(await Utils.compareRDF(move.notification, expectedNotification), true, 'The notification should be the same.');
    assert.deepEqual(chess.getLastMove(), {san: 'e4', url: 'http://example.org/myfile#1'});
  });

  describe('do invalid mode', function() {
    it('invalid san', async function () {
      const chess = new SemanticChess({
        url: 'http://example.org/myGame',
        moveBaseUrl: 'http://example.org/myfile',
        userWebId: 'http://example.org/#me',
        opponentWebId: 'http://example.org/#other',
        name: 'My game',
        uniqid: Utils.customUniqid
      });

      const move = chess.doMove('adfadsfasdf');

      assert.equal(move, null, 'The move should be null.');
      assert.deepEqual(chess.getLastMove(), null);
    });

    it.skip('not your turn', async function () {
      const chess = new SemanticChess({
        url: 'http://example.org/myGame',
        moveBaseUrl: 'http://example.org/myfile',
        userWebId: 'http://example.org/#me',
        opponentWebId: 'http://example.org/#other',
        name: 'My game',
        uniqid: Utils.customUniqid
      });

    });
  });
});
