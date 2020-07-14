import React, { useEffect, useState } from 'react';
import { RouteComponentProps, useHistory } from 'react-router-dom';
import io from 'socket.io-client';

type MatchParams = {
  roomId: string,
  playerId: string
}

const socket = io('http://localhost:3001/');

function GamePage({match} : RouteComponentProps<MatchParams>) {
  const playerId = match.params.playerId;
  const roomId = match.params.roomId;
  const [tiles, setTiles] = useState<number[]>([]);
  const history = useHistory();

  useEffect( () => {
    let unmounted = false;

    socket.connect();

    socket.on('cannotDrawHead', () => console.log('Cannot draw head anymore'));
    socket.on('cannotDrawTail', () => console.log('Cannot draw tail anymore'));
    socket.on('drewTile', (tileId: number) => {
      if (!unmounted) {
        setTiles(tiles => [...tiles, tileId]);
      }
    });

    return () => {
      unmounted = true;
      socket.removeAllListeners();
      socket.close();
    }
  }, []);

  function drawHead() {
    socket.emit('drawHead', {'roomId': roomId, 'playerId': playerId});
  }

  function drawTail() {
    socket.emit('drawTail', {'roomId': roomId, 'playerId': playerId});
  }

  function superDrawHead() {
    for (let i = 0; i < 143; i ++) {
      socket.emit('drawHead', {'roomId': roomId, 'playerId': playerId});
    }
  }

  function goHome() {
    history.push('/');
  }

  function generateTiles() {
    const listItems = tiles.map( tileId => <li key={tileId}>Tile: {tileId}</li>)
    return listItems;
  }

  return (
    <div>
      <div>Game Page - {match.params.roomId} </div>
      <div>{generateTiles()}</div>
      <button onClick={goHome}>Go Home</button>
      <button onClick={drawHead}>Draw Head</button>
      <button onClick={drawTail}>Draw Tail</button>
      <button onClick={superDrawHead}>Super Draw Head - Draws 144 times</button>
    </div>
  );
}

export default GamePage;