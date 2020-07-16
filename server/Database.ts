export type Tile = {
  [id: number]: {
    locked: boolean,
    ownerId: null | string,
    revealed: boolean,
  }
}

export type Player = {
  [id: string]: {
    hand: number[],
    revealedTiles: number[],
    activeTile: null | Tile
  }
}

interface Database {
  // Room
  newRoom() : string;
  deleteRoom(roomId: string) : boolean;

  // TODO Maybe don't need?
  joinRoom(roomId: string) : boolean;

  // Game itself (In Room)
  newGame(roomId: string) : boolean;
  activePlayer(roomId: string) : string;
  addPlayer(roomId: string) : string;

  // Drawing action, to a player
  drawHead(roomId: string, playerId: string) : Tile;
  drawTail(roomId: string, playerId: string) : Tile;

  // Checks to see if the tile is discarded
  // Checks to see if tile's owner is not given playerId
  drawTileFromOtherPlayer(roomId: string, tileId: number, playerId: string, otherPlayerId: string) : boolean;
  discardTile(roomId: string, tileId: number, playerId: string) : number;

  // Tile
  revealTile(roomId: string, tileId: number, playerId: string) : boolean;
  hideTile(roomId: string, tileId: number, playerId: string) : boolean;
  lockTile(roomId: string, tileId: number, playerId: string) : boolean;
  unlockTile(roomId: string, tileId: number, playerId: string) : boolean;
}

export default Database;
