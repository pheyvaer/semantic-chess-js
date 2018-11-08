/**
 * author: Pieter Heyvaert (pheyvaer.heyvaert@ugent.be)
 * Ghent University - imec - IDLab
 */

const N3 = require('n3');
const Q = require('q');
const {isomorphic} = require('rdf-isomorphic');

/**
 * This method returns a unique id, based on a counter.
 * This method is used for testing.
 * @returns {function(): number}: a function that always returns a new number
 */
function customUniqid() {
  let counter = 0;

  return function() {
    counter ++;

    return counter;
  };
}

/**
 * This method compares two RDF strings.
 * This method is used for testing.
 * @param rdfStr1: the first RDF string
 * @param rdfStr2: the second RDF string
 * @returns {Promise<void>}: a promise that resolves with true if the RDF strings are semantically the same, else false
 */
async function compareRDF(rdfStr1, rdfStr2) {
  const quads1 = await _getQuads(rdfStr1);
  const quads2 = await _getQuads(rdfStr2);

  return isomorphic(quads1, quads2);
}

/**
 * This method returns an array of quads extracted from an string with RDF
 * @param rdfStr: the RDF string
 * @returns {*|PromiseLike<any>}: a promise that resolves with an array of Quads
 * @private
 */
function _getQuads(rdfStr) {
  const deferred = Q.defer();
  const quads = [];
  const parser = new N3.Parser();

  parser.parse(rdfStr, (err, quad) => {
    if (err) {
      deferred.reject(err);
    } else if (quad) {
      quads.push(quad);
    } else {
      deferred.resolve(quads);
    }
  });

  return deferred.promise;
}

module.exports = {
  customUniqid,
  compareRDF
};
