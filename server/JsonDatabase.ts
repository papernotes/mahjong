import Database from './Database';
import { Tile, Player } from './Database';
import * as fs from 'fs';

class JsonDatabase implements Database {
  readonly localDir = './testdb/';
  readonly localJson = './testdb/db.json';
  readonly numTiles = 144;

  private db;

  readonly defaultTile = {
    'locked': false,
    'revealed': false,
    'ownerId': null
  }

  // TODO generate tiles and tile mapping from shuffle
  readonly newRoomValues = {
    'numGames': 0,
    'numPlayers': 0,
    'playerOrder': [],
    'playerIndex': 0,
    'headIndex': 0,
    'tailIndex': 0,
    'mapping': [],
    'players': {},
    'tiles': {}
  }
  readonly newPlayerValues = {
    'hand': [],
    'revealedTiles': [],
    'discardedTiles': [],
    'activeTile': null
  }

  constructor() {
    this.db = this.initializeDb();
  }

  private generateTileMapping() : object {
    let tileMapping = {}
    for (let i = 0; i < this.numTiles; i++) {
      tileMapping[i] = JSON.parse(JSON.stringify(this.defaultTile));
    }
    return tileMapping;
  }

  private populateRoomTiles(roomId: string) : boolean {
    const tiles = Array.apply(null, Array(this.numTiles)).map( (x, i) => {return i});
    this.db[roomId]['tiles'] = this.generateTileMapping();
    this.db[roomId]['mapping'] = this.shuffleTiles(tiles);
    return this.writeToDb();
  }  

  private initializeDb() {
    const initialDb = {}

    // Read JSON files since they're written here
    try {
      const content = fs.readFileSync(this.localJson, 'utf8');
      return JSON.parse(content);
    } catch (err) {
      try {
        // Write to file if they files don't exist
        // TODO fix -> if folder exists already
        if (!fs.existsSync(this.localDir) && !fs.existsSync(this.localJson)) {
          fs.mkdirSync(this.localDir);
          fs.writeFileSync(this.localJson, JSON.stringify(initialDb));
        }
        return initialDb;
      } catch (err) {
        throw new Error(err);
      }
    }
  }

  // ERRORS
  // TODO take in missing ID
  private throwNonExistentRoom() : Error {
    throw new Error('Room does not exist');
  }

  private throwFullRoom() : Error {
    throw new Error('Room is full');
  }

  private throwNonExistentPlayer() : Error {
    throw new Error('Player does not exist');
  }

  private throwHeadDraw() : Error {
    throw new Error('Cannot draw any more tiles from head');
  }

  private throwTailDraw() : Error {
    throw new Error('Cannot draw any more tiles from tail');
  }

  private throwNoDiscardedTiles() : Error {
    throw new Error('Cannot draw any discarded tiles from player');
  }

  private throwPlayerHasNoTile() : Error {
    throw new Error('Player does not have tile');
  }

  private throwTileRevealed() : Error {
    throw new Error('Tile already revealed');
  }

  private throwTileHidden() : Error {
    throw new Error('Tile already hidden');
  }

  private throwTileLocked() : Error {
    throw new Error('Tile already locked');
  }

  private throwTileUnlocked() : Error {
    throw new Error('Tile already unlocked');
  }

  // BOOLEAN
  private isTileLocked(roomId: string, tileId: number) : boolean {
    return this.getTile(roomId, tileId)[tileId]['locked'];
  }

  private isTileRevealed(roomId: string, tileId: number) : boolean {
    return this.getTile(roomId, tileId)[tileId]['revealed'];
  }

  private roomExists(roomId: string) : boolean {
    return this.db[roomId] !== undefined;
  }

  private isRoomFull(roomId: string) : boolean {
    if (!this.roomExists(roomId)) {
      this.throwNonExistentRoom();
    }
    if (this.db[roomId]['numPlayers'] > 4) {
      this.throwFullRoom();
    }
    return false;
  }

  private isTileDiscarded(roomId: string, tileId: number) : boolean {
    return this.getAllDiscardedTileIds(roomId).includes(tileId);
  }

  private playerExists(roomId: string, playerId: string) : boolean {
    return this.db[roomId]['players'][playerId] !== undefined;
  }

  private playerHasTile(roomId: string, playerId: string, tileId: number) : boolean {
    const handIncludes = this.db[roomId]['players'][playerId]['hand'].includes(tileId);
    const revealedIncludes = this.db[roomId]['players'][playerId]['revealedTiles'].includes(tileId);
    const discardedTiles = this.db[roomId]['players'][playerId]['discardedTiles'].includes(tileId);
    return handIncludes || revealedIncludes || discardedTiles;
  }

  // TODO player hand limit?
  private canDrawFromHead(roomId: string) : boolean {
    return this.db[roomId]['headIndex'] < this.db[roomId]['mapping'].length;
  }

  private canDrawFromTail(roomId: string) : boolean {
    const index = this.db[roomId]['mapping'].length - this.db[roomId]['tailIndex'] - 1;
    return index < this.db[roomId]['mapping'].length;
  }

  private canDraw(roomId: string): boolean {
    const headIndex = this.db[roomId]['headIndex'];
    const actualTailIndex = this.db[roomId]['mapping'].length - this.db[roomId]['tailIndex'] - 1;
    return headIndex < actualTailIndex;
  }

  private canDrawPlayerDiscarded(roomId: string, playerId: string) : boolean {
    return this.db[roomId]['players'][playerId]['discardedTiles'].length > 0;
  }

  // UTILS
  private writeToDb(): boolean {
    try {
      fs.writeFileSync(this.localJson, JSON.stringify(this.db));
      return true;
    } catch (err) {
      throw new Error();
    }
  }

  // TODO uuid?
  private newId() : string {
    return Math.random().toString();
  }

  private shuffleTiles(tiles: number[]) : number[] {
    for (let i = tiles.length - 1; i >= 0; i -= 1) {
      const j = Math.floor(Math.random() * i);
      [tiles[i], tiles[j]] = [tiles[j], tiles[i]]
    }
    return tiles;
  }

  private getTile(roomId: string, tileId: number) : Tile | null {
    return { [tileId]: this.db[roomId]['tiles'][tileId] };
  }

  private getAllDiscardedTileIds(roomId: string) : number[] {
    const players = this.db[roomId]['players'];
    let discardedTiles = [];
    for (const [playerId, values] of Object.entries(players)) {
      discardedTiles = discardedTiles.concat(values['discardedTiles']);
    }
    return discardedTiles;
  }

  private addTileToPlayer(roomId: string, playerId: string, tileId: number) : Tile {
    const tile = this.getTile(roomId, tileId);
    this.db[roomId]['players'][playerId]['hand'] = this.db[roomId]['players'][playerId]['hand'].concat(tileId);
    this.db[roomId]['tiles'][tileId]['ownerId'] = playerId;
    const returnTile = JSON.parse(JSON.stringify({[tileId]: this.db[roomId]['tiles'][tileId]}));
    this.writeToDb();
    return returnTile;
  }

  private removeDiscardedTileFromPlayer(roomId: string, playerId: string, tileId: number) : Tile {
    const tile = this.getTile(roomId, tileId);
    const discardedTiles = this.db[roomId]['players'][playerId]['discardedTiles'];
    this.db[roomId]['players'][playerId]['discardedTiles'] = discardedTiles.filter( val => val != tileId);
    this.db[roomId]['tiles'][tileId]['ownerId'] = null;
    const returnTile = JSON.parse(JSON.stringify({[tileId]: this.db[roomId]['tiles'][tileId]}));
    this.writeToDb();
    return returnTile;
  }

  // Room
  // TODO add player automatically?
  newRoom() : string {
    const newRoomId = this.newId();
    this.db[newRoomId] = JSON.parse(JSON.stringify(this.newRoomValues));
    this.populateRoomTiles(newRoomId);
    this.writeToDb();
    return newRoomId;
  }

  deleteRoom(roomId: string) : boolean {
    if (!this.roomExists(roomId)) {
      this.throwNonExistentRoom();
    }
    delete this.db[roomId];
    return this.writeToDb();
  }

  joinRoom(roomId: string) : boolean {
    if (!this.roomExists(roomId)) {
      this.throwNonExistentRoom();
    }
    if (this.isRoomFull(roomId)) {
      this.throwFullRoom();
    }
    this.db[roomId]['numPlayers'] += 1;
    this.db[roomId]['players'][this.newId()] = JSON.parse(JSON.stringify(this.newPlayerValues));
    return this.writeToDb();
  }

  // GAME (in Room)
  newGame(roomId: string) : boolean {
    // TODO
    return true;
  }

  activePlayer(roomId: string) : string {
    if (!this.roomExists(roomId)) {
      this.throwNonExistentRoom();
    }
    const index = this.db[roomId]['playerIndex'];
    const order = this.db[roomId]['playerOrder'];
    return order[index];
  }

  addPlayer(roomId: string) : string {
    if (!this.roomExists(roomId)) {
      this.throwNonExistentRoom();
    }
    const newPlayerId = this.newId();
    this.db[roomId]['players'][newPlayerId] = JSON.parse(JSON.stringify(this.newPlayerValues));
    this.db[roomId]['playerOrder'] = this.db[roomId]['playerOrder'].concat(newPlayerId);
    this.db[roomId]['numPlayers'] += 1;
    this.writeToDb();
    return newPlayerId;
  }


  // PLAYER
  // Drawing action, to a player
  drawHead(roomId: string, playerId: string) : Tile {
    if (!this.roomExists(roomId)) {
      this.throwNonExistentRoom();
    }
    if (!this.playerExists(roomId, playerId)) {
      this.throwNonExistentPlayer();
    }
    if (!this.canDrawFromHead(roomId) || !this.canDraw(roomId)) {
      this.throwHeadDraw();
    }

    const index = this.db[roomId]['headIndex']
    const tileId = this.db[roomId]['mapping'][index];
    this.db[roomId]['headIndex'] += 1

    return this.addTileToPlayer(roomId, playerId, tileId);
  }

  drawTail(roomId: string, playerId: string) : Tile {
    if (!this.roomExists(roomId)) {
      this.throwNonExistentRoom();
    }
    if (!this.playerExists(roomId, playerId)) {
      this.throwNonExistentPlayer();
    }
    if (!this.canDrawFromTail(roomId) || !this.canDraw(roomId)) {
      this.throwTailDraw();
    }

    const index = this.db[roomId]['mapping'].length - this.db[roomId]['tailIndex'] - 1;
    const tileId = this.db[roomId]['mapping'][index];
    this.db[roomId]['tailIndex'] += 1

    return this.addTileToPlayer(roomId, playerId, tileId);
  }

  drawTileFromOtherPlayer(roomId: string, tileId: number, playerId: string, otherPlayerId: string) : boolean {
    if (!this.roomExists(roomId)) {
      this.throwNonExistentRoom();
    }
    if (!this.playerExists(roomId, playerId) || !this.playerExists(roomId, otherPlayerId)) {
      this.throwNonExistentPlayer();
    }
    if (!this.canDrawPlayerDiscarded(roomId, otherPlayerId)) {
      this.throwNoDiscardedTiles();
    }
    if (!this.isTileDiscarded(roomId, tileId)) {
      return false;
    }

    this.removeDiscardedTileFromPlayer(roomId, otherPlayerId, tileId);
    this.addTileToPlayer(roomId, playerId, tileId);

    return this.writeToDb();
  }

  discardTile(roomId: string, tileId: number, playerId: string) : boolean {
    if (!this.roomExists(roomId)) {
      this.throwNonExistentRoom();
    }
    if (!this.playerExists(roomId, playerId)) {
      this.throwNonExistentPlayer();
    }
    if (!this.playerHasTile(roomId, playerId, tileId)) {
      this.throwPlayerHasNoTile();
    }

    // Move tile from hand to discard
    const discardedTiles = this.db[roomId]['players'][playerId]['discardedTiles'];
    const handTiles = this.db[roomId]['players'][playerId]['hand'];

    this.db[roomId]['players'][playerId]['hand'] = handTiles.filter( val => val != tileId);
    this.db[roomId]['players'][playerId]['discardedTiles'] = discardedTiles.concat(tileId);
    return this.writeToDb();
  }

  // TILE
  revealTile(roomId: string, tileId: number, playerId: string) : boolean {
    if (!this.roomExists(roomId)) {
      this.throwNonExistentRoom();
    }
    if (!this.playerExists(roomId, playerId)) {
      this.throwNonExistentPlayer();
    }
    if (!this.playerHasTile(roomId, playerId, tileId)) {
      this.throwPlayerHasNoTile();
    }
    if (this.isTileRevealed(roomId, tileId)) {
      this.throwTileRevealed();
    }

    const tile = this.getTile(roomId, tileId)[tileId];
    const revealedTiles = this.db[roomId]['players'][playerId]['revealedTiles'];
    const handTiles = this.db[roomId]['players'][playerId]['hand'];

    tile['revealed'] = true;

    this.db[roomId]['players'][playerId]['hand'] = handTiles.filter( val => val != tileId);
    this.db[roomId]['players'][playerId]['revealedTiles'] = revealedTiles.concat(tileId);
    return this.writeToDb();
  }

  hideTile(roomId: string, tileId: number, playerId: string) : boolean {
    if (!this.roomExists(roomId)) {
      this.throwNonExistentRoom();
    }
    if (!this.playerExists(roomId, playerId)) {
      this.throwNonExistentPlayer();
    }
    if (!this.playerHasTile(roomId, playerId, tileId)) {
      this.throwPlayerHasNoTile();
    }
    if (!this.isTileRevealed(roomId, tileId)) {
      this.throwTileHidden();
    }

    const tile = this.getTile(roomId, tileId)[tileId];
    const revealedTiles = this.db[roomId]['players'][playerId]['revealedTiles'];
    const handTiles = this.db[roomId]['players'][playerId]['hand'];

    tile['revealed'] = false;

    this.db[roomId]['players'][playerId]['hand'] = handTiles.concat(tileId);
    this.db[roomId]['players'][playerId]['revealedTiles'] = revealedTiles.filter( val => val != tileId);
    return this.writeToDb();
  }

  lockTile(roomId: string, tileId: number, playerId: string) : boolean {
    if (!this.roomExists(roomId)) {
      this.throwNonExistentRoom();
    }
    if (!this.playerExists(roomId, playerId)) {
      this.throwNonExistentPlayer();
    }
    if (!this.playerHasTile(roomId, playerId, tileId)) {
      this.throwPlayerHasNoTile();
    }
    if (this.isTileLocked(roomId, tileId)) {
      this.throwTileLocked();
    }
    const tile = this.getTile(roomId, tileId)[tileId];
    tile['locked'] = true;
    return this.writeToDb();
  }

  unlockTile(roomId: string, tileId: number, playerId: string) : boolean {
    if (!this.roomExists(roomId)) {
      this.throwNonExistentRoom();
    }
    if (!this.playerExists(roomId, playerId)) {
      this.throwNonExistentPlayer();
    }
    if (!this.playerHasTile(roomId, playerId, tileId)) {
      this.throwPlayerHasNoTile();
    }
    if (!this.isTileLocked(roomId, tileId)) {
      this.throwTileUnlocked();
    }
    const tile = this.getTile(roomId, tileId)[tileId];
    tile['locked'] = false;
    return this.writeToDb();
  }
}

export default JsonDatabase;