import React, { useState, useEffect } from 'react';
import TileUtils from '../utils/TileUtils';
import TileUnicode from '../utils/TileUnicode';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import { makeStyles } from '@material-ui/core/styles';
import { db } from '../firebase';

type GameLogProps = {
  roomId: string;
}
const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: theme.palette.background.paper,
    position: 'relative',
    overflow: 'auto',
    height: 200,
    fontSize: 20
  }
}));

function GameLog({roomId} : GameLogProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const classes = useStyles();

  function getUnicodeString(id : number) {
    if (id === -1) { return }
    let count;
    let type;
    [count, type] = TileUtils.getTileName(id).split('/');
    return TileUnicode.getUnicodeString(parseInt(count), type);
  }
  
  useEffect( () => {
    let logUnsub : Function;
    const logRef = db.collection('rooms').doc(roomId);
    logUnsub = logRef.onSnapshot(function(doc) {
      const data = doc.data();
      if (data) {
        const lastAction = data.lastAction;
        const lastTile = data.lastActionTileId;
        if (logs.length === 0 && lastTile === 0) {
          setLogs([]);
        } else {
          setLogs(prevLogs => [`${lastAction}/${lastTile}`].concat(prevLogs));
        }
      }
    });

    return () => {
      logUnsub && logUnsub();
    }
  // eslint-disable-next-line
  }, []);

  return (
      <div>
        <List className={classes.root}>
          {logs.map( (message, index) => {
            const data = message.split('/');
            const msg = data[0];
            const tileId = data[1];
            return <ListItem>{msg} {getUnicodeString(parseInt(tileId))}</ListItem>;
          })}
        </List>
      </div>
  );
}

export default GameLog;