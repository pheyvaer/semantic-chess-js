const namespaces = require('./namespaces');
const Chess = require('chess.js').Chess;

class SemanticChess {

  /*
    @url the unique url of this chess game
    @userDataUrl the url of the current user's data file where the chess data is stored
    @userWebId the WebID of the current user
    @opponentWebId the WebID of the opponent
  */
  constructor(options) {
    if (options.chess) {
      this.chess = options.chess;
      this.startPosition = options.startPosition; // FEN
    } else {
      if (options.startPosition) {
        this.chess = new Chess(options.startPosition);
      } else {
        this.chess = new Chess();
      }

      this.startPosition = this.chess.fen();
    }

    this.url = options.url;
    this.userDataUrl = options.userDataUrl;
    this.userWebId = options.userWebId;
    this.opponentWebId = options.opponentWebId;
    this.name = options.name;    this.lastMove = options.lastMove;
    this.lastUserMove = options.lastUserMove;

    if (!options.colorOfUser) {
      this.colorOfUser = 'w';
    } else {
      this.colorOfUser = options.colorOfUser;
    }

    if (this.name === '') {
      this.name = null;
    }

    if (this.colorOfUser === 'w') {
      this.colorOfOpponent = 'b';
    } else {
      this.colorOfOpponent = 'w';
    }

    if (!this.lastMove) {
      this.colorOfFirstTurn = this.chess.turn();
    }

    if (!options.uniqid) {
      this.uniqid = require('uniqid');
    } else {
      this.uniqid = options.uniqid;
    }
  }

  isOpponentsTurn() {
    return this.chess.turn() === this.colorOfOpponent;
  }

  doMove(san, options) {
    if (!this.isOpponentsTurn()) {
      const currentTurn = this.chess.turn();
      const createdMove = this.chess.move(san, options);

      if (createdMove) {
        if (!this.colorOfFirstTurn) {
          this.colorOfFirstTurn = currentTurn;
        }

        return this._addUserMove(san);
      } else {
        return null;
      }
    } else {
      return null;
    }
  }

  loadMove(san, options) {
    const currentTurn = this.chess.turn();
    const createdMove = this.chess.move(san, options);

    if (createdMove) {
      if (!this.colorOfFirstTurn) {
        this.colorOfFirstTurn = currentTurn;
      }

      if (currentTurn === this.colorOfUser) {
        this.lastUserMove = {url: options.url, san};
      }

      this.lastMove = {url: options.url, san};

      return this.lastMove;
    } else {
      return null;
    }
  }

  getLastMove() {
    return this.lastMove;
  }

  getLastUserMove() {
    return this.lastUserMove;
  }

  getUserColor() {
    return this.colorOfUser;
  }

  getOpponentColor() {
    return this.colorOfOpponent;
  }

  getChess() {
    return this.chess;
  }

  getOpponentWebId() {
    return this.opponentWebId;
  }

  getUrl() {
    return this.url;
  }

  getUserDataUrl() {
    return this.userDataUrl;
  }

  getName() {
    return this.name;
  }

  getStartPosition() {
    return this.startPosition;
  }

  /*
    Updates the last user move and returns the corresponding RDF
  */
  _addUserMove(san) {
    //generate URL for move
    const moveURL = this.userDataUrl + `#` + this.uniqid();

    let sparqlUpdate = 'INSERT DATA {\n';
    let notification = null;

    sparqlUpdate +=
    `<${this.url}> <${namespaces.chess}hasHalfMove> <${moveURL}>.

    <${moveURL}> <${namespaces.rdf}type> <${namespaces.chess}HalfMove>;
      <${namespaces.chess}hasSANRecord> "${san}"^^<${namespaces.xsd}string>.\n`;

    if (this.lastMove) {
      sparqlUpdate += `<${this.lastMove.url}> <${namespaces.chess}nextHalfMove> <${moveURL}>.\n`;
      notification = `<${this.lastMove.url}> <${namespaces.chess}nextHalfMove> <${moveURL}>.`;
    } else {
      sparqlUpdate += `<${this.url}> <${namespaces.chess}hasFirstHalfMove> <${moveURL}>.\n`;
      notification = `<${this.url}> <${namespaces.chess}hasFirstHalfMove> <${moveURL}>.`;
    }

    if (this.chessGame.in_checkmate()) {
      sparqlUpdate += `<${this.url}> <${namespaces.chess}hasLastHalfMove> <${moveURL}>.\n`;
      notification += `<${this.url}> <${namespaces.chess}hasLastHalfMove> <${moveURL}>.`;
    }

    sparqlUpdate += `}`;

    this.lastMove = {
      url: moveURL,
      san
    };

    this.lastUserMove = this.lastMove;

    return {
      sparqlUpdate,
      notification
    }
  }

  getMinimumRDF() {
    if (!this.minimumRDF) {
      const userAgentRole = this.userDataUrl + `#` + this.uniqid();
      const opponentAgentRole = this.userDataUrl + `#` + this.uniqid();

      this.minimumRDF = `
        <${this.url}>  <${namespaces.rdf}type> <${namespaces.chess}ChessGame>;
          <${namespaces.chess}providesAgentRole> <${userAgentRole}>, <${opponentAgentRole}>.

        <${userAgentRole}> <${namespaces.rdf}type> <${namespaces.chess}WhitePlayerRole>;
          <${namespaces.chess}performedBy> <${this.userWebId}>.

        <${opponentAgentRole}> <${namespaces.rdf}type> <${namespaces.chess}BlackPlayerRole>;
          <${namespaces.chess}performedBy> <${this.opponentWebId}>.
      `;

      if (this.name) {
        this.minimumRDF += `<${this.url}> <http://schema.org/name> "${this.name}".\n`;
      }

      if (this.startPosition) {
        this.minimumRDF += `<${this.url}> <${namespaces.chess}startPosition> "${this.startPosition}".\n`;
      }

      if (this.colorOfFirstTurn = 'w') {
        this.minimumRDF += `<${this.url}> <${namespaces.chess}starts> <${userAgentRole}>.\n`;
      } else if (this.colorOfFirstTurn === 'b') {
        this.minimumRDF += `<${this.url}> <${namespaces.chess}starts> <${opponentAgentRole}>.\n`;
      }
    }

    return this.minimumRDF;
  }

  /*
    Generates a hash for the current state of the chess game
  */
  _generateHash() {

  }
}

module.exports = SemanticChess;
