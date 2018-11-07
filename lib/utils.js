/**
 * author: Pieter Heyvaert (pheyvaer.heyvaert@ugent.be)
 * Ghent University - imec - IDLab
 */

const N3 = require('n3');
const Q = require('q');
const {isomorphic} = require('rdf-isomorphic');

let counter = 0;

function customUniqid() {
  counter ++;

  return counter;
}

async function compareRDF(rdfStr1, rdfStr2) {
  const quads1 = await _getQuads(rdfStr1);
  const quads2 = await _getQuads(rdfStr2);

  return isomorphic(quads1, quads2);
}

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
