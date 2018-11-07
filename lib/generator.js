/**
 * author: Pieter Heyvaert (pheyvaer.heyvaert@ugent.be)
 * Ghent University - imec - IDLab
 */

const auth = require('solid-auth-client');
const N3 = require('n3');
const newEngine = require('@comunica/actor-init-sparql-rdfjs').newEngine;
const Q = require('q');
const namespaces = require('./namespaces');
const SemanticChess = require('./semanticchess');

class Generator {

  constructor() {
    this.engine = newEngine();
  }


  generateFromUrl(gameUrl, userWebId, userDataUrl) {
    const deferred = Q.defer();

    auth.fetch(gameUrl)
      .then(async res => {
        if (res.status === 404) {
          deferred.reject(404);
        } else {
          const body = await res.text();
          const store = N3.Store();
          const parser = N3.Parser({baseIRI: res.url});

          console.log(body);

          parser.parse(body, async (err, quad, prefixes) => {
            if (err) {
              deferred.reject();
            } else if (quad) {
              store.addQuad(quad);
            } else {
              const source = {
                match: function (s, p, o, g) {
                  return require('streamify-array')(store.getQuads(s, p, o, g));
                }
              };
              const sources = [{type: 'rdfjsSource', value: source}];
              const startPosition = await this._getStartPositionOfGame(gameUrl);
              const colorOfUser = await this._findUserColor(sources, userWebId);
              const opponentWebId = await this._findWebIdOfOpponent(sources, userWebId);
              const name = await this._getGameName(gameUrl);

              const semanticGame = new SemanticChess({
                url: gameUrl,
                userDataUrl,
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

  async _getGameName(gameUrl) {
    const deferred = Q.defer();
    const rdfjsSource = await this._getRDFjsSourceFromUrl(gameUrl);
    const engine = newEngine();

    engine.query(`SELECT ?name {
    <${gameUrl}> <http://schema.org/name> ?name.
  }`,
      { sources: [ { type: 'rdfjsSource', value: rdfjsSource } ] })
      .then(function (result) {
        result.bindingsStream.on('data', function (data) {
          data = data.toObject();

          deferred.resolve(data['?name'].value);
        });

        result.bindingsStream.on('end', function () {
          deferred.resolve(null);
        });
      });

    return deferred.promise;
  }


  async _findMove(current, predicate) {
    const deferred = Q.defer();
    let results = [];

    const rdfjsSource = await this._getRDFjsSourceFromUrl(current);
    let nextMoveFound = false;

    this.engine.query(`SELECT * {
      OPTIONAL { <${current}> <${namespaces.chess}hasSANRecord> ?san. }
      OPTIONAL { <${current}> <${predicate}> ?nextMove. }
    } LIMIT 100`,
      {sources: [{type: 'rdfjsSource', value: rdfjsSource}]})
      .then(result => {
        result.bindingsStream.on('data', async data => {
          data = data.toObject();

          if (data['?san']) {
            results.push({
              san: data['?san'].value,
              url: current
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

  _findUserColor(sources, userWebId) {
    const deferred = Q.defer();

    this.engine.query(`SELECT * { ?agentRole <${namespaces.rdf}type> ?playerRole;
                <${namespaces.chess}performedBy> <${userWebId}> } LIMIT 100`,
      {sources})
      .then(function (result) {
        result.bindingsStream.on('data', function (data) {
          const role = data.toObject()['?playerRole'].value;

          if (role === namespaces.chess + 'WhitePlayerRole') {
            deferred.resolve('white');
          } else {
            deferred.resolve('black');
          }
        });
      });

    return deferred.promise;
  }

  _findWebIdOfOpponent(sources, userWebId) {
    const deferred = Q.defer();

    this.engine.query(`SELECT ?id { ?agentRole <${namespaces.rdf}type> ?playerRole;
                   <${namespaces.chess}performedBy> ?id.
                MINUS {?playerRole <${namespaces.chess}performedBy> <${userWebId}> .}} LIMIT 100`,
      {sources})
      .then(function (result) {
        result.bindingsStream.on('data', function (data) {
          const id = data.toObject()['?id'].value;

          if (id !== userWebId) {
            deferred.resolve(id);
          }
        });
      });

    return deferred.promise;
  }


  async _getStartPositionOfGame(gameUrl) {
    const deferred = Q.defer();
    const rdfjsSource = await this._getRDFjsSourceFromUrl(gameUrl);
    const engine = newEngine();

    engine.query(`SELECT ?pos {
    <${gameUrl}> <${namespaces.chess}startPosition> ?pos.
  }`,
      { sources: [ { type: 'rdfjsSource', value: rdfjsSource } ] })
      .then(function (result) {
        result.bindingsStream.on('data', function (data) {
          data = data.toObject();

          deferred.resolve(data['?pos'].value);
        });

        result.bindingsStream.on('end', function () {
          deferred.resolve(null);
        });
      });

    return deferred.promise;
  }


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

module.exports = Generator;
