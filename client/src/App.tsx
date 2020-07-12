import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';


const socket = io('http://localhost:3001/');

function App() {
  const [playerId, setPlayerId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [tiles, setTiles] = useState<number[]>([]);

  useEffect( () => {
    socket.on('drewTile', (tileId: number) => {
      setTiles(tiles => [...tiles, tileId]);
    })
    socket.on('cannotDrawHead', () => console.log('Cannot draw head anymore'));
    socket.on('cannotDrawTail', () => console.log('Cannot draw tail anymore'));
    socket.on('createdNewRoom', (data: any) => {
      setPlayerId(data['playerId']);
      setRoomId(data['roomId']);
    }) //eslint-disable-next-line
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

  function newRoom() {
    socket.emit('newRoom', () => {});
  }

  function generateTiles() {
    const listItems = tiles.map( tileId => <li key={tileId}>Tile: {tileId}</li>)
    return listItems;
  }

  return (
    <div>
      <div>{generateTiles()}</div>
      <button onClick={drawHead}>Draw Head</button>
      <button onClick={drawTail}>Draw Tail</button>
      <button onClick={newRoom}>New Room</button>
      <button onClick={superDrawHead}>Super Draw Head - Draws 144 times</button>
    </div>
  );
}

export default App;
