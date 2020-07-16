import JsonDatabase from '../JsonDatabase';
import { Tile, Player } from '../Database';
import { expect } from 'chai';
import * as sinon from 'sinon';
import * as fs from 'fs';
import 'mocha';


// TODO delete spies that are just function calls if we don't need spy result
describe('JsonDatabase', () => {
  const NON_EXISTENT_ROOM_ERROR = 'Room does not exist';
  const NON_EXISTENT_PLAYER_ERROR = 'Player does not exist';
  const FULL_ROOM_ERROR = 'Room is full';
  const HEAD_DRAW_ERROR = 'Cannot draw any more tiles from head';
  const TAIL_DRAW_ERROR = 'Cannot draw any more tiles from tail';
  const DISCARD_DRAW_ERROR = 'Cannot draw any discarded tiles from player';
  const NO_TILE_IN_HAND_ERROR = 'Player does not have tile';
  const REVEALED_ERROR = 'Tile already revealed';
  const HIDDEN_ERROR = 'Tile already hidden';
  const LOCKED_ERROR = 'Tile already locked';
  const UNLOCKED_ERROR = 'Tile already unlocked';

  const sandbox = sinon.createSandbox();
  const tileMapping = {
    1: {
      'locked': false,
      'ownerId': null,
      'revealed': false
    },
    2: {
      'locked': true,
      'ownerId': 'player2',
      'revealed': false
    },
    3: {
      'locked': false,
      'ownerId': 'player1',
      'revealed': false
    },
    4: {
      'locked': false,
      'ownerId': null,
      'revealed': true
    },
    5: {
      'locked': false,
      'ownerId': 'player1',
      'revealed': true
    }
  }

  const dummyDb = {
    'room1': {
      'numGames': 1,
      'numPlayers': 2,
      'playerOrder': ['player1', 'player2'],
      'playerIndex': 0,
      'headIndex': 2,
      'tailIndex': 2,
      'mapping': [1, 2, 3, 4, 5],
      'players': {
        'player1': {
          'hand': [1],
          'revealedTiles': [5],
          'discardedTiles': [],
          'activeTile': null
        },
        'player2': {
          'hand': [],
          'revealedTiles': [],
          'discardedTiles': [2],
          'activeTile': null
        }
      },
      'tiles': tileMapping
    }
  }

  describe('initializeDb()', () => {
    let dummyInit;

    beforeEach( () => {
      dummyInit = sandbox.spy(JsonDatabase.prototype, <any>'initializeDb');
      sandbox.stub(JsonDatabase.prototype, <any>'shuffleTiles').returns([1,2,3,4,5]);
      sandbox.stub(JsonDatabase.prototype, <any>'generateTileMapping').returns(tileMapping)
    });

    afterEach( () => {
      sandbox.restore();
    });

    it ('initializes with an existing db', () => {
      const contents = sandbox.stub(fs, 'readFileSync').returns('{}');

      new JsonDatabase();

      sinon.assert.calledOnce(dummyInit);
      sinon.assert.match(dummyInit.returnValues[0], {});
    });

    it ('initializes a new db', () => {
      const contents = sandbox.stub(fs, 'readFileSync').throws();
      const dummyMkDir = sandbox.stub(fs, 'mkdirSync').returns(undefined);
      const dummyWrite = sandbox.stub(fs, 'writeFileSync').returns(undefined);
      const dummyExists = sandbox.stub(fs, 'existsSync').returns(false);

      new JsonDatabase();

      sinon.assert.calledTwice(dummyExists);
      sinon.assert.calledOnce(dummyMkDir);
      sinon.assert.calledOnce(dummyWrite);
      sinon.assert.match(dummyInit.returnValues[0], {});
    });
  });

  describe('Room', () => {
    let jsonDb;
    let copyDb = JSON.parse(JSON.stringify(dummyDb));

    beforeEach( () => {
      sandbox.stub(JsonDatabase.prototype, <any>'initializeDb').returns(copyDb);
      sandbox.stub(JsonDatabase.prototype, <any>'newId').returns('123');
      jsonDb = new JsonDatabase();
    });

    afterEach( () => {
      copyDb = JSON.parse(JSON.stringify(dummyDb));
      sandbox.restore();
    });

    it('newRoom() successfully creates a new room', () => {
      const writeSpy = sandbox.spy(JsonDatabase.prototype, <any>'writeToDb');

      const res = jsonDb.newRoom();

      sinon.assert.calledTwice(writeSpy);
      sinon.assert.match(res, 123);
    });

    it('deleteRoom() successfully deletes a new room', () => {
      const writeSpy = sandbox.spy(JsonDatabase.prototype, <any>'writeToDb');

      const res = jsonDb.deleteRoom('room1');

      sinon.assert.calledOnce(writeSpy);
      sinon.assert.match(res, true);
    });

    it('deleteRoom() throws an error for a non-existent room', () => {
      const writeSpy = sandbox.spy(JsonDatabase.prototype, <any>'writeToDb');

      try {
        jsonDb.deleteRoom('fakeid1');
      } catch (err) {
        sinon.assert.match(err.message, NON_EXISTENT_ROOM_ERROR);
      }
    });

    it('joinRoom() successfully returns true for joining a room', () => {
      const writeSpy = sandbox.spy(JsonDatabase.prototype, <any>'writeToDb');

      const res = jsonDb.joinRoom('room1');

      sinon.assert.calledOnce(writeSpy);
      sinon.assert.match(res, true);
    });

    it('joinRoom() throws an error for a non-existent room', () => {
      try {
        jsonDb.joinRoom('fakeid1');
      } catch (err) {
        sinon.assert.match(err.message, NON_EXISTENT_ROOM_ERROR); 
      }
    });

    it('joinRoom() throws an error for a full room', () => {
      sandbox.stub(JsonDatabase.prototype, <any>'isRoomFull').returns(true);
      try {
        jsonDb.joinRoom('room1');
      } catch (err) {
        sinon.assert.match(err.message, FULL_ROOM_ERROR); 
      }
    });
  });

  describe('Game', () => {
    let jsonDb;
    let copyDb = JSON.parse(JSON.stringify(dummyDb));

    beforeEach( () => {
      sandbox.stub(JsonDatabase.prototype, <any>'initializeDb').returns(copyDb);
      sandbox.stub(JsonDatabase.prototype, <any>'newId').returns('123');
      jsonDb = new JsonDatabase();
    });

    afterEach( () => {
      copyDb = JSON.parse(JSON.stringify(dummyDb));
      sandbox.restore();
    });

    it('newGame() successfully creates a new game', () => {
      // TODO
    });

    it('activePlayer() successfully returns the current active player', () => {
      const id = jsonDb.activePlayer('room1');
      sinon.assert.match(id, 'player1');
    });

    it('activePlayer() throws an error for a non-existent room', () => {
      const id = jsonDb.activePlayer('room1');
      try {
        jsonDb.activePlayer('fakeid1');
      } catch(err) {
        sinon.assert.match(err.message, NON_EXISTENT_ROOM_ERROR);
      }
      sinon.assert.match(id, 'player1');
    });

    it('addPlayer() successfully adds a new player to the game', () => {
      const writeSpy = sandbox.spy(JsonDatabase.prototype, <any>'writeToDb');
      const res = jsonDb.addPlayer('room1');
      sinon.assert.calledOnce(writeSpy);
      sinon.assert.match(res, 123);
    });

    it('addPlayer() throws an error for a non-existent room', () => {
      try {
        jsonDb.addPlayer('fakeid1');
      } catch (err) {
        sinon.assert.match(err.message, NON_EXISTENT_ROOM_ERROR);
      }
    });

    it('addPlayer() throws an error for a full room', () => {
      sandbox.stub(JsonDatabase.prototype, <any>'isRoomFull').returns(true)
      try {
        jsonDb.addPlayer('room1');
      } catch (err) {
        sinon.assert.match(err.message, FULL_ROOM_ERROR);
      }
    });
  });

  describe('Player', () => {
    let jsonDb;
    let copyDb = JSON.parse(JSON.stringify(dummyDb));

    beforeEach( () => {
      sandbox.stub(JsonDatabase.prototype, <any>'initializeDb').returns(copyDb);
      jsonDb = new JsonDatabase();
    });

    afterEach( () => {
      copyDb = JSON.parse(JSON.stringify(dummyDb));
      sandbox.restore();
    });

    it('drawHead() successfully draws a tile from the head for the given player', () => {
      sandbox.stub(JsonDatabase.prototype, <any>'canDraw').returns(true);
      const writeSpy = sandbox.spy(JsonDatabase.prototype, <any>'writeToDb');
      const res = jsonDb.drawHead('room1', 'player1');
      sinon.assert.match(res, { 3: { 'locked': false, 'ownerId': "player1", 'revealed': false } });
      sinon.assert.calledOnce(writeSpy);
    });

    it('drawHead() throws an error for when the head index is past the tail index', () => {
      try {
        jsonDb.drawHead('room1', 'player1');
      } catch (err) {
        sinon.assert.match(err.message, HEAD_DRAW_ERROR);
      }
    });

    it('drawHead() throws an error for a non-existent player', () => {
      try {
        jsonDb.drawHead('room1', 'fakeid1');
      } catch (err) {
        sinon.assert.match(err.message, NON_EXISTENT_PLAYER_ERROR);
      }
    });

    it('drawHead() throws an error for a non-existent room', () => {
      try {
        jsonDb.drawHead('fakeid1', 'player1');
      } catch (err) {
        sinon.assert.match(err.message, NON_EXISTENT_ROOM_ERROR);
      }
    });

    it('drawHead() throws an error when there are no more tiles left to draw', () => {
      sandbox.stub(JsonDatabase.prototype, <any>'canDrawFromHead').returns(false);
      try {
        jsonDb.drawHead('room1', 'player1');
      } catch (err) {
        sinon.assert.match(err.message, HEAD_DRAW_ERROR);
      }
    });

    it('drawTail() successfully draws a tile from the tail for the given player', () => {
      sandbox.stub(JsonDatabase.prototype, <any>'canDraw').returns(true);
      const writeSpy = sandbox.spy(JsonDatabase.prototype, <any>'writeToDb');
      const res = jsonDb.drawTail('room1', 'player1');
      sinon.assert.match(res, { 3: { 'locked': false, 'ownerId': "player1", 'revealed': false } });
      sinon.assert.calledOnce(writeSpy);
    });

    it('drawTail() throws an error for when the head index is past the tail index', () => {
      try {
        jsonDb.drawTail('room1', 'player1');
      } catch (err) {
        sinon.assert.match(err.message, TAIL_DRAW_ERROR);
      }
    });

    it('drawTail() throws an error for a non-existent player', () => {
      try {
        jsonDb.drawTail('room1', 'fakeid1');
      } catch (err) {
        sinon.assert.match(err.message, NON_EXISTENT_PLAYER_ERROR);
      }
    });

    it('drawTail() throws an error for a non-existent room', () => {
      try {
        jsonDb.drawTail('room1', 'fakeid1');
      } catch (err) {
        sinon.assert.match(err.message, NON_EXISTENT_PLAYER_ERROR);
      }
    });

    it('drawTail() returns null when there are no more tiles left to draw', () => {
      sandbox.stub(JsonDatabase.prototype, <any>'canDrawFromTail').returns(false);
      try {
        jsonDb.drawHead('room1', 'fakeid1');
      } catch (err) {
        sinon.assert.match(err.message, NON_EXISTENT_PLAYER_ERROR);
      }
    });

    it('drawTileFromOtherPlayer() successfully draws a tile from the discard pile of another player', () => {
      const writeSpy = sandbox.spy(JsonDatabase.prototype, <any>'writeToDb');
      const removeSpy = sandbox.spy(JsonDatabase.prototype, <any>'removeDiscardedTileFromPlayer');
      const addSpy = sandbox.spy(JsonDatabase.prototype, <any>'addTileToPlayer');

      const res = jsonDb.drawTileFromOtherPlayer('room1', 2, 'player1', 'player2');

      sinon.assert.calledThrice(writeSpy);
      sinon.assert.match(removeSpy.returnValues[0][2]['ownerId'], null);
      sinon.assert.match(addSpy.returnValues[0][2]['ownerId'], 'player1');
      sinon.assert.match(res, true);
    });

    it('drawTileFromOtherPlayer() throws an error when there are no tiles to draw from another player', () => {
      sandbox.stub(JsonDatabase.prototype, <any>'canDrawPlayerDiscarded').returns(false);
      try {
        jsonDb.drawTileFromOtherPlayer('room1', 2, 'player1', 'player2');
      } catch(err) {
        sinon.assert.match(err.message, DISCARD_DRAW_ERROR);
      }
    });

    it('drawTileFromOtherPlayer() throws an error for a non-existent room', () => {
      try {
        jsonDb.drawTileFromOtherPlayer('fakeid1', 2, 'player1', 'player2');
      } catch(err) {
        sinon.assert.match(err.message, NON_EXISTENT_ROOM_ERROR);
      }
    });

    it('drawTileFromOtherPlayer() throws an error for a non-existent player', () => {
      try {
        jsonDb.drawTileFromOtherPlayer('room1', 2, 'fakeid1', 'player2');
      } catch(err) {
        sinon.assert.match(err.message, NON_EXISTENT_PLAYER_ERROR);
      }
    });

    it('drawTileFromOtherPlayer() throws an error for a non-existent other player', () => {
      try {
        jsonDb.drawTileFromOtherPlayer('room1', 2, 'player1', 'fakeid1');
      } catch(err) {
        sinon.assert.match(err.message, NON_EXISTENT_PLAYER_ERROR);
      }
    });

    it('discardTile() successfully discards the tile of the given player', () => {
      const writeSpy = sandbox.spy(JsonDatabase.prototype, <any>'writeToDb');

      const res = jsonDb.discardTile('room1', 1, 'player1');

      sinon.assert.calledOnce(writeSpy);
      sinon.assert.match(res, 1);
    });

    it('discardTile() throws an error for a non-existent room', () => {
      try {
        jsonDb.discardTile('fakeid1', 1, 'player1');
      } catch (err) {
        sinon.assert.match(err.message, NON_EXISTENT_ROOM_ERROR);
      }
    });

    it('discardTile() throws an error for a non-existent tile', () => {
      try {
        jsonDb.discardTile('room1', 'fakeid1', 'player1');
      } catch (err) {
        sinon.assert.match(err.message, NO_TILE_IN_HAND_ERROR);
      }
    });

    it('discardTile() throws an error for a non-existent player', () => {
      try {
        jsonDb.discardTile('room1', 1, 'fakeid1');
      } catch (err) {
        sinon.assert.match(err.message, NON_EXISTENT_PLAYER_ERROR);
      }
    });

    it('discardTile() throws for a tile that the player does not own', () => {
      try {
        jsonDb.discardTile('room1', 2, 'player1');
      } catch (err) {
        sinon.assert.match(err.message, NO_TILE_IN_HAND_ERROR);
      }
    });
  });

  describe('Tile', () => {
    let jsonDb;
    let copyDb = JSON.parse(JSON.stringify(dummyDb));

    beforeEach( () => {
      sandbox.stub(JsonDatabase.prototype, <any>'initializeDb').returns(copyDb);
      jsonDb = new JsonDatabase();
    });

    afterEach( () => {
      copyDb = JSON.parse(JSON.stringify(dummyDb));
      sandbox.restore();
    });

    it('revealTile() returns true on revealing a hidden tile', () => {
      const writeSpy = sandbox.spy(JsonDatabase.prototype, <any>'writeToDb');

      const res = jsonDb.revealTile('room1', 1, 'player1');
      sinon.assert.calledOnce(writeSpy);
      sinon.assert.match(res, true);
    });

    it('revealTile() throws an error for an already revealed tile', () => {
      try {
        jsonDb.revealTile('room1', 5, 'player1');
      } catch (err) {
        sinon.assert.match(err.message, REVEALED_ERROR);
      }
    });

    it ('revealTile() throws an error for a non-existent room', () => {
      try {
        jsonDb.revealTile('fakeid1', 5, 'player1');
      } catch (err) {
        sinon.assert.match(err.message, NON_EXISTENT_ROOM_ERROR);
      }
    });

    it ('revealTile() throws an error for a non-existent player', () => {
      try {
        jsonDb.revealTile('room1', 5, 'fakeid1');
      } catch (err) {
        sinon.assert.match(err.message, NON_EXISTENT_PLAYER_ERROR);
      }
    });

    it ('revealTile() throws an error for a non-existent tile', () => {
      try {
        jsonDb.revealTile('room1', 'fakeid1', 'player1');
      } catch (err) {
        sinon.assert.match(err.message, NO_TILE_IN_HAND_ERROR);
      }
    });

    it('hideTile() returns true on hiding a revealed tile', () => {
      const writeSpy = sandbox.spy(JsonDatabase.prototype, <any>'writeToDb');

      const res = jsonDb.hideTile('room1', 5, 'player1');
      sinon.assert.calledOnce(writeSpy);
      sinon.assert.match(res, true);
    });

    it('hideTile() throws an error for an already hidden tile', () => {
      try {
        jsonDb.hideTile('room1', 1, 'player1');
      } catch (err) {
        sinon.assert.match(err.message, HIDDEN_ERROR);
      }
    });

    it ('hideTile() throws an error for a non-existent room', () => {
      try {
        jsonDb.hideTile('fakeid1', 1, 'player1');
      } catch (err) {
        sinon.assert.match(err.message, NON_EXISTENT_ROOM_ERROR);
      }
    });

    it ('hideTile() throws an error for a non-existent player', () => {
      try {
        jsonDb.hideTile('room1', 1, 'fakeid1');
      } catch (err) {
        sinon.assert.match(err.message, NON_EXISTENT_PLAYER_ERROR);
      }
    });

    it ('hideTile() throws an error for a non-existent tile', () => {
      try {
        jsonDb.hideTile('room1', 'fakeid1', 'player1');
      } catch (err) {
        sinon.assert.match(err.message, NO_TILE_IN_HAND_ERROR);
      }
    });

    it('lockTile() returns true on locking an unlocked tile', () => {
      const writeSpy = sandbox.spy(JsonDatabase.prototype, <any>'writeToDb');

      const res = jsonDb.lockTile('room1', 1, 'player1');
      sinon.assert.calledOnce(writeSpy);
      sinon.assert.match(res, true);
    });

    it('lockTile() throws an error for an already locked tile', () => {
      try {
        jsonDb.lockTile('room1', 2, 'player2');
      } catch (err) {
        sinon.assert.match(err.message, LOCKED_ERROR);
      }
    });

    it ('lockTile() throws an error for a non-existent room', () => {
      try {
        jsonDb.lockTile('fakeid1', 2, 'player2');
      } catch (err) {
        sinon.assert.match(err.message, NON_EXISTENT_ROOM_ERROR);
      }
    });

    it ('lockTile() throws an error for a non-existent player', () => {
      try {
        jsonDb.lockTile('room1', 2, 'fakeid1');
      } catch (err) {
        sinon.assert.match(err.message, NON_EXISTENT_PLAYER_ERROR);
      }
    });

    it ('lockTile() throws an error for a non-existent tile', () => {
      try {
        jsonDb.lockTile('room1', 'fakeid1', 'player2');
      } catch (err) {
        sinon.assert.match(err.message, NO_TILE_IN_HAND_ERROR);
      }
    });

    it('unlockTile() returns true on unlocking a locked tile', () => {
      const writeSpy = sandbox.spy(JsonDatabase.prototype, <any>'writeToDb');

      const res = jsonDb.unlockTile('room1', 2, 'player2');
      sinon.assert.calledOnce(writeSpy);
      sinon.assert.match(res, true);
    });

    it('unlockTile() throws an error for an already unlocked tile', () => {
      try {
        jsonDb.lockTile('room1', 1, 'player1');
      } catch (err) {
        sinon.assert.match(err.message, UNLOCKED_ERROR);
      }
    });

    it ('unlockTile() throws an error for a non-existent room', () => {
      try {
        jsonDb.lockTile('fakeid1', 1, 'player1');
      } catch (err) {
        sinon.assert.match(err.message, NON_EXISTENT_ROOM_ERROR);
      }
    });

    it ('unlockTile() throws an error for a non-existent player', () => {
      try {
        jsonDb.lockTile('room1', 1, 'fakeid1');
      } catch (err) {
        sinon.assert.match(err.message, NON_EXISTENT_PLAYER_ERROR);
      }
    });

    it ('unlockTile() throws an error for a non-existent tile', () => {
      try {
        jsonDb.lockTile('room1', 'fakeid1', 'player1');
      } catch (err) {
        sinon.assert.match(err.message, NO_TILE_IN_HAND_ERROR);
      }
    });
  });
});