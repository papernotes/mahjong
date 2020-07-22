import React, { useEffect } from 'react';
import { useHistory } from 'react-router-dom';

// TODO remove socket in favor of a socket hook
type PlayerMovesProps = {
  roomId: string;
  userId: string;
}

function PlayerMoves({ roomId, userId }: PlayerMovesProps) {
  const history = useHistory();

  useEffect( () => {
    console.log("TODO")
  }, []);

  function drawHead() {
    // socket.emit('drawHead', {'roomId': roomId, 'userId': userId});
  }

  function drawTail() {
    // socket.emit('drawTail', {'roomId': roomId, 'userId': userId});
  }

  function superDrawHead() {
    for (let i = 0; i < 144; i ++) {
      // socket.emit('drawHead', {'roomId': roomId, 'userId': userId});
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