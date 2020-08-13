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
  // TODO remove useContext
  const userId = useContext(UserContext).userId;
  const roomId = match.params.roomId;

  const [tiles, setTiles] = useState<number[]>([]);
  const [uids, setUids] = useState<string[]>([]);
  const [discardMap, setDiscardMap] = useState<DiscardMapping>({});
  const [createdMap, setCreatedMap] = useState<boolean>(false);

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
              setDiscardMap(prevMap => ({
                ...prevMap,
                [uid]: hand
              }));
            } else {
              const newTile = hand.pop();
              const newHand = discardMap[uid].concat(newTile);
              setDiscardMap(prevMap => ({
                ...prevMap,
                [uid]: newHand
              }));
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

  function updateFirestore(newTiles : number[], category : string, userId : string) {
    const handRef = firebase.firestore().collection(`rooms/${roomId}/${category}/`).doc(userId)
    return handRef.update({
      tiles: newTiles
    })
    .catch(function(error) {
      throw new Error('Could not update hand');
    })
  }

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

      if (start.includes("hand")) {
        newTiles = Array.from(tiles);
      } else {
        inHand = false;
        newTiles = Array.from(discardMap[sameHandUserId]);
      }

      newTiles.splice(source.index, 1)
      newTiles.splice(destination.index, 0, parseInt(draggableId));

      if (inHand) {
        setTiles(newTiles);
      } else {
        setDiscardMap(prevMap => ({
          ...prevMap,
          [sameHandUserId]: newTiles
        }));
      }
      updateFirestore(newTiles, category, sameHandUserId);
    }
    // From one hand to discard area and vice versa
    else {
      let primary : number[];
      let secondary : number[];

      // Current user hand -> some discard pile
      if (start.includes("hand")) {
        primary = Array.from(tiles);
        secondary = Array.from(discardMap[destination.droppableId.split('/')[1]]);

        primary.splice(source.index, 1);
        secondary.splice(destination.index, 0, parseInt(draggableId));

        updateFirestore(primary, 'hand', userId);
        updateFirestore(secondary, 'discarded', destination.droppableId.split('/')[1]);

        setTiles(primary);
        setDiscardMap(prevMap => ({
          ...prevMap,
          [destination.droppableId.split('/')[1]]: secondary
        }));
      }
      // TODO discard to discard
      // Some discard pile to user hand
      else {
        primary = Array.from(discardMap[source.droppableId.split('/')[1]]);
        secondary = Array.from(tiles);

        primary.splice(source.index, 1);
        secondary.splice(destination.index, 0, parseInt(draggableId));

        updateFirestore(primary, 'discarded', source.droppableId.split('/')[1]);
        updateFirestore(secondary, 'hand', userId);

        setTiles(secondary);
        setDiscardMap(prevMap => ({
          ...prevMap,
          [source.droppableId.split('/')[1]]: primary
        }));
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
        <h2>Game Page - {match.params.roomId} </h2>
        <HandArea tiles={tiles} userId={userId}/>
        <PlayerMoves roomId={roomId}/>
      </div>
    </DragDropContext>
  );
}

export default GamePage;