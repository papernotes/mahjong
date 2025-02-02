import React, { useContext, useEffect, useState } from 'react';
import { RouteComponentProps, useHistory } from 'react-router-dom';
import { Theme, createStyles, makeStyles } from '@material-ui/core/styles';
import firebase, { db } from '../firebase';

import AppToolbar from '../components/AppToolbar';
import Button from '@material-ui/core/Button';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import Dialog from '@material-ui/core/Dialog';
import DialogContentText from '@material-ui/core/DialogContentText';
import DiscardArea from '../components/DiscardArea';
import { DragDropContext } from 'react-beautiful-dnd';
import GameLog from '../components/GameLog';
import Grid from '@material-ui/core/Grid';
import HandArea from '../components/HandArea';
import Paper from '@material-ui/core/Paper';
import PlayerMoves from '../components/PlayerMoves';
import RevealedArea from '../components/RevealedArea';
import { UserContext } from '../context';

type MatchParams = {
  roomId: string;
}

type SharedTileMapping = {
  [uid : string] : number[];
}

type UsernameMapping = {
  [uid: string] : string;
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

function GamePage({match} : RouteComponentProps<MatchParams>) {
  const history = useHistory();
  const userId = useContext(UserContext).userId;
  const roomId = match.params.roomId;
  const classes = useStyles();

  const [tiles, setTiles] = useState<number[]>([]);
  const [uids, setUids] = useState<string[]>([]);

  const [discardMap, setDiscardMap] = useState<SharedTileMapping>({});
  const [revealedMap, setRevealedMap] = useState<SharedTileMapping>({});
  const [usernameMap, setUsernameMap] = useState<UsernameMapping>({});
  const [createdMap, setCreatedMap] = useState<boolean>(false);
  const [tilesLeft, setTilesLeft] = useState<number>(-1);
  const [open, setOpen] = useState(false);

  function updateSharedTileMap(uid : string, newTiles : number[], category : string) {
    if (category === 'discarded') {
      setDiscardMap(prevMap => ({
        ...prevMap,
        [uid]: newTiles
      }));
    } else {
      setRevealedMap(prevMap => ({
        ...prevMap,
        [uid]: newTiles
      }))
    }
  }

  function createSharedTileListener(uid : string, sharedMap : SharedTileMapping, category : string) {
    const ref = db.collection(`rooms/${roomId}/${category}`).doc(uid);
    const sharedUnsub = ref.onSnapshot((doc) => {
      const data = doc.data();
      if (data) {
        const hand = data.tiles;

        if (sharedMap[uid]) {
          if (sharedMap[uid].length === 0) {
            updateSharedTileMap(uid, hand, category);
          } else {
            const newTile = hand.pop();
            const newHand = sharedMap[uid].concat(newTile);
            updateSharedTileMap(uid, newHand, category);
          }
        }
      }
    });

    return sharedUnsub;
  }

  function setSharedTileAreaListeners(otherUids : string[]) {
    const unsubs : Function[] = [];

    otherUids.forEach(uid => {
      unsubs.push(createSharedTileListener(uid, discardMap, 'discarded'));
      unsubs.push(createSharedTileListener(uid, discardMap, 'revealed'));
      unsubs.push(createUsernameListener(uid));
    });
    return unsubs;
  }

  function createUsernameListener(uid : string) {
    const usernameRef = db.collection('users').doc(uid);
    const usernameUnsub = usernameRef.onSnapshot(function(doc) {
      const data = doc.data();
      if (data) {
        const newUsername = data.username;
        setUsernameMap(prevMap => ({
          ...prevMap,
          [uid]: newUsername
        }));
      }
    });
    return usernameUnsub;
  }

  function createSharedTileMap(otherUids : string[]) {
    const newMap : SharedTileMapping = {};
    otherUids.forEach(uid => {
      newMap[uid] = [];
    })
    return newMap;
  }

  function spliceUpdate(primary : number[], secondary : number[], sourceIndex : number,
                        destIndex : number, draggableId : string) {
      primary.splice(sourceIndex, 1);
      secondary.splice(destIndex, 0, parseInt(draggableId));
  }

  function newArrayFromSharedTileMap(category : string, uid : string) {
    switch (category) {
      case 'discarded':
        return Array.from(discardMap[uid]);
      case 'revealed':
        return Array.from(revealedMap[uid]);
      default:
        return []
    }
  }

  // TODO make transaction?
  function updateFirestore(newTiles : number[], category : string, otherUserId : string) {
    const handRef = db.collection(`rooms/${roomId}/${category}/`).doc(otherUserId)
    return handRef.update({
      tiles: newTiles
    })
    .catch(function(error) {
      console.error(error);
      throw new Error('Could not update hand');
    })
  }

  // Update Hand <-> (Discard/Revealed)
  function sharedWithHandDragUpdate(primary : number[], secondary: number[], destUserId : string, category : string) {
    void updateFirestore(primary, 'hand', userId);
    void updateFirestore(secondary, category, destUserId);
    setTiles(primary);
    updateSharedTileMap(destUserId, secondary, category);
  }

  function createUsernameMap(otherUids : string[]) {
    const newMap : UsernameMapping = {};
    for (const uid of otherUids) {
      newMap[uid] = ''
    }
    return newMap
  }

  async function emitLog(message : string, tileId: number) {
    const drawTile = firebase.functions().httpsCallable('logLastAction');
    try {
      drawTile({message: message, roomId: roomId, tileId: tileId})
        .catch(e => {
          console.error(e);
        })
    } catch (err) {
      console.error("error", err);
    }
  }

  useEffect(() => {
    let handUnsub : Function;
    let countUnsub : Function;

    if (userId && roomId) {
      const userIdRef = db.collection('rooms').doc(roomId);
      userIdRef.get()
        .then((doc) => {
          const data = doc.data();
          if (data) {
            const dataUids = data.userIds;
            if (dataUids.length !== 4) history.push(`/game/${roomId}/lobby`)
            setUids(dataUids);
            setUsernameMap(createUsernameMap(dataUids));
            setDiscardMap(createSharedTileMap(dataUids));
            setRevealedMap(createSharedTileMap(dataUids));
            setCreatedMap(true);
          } else {
            console.error("No room found");
            history.push('/');
          }
        })
        .catch((err) => {
          console.error(err);
        });

      const handRef = db.collection(`rooms/${roomId}/hand`).doc(userId);
      const countRef = db.collection(`mappings/${roomId}/tilesLeft`).doc('count');
      handUnsub = handRef.onSnapshot(function(doc) {
        const data = doc.data();
        if (data) {
          const hand = data.tiles;
          if (tiles.length === 0) {
            setTiles(hand);
          } else {
            const newTile = hand.pop();
            setTiles(prevTiles => [...prevTiles, newTile]);
          }
        }
      });

      countUnsub = countRef.onSnapshot(function(doc) {
        const data = doc.data();
        if (data) {
          setTilesLeft(data.count);
        }
      });
    }

    return () => {
      handUnsub && handUnsub();
      countUnsub && countUnsub();
    }
  // eslint-disable-next-line
  }, [userId, roomId]);

  useEffect(() => {
    let unsubs : Function[];
    if (createdMap) {
      unsubs = setSharedTileAreaListeners(uids);
    }
    return () => {
      unsubs && unsubs.forEach(func => func());
    }
  // eslint-disable-next-line
  }, [createdMap])

  function onDragEnd(result: any) {
    const { destination, source, draggableId } = result;
    if (!destination) { return }
    if (destination.droppableId === source.draggableId &&
        destination.index === source.index) { return }

    const start = source.droppableId;
    const finish = destination.droppableId;

    const startCategory = start.split('/')[0];
    const endCategory = finish.split('/')[0];

    // Reordering within the same area
    if (start === finish) {
      let newTiles : number[];
      const inHand = startCategory === 'hand';
      const startUserId = start.split('/')[1];

      // Do not allow users reorder if it's not their own revealed area
      if (startCategory === 'revealed' && startUserId !== userId) return;

      if (inHand) {
        newTiles = Array.from(tiles);
      } else {
        newTiles = newArrayFromSharedTileMap(startCategory, startUserId);
      }

      spliceUpdate(newTiles, newTiles, source.index, destination.index, draggableId);

      if (inHand) {
        setTiles(newTiles);
      } else {
        updateSharedTileMap(startUserId, newTiles, startCategory);
      }
      void updateFirestore(newTiles, startCategory, startUserId);
    }
    // Dragging from one area to another
    else {
      let primary : number[];
      let secondary : number[];

      // Hand <-> Discard, Hand <-> Revealed
      if (startCategory === 'hand' || endCategory === 'hand') {
        const destUserId = destination.droppableId.split('/')[1]

        // Hand -> Discard, Hand -> Revealed
        if (startCategory === 'hand') {
          if (endCategory === 'revealed' && destUserId !== userId) return;

          primary = Array.from(tiles);
          secondary = newArrayFromSharedTileMap(endCategory, destUserId);

          spliceUpdate(primary, secondary, source.index, destination.index, draggableId);
          sharedWithHandDragUpdate(primary, secondary, destUserId, endCategory);

          void emitLog(`${usernameMap[userId]}
            ${endCategory === 'revealed' ? 'revealed' : 'discarded'}`, parseInt(draggableId)
          );
        }
        // Moving Discard -> Hand or Revealed -> Hand
        else {
          const sourceUserId = source.droppableId.split('/')[1];
          if (startCategory === 'revealed' && sourceUserId !== userId) return;

          primary = newArrayFromSharedTileMap(startCategory, sourceUserId);
          secondary = Array.from(tiles);

          spliceUpdate(primary, secondary, source.index, destination.index, draggableId);
          sharedWithHandDragUpdate(secondary, primary, sourceUserId, startCategory);

          const message = startCategory === 'discarded' ?
            `${usernameMap[sourceUserId]}` :
            'their revealed';

          void emitLog(`${usernameMap[userId]} took from ${message}`, draggableId);
        }
      }
    }
  }

  function revealHand() {
    const newTiles = revealedMap[userId].concat(JSON.parse(JSON.stringify(tiles)));
    updateSharedTileMap(userId, newTiles, 'revealed');
    setTiles([]);
    void updateFirestore([], 'hand', userId);
    void updateFirestore(newTiles, 'revealed', userId);
    setOpen(false);
    void emitLog(`${usernameMap[userId]} revealed their hand!`, -1)
  }

  function createCurrentUserArea() {
    return (
      <div>
        <Button color='secondary' onClick={() => setOpen(true)}>Reveal hand</Button>
        <DiscardArea key={4} tiles={discardMap[userId] || []} roomId={roomId} userId={userId}/>
        <HandArea tiles={tiles} userId={userId}/>
      </div>
    );
  }

  function generateOtherUserArea(index : number) {
    if (uids.length !== 4) return <div>Not enough users</div>;

    const otherUids = JSON.parse(JSON.stringify(uids));
    let point = otherUids.indexOf(userId);
    let firstHalf : string[] = [];
    let end : string[];

    // splice point
    point = point === 0 ? 1 : point;

    // Sorted in order already
    if (point !== 3) {
      firstHalf = otherUids.splice(0, point);
    } else {
      end = otherUids;
    }
    end = otherUids.concat(firstHalf);

    // 0, 1, 2 counter clockwise
    const uid = end[index];

    if (!uid) return <div>No user</div>
    if (uid === userId) return <div>Same</div>
    return (
      <div>
        <p>{usernameMap[uid] || 'Loading username...'} </p>
        <RevealedArea key={index} tiles={revealedMap[uid] || []} userId={uid}/>
        <DiscardArea key={index+10} tiles={discardMap[uid] || []} roomId={roomId} userId={uid}/>
      </div>
    );
  }

  // TODO create newRoom button for roomOwner only
  return (
    <div>
      <AppToolbar/>
      <DragDropContext
        onDragEnd={onDragEnd}>
        <div>
          <Grid container spacing={1}>
            <Grid item xs={4}/>
            <Grid item xs={4}>
              <Paper>{generateOtherUserArea(1)}</Paper>
            </Grid>
            <Grid item xs={4}/>
            <Grid item xs={4}>
              <Paper>{generateOtherUserArea(2)}</Paper>
            </Grid>
            <Grid item xs={4}>
              <Paper>
                <h3>Tiles left: {tilesLeft}</h3>
                <GameLog roomId={roomId}/>
              </Paper>
            </Grid>
            <Grid item xs={4}>
              <Paper>{generateOtherUserArea(0)}</Paper>
            </Grid>
            <Grid item xs={8}>
              <Paper>{createCurrentUserArea()}</Paper>
            </Grid>
            <Grid item xs={4}>
              <PlayerMoves username={usernameMap[userId]} roomId={roomId}/>
              <Paper><RevealedArea key={4} tiles={revealedMap[userId] || []} userId={userId}/></Paper>
              <Dialog onClose={() => setOpen(false)} open={open}>
                <DialogContentText>
                  <h2>Are you sure you want to reveal your hand?</h2>
                </DialogContentText>
                <div className={classes.root}>
                  <ButtonGroup size='large'>
                    <Button color='default' onClick={revealHand}>Yes, I'm sure</Button>
                    <Button color='secondary' onClick={() => setOpen(false)}>No, just kidding</Button>
                  </ButtonGroup>
                </div>
              </Dialog>
            </Grid>
          </Grid>
        </div>
      </DragDropContext>
    </div>
  );
}

export default GamePage;