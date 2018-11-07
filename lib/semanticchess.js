const namespaces = require('./namespaces');
const Chess = require('chess.js').Chess;

/**
 * This is class represents a chess game using semantic annotations.
 */
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

    // the default color of the user is white
    if (!options.colorOfUser) {
      this.colorOfUser = 'w';
    } else {
      this.colorOfUser = options.colorOfUser;
    }

    // set the color of the opponent opposite of the user
    if (this.colorOfUser === 'w') {
      this.colorOfOpponent = 'b';
    } else {
      this.colorOfOpponent = 'w';
    }

    // an empty string as name does not make much sense
    if (this.name === '') {
      this.name = null;
    }

    // if we don't have a last move, the game just started so we can check who which color started the game
    if (!this.lastMove) {
      this.colorOfFirstTurn = this.chess.turn();
    }

    // set the default uniqid function to the function of the package 'uniqid'
    if (!options.uniqid) {
      this.uniqid = require('uniqid');
    } else {
      this.uniqid = options.uniqid;
    }
  }

  /**
   * The method returns true if the next half move has to be made by the opponent.
   * @returns {boolean}
   */
  isOpponentsTurn() {
    return this.chess.turn() === this.colorOfOpponent;
  }

  /**
   * This method does the next move, which specified via the san and the options.
   * It returns the corresponding SPARQL update and inbox notification if the move is valid.
   * It returns null if the move was invalid. For example, when the san is invalid or
   * when it's the opponents turn.
   * Note that opponents turns can only be added via the method loadMove.
   * @param san: the SAN of the move
   * @param options: the options of the move, inherited from chess.js
   * @returns {*}:
   */
  doMove(san, options) {
    // check if it's the user's turn
    if (!this.isOpponentsTurn()) {
      // save the current turn for later
      const currentTurn = this.chess.turn();
      const createdMove = this.chess.move(san, options);

      // check if the move is valid
      if (createdMove) {
        // if the color of the first turn has not been set that means that this move is the first move
        if (!this.colorOfFirstTurn) {
          this.colorOfFirstTurn = currentTurn;
        }

        return this._addUserMove(san);
      } else {
        // invalid mode
        return null;
      }
    } else {
      // not the user's turn
      return null;
    }
  }

  /**
   * This method load a user's or opponent's move.
   * This method returns {url, san}, where `url` is the url of the newly loaded move and
   * `san` is the SAN of the newly loaded move.
   * This method returns null if the SAN of the move is invalid.
   * When multiple moves need to be loaded, they have to be loaded in the order that they are played.
   * @param san
   * @param options
   * @returns {*}
   */
  loadMove(san, options) {
    const currentTurn = this.chess.turn();
    const createdMove = this.chess.move(san, options);

    // check if the move is valid
    if (createdMove) {
      if (!this.colorOfFirstTurn) {
        this.colorOfFirstTurn = currentTurn;
      }

      // check if the current turn is made by the user
      if (currentTurn === this.colorOfUser) {
        this.lastUserMove = {url: options.url, san};
      }

      this.lastMove = {url: options.url, san};

      return this.lastMove;
    } else {
      // invalid move
      return null;
    }
  }

  /**
   * This method returns {san, url} of the last move made, where `san` is the SAN of the move and
   * `url` is the url of the move.
   * @returns {*}
   */
  getLastMove() {
    return this.lastMove;
  }

  /**
   * This method returns {san, url} of the last move made by the user, where `san` is the SAN of the move and
   * `url` is the url of the move.
   * @returns {*}
   */
  getLastUserMove() {
    return this.lastUserMove;
  }

  /**
   * This method returns the color of the user, where 'w' is white and 'b' is black.
   * @returns {*}
   */
  getUserColor() {
    return this.colorOfUser;
  }

  /**
   * This method returns the color of the opponent, where 'w' is white and 'b' is black.
   * @returns {*}
   */
  getOpponentColor() {
    return this.colorOfOpponent;
  }

  /**
   * This method returns chess.js game that is used.
   * @returns {*}
   */
  getChess() {
    return this.chess;
  }

  /**
   * This method return the WebId of the opponent.
   * @returns {*|string}
   */
  getOpponentWebId() {
    return this.opponentWebId;
  }

  /**
   * This method returns the URL of the game.
   * @returns {*}
   */
  getUrl() {
    return this.url;
  }

  /**
   * This method returns the url of the file where the user wants his data to be stored.
   * @returns {*|string}
   */
  getUserDataUrl() {
    return this.userDataUrl;
  }

  /**
   * This method returns the name of the game.
   * @returns {*|null}
   */
  getName() {
    return this.name;
  }

  /**
   * This method returns the start position (using FEN) of the game.
   * @returns {*}
   */
  getStartPosition() {
    return this.startPosition;
  }

  /**
   * This method adds a new move for the user and generates the corresponding SPARQL update and notification.
   * @param san
   * @returns {{sparqlUpdate: string, notification: string}}
   * @private
   */
  _addUserMove(san) {
    // generate URL for move
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

    // if we have a checkmate we also say that this move is the last move
    if (this.chess.in_checkmate()) {
      sparqlUpdate += `<${this.url}> <${namespaces.chess}hasLastHalfMove> <${moveURL}>.\n`;
      notification += `<${this.url}> <${namespaces.chess}hasLastHalfMove> <${moveURL}>.`;
    }

    sparqlUpdate += `}`;

    this.lastMove = {
      url: moveURL,
      san
    };

    // because this method is only called when a move is done by the user, so we can set the lastUserMove
    this.lastUserMove = this.lastMove;

    return {
      sparqlUpdate,
      notification
    }
  }

  /**
   * This method returns the RDF (Turtle) representation of the game, without any moves.
   * @returns {*|string}
   */
  getMinimumRDF() {
    if (!this.minimumRDF) {
      const userAgentRole = this.userDataUrl + `#` + this.uniqid();
      const opponentAgentRole = this.userDataUrl + `#` + this.uniqid();

      let whiteWebId;
      let blackWebId;

      // determine the WebIds per color
      if (this.colorOfUser === 'w') {
        whiteWebId = this.userWebId;
        blackWebId = this.opponentWebId;
      } else {
        whiteWebId = this.opponentWebId;
        blackWebId = this.userWebId;
      }

      this.minimumRDF = `<${this.url}> <${namespaces.rdf}type> <${namespaces.chess}ChessGame>;\n` +
        `<${namespaces.chess}providesAgentRole> <${userAgentRole}>, <${opponentAgentRole}>.\n\n` +

        `<${userAgentRole}> <${namespaces.rdf}type> <${namespaces.chess}WhitePlayerRole>;\n` +
        `<${namespaces.chess}performedBy> <${whiteWebId}>.\n\n` +

        `<${opponentAgentRole}> <${namespaces.rdf}type> <${namespaces.chess}BlackPlayerRole>;\n` +
        `<${namespaces.chess}performedBy> <${blackWebId}>.\n\n`;

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
}

module.exports = SemanticChess;
