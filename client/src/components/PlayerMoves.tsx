import React, { useEffect, useContext } from 'react';
import { useHistory } from 'react-router-dom';
import firebase from '../firebase';
import { UserContext } from '../context';

type PlayerMovesProps = {
  roomId: string;
}

function PlayerMoves({ roomId }: PlayerMovesProps) {
  const history = useHistory();
  const userId = useContext(UserContext).userId

  useEffect( () => {

  }, []);

  async function handleDrawTile() {
    const drawTile = firebase.functions().httpsCallable('drawTile');
    try {
      drawTile({userId: userId, roomId: roomId})
        .then( (data) => {
          console.log('Drew tile: ', data['data']['tileId']);
        })
        .catch(e => {
          console.log(e);
        })
    } catch (err) {
      console.error("error", err);
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
    </div>
  );
}

export default PlayerMoves;