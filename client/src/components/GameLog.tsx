import React, { useEffect, useState } from 'react';
import { Theme, makeStyles, withStyles } from '@material-ui/core/styles';

import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import TileUnicode from '../utils/TileUnicode';
import TileUtils from '../utils/TileUtils';
import Tooltip from '@material-ui/core/Tooltip';
import { db } from '../firebase';

type GameLogProps = {
  roomId: string;
}
const useStyles = makeStyles((theme) => ({
  root: {
    backgroundColor: theme.palette.background.paper,
    position: 'relative',
    overflow: 'auto',
    height: 185,
    fontSize: 20
  }
}));

const TileTooltip = withStyles((theme: Theme) => ({
  tooltip: {
    backgroundColor: 'green',
    maxWidth: 500,
    fontSize: 100
  }
}))(Tooltip);

function GameLog({roomId} : GameLogProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const classes = useStyles();

  function getUnicodeString(id : number) {
    if (id === -1) return TileUnicode.getBackTile();
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
          setLogs(prevLogs => {
            if (prevLogs.length === 0) return [];
            return [`${lastAction}/${lastTile}`].concat(prevLogs);
          });
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
            return (
            <ListItem key={index} button>
              <TileTooltip title={getUnicodeString(parseInt(tileId))} placement='right'>
                <div>
                  {msg} {getUnicodeString(parseInt(tileId))}
                </div>
              </TileTooltip>
             </ListItem>
            );
          })}
        </List>
      </div>
  );
}

export default GameLog;