/**
 * author: Pieter Heyvaert (pheyvaer.heyvaert@ugent.be)
 * Ghent University - imec - IDLab
 */

const auth = require('solid-auth-client');
const N3 = require('n3');
const newEngine = require('@comunica/actor-init-sparql-rdfjs').newEngine;
const Q = require('q');
const streamify = require('streamify-array');
const { default: data } = require('@solid/query-ldflex');
const namespaces = require('./namespaces');
const SemanticChess = require('./semanticchess');

/**
 * The Loader allows creating a Semantic Chess instance via information loaded from an url.
 */
class Loader {

  constructor() {
    this.engine = newEngine();
  }

  /**
   * This method creates a instance of Semantic Chess, based on a URL that describes the game.
   * @param {string} gameUrl: the url that represents the game
   * @param {string} userWebId: the WebId of the user
   * @param {string|function(): string} moveBaseUrl: base url used to create urls for new moves
   * @returns {Promise}: a promise that resolves with the new instance
   */
  loadFromUrl(gameUrl, userWebId, moveBaseUrl) {
    const deferred = Q.defer();

    auth.fetch(gameUrl)
      .then(async res => {
        if (res.status === 404) {
          deferred.reject(404);
        } else {
          const body = await res.text();
          const store = N3.Store();
          const parser = N3.Parser({baseIRI: res.url});

          parser.parse(body, async (err, quad, prefixes) => {
            if (err) {
              deferred.reject();
            } else if (quad) {
              store.addQuad(quad);
            } else {
              const source = {
                match: function (s, p, o, g) {
                  return streamify(store.getQuads(s, p, o, g));
                }
              };
              const sources = [{type: 'rdfjsSource', value: source}];
              const colorOfUser = await this._findUserColor(sources, userWebId);
              const opponentWebId = await this.findWebIdOfOpponent(gameUrl, userWebId);
              let name = await data[gameUrl]['http://schema.org/name'];

              if (name) {
                name = name.value;
              }

              let startPosition = await data[gameUrl][namespaces.chess + 'startPosition'];

              if (startPosition) {
                startPosition = startPosition.value;
              }

              const semanticGame = new SemanticChess({
                url: gameUrl,
                moveBaseUrl,
                userWebId,
                opponentWebId,
                colorOfUser,
                name,
                startPosition
              });

              const moves = await this._findMove(gameUrl, namespaces.chess + 'hasFirstHalfMove');
              //console.log(moves);

              moves.forEach(move => {
                semanticGame.loadMove(move.san, {url: move.url});
              });

              deferred.resolve(semanticGame);
            }
          });
        }
      });

    return deferred.promise;
  }

    /**
     * This method returns the WebId of the opponent.
     * @param gameUrl: the url of the game
     * @param userWebId: the WebId of the user
     * @returns {Promise}: a promise that resolves with the WebId of the opponent or null if not found
     */
    async findWebIdOfOpponent(gameUrl, userWebId) {
        const deferred = Q.defer();

        const rdfjsSource = await this._getRDFjsSourceFromUrl(gameUrl);

        this.engine.query(`SELECT ?id { ?agentRole <${namespaces.rdf}type> ?playerRole;
                   <${namespaces.chess}performedBy> ?id.
                MINUS {?playerRole <${namespaces.chess}performedBy> <${userWebId}> .}} LIMIT 100`,
            {sources: [{type: 'rdfjsSource', value: rdfjsSource}]})
            .then(function (result) {
                result.bindingsStream.on('data', function (data) {
                    const id = data.toObject()['?id'].value;

                    if (id !== userWebId) {
                        deferred.resolve(id);
                    }
                });

                result.bindingsStream.on('end', function () {
                    deferred.resolve(null);
                });
            });

        return deferred.promise;
    }

  /**
   * This method returns the move that is represented by a url
   * @param {string} moveUrl: the url of the move
   * @param predicate: the predicate that connects the current move with the next move
   * @returns {Promise}: a promise that resolves with an array of moves
   * @private
   */
  async _findMove(moveUrl, predicate) {
    const deferred = Q.defer();
    let results = [];

    const rdfjsSource = await this._getRDFjsSourceFromUrl(moveUrl);
    let nextMoveFound = false;

    this.engine.query(`SELECT * {
      OPTIONAL { <${moveUrl}> <${namespaces.chess}hasSANRecord> ?san. }
      OPTIONAL { <${moveUrl}> <${predicate}> ?nextMove. }
    } LIMIT 100`,
      {sources: [{type: 'rdfjsSource', value: rdfjsSource}]})
      .then(result => {
        result.bindingsStream.on('data', async data => {
          data = data.toObject();

          if (data['?san']) {
            results.push({
              san: data['?san'].value,
              url: moveUrl
            });
          }

          if (data['?nextMove']) {
            nextMoveFound = true;
            const t = await this._findMove(data['?nextMove'].value, namespaces.chess + 'nextHalfMove');
            results = results.concat(t);
          }

          deferred.resolve(results);
        });

        result.bindingsStream.on('end', function () {
          if (!nextMoveFound) {
            deferred.resolve(results);
          }
        });
      });

    return deferred.promise;
  }

  /**
   * This method returns the color of a user.
   * @param sources: the sources the Comunica engine needs to query
   * @param userWebId: the WebId of the user
   * @returns {Promise}: a promise that resolve with either 'w' or 'b'
   * @private
   */
  _findUserColor(sources, userWebId) {
    const deferred = Q.defer();

    this.engine.query(`SELECT * { ?agentRole <${namespaces.rdf}type> ?playerRole;
                <${namespaces.chess}performedBy> <${userWebId}> } LIMIT 100`,
      {sources})
      .then(function (result) {
        result.bindingsStream.on('data', function (data) {
          const role = data.toObject()['?playerRole'].value;

          if (role === namespaces.chess + 'WhitePlayerRole') {
            deferred.resolve('w');
          } else {
            deferred.resolve('b');
          }
        });
      });

    return deferred.promise;
  }

  /**
   * This method returns an RDFJSSource of an url
   * @param {string} url: url of the source
   * @returns {Promise}: a promise that resolve with the corresponding RDFJSSource
   * @private
   */
  _getRDFjsSourceFromUrl(url) {
    const deferred = Q.defer();

    auth.fetch(url)
      .then(async res => {
        if (res.status === 404) {
          deferred.reject(404);
        } else {
          const body = await res.text();
          const store = N3.Store();
          const parser = N3.Parser({baseIRI: res.url});

          parser.parse(body, (err, quad, prefixes) => {
            if (err) {
              deferred.reject();
            } else if (quad) {
              store.addQuad(quad);
            } else {
              const source = {
                match: function(s, p, o, g) {
                  return require('streamify-array')(store.getQuads(s, p, o, g));
                }
              };

              deferred.resolve(source);
            }
          });
        }
      });

    return deferred.promise;
  }
}

module.exports = Loader;
