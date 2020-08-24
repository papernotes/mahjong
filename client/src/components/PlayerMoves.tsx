import React, { useContext } from 'react';
import { Theme, createStyles, makeStyles } from '@material-ui/core/styles';

import Button from '@material-ui/core/Button';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import { UserContext } from '../context';
import firebase from '../firebase';

type PlayerMovesProps = {
  roomId: string;
  username: string;
}

const useStyles = makeStyles((theme : Theme) =>
  createStyles({
    root: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }
  })
);

function PlayerMoves({ roomId, username }: PlayerMovesProps) {
  const userId = useContext(UserContext).userId;
  const classes = useStyles();

  async function emitLog(message : string, tileId: number) {
    const drawTile = firebase.functions().httpsCallable('logLastAction');
    try {
      drawTile({message: message, roomId: roomId, tileId: tileId})
        .catch(e => {
          console.error(e);
        })
    } catch(err) {
      console.error("error", err);
    }
  }

  async function handleDrawTile() {
    const drawTile = firebase.functions().httpsCallable('drawTile');
    try {
      drawTile({userId: userId, roomId: roomId})
        .then((data) => {
          void emitLog(`${username} drew a tile`, -1)
          // console.log('Drew tile: ', data['data']['tileId']);
        })
        .catch(e => {
          console.error(e);
        })
    } catch (err) {
      console.error("error", err);
    }
  }

  return (
    <div className={classes.root}>
      <ButtonGroup size='large'>
        <Button onClick={handleDrawTile}>Draw Head</Button>
        <Button onClick={handleDrawTile}>Draw Tail</Button>
      </ButtonGroup>
    </div>
  );
}

export default PlayerMoves;