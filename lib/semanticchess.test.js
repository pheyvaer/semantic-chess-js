/**
 * author: Pieter Heyvaert (pheyvaer.heyvaert@ugent.be)
 * Ghent University - imec - IDLab
 */

const assert = require('assert');
const SemanticChess = require('./semanticchess');

describe('Semantic Chess', function() {
  it('default', function() {
    const chess = new SemanticChess({
      url: 'http://example.org/myGame',
      userDataUrl: 'http://example.org/myfile',
      userWebId: 'http://example.org/#me',
      opponentWebId: 'http://example.org/#other',
      name: 'My game'
    });

    const rdf = chess.getMinimumRDF();
    //TODO assert.equal(rdf, )
    const startPosition = chess.getStartPosition();
    assert.equal(startPosition, 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', 'The start position should be the default.');
    assert.equal(chess.getUserColor(), 'w', 'The user should have the color white.');
    assert.equal(chess.getOpponentColor(), 'b', 'The opponent should have the color black.');
  });

  it('user is black', function() {
    const chess = new SemanticChess({
      url: 'http://example.org/myGame',
      userDataUrl: 'http://example.org/myfile',
      userWebId: 'http://example.org/#me',
      opponentWebId: 'http://example.org/#other',
      name: 'My game',
      colorOfUser: 'b'
    });

    const rdf = chess.getMinimumRDF();
    //assert.equal(rdf, )
    const startPosition = chess.getStartPosition();
    assert.equal(startPosition, 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', 'The start position should be the default.');
    assert.equal(chess.getUserColor(), 'b', 'The user should have the color black.');
    assert.equal(chess.getOpponentColor(), 'w', 'The opponent should have the color white.');
  });

  it('load valid move', function() {
    const chess = new SemanticChess({
      url: 'http://example.org/myGame',
      userDataUrl: 'http://example.org/myfile',
      userWebId: 'http://example.org/#me',
      opponentWebId: 'http://example.org/#other',
      name: 'My game',
    });

    const rdf = chess.getMinimumRDF();
    //assert.equal(rdf, )
    const startPosition = chess.getStartPosition();
    assert.equal(startPosition, 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', 'The start position should be the default.');
    assert.equal(chess.getUserColor(), 'w', 'The user should have the color white.');
    assert.equal(chess.getOpponentColor(), 'b', 'The opponent should have the color black.');

    chess.loadMove('e4', {url: 'http://exmaple.org/move/1'});
    assert.deepEqual(chess.getLastMove(), {san: 'e4', url: 'http://exmaple.org/move/1'});
  });

  it('load invalid move', function() {
    const chess = new SemanticChess({
      url: 'http://example.org/myGame',
      userDataUrl: 'http://example.org/myfile',
      userWebId: 'http://example.org/#me',
      opponentWebId: 'http://example.org/#other',
      name: 'My game',
    });

    const rdf = chess.getMinimumRDF();
    //assert.equal(rdf, )
    const startPosition = chess.getStartPosition();
    assert.equal(startPosition, 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', 'The start position should be the default.');
    assert.equal(chess.getUserColor(), 'w', 'The user should have the color white.');
    assert.equal(chess.getOpponentColor(), 'b', 'The opponent should have the color black.');

    const r = chess.loadMove('dflklklfdfd', {url: 'http://exmaple.org/move/1'});
    assert.equal(r, null, 'This should be an invalid move.');
    assert.deepEqual(chess.getLastMove(), null);
  });
});
