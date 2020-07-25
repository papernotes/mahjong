import React, { useEffect, useContext } from 'react';
import { useHistory } from 'react-router-dom';
import firebase from '../firebase';
import { PlayerContext } from '../context';

type PlayerMovesProps = {
  roomId: string;
}

function PlayerMoves({ roomId }: PlayerMovesProps) {
  const history = useHistory();
  const userId = useContext(PlayerContext)

  useEffect( () => {

  }, []);

  async function handleDrawTile() {
    const drawTile = firebase.functions().httpsCallable('drawTile');
    try {
      drawTile({userId: userId, roomId: roomId}).then( (data) => {
        console.log('Drawn tile: ', data['data']['tileId']);
      })
    } catch (err) {
      console.error(err);
    }
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
      <button onClick={handleDrawTile}>Draw Head</button>
      <button onClick={handleDrawTile}>Draw Tail</button>
      <button onClick={superDrawHead}>Super Draw Head - Draws 144 times</button>
    </div>
  );
}

export default PlayerMoves;