import React, { useEffect, useContext } from 'react';
import { useHistory } from 'react-router-dom';
import firebase from '../firebase';
import { UserContext } from '../context';

type PlayerMovesProps = {
  roomId: string;
}

function PlayerMoves({ roomId }: PlayerMovesProps) {
  const history = useHistory();
  const userId = useContext(UserContext)

  useEffect( () => {

  }, []);

  async function handleDrawTile() {
    const drawTile = firebase.functions().httpsCallable('drawTile');
    try {
      drawTile({userId: userId, roomId: roomId})
        .then( (data) => {
          console.log('Drawn tile: ', data['data']['tileId']);
        })
        .catch(e => {
          console.log(e);
        })
    } catch (err) {
      console.error("error", err);
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