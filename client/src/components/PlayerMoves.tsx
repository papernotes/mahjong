import React, { useEffect } from 'react';
import { useHistory } from 'react-router-dom';

// TODO remove socket in favor of a socket hook
type PlayerMovesProps = {
  roomId: string;
  playerId: string;
  socket: any;
}

function PlayerMoves({ roomId, playerId, socket }: PlayerMovesProps) {
  const history = useHistory();

  useEffect( () => {
    socket.connect();

    socket.on('cannotDrawHead', () => console.log('Cannot draw head anymore'));
    socket.on('cannotDrawTail', () => console.log('Cannot draw tail anymore'));

    return () => {
      socket.removeAllListeners();
      socket.close();
    }
  }, [socket]);

  function drawHead() {
    socket.emit('drawHead', {'roomId': roomId, 'playerId': playerId});
  }

  function drawTail() {
    socket.emit('drawTail', {'roomId': roomId, 'playerId': playerId});
  }

  function superDrawHead() {
    for (let i = 0; i < 144; i ++) {
      socket.emit('drawHead', {'roomId': roomId, 'playerId': playerId});
    }
  }

  function goHome() {
    history.push('/');
  }
  return (
    <div>
      <button onClick={goHome}>Go Home</button>
      <button onClick={drawHead}>Draw Head</button>
      <button onClick={drawTail}>Draw Tail</button>
      <button onClick={superDrawHead}>Super Draw Head - Draws 144 times</button>
    </div>
  );
}

export default PlayerMoves;