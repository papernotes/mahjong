import React, { useEffect, useState, useContext } from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { DragDropContext } from 'react-beautiful-dnd';
import { UserContext } from '../context';

import HandArea from '../components/HandArea';
import PlayerMoves from '../components/PlayerMoves';
import DiscardArea from '../components/DiscardArea';
import RevealedArea from '../components/RevealedArea';

import firebase from '../firebase';

type MatchParams = {
  roomId: string;
}

type SharedTileMapping = {
  [uid : string] : number[];
}

function GamePage({match} : RouteComponentProps<MatchParams>) {
  const userId = useContext(UserContext).userId;
  const roomId = match.params.roomId;

  const [tiles, setTiles] = useState<number[]>([]);
  const [uids, setUids] = useState<string[]>([]);
  const [discardMap, setDiscardMap] = useState<SharedTileMapping>({});
  const [revealedMap, setRevealedMap] = useState<SharedTileMapping>({});
  const [createdMap, setCreatedMap] = useState<boolean>(false);

  // TODO refactor the 2 below
  function updateDiscardMap(uid : string, newTiles : number[]) {
    setDiscardMap(prevMap => ({
      ...prevMap,
      [uid]: newTiles
    }));
  }

  function updateRevealedMap(uid : string, newTiles : number[]) {
    setRevealedMap(prevMap => ({
      ...prevMap,
      [uid]: newTiles
    }))
  }

  // TODO refactor
  function setSharedTileAreaListeners(uids : string[]) {
    const unsubs : Function[] = [];

    uids.forEach(uid => {
      const discardRef = firebase.firestore().collection(`rooms/${roomId}/discarded`).doc(uid);
      const revealedRef = firebase.firestore().collection(`rooms/${roomId}/revealed`).doc(uid);

      const discardUnsub = discardRef.onSnapshot((doc) => {
        const data = doc.data();
        if (data) {
          const hand = data.tiles;

          if (discardMap[uid]) {
            if (discardMap[uid].length === 0) {
              updateDiscardMap(uid, hand);
            } else {
              const newTile = hand.pop();
              const newHand = discardMap[uid].concat(newTile);
              updateDiscardMap(uid, newHand);
            }
          }
        }
      });

      const revealedUnsub = revealedRef.onSnapshot((doc) => {
        const data = doc.data();
        if (data) {
          const hand = data.tiles;
          if (revealedMap[uid]) {
            if (revealedMap[uid].length === 0) {
              updateRevealedMap(uid, hand);
            } else {
              const newTile = hand.pop();
              const newHand = revealedMap[uid].concat(newTile);
              updateRevealedMap(uid, newHand);
            }
          }
        }
      });

      unsubs.push(discardUnsub);
      unsubs.push(revealedUnsub);
    });
    return unsubs;
  }

  // TODO refactor
  function createDiscardMap(uids : number[]) {
    const newDiscardMap : SharedTileMapping = {};
    uids.forEach(uid => {
      newDiscardMap[uid] = [];
    });
    return newDiscardMap;
  }

  function createRevealedMap(uids : number[]) {
    const newRevealedMap : SharedTileMapping = {};
    uids.forEach(uid => {
      newRevealedMap[uid] = [];
    });
    return newRevealedMap;
  }

  function spliceUpdate(primary : number[], secondary : number[], sourceIndex : number,
                        destIndex : number, draggableId : string) {
      primary.splice(sourceIndex, 1);
      secondary.splice(destIndex, 0, parseInt(draggableId));
  }

  // TODO make transaction
  // TODO, if one user is holding it, another moves it, user holding might have out of date local data
  // Verify that the move is possible? Callable function?
  function updateFirestore(newTiles : number[], category : string, userId : string) {
    console.log("Updating firestore for " + category);
    const handRef = firebase.firestore().collection(`rooms/${roomId}/${category}/`).doc(userId)
    return handRef.update({
      tiles: newTiles
    })
    .catch(function(error) {
      console.error(error);
      throw new Error('Could not update hand');
    })
  }

  // TODO refactor
  // Primary is what we want the hand to be
  function discardHandDragUpdate(primary : number[], secondary: number[], destUserId : string) {
    console.log("Updating discard map")
    updateFirestore(primary, 'hand', userId);
    updateFirestore(secondary, 'discarded', destUserId);
    setTiles(primary);
    updateDiscardMap(destUserId, secondary);
  }

  function revealedHandDragUpdate(primary : number[], secondary: number[], destUserId : string) {
    console.log("Updating revealed map")
    updateFirestore(primary, 'hand', userId);
    updateFirestore(secondary, 'revealed', destUserId);
    setTiles(primary);
    updateRevealedMap(destUserId, secondary);
  }

  useEffect(() => {
    let handUnsub : Function;

    if (userId && roomId) {
      const userIdRef = firebase.firestore().collection('rooms').doc(roomId);
      userIdRef.get()
        .then((doc) => {
          const data = doc.data();
          if (data) {
            const uids = data.userIds;
            setUids(uids);
            setDiscardMap(createDiscardMap(uids));
            setRevealedMap(createRevealedMap(uids));
            setCreatedMap(true);
          }
        });

      const handRef = firebase.firestore().collection(`rooms/${roomId}/hand`).doc(userId);
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
    }

    return () => {
      handUnsub && handUnsub();
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

  // TODO refactor/cleanup split IDs
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
      let inHand = false;

      // hand, revealed, discarded
      let sameHandUserId = start.split('/')[1];

      switch(startCategory) {
        case 'hand':
          newTiles = Array.from(tiles);
          inHand = true;
          break;
        case 'discarded':
          newTiles = Array.from(discardMap[sameHandUserId]);
          break;
        default:
          newTiles = Array.from(revealedMap[sameHandUserId]);
      }

      spliceUpdate(newTiles, newTiles, source.index, destination.index, draggableId);

      if (inHand) {
        setTiles(newTiles);
      } else if (startCategory === 'discarded') {
        updateDiscardMap(sameHandUserId, newTiles);
      } else {
        updateRevealedMap(sameHandUserId, newTiles);
      }

      updateFirestore(newTiles, startCategory, sameHandUserId);
    }
    else {
      let primary : number[];
      let secondary : number[];

      // Hand -> Discard, Hand -> Revealed
      if (startCategory === 'hand' || endCategory === 'hand') {
        const destUserId = destination.droppableId.split('/')[1]

        if (startCategory === 'hand') {
          primary = Array.from(tiles);

          if (endCategory === 'discarded') {
            secondary = Array.from(discardMap[destUserId]);
          } else {
            if (destUserId !== userId) {
              return;
            }
            secondary = Array.from(revealedMap[destUserId]);
          }

          spliceUpdate(primary, secondary, source.index, destination.index, draggableId);

          if (endCategory === 'discarded') {
            discardHandDragUpdate(primary, secondary, destUserId);
          } else {
            if (destUserId !== userId) {
              return;
            }
            revealedHandDragUpdate(primary, secondary, destUserId);
          }

        }
        // Moving Discard <-> Hand or Revealed <-> Hand
        else {
          const sourceUserId = source.droppableId.split('/')[1];
          secondary= Array.from(tiles);
          if (startCategory === 'discarded') {
            primary = Array.from(discardMap[sourceUserId]);
          } else {
            if (sourceUserId !== userId) {
              return;
            }
            primary = Array.from(revealedMap[sourceUserId]);
          }

          spliceUpdate(primary, secondary, source.index, destination.index, draggableId);

          if (startCategory === 'discarded') {
            discardHandDragUpdate(secondary, primary, sourceUserId);
          } else {
            revealedHandDragUpdate(secondary, primary, sourceUserId);
          }
        }
      }
    }
  }

  return (
    <DragDropContext
      onDragEnd={onDragEnd}>
      <div>
        {uids.map( (uid, index) => {
            return <DiscardArea key={index} tiles={discardMap[uid] || []} roomId={roomId} userId={uid}/> }
        )}
        {uids.map( (uid, index) => {
            return <RevealedArea key={index} tiles={revealedMap[uid] || []} userId={uid}/> }
        )}
        <PlayerMoves roomId={roomId}/>
        <HandArea tiles={tiles} userId={userId}/>
      </div>
    </DragDropContext>
  );
}

export default GamePage;