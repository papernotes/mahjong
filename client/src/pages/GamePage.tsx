import React, { useEffect, useState, useContext } from 'react';
import { RouteComponentProps } from 'react-router-dom';

import HandArea from '../components/HandArea';
import PlayerMoves from '../components/PlayerMoves';
import DiscardArea from '../components/DiscardArea';
import { DragDropContext } from 'react-beautiful-dnd';
import { UserContext } from '../context';
import firebase from '../firebase';

type MatchParams = {
  roomId: string;
}

type DiscardMapping = {
  [uid : string] : number[];
}

function GamePage({match} : RouteComponentProps<MatchParams>) {
  const userId = useContext(UserContext).userId;
  const roomId = match.params.roomId;

  const [tiles, setTiles] = useState<number[]>([]);
  const [uids, setUids] = useState<string[]>([]);
  const [discardMap, setDiscardMap] = useState<DiscardMapping>({});
  const [createdMap, setCreatedMap] = useState<boolean>(false);

  function updateDiscardMap(uid : string, newTiles : number[]) {
    setDiscardMap(prevMap => ({
      ...prevMap,
      [uid]: newTiles
    }));
  }

  function setDiscardListeners(uids : string[]) {
    const unsubs : Function[] = [];

    uids.forEach(uid => {
      const discardRef = firebase.firestore().collection(`rooms/${roomId}/discarded`).doc(uid);
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
      unsubs.push(discardUnsub);
    });
    return unsubs;
  }

  function createDiscardMap(uids : number[]) {
    const newDiscardMap : DiscardMapping = {};
    uids.forEach(uid => {
      newDiscardMap[uid] = [];
    });
    return newDiscardMap;
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
    const handRef = firebase.firestore().collection(`rooms/${roomId}/${category}/`).doc(userId)
    return handRef.update({
      tiles: newTiles
    })
    .catch(function(error) {
      throw new Error('Could not update hand');
    })
  }

  function discardHandDragUpdate(primary : number[], secondary: number[], destUserId : string) {
    updateFirestore(primary, 'hand', userId);
    updateFirestore(secondary, 'discarded', destUserId);
    setTiles(primary);
    updateDiscardMap(destUserId, secondary);
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
      unsubs = setDiscardListeners(uids);
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


    // Reordering within the same area
    if (start === finish) {
      let newTiles : number[];
      let inHand = true;
      let category = start.split('/')[0];
      let sameHandUserId = start.split('/')[1];

      if (start.includes("hand/")) {
        newTiles = Array.from(tiles);
      } else {
        inHand = false;
        newTiles = Array.from(discardMap[sameHandUserId]);
      }

      spliceUpdate(newTiles, newTiles, source.index, destination.index, draggableId);

      if (inHand) {
        setTiles(newTiles);
      } else {
        updateDiscardMap(sameHandUserId, newTiles);
      }
      updateFirestore(newTiles, category, sameHandUserId);
    }
    // From one hand to discard area and vice versa
    else {
      let primary : number[];
      let secondary : number[];

      // Current user hand -> some discard pile (Start: Hand, Dest: Discard)
      if (start.includes("hand/")) {
        const destUserId = destination.droppableId.split('/')[1]
        primary = Array.from(tiles);
        secondary = Array.from(discardMap[destUserId]);

        spliceUpdate(primary, secondary, source.index, destination.index, draggableId);
        discardHandDragUpdate(primary, secondary, destUserId);
      }
      // TODO (Start: Discard, Dest: Discard)
      // Some discard pile to user hand (Start: Discard, Dest: Hand)
      else {
        const sourceUserId = source.droppableId.split('/')[1]
        primary = Array.from(discardMap[sourceUserId]);
        secondary = Array.from(tiles);

        spliceUpdate(primary, secondary, source.index, destination.index, draggableId);
        discardHandDragUpdate(secondary, primary, sourceUserId);
      }
    }
  }


  return (
    <DragDropContext
      onDragEnd={onDragEnd}>
      <div>
        {uids.map( (uid, index) => {
            return <DiscardArea key={index} tiles={discardMap[uid] || []} roomId={roomId} userId={uid}/>
          }
        )}
        <PlayerMoves roomId={roomId}/>
        <HandArea tiles={tiles} userId={userId}/>
      </div>
    </DragDropContext>
  );
}

export default GamePage;